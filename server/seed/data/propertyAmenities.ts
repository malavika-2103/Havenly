// Amenities per property. 'ac' must match whether any room type has AC (checked by validate.ts).
import type { AmenityId } from './amenities'

type A = AmenityId | [AmenityId, string]

export const propertyAmenities: Record<string, A[]> = {
  'tulsi-nest-womens-pg': ['wifi', 'ac', ['laundry', 'Paid, ₹500 a month'], 'fridge', ['power_backup', 'Inverter and generator'], ['hot_water_24h', 'Solar with backup geyser'], 'lift', 'study_table', 'cupboard', 'water_purifier', 'housekeeping'],
  'kayal-house-ladies-hostel': ['wifi', 'washing_machine', ['power_backup', 'Inverter for lights and fans'], 'study_table', 'cupboard', 'water_purifier', 'housekeeping'],
  'coconut-grove-coliving': ['wifi', 'ac', 'washing_machine', 'fridge', ['power_backup', 'Generator'], 'hot_water_24h', 'lift', 'parking', 'study_table', 'cupboard', 'common_kitchen', 'water_purifier', 'housekeeping'],
  'mango-leaf-pg-for-women': ['wifi', 'washing_machine', ['power_backup', 'Inverter for lights and fans only'], 'study_table', 'cupboard', 'water_purifier'],
  'harbour-line-mens-hostel': ['wifi', 'ac', ['laundry', 'Paid, ₹400 a month'], 'washing_machine', ['power_backup', 'Inverter'], 'parking', 'study_table', 'cupboard', 'water_purifier'],
  'nila-womens-hostel': ['wifi', 'study_table', 'cupboard', 'water_purifier'],
  'jasmine-court-working-womens-pg': ['wifi', 'washing_machine', 'fridge', ['power_backup', 'Inverter'], 'study_table', 'cupboard', 'water_purifier', 'housekeeping'],
  'palm-shade-mens-hostel': ['wifi', 'parking', 'cupboard', 'water_purifier'],
  'lotus-residency-for-women': ['wifi', 'ac', ['laundry', 'Paid, ₹450 a month'], 'fridge', ['power_backup', 'Generator'], 'hot_water_24h', 'study_table', 'cupboard', 'water_purifier', 'housekeeping'],
  'kaithari-shared-homes': ['wifi', 'washing_machine', 'fridge', ['power_backup', 'Apartment generator'], 'lift', 'parking', 'cupboard', 'common_kitchen', 'water_purifier', ['housekeeping', 'Once a week']],
  'anjili-womens-hostel': ['wifi', 'washing_machine', ['power_backup', 'Inverter'], 'study_table', 'cupboard', 'water_purifier', 'housekeeping'],
  'greenline-mens-hostel': ['wifi', 'ac', 'washing_machine', ['power_backup', 'Inverter'], 'parking', 'cupboard', 'water_purifier', 'housekeeping'],
  'sandalwood-suites-womens-pg': ['wifi', 'ac', ['laundry', 'Included'], 'fridge', ['power_backup', 'Generator'], 'hot_water_24h', 'lift', 'study_table', 'cupboard', 'water_purifier', ['housekeeping', 'Daily']],
  'thenmala-shared-house': ['wifi', 'washing_machine', 'fridge', 'parking', 'cupboard', 'common_kitchen'],
  'ixora-ladies-pg': ['wifi', 'washing_machine', ['power_backup', 'Inverter'], 'study_table', 'cupboard', 'water_purifier', 'housekeeping'],
  'rosewood-shared-flats': ['wifi', 'ac', 'washing_machine', 'fridge', ['power_backup', 'Apartment generator'], 'lift', 'parking', 'cupboard', 'common_kitchen', 'water_purifier'],
}
