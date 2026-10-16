// Wi-Fi as listed. Range 20–200 Mbps; three are paid add-ons (charge lives in properties.other_charges); one has a data cap.
export interface WifiSeed {
  free: boolean
  speed_mbps: number
  backup_connection: boolean
  coverage: 'rooms' | 'common_areas' | 'rooms_and_common_areas'
  data_cap_gb: number | null
}

const w = (free: boolean, speed_mbps: number, coverage: WifiSeed['coverage'], backup_connection = false, data_cap_gb: number | null = null): WifiSeed => ({
  free,
  speed_mbps,
  backup_connection,
  coverage,
  data_cap_gb,
})

export const wifi: Record<string, WifiSeed> = {
  'tulsi-nest-womens-pg': w(true, 100, 'rooms_and_common_areas', true),
  'kayal-house-ladies-hostel': w(true, 40, 'common_areas'),
  'coconut-grove-coliving': w(true, 200, 'rooms_and_common_areas', true),
  'mango-leaf-pg-for-women': w(true, 30, 'rooms_and_common_areas', false, 150),
  'harbour-line-mens-hostel': w(true, 100, 'rooms_and_common_areas'),
  'nila-womens-hostel': w(false, 25, 'common_areas'),
  'jasmine-court-working-womens-pg': w(true, 60, 'rooms_and_common_areas'),
  'palm-shade-mens-hostel': w(true, 20, 'rooms_and_common_areas'),
  'lotus-residency-for-women': w(true, 100, 'rooms_and_common_areas'),
  'kaithari-shared-homes': w(true, 150, 'rooms'),
  'anjili-womens-hostel': w(false, 50, 'rooms_and_common_areas'),
  'greenline-mens-hostel': w(true, 50, 'rooms_and_common_areas'),
  'sandalwood-suites-womens-pg': w(true, 150, 'rooms_and_common_areas', true),
  'thenmala-shared-house': w(false, 40, 'rooms'),
  'ixora-ladies-pg': w(true, 50, 'rooms_and_common_areas'),
  'rosewood-shared-flats': w(true, 100, 'rooms'),
}
