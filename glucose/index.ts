import { faker } from '@faker-js/faker'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import fs from 'fs'
import { BSONDate, dateToBSONDate } from '../bson'
dayjs.extend(utc)
dayjs.extend(timezone)

enum Meal {
	Breakfast = 'breakfast',
	Lunch = 'lunch',
	Dinner = 'dinner',
}
interface Metadata {
	patientID: number
	createdAt: BSONDate
	isBeforeMeal: boolean
	meal: Meal
}
interface Glucose {
	dateTime: BSONDate
	metadata: Metadata
	value: number
}

const generateGlucoses = (patientID: number, startDate: dayjs.Dayjs, endDate: dayjs.Dayjs): Glucose[] => {
	const glucoses: Glucose[] = []
	while (!startDate.isAfter(endDate)) {
		const freq = faker.mersenne.rand(0, 7)
		let gs: Glucose[] = [
			generateGlucose(patientID, startDate, true, Meal.Breakfast),
			generateGlucose(patientID, startDate, true, Meal.Dinner),
			generateGlucose(patientID, startDate, true, Meal.Lunch),
			generateGlucose(patientID, startDate, false, Meal.Breakfast),
			generateGlucose(patientID, startDate, false, Meal.Dinner),
			generateGlucose(patientID, startDate, false, Meal.Lunch),
		]
		gs = gs.slice(0, freq)
		console.log(
			startDate.tz('Asia/Bangkok').format('ddd DD/MM/YYYY'),
			freq,
			...gs.map(
				g =>
					`| ${g.metadata.isBeforeMeal ? 'Before' : 'After'} ${g.metadata.meal} ${dayjs(g.dateTime.$date)
						.tz('Asia/Bangkok')
						.format('HH:mm')} |`
			)
		)
		glucoses.push(...gs)
		startDate = startDate.add(1, 'day')
	}
	return glucoses
}

const generateGlucose = (patientID: number, startDate: dayjs.Dayjs, isBeforeMeal: boolean, meal: Meal): Glucose => {
	const insertDateTime = randomInsertDateTime(startDate, isBeforeMeal, meal)
	return {
		dateTime: dateToBSONDate(insertDateTime.utc().toDate()),
		metadata: { createdAt: dateToBSONDate(insertDateTime.utc().toDate()), isBeforeMeal, meal, patientID },
		value: isBeforeMeal ? faker.mersenne.rand(70, 150) : faker.mersenne.rand(90, 200),
	}
}

const randomInsertDateTime = (date: dayjs.Dayjs, isBeforeMeal: boolean, meal: Meal): dayjs.Dayjs => {
	let start = date.hour(7).minute(0).second(0)
	switch (meal) {
		case Meal.Lunch:
			start = date.hour(12).minute(0).second(0)
			break
		case Meal.Dinner:
			start = date.hour(18).minute(0).second(0)
			break
	}
	start = isBeforeMeal ? start.subtract(1, 'hour') : start.add(2, 'hour')
	const end = start.add(1, 'hour')
	const insertDate = faker.date.between(start.toDate(), end.toDate())
	return dayjs(insertDate)
}

const et = dayjs()
const st = et.subtract(3, 'month')
console.log(st.toISOString(), et.toISOString())
const bloodPressure = generateGlucoses(1, st, et)
fs.writeFileSync('glucose/data.json', JSON.stringify(bloodPressure))
