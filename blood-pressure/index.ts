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

enum Status {
	NORMAL = 'Normal',
	WARNING = 'Warning',
	ABNORMAL = 'Abnormal',
}

const randomBloodPressureResult = (status: Status): { systolic: number; diastolic: number; pulse: number } => {
	switch (status) {
		case Status.NORMAL:
			return {
				diastolic: faker.mersenne.rand(80, 60),
				systolic: faker.mersenne.rand(120, 90),
				pulse: faker.mersenne.rand(165, 60),
			}
		case Status.WARNING:
			return {
				diastolic: faker.mersenne.rand(90, 80),
				systolic: faker.mersenne.rand(140, 120),
				pulse: faker.mersenne.rand(199, 168),
			}
		case Status.ABNORMAL:
			const isLow = faker.helpers.arrayElement([false, true])
			return {
				diastolic: isLow ? faker.mersenne.rand(60, 40) : faker.mersenne.rand(120, 91),
				systolic: isLow ? faker.mersenne.rand(90, 70) : faker.mersenne.rand(160, 141),
				pulse: faker.mersenne.rand(220, 199),
			}
	}
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
		const bp = dates.map((date): BloodPressure => {
			const status = faker.helpers.arrayElement([Status.NORMAL, Status.ABNORMAL, Status.WARNING])
			return {
				dateTime: dateToBSONDate(date),
				metadata: { patientID, createdAt: dateToBSONDate(date) },
				...randomBloodPressureResult(status),
			}
		})

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
const bloodPressure = generateBloodPressure(5, st, et)
fs.writeFileSync('blood-pressure/data.json', JSON.stringify(bloodPressure))
