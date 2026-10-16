// Public property reads. Never joins the owners table.
import type { DB } from '../db'
import { bool, parseJson } from '../db'
import { config } from '../config'
import { notFound, badRequest } from '../lib/http'
import { label, roomLabel, time12, inr } from '../lib/labels'
import { buildWhere, facets as facetCounts } from './filters'
import { factsFor } from './facts'
import { reviewSummary } from './reviews'
import type {
  CompareResponse,
  CompareRow,
  FactSource,
  FilterValues,
  PropertyDetail,
  PropertyListResponse,
  PropertySummary,
  RoomInventoryItem,
} from '../../../shared/types'

const MIN_REVIEWS_FOR_RATING = 3

type Row = Record<string, any>

export function toSummary(db: DB, ps: Row): PropertySummary {
  const rooms = db.prepare('SELECT room_type, ac FROM room_inventory WHERE property_id = ? ORDER BY rent_per_bed').all(ps.id) as Row[]
  const diffs = db
    .prepare(`SELECT title FROM reported_differences WHERE property_id = ? AND status != 'resolved' ORDER BY created_at`)
    .all(ps.id) as Row[]
  const nearest = db
    .prepare(
      `SELECT l.name, c.minutes_auto, c.minutes_walk FROM commute c JOIN landmarks l ON l.id = c.landmark_id
       WHERE c.property_id = ? AND l.kind IN ('it_park', 'campus') ORDER BY c.minutes_auto, c.distance_km LIMIT 1`,
    )
    .get(ps.id) as Row | undefined
  const enough = ps.review_count >= MIN_REVIEWS_FOR_RATING
  return {
    id: ps.id,
    slug: ps.slug,
    name: ps.name,
    type: ps.type,
    gender_policy: ps.gender_policy,
    occupant_focus: ps.occupant_focus,
    sub_area: { slug: ps.sub_area_slug, name: ps.sub_area_name },
    area: { slug: ps.area_slug, name: ps.area_name },
    art: ps.art,
    from_rent: ps.from_rent,
    rent_max: ps.rent_max,
    security_deposit: ps.security_deposit,
    verification_status: ps.verification_status,
    verified_badge: ps.verification_status === 'verified' && ps.verified_fact_count > 0,
    last_verified_at: ps.last_verified_at,
    rating: enough && ps.avg_rating != null ? Math.round(ps.avg_rating * 10) / 10 : null,
    review_count: ps.review_count,
    beds_available: ps.beds_available,
    food_included: ps.food_included,
    curfew_type: ps.curfew_type,
    gate_close_time: ps.gate_close_time,
    wifi: { free: bool(ps.wifi_free), speed_mbps: ps.wifi_speed_mbps },
    room_types: rooms.map((r) => r.room_type),
    has_ac_rooms: rooms.some((r) => bool(r.ac)),
    reported_difference_count: diffs.length,
    top_reported_difference: diffs[0]?.title ?? null,
    nearest: nearest ? { landmark: nearest.name, minutes_auto: nearest.minutes_auto, minutes_walk: nearest.minutes_walk } : null,
    data_source: ps.data_source,
  }
}

function orderBy(db: DB, sort: string, values: FilterValues): { sql: string; params: unknown[] } {
  const ratingExpr = `CASE WHEN ps.review_count >= ${MIN_REVIEWS_FOR_RATING} THEN ps.avg_rating END`
  switch (sort) {
    case 'rent_asc':
      return { sql: 'ps.from_rent ASC, ps.name', params: [] }
    case 'rent_desc':
      return { sql: 'ps.rent_max DESC, ps.name', params: [] }
    case 'rating':
      return { sql: `${ratingExpr} IS NULL, ${ratingExpr} DESC, ps.review_count DESC`, params: [] }
    case 'recently_verified':
      return { sql: 'ps.last_verified_at IS NULL, ps.last_verified_at DESC, ps.name', params: [] }
    case 'nearest': {
      if (values.near_landmark) {
        const mode = ['walk', 'auto', 'bus'].includes(values.commute_mode) ? values.commute_mode : 'auto'
        return {
          sql: `(SELECT c.minutes_${mode} FROM commute c JOIN landmarks l ON l.id = c.landmark_id WHERE c.property_id = ps.id AND l.slug = ?) ASC`,
          params: [values.near_landmark],
        }
      }
      const area = db.prepare('SELECT lat, lng FROM areas WHERE slug = ?').get(config.activeArea) as Row
      return { sql: '((ps.lat - ?) * (ps.lat - ?) + (ps.lng - ?) * (ps.lng - ?)) ASC', params: [area.lat, area.lat, area.lng, area.lng] }
    }
    default:
      // Recommended: verified first, places with free beds, then rating, then price.
      return {
        sql: `CASE ps.verification_status WHEN 'verified' THEN 0 WHEN 'partially_verified' THEN 1 ELSE 2 END,
              ps.beds_available = 0, ${ratingExpr} IS NULL, ${ratingExpr} DESC, ps.from_rent ASC`,
        params: [],
      }
  }
}

export function listProperties(db: DB, query: Record<string, unknown>): PropertyListResponse {
  const values: FilterValues = {}
  for (const [k, v] of Object.entries(query)) if (typeof v === 'string') values[k] = v
  const page = Math.max(1, Number(values.page) || 1)
  const limit = Math.min(50, Math.max(1, Number(values.limit) || 20))
  const sort = values.sort ?? 'relevance'

  const where = buildWhere(db, values)
  const order = orderBy(db, sort, values)
  const total = (db.prepare(`SELECT COUNT(*) AS n FROM property_search ps WHERE ${where.sql}`).get(...where.params) as { n: number }).n
  const rows = db
    .prepare(`SELECT ps.* FROM property_search ps WHERE ${where.sql} ORDER BY ${order.sql} LIMIT ? OFFSET ?`)
    .all(...where.params, ...order.params, limit, (page - 1) * limit) as Row[]

  const known = new Set([...Object.keys(where.applied), 'sort', 'page', 'limit', 'max_minutes', 'commute_mode'])
  const ignored = Object.keys(values).filter((k) => !known.has(k) && values[k] !== '')

  return {
    total,
    page,
    limit,
    results: rows.map((r) => toSummary(db, r)),
    facets: facetCounts(db, values),
    applied: where.applied,
    ignored,
  }
}

function findRow(db: DB, slugOrId: string): Row | undefined {
  return db
    .prepare(
      `SELECT ps.* FROM property_search ps JOIN areas a ON a.slug = ps.area_slug
       WHERE (ps.slug = ? OR ps.id = ?) AND ps.area_slug = ? AND a.status = 'active'`,
    )
    .get(slugOrId, slugOrId, config.activeArea) as Row | undefined
}

export function roomItems(db: DB, propertyId: string): RoomInventoryItem[] {
  const rows = db.prepare('SELECT * FROM room_inventory WHERE property_id = ? ORDER BY rent_per_bed DESC').all(propertyId) as Row[]
  return rows.map((r) => ({
    id: r.id,
    room_type: r.room_type,
    label: roomLabel(r as any),
    occupancy: r.occupancy,
    ac: bool(r.ac),
    attached_bathroom: bool(r.attached_bathroom),
    furnished: bool(r.furnished),
    rent_per_bed: r.rent_per_bed,
    mess_cost_per_month: r.mess_cost_per_month,
    total_beds: r.total_beds,
    available_beds: r.available_beds,
    next_available_date: r.next_available_date,
    availability_updated_at: r.availability_updated_at,
    waitlist_open: bool(r.waitlist_open),
    status: r.available_beds > 0 ? 'available' : bool(r.waitlist_open) ? 'full_waitlist' : 'full',
  }))
}

export function getPropertyDetail(db: DB, slug: string): PropertyDetail {
  const ps = findRow(db, slug)
  if (!ps) throw notFound('We couldn’t find that place in the area we cover.')
  const summary = toSummary(db, ps)
  const { facts, counts } = factsFor(db, ps.id)

  const amenities = db
    .prepare(
      `SELECT a.id, a.label, a.icon, pa.note FROM property_amenities pa JOIN amenities a ON a.id = pa.amenity_id
       WHERE pa.property_id = ? ORDER BY a.rowid`,
    )
    .all(ps.id) as PropertyDetail['amenities']

  const commute = (
    db
      .prepare(
        `SELECT l.slug, l.name, l.kind, c.minutes_walk, c.minutes_auto, c.minutes_bus, c.distance_km
         FROM commute c JOIN landmarks l ON l.id = c.landmark_id WHERE c.property_id = ? ORDER BY c.distance_km`,
      )
      .all(ps.id) as Row[]
  ).map((c) => ({
    landmark: { slug: c.slug, name: c.name, kind: c.kind },
    minutes_walk: c.minutes_walk,
    minutes_auto: c.minutes_auto,
    minutes_bus: c.minutes_bus,
    distance_km: c.distance_km,
  }))

  const differences = (db.prepare('SELECT * FROM reported_differences WHERE property_id = ? ORDER BY created_at').all(ps.id) as Row[]).map((d) => {
    const ids = parseJson<string[]>(d.supporting_review_ids, [])
    return {
      id: d.id,
      field_name: d.field_name,
      title: d.title,
      listed_value: d.listed_value,
      reported_summary: d.reported_summary,
      supporting_review_count: ids.length,
      supporting_review_ids: ids,
      status: d.status,
      owner_response: d.owner_response,
    }
  })

  return {
    ...summary,
    description: ps.description,
    address_line: ps.address_line,
    lat: ps.lat,
    lng: ps.lng,
    year_established: ps.year_established,
    floors: ps.floors,
    costs: {
      security_deposit: ps.security_deposit,
      advance_months: ps.advance_months,
      maintenance_charge: ps.maintenance_charge,
      electricity_policy: ps.electricity_policy,
      other_charges: parseJson(ps.other_charges, []),
      notice_period_days: ps.notice_period_days,
      notice_terms: ps.notice_terms,
      min_stay_months: ps.min_stay_months,
      max_stay_months: ps.max_stay_months,
    },
    amenities,
    facts,
    source_counts: counts,
    rooms: roomItems(db, ps.id),
    commute,
    reported_differences: differences,
    review_summary: reviewSummary(db, ps.id),
  }
}

/** Side-by-side rows for up to three places. Highlights differences; never combines safety into a score. */
export function compareProperties(db: DB, idsParam: string): CompareResponse {
  const ids = [...new Set(String(idsParam ?? '').split(',').map((s) => s.trim()).filter(Boolean))]
  if (ids.length === 0) throw badRequest('COMPARE_EMPTY', 'Add at least one place to compare.')
  if (ids.length > config.maxCompare) throw badRequest('COMPARE_LIMIT', `You can compare up to ${config.maxCompare} places at a time.`, { max: config.maxCompare })
  const details = ids.map((id) => getPropertyDetail(db, id))

  const fact = (d: PropertyDetail, field: string) => {
    const [group] = field.split('.') as [keyof PropertyDetail['facts']]
    return d.facts[group].find((f) => f.field === field)
  }
  const rows: CompareRow[] = []
  const add = (
    key: string,
    labelText: string,
    group: string,
    get: (d: PropertyDetail) => string | null,
    opts: { num?: (d: PropertyDetail) => number | null; better?: 'low' | 'high'; source?: (d: PropertyDetail) => FactSource | null } = {},
  ) => {
    const values = details.map(get)
    let best: number | null = null
    if (opts.num && opts.better && details.length > 1) {
      const nums = details.map(opts.num)
      if (nums.every((n) => n != null) && new Set(nums).size > 1) {
        const target = opts.better === 'low' ? Math.min(...(nums as number[])) : Math.max(...(nums as number[]))
        const idx = nums.filter((n) => n === target).length === 1 ? nums.indexOf(target) : -1
        best = idx >= 0 ? idx : null
      }
    }
    rows.push({
      key,
      label: labelText,
      group,
      values,
      sources: details.map((d) => opts.source?.(d) ?? null),
      differs: new Set(values).size > 1,
      best_index: best,
    })
  }
  const factRow = (field: string, labelText: string, group: string, num?: (d: PropertyDetail) => number | null, better?: 'low' | 'high') =>
    add(field, labelText, group, (d) => fact(d, field)?.display ?? null, { num, better, source: (d) => fact(d, field)?.source ?? null })

  add('type', 'Type', 'Basics', (d) => label('type', d.type))
  add('gender_policy', 'Who it is for', 'Basics', (d) => label('gender_policy', d.gender_policy))
  add('sub_area', 'Locality', 'Basics', (d) => d.sub_area.name)
  add('from_rent', 'Rent from (per bed)', 'Costs', (d) => inr(d.from_rent), { num: (d) => d.from_rent, better: 'low' })
  add('deposit', 'Security deposit', 'Costs', (d) => inr(d.costs.security_deposit), { num: (d) => d.costs.security_deposit, better: 'low' })
  add('electricity', 'Electricity', 'Costs', (d) => label('electricity_policy', d.costs.electricity_policy))
  add('other_charges', 'Other listed charges', 'Costs', (d) =>
    d.costs.other_charges.length ? d.costs.other_charges.map((c) => `${c.name} ${inr(c.amount)}${c.frequency === 'monthly' ? '/mo' : c.frequency === 'yearly' ? '/yr' : ''}`).join(', ') : 'None listed',
  )
  add('beds', 'Free beds (as last updated)', 'Availability', (d) => (d.beds_available > 0 ? `${d.beds_available} free` : 'Full'))
  factRow('food.food_included', 'Food', 'Food')
  factRow('food.veg_options', 'Veg / non-veg', 'Food')
  factRow('rules.curfew_type', 'Curfew', 'Rules')
  factRow('rules.gate_close_time', 'Gate closes', 'Rules')
  factRow('rules.late_entry_policy', 'Late entry', 'Rules')
  factRow('rules.visitors_policy', 'Visitors', 'Rules')
  factRow('wifi.speed_mbps', 'Wi-Fi speed (listed)', 'Wi-Fi', (d) => d.wifi.speed_mbps, 'high')
  factRow('wifi.free', 'Wi-Fi cost', 'Wi-Fi')
  factRow('cleaning.room_cleaning_per_week', 'Room cleaning', 'Cleaning', (d) => Number(fact(d, 'cleaning.room_cleaning_per_week')?.value ?? 0), 'high')
  factRow('cleaning.garbage_collection', 'Garbage collection', 'Cleaning')
  factRow('safety.cctv', 'CCTV', 'Safety features')
  factRow('safety.security_guard', 'Security guard', 'Safety features')
  factRow('safety.female_warden_resident', 'Female warden on site', 'Safety features')
  factRow('safety.biometric_or_keycard_entry', 'Biometric or keycard entry', 'Safety features')
  factRow('safety.distance_to_main_road_m', 'Distance to main road', 'Safety features', (d) => Number(fact(d, 'safety.distance_to_main_road_m')?.value ?? 0), 'low')
  factRow('safety.approach_road_lit', 'Approach road lit', 'Safety features')
  add('nearest', 'Nearest IT park or campus', 'Commute', (d) => (d.nearest ? `${d.nearest.landmark} · ${d.nearest.minutes_auto} min by auto` : null))
  add('rating', 'Resident rating', 'Reviews', (d) => (d.rating != null ? `${d.rating.toFixed(1)} ★ (${d.review_count})` : d.review_count ? `Not enough reviews yet (${d.review_count})` : 'No reviews yet'), {
    num: (d) => d.rating,
    better: 'high',
  })
  add('differences', 'Reported differences', 'Reviews', (d) => (d.reported_difference_count ? `${d.reported_difference_count} reported by residents` : 'None reported'))
  add('verification', 'Verification', 'Verification', (d) =>
    d.verification_status === 'verified' ? `Verified ${d.last_verified_at?.slice(0, 10)}` : label('verification_status', d.verification_status),
  )

  return {
    properties: details.map((d) => toSummary(db, findRow(db, d.slug)!)),
    rows,
    note: 'Safety is shown as individual features with their source. Havenly does not combine them into a score.',
  }
}

export const gateLabel = (t: string | null) => (t ? `Gate closes ${time12(t)}` : 'No gate time')
