// Amenity catalogue (reference data, not demo content).
export const amenities = [
  { id: 'wifi', label: 'Wi-Fi', icon: 'wifi' },
  { id: 'ac', label: 'AC rooms', icon: 'ac' },
  { id: 'laundry', label: 'Laundry service', icon: 'laundry' },
  { id: 'washing_machine', label: 'Washing machine', icon: 'laundry' },
  { id: 'fridge', label: 'Fridge', icon: 'kitchen' },
  { id: 'power_backup', label: 'Power backup', icon: 'power' },
  { id: 'hot_water_24h', label: '24-hour hot water', icon: 'bath' },
  { id: 'lift', label: 'Lift', icon: 'lift' },
  { id: 'parking', label: 'Two-wheeler parking', icon: 'parking' },
  { id: 'study_table', label: 'Study table', icon: 'study' },
  { id: 'cupboard', label: 'Cupboard', icon: 'cupboard' },
  { id: 'common_kitchen', label: 'Common kitchen', icon: 'kitchen' },
  { id: 'water_purifier', label: 'Water purifier', icon: 'water' },
  { id: 'housekeeping', label: 'Housekeeping', icon: 'broom' },
] as const

export type AmenityId = (typeof amenities)[number]['id']
