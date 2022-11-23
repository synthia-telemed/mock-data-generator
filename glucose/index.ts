import { faker } from '@faker-js/faker'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import fs from 'fs'
import { BSONDate, dateToBSONDate } from '../bson'
dayjs.extend(utc)
dayjs.extend(timezone)

enum Period {
	BeforeMeal = 'BEFORE_MEAL',
	AfterMeal = 'AFTER_MEAL',
	Fasting = 'FASTING',
}
interface Metadata {
	patientID: number
	createdAt: BSONDate
	period: Period
}
interface Glucose {
	dateTime: BSONDate
	metadata: Metadata
	value: number
}

const generateGlucoses = (patientID: number, startDate: dayjs.Dayjs, endDate: dayjs.Dayjs): Glucose[] => {
	const glucoses: Glucose[] = []
	while (!startDate.isAfter(endDate)) {
		let gs: Glucose[] = [
			generateGlucose(patientID, startDate, Period.Fasting),
			generateGlucose(patientID, startDate, Period.BeforeMeal),
			generateGlucose(patientID, startDate, Period.AfterMeal),
		]
		const freq = faker.mersenne.rand(0, gs.length + 1)
		gs = gs.slice(0, freq)
		console.log(
			startDate.tz('Asia/Bangkok').format('ddd DD/MM/YYYY'),
			freq,
			...gs.map(
				g => `| ${g.metadata.period} ${g.value} ${dayjs(g.dateTime.$date).tz('Asia/Bangkok').format('HH:mm')} |`
			)
		)
		glucoses.push(...gs)
		startDate = startDate.add(1, 'day')
	}
	return glucoses
}

const generateGlucose = (patientID: number, startDate: dayjs.Dayjs, period: Period): Glucose => {
	const insertDateTime = randomInsertDateTime(startDate, period)
	return {
		dateTime: dateToBSONDate(insertDateTime.utc().toDate()),
		metadata: { createdAt: dateToBSONDate(insertDateTime.utc().toDate()), patientID, period },
		value: randomGlucoseValue(period),
	}
}

const randomGlucoseValue = (period: Period) => {
	switch (period) {
		case Period.BeforeMeal:
			return faker.mersenne.rand(80, 150)
		case Period.AfterMeal:
			return faker.mersenne.rand(100, 180)
		case Period.Fasting:
			return faker.mersenne.rand(70, 130)
	}
}

const randomInsertDateTime = (date: dayjs.Dayjs, period: Period): dayjs.Dayjs => {
	let start = date.hour(6).minute(0).second(0)
	switch (period) {
		case Period.BeforeMeal:
			start = date.hour(faker.helpers.arrayElement([12, 18]))
			break
		case Period.AfterMeal:
			start = date.hour(faker.helpers.arrayElement([12, 18]))
			break
	}
	start = period === Period.BeforeMeal || period === Period.Fasting ? start.subtract(1, 'hour') : start.add(2, 'hour')
	const end = start.add(1, 'hour').endOf('hour')
	const insertDate = faker.date.between(start.toDate(), end.toDate())
	return dayjs(insertDate)
}

const et = dayjs('2022-11-23T12:34:15+0000')
const st = et.subtract(4, 'month')
console.log(st.toISOString(), et.toISOString())
const bloodPressure = generateGlucoses(5, st, et)
fs.writeFileSync('glucose/data.json', JSON.stringify(bloodPressure))
