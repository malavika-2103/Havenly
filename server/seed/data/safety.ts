// Factual safety features, per property. No combined score is ever computed from these.
// Quotas: Kayal House alone has 24x7 guard + extensive CCTV + resident female warden; three have no CCTV.
export interface SafetySeed {
  cctv: 'none' | 'entrance_only' | 'common_areas' | 'extensive'
  security_guard: 'none' | 'night_only' | '24x7'
  biometric_or_keycard_entry: boolean
  female_warden_resident: boolean
  female_staff_only: boolean
  fire_extinguishers: boolean
  first_aid: boolean
  distance_to_main_road_m: number
  approach_road_lit: boolean
  night_transport_nearby: boolean
  emergency_contact_displayed: boolean
}

const s = (
  cctv: SafetySeed['cctv'],
  security_guard: SafetySeed['security_guard'],
  flags: { bio?: boolean; warden?: boolean; femaleStaff?: boolean; fire?: boolean; aid?: boolean; lit?: boolean; transport?: boolean; contact?: boolean },
  distance_to_main_road_m: number,
): SafetySeed => ({
  cctv,
  security_guard,
  biometric_or_keycard_entry: !!flags.bio,
  female_warden_resident: !!flags.warden,
  female_staff_only: !!flags.femaleStaff,
  fire_extinguishers: flags.fire ?? true,
  first_aid: flags.aid ?? true,
  distance_to_main_road_m,
  approach_road_lit: !!flags.lit,
  night_transport_nearby: !!flags.transport,
  emergency_contact_displayed: !!flags.contact,
})

export const safety: Record<string, SafetySeed> = {
  'tulsi-nest-womens-pg': s('common_areas', 'night_only', { bio: true, warden: true, lit: true, transport: true, contact: true }, 150),
  'kayal-house-ladies-hostel': s('extensive', '24x7', { bio: true, warden: true, femaleStaff: true, lit: true, transport: true, contact: true }, 120),
  'coconut-grove-coliving': s('common_areas', 'night_only', { bio: true, lit: true, transport: true, contact: true }, 200),
  'mango-leaf-pg-for-women': s('none', 'none', { fire: false, lit: true }, 300),
  'harbour-line-mens-hostel': s('entrance_only', 'night_only', { lit: true, transport: true, contact: true }, 80),
  'nila-womens-hostel': s('none', 'none', { warden: true, femaleStaff: true }, 450),
  'jasmine-court-working-womens-pg': s('common_areas', 'night_only', { warden: true, lit: true, transport: true, contact: true }, 180),
  'palm-shade-mens-hostel': s('none', 'none', { aid: false, transport: true }, 350),
  'lotus-residency-for-women': s('common_areas', 'night_only', { bio: true, lit: true, contact: true }, 220),
  'kaithari-shared-homes': s('entrance_only', 'none', { lit: true, transport: true }, 100),
  'anjili-womens-hostel': s('entrance_only', 'night_only', { lit: true, contact: true }, 260),
  'greenline-mens-hostel': s('entrance_only', 'night_only', { transport: true }, 400),
  'sandalwood-suites-womens-pg': s('extensive', '24x7', { bio: true, lit: true, transport: true, contact: true }, 90),
  'thenmala-shared-house': s('entrance_only', 'none', { fire: false }, 550),
  'ixora-ladies-pg': s('entrance_only', 'none', { warden: true, lit: true, contact: true }, 240),
  'rosewood-shared-flats': s('entrance_only', 'night_only', { bio: true, lit: true, transport: true }, 130),
}
