import type { DB } from '../db'

// Child tables first. Rows owned by runtime users that point at demo properties go via ON DELETE CASCADE.
const TABLES = [
  'review_votes',
  'room_waitlist',
  'saved_properties',
  'booking_requests',
  'residency_verifications',
  'reviews',
  'reported_differences',
  'fact_provenance',
  'commute',
  'owners',
  'property_amenities',
  'wifi_details',
  'food_details',
  'cleaning_details',
  'rules_details',
  'safety_features',
  'room_inventory',
  'properties',
  'landmarks',
  'sub_areas',
  'area_waitlist',
  'users',
  'areas',
]

/** Remove every row with data_source = 'demo_seed'. Returns rows deleted per table. */
export function purgeDemo(db: DB): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const t of TABLES) {
    counts[t] = db.prepare(`DELETE FROM ${t} WHERE data_source = 'demo_seed'`).run().changes
  }
  return counts
}
