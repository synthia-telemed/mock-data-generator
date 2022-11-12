import { faker } from '@faker-js/faker'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import fs from 'fs'
import { BSONDate, dateToBSONDate } from '../bson'
dayjs.extend(utc)
dayjs.extend(timezone)

interface Metadata {
	patientID: number
	createdAt: BSONDate
}
interface BloodPressure {
	dateTime: BSONDate
	metadata: Metadata
	systolic: number
	diastolic: number
	pulse: number
}

const generateBloodPressure = (patientID: number, startDate: dayjs.Dayjs, endDate: dayjs.Dayjs): BloodPressure[] => {
	const bloodPressure: BloodPressure[] = []
	while (!startDate.isAfter(endDate, 'day')) {
		const frequency = faker.mersenne.rand(4, 0)
		let dates = [
			faker.date.between(startDate.hour(6).toDate(), startDate.hour(9).toDate()),
			faker.date.between(startDate.hour(11).toDate(), startDate.hour(14).toDate()),
			faker.date.between(startDate.hour(17).toDate(), startDate.hour(20).toDate()),
		]
		dates = faker.helpers.shuffle(dates)
		dates = dates.slice(0, frequency)
		const bp = dates.map(
			(date): BloodPressure => ({
				dateTime: dateToBSONDate(date),
				metadata: { patientID, createdAt: dateToBSONDate(date) },
				systolic: faker.mersenne.rand(200, 100),
				diastolic: faker.mersenne.rand(140, 50),
				pulse: faker.mersenne.rand(120, 50),
			})
		)
		console.log(
			startDate.tz('Asia/Bangkok').format('ddd DD/MM/YYYY'),
			bp.length,
			...dates
				.sort((a, b) => a.getTime() - b.getTime())
				.map(date => dayjs(date).tz('Asia/Bangkok').format('HH:mm'))
		)
		bloodPressure.push(...bp)
		startDate = startDate.add(1, 'day')
	}
	console.info('Total', bloodPressure.length)
	return bloodPressure
}

const et = dayjs('2022-11-22T12:34:15+0000').endOf('day')
const st = et.subtract(4, 'month').startOf('day')
console.log(st.toISOString(), et.toISOString())
const bloodPressure = generateBloodPressure(1, st, et)
fs.writeFileSync('blood-pressure/data.json', JSON.stringify(bloodPressure))
