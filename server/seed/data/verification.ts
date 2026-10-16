// Which listed facts the (demo) field team has checked. Drives fact_provenance rows.
// verified          -> every rules/safety/wifi/cleaning fact is platform_verified
// partially_verified -> only the fields listed here are platform_verified; the rest stay owner_listed
// not_verified      -> everything is owner_listed
// food_quality_note is always owner_listed: Havenly never "verifies" taste.

export const VERIFIER = 'Havenly field team (demo)'

export const partialVerification: Record<string, { fields: string[]; evidence: string }> = {
  'mango-leaf-pg-for-women': {
    fields: ['rules.gate_close_time', 'rules.curfew_type', 'safety.cctv', 'safety.security_guard', 'safety.distance_to_main_road_m', 'food.food_included'],
    evidence: 'site_visit',
  },
  'harbour-line-mens-hostel': {
    fields: ['rules.curfew_type', 'safety.cctv', 'safety.security_guard', 'wifi.speed_mbps', 'food.food_included'],
    evidence: 'site_visit',
  },
  'jasmine-court-working-womens-pg': {
    fields: ['rules.gate_close_time', 'rules.curfew_type', 'safety.cctv', 'safety.female_warden_resident', 'safety.security_guard'],
    evidence: 'site_visit',
  },
  'kaithari-shared-homes': {
    fields: ['safety.cctv', 'safety.distance_to_main_road_m', 'cleaning.room_cleaning_per_week', 'wifi.speed_mbps'],
    evidence: 'photo',
  },
  'sandalwood-suites-womens-pg': {
    fields: ['safety.cctv', 'safety.security_guard', 'safety.biometric_or_keycard_entry', 'cleaning.room_cleaning_per_week', 'wifi.backup_connection'],
    evidence: 'site_visit',
  },
  'ixora-ladies-pg': {
    fields: ['rules.gate_close_time', 'rules.curfew_type', 'safety.female_warden_resident', 'food.veg_options'],
    evidence: 'site_visit',
  },
}

/** Residency verification requests waiting in the admin queue (evidence itself is never stored here). */
export const pendingResidency = [
  { review_id: 'rev_queue_01', evidence_type: 'rent_receipt' as const },
  { review_id: 'rev_queue_05', evidence_type: 'rental_agreement' as const },
]
