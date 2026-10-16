// Cleaning and garbage as listed. Room cleaning ranges from 1 to 7 times a week.
export interface CleaningSeed {
  room_cleaning_per_week: number
  bathroom_cleaning_per_week: number
  common_area_cleaning_per_week: number
  linen_change_per_month: number
  pest_control_per_year: number
  garbage_collection: 'daily' | 'alternate_days' | 'twice_weekly' | 'weekly'
}

const c = (room: number, bath: number, common: number, linen: number, pest: number, garbage: CleaningSeed['garbage_collection']): CleaningSeed => ({
  room_cleaning_per_week: room,
  bathroom_cleaning_per_week: bath,
  common_area_cleaning_per_week: common,
  linen_change_per_month: linen,
  pest_control_per_year: pest,
  garbage_collection: garbage,
})

export const cleaning: Record<string, CleaningSeed> = {
  'tulsi-nest-womens-pg': c(3, 7, 7, 2, 4, 'daily'),
  'kayal-house-ladies-hostel': c(6, 14, 7, 2, 4, 'daily'),
  'coconut-grove-coliving': c(2, 2, 7, 4, 4, 'daily'),
  'mango-leaf-pg-for-women': c(2, 3, 3, 0, 2, 'alternate_days'),
  'harbour-line-mens-hostel': c(2, 3, 7, 0, 2, 'daily'),
  'nila-womens-hostel': c(1, 3, 3, 0, 1, 'alternate_days'),
  'jasmine-court-working-womens-pg': c(3, 7, 7, 2, 2, 'daily'),
  'palm-shade-mens-hostel': c(1, 2, 2, 0, 1, 'twice_weekly'),
  'lotus-residency-for-women': c(3, 7, 7, 2, 4, 'daily'),
  'kaithari-shared-homes': c(1, 1, 1, 0, 2, 'daily'),
  'anjili-womens-hostel': c(3, 7, 7, 1, 2, 'daily'),
  'greenline-mens-hostel': c(2, 4, 7, 0, 2, 'daily'),
  'sandalwood-suites-womens-pg': c(7, 7, 7, 4, 4, 'daily'),
  'thenmala-shared-house': c(1, 1, 1, 0, 1, 'weekly'),
  'ixora-ladies-pg': c(2, 4, 4, 1, 2, 'alternate_days'),
  'rosewood-shared-flats': c(1, 1, 2, 0, 2, 'daily'),
}
