// Turns detail-table rows into labelled facts, each carrying where it came from.
import type { DB } from '../db'
import { bool, parseJson } from '../db'
import { label, time12 } from '../lib/labels'
import type { Fact, FactSource } from '../../../shared/types'

/** Fields that get one provenance row each. Every rules and safety field is covered. */
export const PROVENANCE_FIELDS = {
  rules: ['gate_close_time', 'curfew_type', 'late_entry_policy', 'out_pass_required', 'visitors_policy', 'visitor_hours', 'smoking_alcohol_policy', 'overnight_guests'],
  safety: [
    'cctv',
    'security_guard',
    'biometric_or_keycard_entry',
    'female_warden_resident',
    'female_staff_only',
    'fire_extinguishers',
    'first_aid',
    'distance_to_main_road_m',
    'approach_road_lit',
    'night_transport_nearby',
    'emergency_contact_displayed',
  ],
  wifi: ['free', 'speed_mbps', 'backup_connection', 'coverage', 'data_cap_gb'],
  food: ['food_included', 'meals_per_day', 'veg_options', 'cuisine_tags', 'mess_timing', 'self_cooking_allowed', 'food_quality_note'],
  cleaning: ['room_cleaning_per_week', 'bathroom_cleaning_per_week', 'common_area_cleaning_per_week', 'linen_change_per_month', 'pest_control_per_year', 'garbage_collection'],
} as const

export type FactGroup = keyof typeof PROVENANCE_FIELDS

const yesNo = (v: unknown, yes = 'Yes', no = 'No') => (bool(v) ? yes : no)
const perWeek = (n: number) => (n >= 7 ? 'Daily' : n === 0 ? 'Not provided' : `${n} time${n > 1 ? 's' : ''} a week`)

const FIELD: Record<string, { label: string; display: (v: any) => string }> = {
  'rules.gate_close_time': { label: 'Gate closes', display: (v) => (v ? time12(v)! : 'Gate does not close') },
  'rules.curfew_type': { label: 'Curfew', display: (v) => label('curfew_type', v) },
  'rules.late_entry_policy': { label: 'Late entry', display: (v) => label('late_entry', v) },
  'rules.out_pass_required': { label: 'Out-pass for nights away', display: (v) => yesNo(v, 'Required', 'Not required') },
  'rules.visitors_policy': { label: 'Visitors', display: (v) => label('visitors', v) },
  'rules.visitor_hours': { label: 'Visitor hours', display: (v) => v ?? '—' },
  'rules.smoking_alcohol_policy': { label: 'Smoking and alcohol', display: (v) => v },
  'rules.overnight_guests': { label: 'Overnight guests', display: (v) => yesNo(v, 'Allowed', 'Not allowed') },
  'safety.cctv': { label: 'CCTV', display: (v) => label('cctv', v) },
  'safety.security_guard': { label: 'Security guard', display: (v) => label('security_guard', v) },
  'safety.biometric_or_keycard_entry': { label: 'Biometric or keycard entry', display: (v) => yesNo(v) },
  'safety.female_warden_resident': { label: 'Female warden living on site', display: (v) => yesNo(v) },
  'safety.female_staff_only': { label: 'Women staff only', display: (v) => yesNo(v) },
  'safety.fire_extinguishers': { label: 'Fire extinguishers', display: (v) => yesNo(v) },
  'safety.first_aid': { label: 'First-aid kit', display: (v) => yesNo(v) },
  'safety.distance_to_main_road_m': { label: 'Distance to main road', display: (v) => `${v} m` },
  'safety.approach_road_lit': { label: 'Approach road lit at night', display: (v) => yesNo(v) },
  'safety.night_transport_nearby': { label: 'Autos or buses at night nearby', display: (v) => yesNo(v) },
  'safety.emergency_contact_displayed': { label: 'Emergency contacts displayed', display: (v) => yesNo(v) },
  'wifi.free': { label: 'Wi-Fi cost', display: (v) => yesNo(v, 'Free', 'Paid add-on') },
  'wifi.speed_mbps': { label: 'Listed speed', display: (v) => `${v} Mbps` },
  'wifi.backup_connection': { label: 'Backup connection', display: (v) => yesNo(v) },
  'wifi.coverage': { label: 'Coverage', display: (v) => label('coverage', v) },
  'wifi.data_cap_gb': { label: 'Data cap', display: (v) => (v ? `${v} GB a month` : 'Unlimited') },
  'food.food_included': { label: 'Food', display: (v) => label('food_included', v) },
  'food.meals_per_day': { label: 'Meals a day', display: (v) => (v ? String(v) : '—') },
  'food.veg_options': { label: 'Veg / non-veg', display: (v) => label('veg_options', v) },
  'food.cuisine_tags': { label: 'Cuisine', display: (v) => (parseJson<string[]>(v, []).map((c) => label('cuisine', c)).join(', ') || '—') },
  'food.mess_timing': { label: 'Mess timings', display: (v) => v ?? '—' },
  'food.self_cooking_allowed': { label: 'Cooking yourself', display: (v) => yesNo(v, 'Allowed', 'Not allowed') },
  'food.food_quality_note': { label: 'Owner’s description of the food', display: (v) => v ?? '—' },
  'cleaning.room_cleaning_per_week': { label: 'Room cleaning', display: (v) => perWeek(v) },
  'cleaning.bathroom_cleaning_per_week': { label: 'Bathroom cleaning', display: (v) => (v > 7 ? `${v / 7 >= 2 ? 'Twice' : v} a day` : perWeek(v)) },
  'cleaning.common_area_cleaning_per_week': { label: 'Common areas', display: (v) => perWeek(v) },
  'cleaning.linen_change_per_month': { label: 'Linen change', display: (v) => (v ? `${v} times a month` : 'Bring your own') },
  'cleaning.pest_control_per_year': { label: 'Pest control', display: (v) => (v ? `${v} times a year` : 'Not listed') },
  'cleaning.garbage_collection': { label: 'Garbage collection', display: (v) => label('garbage_collection', v) },
}

export const fieldLabel = (field: string) => FIELD[field]?.label ?? field

const TABLE: Record<FactGroup, string> = {
  rules: 'rules_details',
  safety: 'safety_features',
  wifi: 'wifi_details',
  food: 'food_details',
  cleaning: 'cleaning_details',
}

export function factsFor(db: DB, propertyId: string) {
  const prov = db
    .prepare('SELECT field_name, source, evidence_type, verified_at, note FROM fact_provenance WHERE property_id = ?')
    .all(propertyId) as { field_name: string; source: FactSource; evidence_type: string | null; verified_at: string | null; note: string | null }[]

  const out = {} as Record<FactGroup, Fact[]>
  const counts: Record<FactSource, number> = { owner_listed: 0, platform_verified: 0, resident_reported: 0 }

  for (const group of Object.keys(PROVENANCE_FIELDS) as FactGroup[]) {
    const row = db.prepare(`SELECT * FROM ${TABLE[group]} WHERE property_id = ?`).get(propertyId) as Record<string, unknown> | undefined
    out[group] = []
    if (!row) continue
    for (const f of PROVENANCE_FIELDS[group]) {
      const field = `${group}.${f}`
      const rows = prov.filter((p) => p.field_name === field)
      const primary = rows.find((p) => p.source === 'platform_verified') ?? rows.find((p) => p.source === 'owner_listed')
      const resident = rows.find((p) => p.source === 'resident_reported')
      const source: FactSource = primary?.source ?? 'owner_listed'
      counts[source]++
      if (resident) counts.resident_reported++
      const value = row[f] as Fact['value']
      out[group].push({
        field,
        label: FIELD[field]?.label ?? f,
        value: typeof value === 'number' && /^(free|backup_connection|biometric|female_|fire_|first_aid|approach|night_|emergency|out_pass|overnight|self_cooking)/.test(f) ? bool(value) : value,
        display: FIELD[field]?.display(value) ?? String(value ?? '—'),
        source,
        evidence_type: primary?.evidence_type ?? null,
        verified_at: source === 'platform_verified' ? primary?.verified_at ?? null : null,
        note: primary?.note ?? null,
        resident_reports: resident?.note ?? null,
      })
    }
  }
  // Resident reports on fields outside these groups (amenities, costs) still count.
  counts.resident_reported += prov.filter((p) => p.source === 'resident_reported' && !Object.keys(TABLE).some((g) => p.field_name.startsWith(g + '.'))).length
  return { facts: out, counts }
}
