import { faker } from '@faker-js/faker'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import fs from 'fs'
dayjs.extend(utc)
dayjs.extend(timezone)

interface Metadata {
	patientID: number
	createdAt: any
}
interface BloodPressure {
	dateTime: any
	metadata: Metadata
	systolic: number
	diastolic: number
	pulse: number
}

const generateBloodPressure = (patientID: number, startDate: dayjs.Dayjs, endDate: dayjs.Dayjs): BloodPressure[] => {
	const bloodPressure: BloodPressure[] = []
	while (!startDate.isAfter(endDate, 'day')) {
		const frequency = faker.mersenne.rand(5, 0)
		const dates = faker.date.betweens(startDate.toDate(), startDate.add(15, 'hour').toDate(), frequency)
		const bp = dates.map(
			(date): BloodPressure => ({
				dateTime: { $date: date.toISOString() },
				metadata: { patientID, createdAt: { $date: date.toISOString() } },
				systolic: faker.mersenne.rand(200, 100),
				diastolic: faker.mersenne.rand(140, 50),
				pulse: faker.mersenne.rand(120, 50),
			})
		)
		console.log(
			startDate.tz('Asia/Bangkok').format('ddd DD/MM/YYYY'),
			bp.length,
			...dates.map(date => dayjs(date).tz('Asia/Bangkok').format('HH:mm'))
		)
		bloodPressure.push(...bp)
		startDate = startDate.add(1, 'day')
	}
	console.info('Total', bloodPressure.length)
	return bloodPressure
}

const st = dayjs().subtract(3, 'month').startOf('day').add(6, 'hour').utc()
const et = dayjs().endOf('day').subtract(3, 'hour').utc()
console.log(st.toISOString(), et.toISOString())
const bloodPressure = generateBloodPressure(1, st, et)
fs.writeFileSync('blood-pressure/data.json', JSON.stringify(bloodPressure))
