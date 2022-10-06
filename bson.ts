export interface BSONDate {
	$date: string
}

export const dateToBSONDate = (date: Date): BSONDate => ({ $date: date.toISOString() })
