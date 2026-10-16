// The single source of truth for filters. GET /api/filters, the SQL in GET /api/properties,
// facet counts, and the search interpreter's allowed keys all come from this registry.
import type { DB } from '../db'
import type { FilterDef, FilterGroupDef, FilterOption, FiltersResponse, FilterValues } from '../../../shared/types'
import { LABELS } from '../lib/labels'
import { config } from '../config'

export interface Clause {
  sql: string
  params: unknown[]
}

interface FilterImpl extends FilterDef {
  /** Build a WHERE fragment against the property_search view (alias ps). Return null to ignore. */
  build?: (value: string, all: FilterValues) => Clause | null
  /** Keys this filter consumes from the query string (defaults to [key]). */
  keys?: string[]
}

export const GROUPS: FilterGroupDef[] = [
  { key: 'place', label: 'Place and room' },
  { key: 'budget', label: 'Budget' },
  { key: 'wifi_amenities', label: 'Wi-Fi and amenities' },
  { key: 'food', label: 'Food' },
  { key: 'cleaning', label: 'Cleaning' },
  { key: 'rules', label: 'Rules and curfew' },
  { key: 'safety', label: 'Safety features' },
  { key: 'commute', label: 'Commute' },
  { key: 'verification', label: 'Verification and reviews' },
]

const opts = (group: string, values?: string[]): FilterOption[] =>
  (values ?? Object.keys(LABELS[group])).map((value) => ({ value, label: LABELS[group][value] ?? value }))

const list = (v: string) =>
  v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

const isTrue = (v: string) => v === 'true' || v === '1'

/** Restrict comma-separated input to known option values; return null if nothing valid remains. */
const inList = (column: string, options: FilterOption[], expand?: (v: string) => string[]) => (value: string): Clause | null => {
  const allowed = new Set(options.map((o) => o.value))
  let values = list(value).filter((v) => allowed.has(v))
  if (expand) values = [...new Set(values.flatMap(expand))]
  if (!values.length) return null
  return { sql: `${column} IN (${values.map(() => '?').join(', ')})`, params: values }
}

const room = (cond: string, params: unknown[] = []): Clause => ({
  sql: `EXISTS (SELECT 1 FROM room_inventory ri WHERE ri.property_id = ps.id AND ${cond})`,
  params,
})

const amenity = (...ids: string[]): Clause => ({
  sql: `EXISTS (SELECT 1 FROM property_amenities pa WHERE pa.property_id = ps.id AND pa.amenity_id IN (${ids.map(() => '?').join(', ')}))`,
  params: ids,
})

const bool = (build: () => Clause) => (v: string) => (isTrue(v) ? build() : null)

const CCTV_RANK = `CASE ps.cctv WHEN 'none' THEN 0 WHEN 'entrance_only' THEN 1 WHEN 'common_areas' THEN 2 WHEN 'extensive' THEN 3 END`
const CCTV_LEVEL: Record<string, number> = { entrance_only: 1, common_areas: 2, extensive: 3 }
const SAFETY_SOURCE = 'Each place shows whether this is listed by the owner or verified by Havenly.'

function staticFilters(): FilterImpl[] {
  const focusOpts = opts('occupant_focus', ['working_professionals', 'students'])
  return [
    // ---------- place ----------
    { key: 'type', label: 'Type of place', group: 'place', kind: 'multi', supported: true, options: opts('type'), build: inList('ps.type', opts('type')) },
    {
      key: 'gender_policy', label: 'Who it is for', group: 'place', kind: 'multi', supported: true, options: opts('gender_policy'),
      build: inList('ps.gender_policy', opts('gender_policy')),
    },
    {
      key: 'occupant_focus', label: 'Best suited to', group: 'place', kind: 'multi', supported: true, options: focusOpts,
      build: inList('ps.occupant_focus', focusOpts, (v) => [v, 'both']),
    },
    {
      key: 'room_type', label: 'Room type', group: 'place', kind: 'multi', supported: true, options: opts('room_type'),
      build: (v) => {
        const values = list(v).filter((x) => x in LABELS.room_type)
        return values.length ? room(`ri.room_type IN (${values.map(() => '?').join(', ')})`, values) : null
      },
    },
    {
      key: 'occupancy', label: 'Most people per room', group: 'place', kind: 'single', supported: true,
      options: [
        { value: '1', label: 'Just me' },
        { value: '2', label: 'Up to 2' },
        { value: '3', label: 'Up to 3' },
        { value: '4', label: 'Up to 4' },
      ],
      build: (v) => (Number(v) > 0 ? room('ri.occupancy <= ?', [Number(v)]) : null),
    },
    { key: 'ac', label: 'AC room available', group: 'place', kind: 'boolean', supported: true, build: bool(() => room('ri.ac = 1')) },
    { key: 'attached_bathroom', label: 'Attached bathroom', group: 'place', kind: 'boolean', supported: true, build: bool(() => room('ri.attached_bathroom = 1')) },
    {
      key: 'available_now', label: 'Has free beds', group: 'place', kind: 'boolean', supported: true,
      help: 'As last updated by the listing, not live.', build: bool(() => room('ri.available_beds > 0')),
    },

    // ---------- budget ----------
    {
      key: 'rent', label: 'Monthly rent per bed', group: 'budget', kind: 'range', supported: true, keys: ['rent_min', 'rent_max'],
      range: {
        min_key: 'rent_min', max_key: 'rent_max', min: 0, max: 25000, step: 500,
        presets: [
          { label: 'Up to ₹10k', max: 10000 },
          { label: '₹10k–14k', min: 10000, max: 14000 },
          { label: '₹14k–18k', min: 14000, max: 18000 },
          { label: '₹18k and above', min: 18000 },
        ],
      },
    },

    // ---------- wifi & amenities ----------
    { key: 'wifi_free', label: 'Free Wi-Fi', group: 'wifi_amenities', kind: 'boolean', supported: true, build: bool(() => ({ sql: 'ps.wifi_free = 1', params: [] })) },
    {
      key: 'wifi_min_mbps', label: 'Listed Wi-Fi speed', group: 'wifi_amenities', kind: 'single', supported: true,
      options: ['25', '50', '100', '150'].map((v) => ({ value: v, label: `${v}+ Mbps` })),
      help: 'Speed as listed. Check reported differences for evening slowdowns.',
      build: (v) => (Number(v) > 0 ? { sql: 'ps.wifi_speed_mbps >= ?', params: [Number(v)] } : null),
    },
    { key: 'laundry', label: 'Laundry or washing machine', group: 'wifi_amenities', kind: 'boolean', supported: true, build: bool(() => amenity('laundry', 'washing_machine')) },
    { key: 'power_backup', label: 'Power backup', group: 'wifi_amenities', kind: 'boolean', supported: true, build: bool(() => amenity('power_backup')) },
    { key: 'hot_water_24h', label: '24-hour hot water (listed)', group: 'wifi_amenities', kind: 'boolean', supported: true, build: bool(() => amenity('hot_water_24h')) },

    // ---------- food ----------
    { key: 'food_included', label: 'Food', group: 'food', kind: 'multi', supported: true, options: opts('food_included'), build: inList('ps.food_included', opts('food_included')) },
    {
      key: 'veg_options', label: 'Veg / non-veg', group: 'food', kind: 'multi', supported: true, options: opts('veg_options', ['veg_only', 'both']),
      build: inList('ps.veg_options', opts('veg_options')),
    },
    {
      key: 'cuisine', label: 'Cuisine', group: 'food', kind: 'multi', supported: true, options: opts('cuisine', ['kerala', 'north_indian', 'south_indian']),
      build: (v) => {
        const values = list(v).filter((x) => x in LABELS.cuisine)
        if (!values.length) return null
        return { sql: `(${values.map(() => 'ps.cuisine_tags LIKE ?').join(' OR ')})`, params: values.map((x) => `%"${x}"%`) }
      },
    },

    // ---------- cleaning ----------
    {
      key: 'cleaning_min_per_week', label: 'Room cleaning', group: 'cleaning', kind: 'single', supported: true,
      options: [
        { value: '2', label: '2+ times a week' },
        { value: '3', label: '3+ times a week' },
        { value: '6', label: 'Daily or almost daily' },
      ],
      build: (v) => (Number(v) > 0 ? { sql: 'ps.room_cleaning_per_week >= ?', params: [Number(v)] } : null),
    },
    {
      key: 'garbage', label: 'Garbage collection', group: 'cleaning', kind: 'multi', supported: true, options: opts('garbage_collection'),
      build: inList('ps.garbage_collection', opts('garbage_collection')),
    },

    // ---------- rules ----------
    { key: 'curfew_type', label: 'Curfew', group: 'rules', kind: 'multi', supported: true, options: opts('curfew_type'), build: inList('ps.curfew_type', opts('curfew_type')) },
    { key: 'late_entry', label: 'Late entry', group: 'rules', kind: 'multi', supported: true, options: opts('late_entry'), build: inList('ps.late_entry_policy', opts('late_entry')) },
    {
      key: 'gate_close_after', label: 'Gate open until at least', group: 'rules', kind: 'single', supported: true,
      options: [
        { value: '21:00', label: '9 PM' },
        { value: '22:00', label: '10 PM' },
        { value: '23:00', label: '11 PM' },
      ],
      build: (v) => (/^\d{2}:\d{2}$/.test(v) ? { sql: '(ps.gate_close_time IS NULL OR ps.gate_close_time >= ?)', params: [v] } : null),
    },
    { key: 'visitors', label: 'Visitors', group: 'rules', kind: 'multi', supported: true, options: opts('visitors'), build: inList('ps.visitors_policy', opts('visitors')) },

    // ---------- safety (facts only, never a score) ----------
    {
      key: 'cctv_min', label: 'CCTV at least', group: 'safety', kind: 'single', supported: true, source_note: SAFETY_SOURCE,
      options: opts('cctv', ['entrance_only', 'common_areas', 'extensive']),
      build: (v) => (CCTV_LEVEL[v] ? { sql: `${CCTV_RANK} >= ?`, params: [CCTV_LEVEL[v]] } : null),
    },
    { key: 'guard_24x7', label: '24x7 security guard', group: 'safety', kind: 'boolean', supported: true, source_note: SAFETY_SOURCE, build: bool(() => ({ sql: `ps.security_guard = '24x7'`, params: [] })) },
    { key: 'female_warden', label: 'Female warden lives on site', group: 'safety', kind: 'boolean', supported: true, source_note: SAFETY_SOURCE, build: bool(() => ({ sql: 'ps.female_warden_resident = 1', params: [] })) },
    { key: 'biometric_entry', label: 'Biometric or keycard entry', group: 'safety', kind: 'boolean', supported: true, source_note: SAFETY_SOURCE, build: bool(() => ({ sql: 'ps.biometric_or_keycard_entry = 1', params: [] })) },
    {
      key: 'main_road_within_m', label: 'Distance to main road', group: 'safety', kind: 'single', supported: true, source_note: SAFETY_SOURCE,
      options: ['100', '200', '300'].map((v) => ({ value: v, label: `Within ${v} m` })),
      build: (v) => (Number(v) > 0 ? { sql: 'ps.distance_to_main_road_m <= ?', params: [Number(v)] } : null),
    },

    // ---------- verification & reviews ----------
    {
      key: 'verified_only', label: 'Verified by Havenly only', group: 'verification', kind: 'boolean', supported: true,
      build: bool(() => ({ sql: `ps.verification_status = 'verified' AND ps.verified_fact_count > 0`, params: [] })),
    },
    {
      key: 'min_rating', label: 'Resident rating', group: 'verification', kind: 'single', supported: true,
      help: 'Only places with at least 3 reviews have a rating.',
      options: ['3', '3.5', '4'].map((v) => ({ value: v, label: `${v}★ and up` })),
      build: (v) => (Number(v) > 0 ? { sql: 'ps.review_count >= 3 AND ps.avg_rating >= ?', params: [Number(v)] } : null),
    },
    { key: 'has_reviews', label: 'Has resident reviews', group: 'verification', kind: 'boolean', supported: true, build: bool(() => ({ sql: 'ps.review_count > 0', params: [] })) },

    // ---------- known but not tracked yet ----------
    { key: 'gym', label: 'Gym', group: 'wifi_amenities', kind: 'boolean', supported: false, help: 'Not tracked yet.' },
    { key: 'pets_allowed', label: 'Pets allowed', group: 'rules', kind: 'boolean', supported: false, help: 'Not tracked yet.' },
    { key: 'quiet_area', label: 'Quiet neighbourhood', group: 'place', kind: 'boolean', supported: false, help: 'Too subjective to filter. Read resident reviews instead.' },
  ]
}

/** Filters that need the database for their options (sub-areas and landmarks of the active area). */
function dynamicFilters(db: DB): FilterImpl[] {
  const subAreas = db
    .prepare(
      `SELECT s.slug AS value, s.name AS label FROM sub_areas s JOIN areas a ON a.id = s.area_id
       WHERE a.slug = ? AND EXISTS (SELECT 1 FROM properties p WHERE p.sub_area_id = s.id) ORDER BY s.name`,
    )
    .all(config.activeArea) as FilterOption[]
  const landmarks = db
    .prepare(`SELECT l.slug AS value, l.name AS label FROM landmarks l JOIN areas a ON a.id = l.area_id WHERE a.slug = ? ORDER BY l.name`)
    .all(config.activeArea) as FilterOption[]

  return [
    { key: 'sub_area', label: 'Locality', group: 'place', kind: 'multi', supported: true, options: subAreas, build: inList('ps.sub_area_slug', subAreas) },
    {
      key: 'near_landmark', label: 'Close to', group: 'commute', kind: 'commute', supported: true, options: landmarks,
      keys: ['near_landmark', 'max_minutes', 'commute_mode'],
      commute: { minutes_key: 'max_minutes', mode_key: 'commute_mode', minutes: [5, 10, 15, 20, 30] },
      help: 'Estimated from location. Auto times assume normal daytime traffic.',
      build: (v, all) => {
        if (!landmarks.some((l) => l.value === v)) return null
        const mode = ['walk', 'auto', 'bus'].includes(all.commute_mode) ? all.commute_mode : 'auto'
        const minutes = Number(all.max_minutes) > 0 ? Number(all.max_minutes) : 15
        return {
          sql: `EXISTS (SELECT 1 FROM commute c JOIN landmarks l ON l.id = c.landmark_id WHERE c.property_id = ps.id AND l.slug = ? AND c.minutes_${mode} <= ?)`,
          params: [v, minutes],
        }
      },
    },
  ]
}

export function registry(db: DB): FilterImpl[] {
  const [sub_area, near] = dynamicFilters(db)
  const all = staticFilters()
  // Locality sits with the other "place" filters; commute gets its own group.
  all.splice(3, 0, sub_area)
  all.push(near)
  return all
}

export const SORTS: FilterOption[] = [
  { value: 'relevance', label: 'Recommended' },
  { value: 'rent_asc', label: 'Rent: low to high' },
  { value: 'rent_desc', label: 'Rent: high to low' },
  { value: 'rating', label: 'Resident rating' },
  { value: 'nearest', label: 'Nearest' },
  { value: 'recently_verified', label: 'Recently verified' },
]

export function filtersResponse(db: DB): FiltersResponse {
  return {
    groups: GROUPS,
    filters: registry(db).map(({ build: _b, keys: _k, ...def }) => def),
    sorts: SORTS,
  }
}

/** Every query key the API accepts (used to validate interpreter output and to report ignored params). */
export function allowedKeys(db: DB): Set<string> {
  const keys = new Set<string>(['q', 'sort', 'page', 'limit'])
  for (const f of registry(db)) if (f.supported) (f.keys ?? [f.key]).forEach((k) => keys.add(k))
  return keys
}

/** Build the WHERE clause for the active area plus every applied filter, optionally skipping one (for facets). */
export function buildWhere(db: DB, values: FilterValues, skipKey?: string) {
  const clauses: Clause[] = [{ sql: `ps.area_slug = ? AND EXISTS (SELECT 1 FROM areas a WHERE a.slug = ps.area_slug AND a.status = 'active')`, params: [config.activeArea] }]
  const applied: FilterValues = {}
  for (const f of registry(db)) {
    if (!f.supported || f.key === skipKey) continue
    if (f.kind === 'range' && f.range) {
      const lo = Number(values[f.range.min_key])
      const hi = Number(values[f.range.max_key])
      const conds: string[] = []
      const params: unknown[] = []
      if (lo > 0) {
        conds.push('ri.rent_per_bed >= ?')
        params.push(lo)
        applied[f.range.min_key] = String(lo)
      }
      if (hi > 0) {
        conds.push('ri.rent_per_bed <= ?')
        params.push(hi)
        applied[f.range.max_key] = String(hi)
      }
      if (conds.length) clauses.push(room(conds.join(' AND '), params))
      continue
    }
    const v = values[f.key]
    if (v == null || v === '' || !f.build) continue
    const c = f.build(v, values)
    if (c) {
      clauses.push(c)
      applied[f.key] = v
      if (f.kind === 'commute') {
        applied.max_minutes = String(Number(values.max_minutes) > 0 ? Number(values.max_minutes) : 15)
        applied.commute_mode = ['walk', 'auto', 'bus'].includes(values.commute_mode) ? values.commute_mode : 'auto'
      }
    }
  }
  if (values.q && values.q.trim() && skipKey !== 'q') {
    const like = `%${values.q.trim().toLowerCase()}%`
    clauses.push({
      sql: '(LOWER(ps.name) LIKE ? OR LOWER(ps.description) LIKE ? OR LOWER(ps.sub_area_name) LIKE ? OR LOWER(ps.address_line) LIKE ?)',
      params: [like, like, like, like],
    })
    applied.q = values.q.trim()
  }
  return {
    sql: clauses.map((c) => `(${c.sql})`).join(' AND '),
    params: clauses.flatMap((c) => c.params),
    applied,
  }
}

/** Facet counts: for each option, how many places match if that option were chosen with every other filter kept. */
export function facets(db: DB, values: FilterValues) {
  const out: Record<string, Record<string, number>> = {}
  for (const f of registry(db)) {
    if (!f.supported || !f.build || f.kind === 'range' || f.kind === 'commute') continue
    const base = buildWhere(db, values, f.key)
    out[f.key] = {}
    const candidates = f.kind === 'boolean' ? ['true'] : (f.options ?? []).map((o) => o.value)
    for (const value of candidates) {
      const c = f.build(value, values)
      if (!c) continue
      const row = db.prepare(`SELECT COUNT(*) AS n FROM property_search ps WHERE ${base.sql} AND (${c.sql})`).get(...base.params, ...c.params) as { n: number }
      out[f.key][value] = row.n
    }
  }
  return out
}
