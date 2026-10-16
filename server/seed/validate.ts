// Validates the database against the demo-data rules and prints a pass/fail report.
// Exit code 1 if anything fails. Run after `npm run seed`.
import type { AddressInfo } from 'node:net'
import { getDb, parseJson, bool } from '../src/db'
import { config } from '../src/config'
import { commuteFor, haversineKm } from '../src/lib/geo'
import { PROVENANCE_FIELDS } from '../src/services/facts'
import { OUT_OF_COVERAGE_PLACES } from '../src/config/coverage'
import { createApp } from '../src/app'

type Row = Record<string, any>
const db = getDb()
const results: { section: string; name: string; ok: boolean; detail?: string }[] = []
let section = ''
const check = (name: string, ok: boolean, detail?: string) => results.push({ section, name, ok, detail: ok ? undefined : detail })
const all = (sql: string, ...p: unknown[]) => db.prepare(sql).all(...p) as Row[]
const one = (sql: string, ...p: unknown[]) => db.prepare(sql).get(...p) as Row
const countBy = (rows: Row[], key: string) => rows.reduce<Record<string, number>>((m, r) => ((m[r[key]] = (m[r[key]] ?? 0) + 1), m), {})
const eq = (a: Record<string, number>, b: Record<string, number>) => Object.keys({ ...a, ...b }).every((k) => (a[k] ?? 0) === (b[k] ?? 0))

const props = all(`SELECT p.*, a.slug AS area_slug FROM properties p JOIN areas a ON a.id = p.area_id`)
const byId = new Map<string, any>(props.map((p) => [p.id, p]))
const rooms = all('SELECT * FROM room_inventory')
const roomsOf = (pid: string) => rooms.filter((r) => r.property_id === pid)

// ---------------- referential integrity ----------------
section = 'Referential integrity'
const fk = all('PRAGMA foreign_key_check')
check('No foreign key violations', fk.length === 0, JSON.stringify(fk.slice(0, 3)))
const orphanDiffs = all(`SELECT d.id, d.supporting_review_ids, d.property_id FROM reported_differences d`).filter((d) =>
  parseJson<string[]>(d.supporting_review_ids, []).some((rid) => !one(`SELECT 1 AS x FROM reviews WHERE id = ? AND property_id = ? AND moderation_status = 'approved'`, rid, d.property_id)),
)
check('Reported differences cite approved reviews of the same property', orphanDiffs.length === 0, orphanDiffs.map((d) => d.id).join(', '))
for (const t of ['wifi_details', 'food_details', 'cleaning_details', 'rules_details', 'safety_features']) {
  const missing = props.filter((p) => !one(`SELECT 1 AS x FROM ${t} WHERE property_id = ?`, p.id))
  check(`Every property has ${t}`, missing.length === 0, missing.map((p) => p.slug).join(', '))
}
check('Every property has at least one room type', props.every((p) => roomsOf(p.id).length > 0))
check('Every property has an owner record (admin-only)', props.every((p) => !!one('SELECT 1 AS x FROM owners WHERE property_id = ?', p.id)))

// ---------------- area scope ----------------
section = 'Area scope'
const active = one(`SELECT * FROM areas WHERE slug = ?`, config.activeArea)
check(`Active area "${config.activeArea}" exists and is active`, active?.status === 'active')
check('Every property belongs to the active area', props.every((p) => p.area_slug === config.activeArea), props.filter((p) => p.area_slug !== config.activeArea).map((p) => p.slug).join(', '))
const subMismatch = all(`SELECT p.slug FROM properties p JOIN sub_areas s ON s.id = p.sub_area_id WHERE s.area_id != p.area_id`)
check('Every property’s sub-area is in the same area', subMismatch.length === 0, subMismatch.map((r) => r.slug).join(', '))
const far = props.filter((p) => haversineKm(p.lat, p.lng, active.lat, active.lng) > 4)
check('Every property is within 4 km of the area centre', far.length === 0, far.map((p) => p.slug).join(', '))
const soonData = one(`SELECT
  (SELECT COUNT(*) FROM properties p JOIN areas a ON a.id = p.area_id WHERE a.status = 'coming_soon') +
  (SELECT COUNT(*) FROM sub_areas s JOIN areas a ON a.id = s.area_id WHERE a.status = 'coming_soon') +
  (SELECT COUNT(*) FROM landmarks l JOIN areas a ON a.id = l.area_id WHERE a.status = 'coming_soon') AS n`).n
check('Coming-soon areas have no properties, sub-areas or landmarks', soonData === 0, `${soonData} rows`)
const otherPlaces = [...OUT_OF_COVERAGE_PLACES, ...all(`SELECT name FROM areas WHERE status = 'coming_soon'`).map((a) => a.name)]
const texts = [
  ...props.map((p) => ({ id: p.slug, text: `${p.name} ${p.description} ${p.address_line}` })),
  ...all('SELECT id, title, body FROM reviews').map((r) => ({ id: r.id, text: `${r.title} ${r.body}` })),
]
const leaks = texts.filter((t) => otherPlaces.some((pl) => new RegExp(`\\b${pl}\\b`, 'i').test(t.text)))
check('No other area or city is named in listings or reviews', leaks.length === 0, leaks.map((l) => l.id).join(', '))

// ---------------- demo flags ----------------
section = 'Demo data flags'
for (const t of ['areas', 'sub_areas', 'landmarks', 'properties', 'room_inventory', 'owners', 'reported_differences', 'fact_provenance', 'commute']) {
  const bad = one(`SELECT COUNT(*) AS n FROM ${t} WHERE data_source != 'demo_seed' AND data_source != 'manual_verified'`).n
  check(`${t}: only demo_seed or manual_verified rows`, bad === 0, `${bad} rows`)
}
const nonDemoProps = props.filter((p) => p.data_source !== 'demo_seed')
check('All seeded properties are flagged demo_seed', nonDemoProps.length === 0, nonDemoProps.map((p) => p.slug).join(', '))
check(
  'All seeded reviews are flagged demo_seed',
  one(`SELECT COUNT(*) AS n FROM reviews r JOIN users u ON u.id = r.user_id WHERE u.data_source = 'demo_seed' AND r.data_source != 'demo_seed'`).n === 0,
)

// ---------------- property mix ----------------
section = 'Property mix'
check('16 properties', props.length === 16, String(props.length))
check('Types: 6 PG, 6 Hostel, 4 Shared Rental', eq(countBy(props, 'type'), { PG: 6, Hostel: 6, 'Shared Rental': 4 }), JSON.stringify(countBy(props, 'type')))
check('Gender: 11 women_only, 3 men_only, 2 mixed', eq(countBy(props, 'gender_policy'), { women_only: 11, men_only: 3, mixed: 2 }), JSON.stringify(countBy(props, 'gender_policy')))
check('Both working-professional and student focused places', ['working_professionals', 'students'].every((f) => props.some((p) => p.occupant_focus === f)))
check('Verification: 3 verified, 6 partial, 7 not', eq(countBy(props, 'verification_status'), { verified: 3, partially_verified: 6, not_verified: 7 }), JSON.stringify(countBy(props, 'verification_status')))
const rulesRows = all('SELECT * FROM rules_details')
check('Curfew: 3 fixed, 4 flexible, 9 none', eq(countBy(rulesRows, 'curfew_type'), { fixed: 3, flexible: 4, none: 9 }), JSON.stringify(countBy(rulesRows, 'curfew_type')))
const rents = rooms.map((r) => r.rent_per_bed)
check('Rent per bed between 4,500 and 20,000', Math.min(...rents) >= 4500 && Math.max(...rents) <= 20000, `${Math.min(...rents)}–${Math.max(...rents)}`)
const buckets: [string, number, number][] = [['≤10k', 0, 10000], ['10–14k', 10000, 14000], ['14–18k', 14000, 18000], ['18k+', 18000, 1e9]]
for (const [name, lo, hi] of buckets) check(`Budget bucket ${name} has results`, rooms.some((r) => r.rent_per_bed >= lo && r.rent_per_bed <= hi))
const depositBad = props.filter((p) => {
  const ratio = p.security_deposit / Math.min(...roomsOf(p.id).map((r) => r.rent_per_bed))
  return ratio < 0.95 || ratio > 3.05
})
check('Deposits are 1–3 months of the lowest rent', depositBad.length === 0, depositBad.map((p) => p.slug).join(', '))
const rentRange = props.filter((p) => p.rent_min !== Math.min(...roomsOf(p.id).map((r) => r.rent_per_bed)) || p.rent_max !== Math.max(...roomsOf(p.id).map((r) => r.rent_per_bed)))
check('rent_min/rent_max match room inventory', rentRange.length === 0, rentRange.map((p) => p.slug).join(', '))
const hiddenCost = all(`SELECT DISTINCT property_id FROM reported_differences WHERE field_name LIKE 'costs.%'`)
check('2 properties with resident-reported hidden charges', hiddenCost.length === 2, String(hiddenCost.length))

// ---------------- safety ----------------
section = 'Safety features'
const safety = all('SELECT * FROM safety_features')
const fortress = safety.filter((s) => s.security_guard === '24x7' && s.cctv === 'extensive' && s.female_warden_resident === 1)
check('Exactly 1 place with 24x7 guard + extensive CCTV + resident female warden', fortress.length === 1, String(fortress.length))
check('3 places with no CCTV', safety.filter((s) => s.cctv === 'none').length === 3)
const cols = (db.prepare('PRAGMA table_info(safety_features)').all() as Row[]).map((c) => c.name)
check('No combined safety score column exists anywhere', !cols.some((c) => /score/i.test(c)) && !all(`SELECT name FROM sqlite_master WHERE sql LIKE '%safety_score%'`).length)

// ---------------- wifi, cleaning, food, amenities ----------------
section = 'Facilities consistency'
const wifi = all('SELECT * FROM wifi_details')
check('Wi-Fi speeds span 20–200 Mbps', Math.min(...wifi.map((w) => w.speed_mbps)) === 20 && Math.max(...wifi.map((w) => w.speed_mbps)) === 200)
check('Not all Wi-Fi is free', wifi.some((w) => w.free === 0))
check('At least one Wi-Fi plan has a data cap', wifi.some((w) => w.data_cap_gb != null))
const paidWifiBad = wifi.filter((w) => w.free === 0 && !parseJson<Row[]>(byId.get(w.property_id).other_charges, []).some((c) => /wi-?fi/i.test(c.name)))
check('Paid Wi-Fi has a matching listed charge', paidWifiBad.length === 0, paidWifiBad.map((w) => byId.get(w.property_id).slug).join(', '))
const clean = all('SELECT * FROM cleaning_details')
check('Room cleaning spans 1 to 7 times a week', Math.min(...clean.map((c) => c.room_cleaning_per_week)) === 1 && Math.max(...clean.map((c) => c.room_cleaning_per_week)) === 7)
const foodRows = all('SELECT * FROM food_details')
const messBad = foodRows.filter((f) => {
  const rs = roomsOf(f.property_id)
  if (f.food_included === 'optional') return rs.some((r) => r.mess_cost_per_month == null)
  return rs.some((r) => r.mess_cost_per_month != null)
})
check('Mess cost exists only where food is optional', messBad.length === 0, messBad.map((f) => byId.get(f.property_id).slug).join(', '))
const acBad = props.filter((p) => roomsOf(p.id).some((r) => r.ac === 1) !== !!one(`SELECT 1 AS x FROM property_amenities WHERE property_id = ? AND amenity_id = 'ac'`, p.id))
check('AC amenity matches AC rooms', acBad.length === 0, acBad.map((p) => p.slug).join(', '))
const elecBad = props.filter((p) => (p.electricity_policy === 'fixed_fee') !== parseJson<Row[]>(p.other_charges, []).some((c) => /electricity/i.test(c.name)))
check('Fixed electricity fee appears as a listed charge', elecBad.length === 0, elecBad.map((p) => p.slug).join(', '))

// ---------------- availability ----------------
section = 'Availability'
const waitlistFull = rooms.filter((r) => r.available_beds === 0 && r.waitlist_open === 1)
check('2 full room types with waitlist open', waitlistFull.length === 2, String(waitlistFull.length))
const fullProps = props.filter((p) => roomsOf(p.id).every((r) => r.available_beds === 0))
check('Exactly 1 fully booked property', fullProps.length === 1, fullProps.map((p) => p.slug).join(', '))
check('Most room types have free beds', rooms.filter((r) => r.available_beds > 0).length >= rooms.length * 0.75)
check('available_beds within total_beds', rooms.every((r) => r.available_beds >= 0 && r.available_beds <= r.total_beds))

// ---------------- commute ----------------
section = 'Commute'
const lms = new Map<string, any>(all('SELECT * FROM landmarks').map((l) => [l.id, l]))
const commuteBad = all('SELECT * FROM commute').filter((c) => {
  const p = byId.get(c.property_id)
  const l = lms.get(c.landmark_id)
  const exp = commuteFor(haversineKm(p.lat, p.lng, l.lat, l.lng))
  return exp.minutes_auto !== c.minutes_auto || exp.minutes_walk !== c.minutes_walk || exp.minutes_bus !== c.minutes_bus
})
check('Commute minutes match coordinates', commuteBad.length === 0, `${commuteBad.length} rows differ`)
check('Every property has commute rows to every landmark', one('SELECT COUNT(*) AS n FROM commute').n === props.length * lms.size)

// ---------------- provenance ----------------
section = 'Provenance and verification'
const prov = all('SELECT * FROM fact_provenance')
const missingProv: string[] = []
for (const p of props) {
  for (const group of ['rules', 'safety'] as const) {
    for (const f of PROVENANCE_FIELDS[group]) {
      if (!prov.some((r) => r.property_id === p.id && r.field_name === `${group}.${f}`)) missingProv.push(`${p.slug}:${group}.${f}`)
    }
  }
}
check('Every rule and safety field has a provenance row', missingProv.length === 0, missingProv.slice(0, 5).join(', '))
const verifiedNoEvidence = props.filter((p) => p.verification_status !== 'not_verified' && !prov.some((r) => r.property_id === p.id && r.source === 'platform_verified'))
check('Verified/partial places have platform_verified evidence', verifiedNoEvidence.length === 0, verifiedNoEvidence.map((p) => p.slug).join(', '))
const unverifiedWithEvidence = props.filter((p) => p.verification_status === 'not_verified' && prov.some((r) => r.property_id === p.id && r.source === 'platform_verified'))
check('Not-verified places have no platform_verified rows', unverifiedWithEvidence.length === 0, unverifiedWithEvidence.map((p) => p.slug).join(', '))
const fullyVerifiedGaps = props.filter(
  (p) => p.verification_status === 'verified' && prov.some((r) => r.property_id === p.id && /^(rules|safety)\./.test(r.field_name) && r.source === 'owner_listed'),
)
check('Fully verified places have every rule and safety fact verified', fullyVerifiedGaps.length === 0, fullyVerifiedGaps.map((p) => p.slug).join(', '))
check('Verified places carry a verification date', props.filter((p) => p.verification_status !== 'not_verified').every((p) => !!p.last_verified_at))
check('Owner food descriptions are never marked verified', !prov.some((r) => r.field_name === 'food.food_quality_note' && r.source === 'platform_verified'))
check('At least 3 reported differences', one('SELECT COUNT(*) AS n FROM reported_differences').n >= 3)
check('Each reported difference cites 2+ reviews', all('SELECT supporting_review_ids FROM reported_differences').every((d) => parseJson<string[]>(d.supporting_review_ids, []).length >= 2))

// ---------------- reviews ----------------
section = 'Reviews'
const reviews = all(`SELECT r.*, p.slug FROM reviews r JOIN properties p ON p.id = r.property_id`)
const approved = reviews.filter((r) => r.moderation_status === 'approved')
check('About 90 seed reviews (80–100)', reviews.length >= 80 && reviews.length <= 100, String(reviews.length))
const perProp = props.map((p) => approved.filter((r) => r.property_id === p.id).length)
check('0–15 approved reviews per property', perProp.every((n) => n <= 15), JSON.stringify(perProp))
check('Exactly 3 properties with no reviews', perProp.filter((n) => n === 0).length === 3, String(perProp.filter((n) => n === 0).length))
const avgBad = props
  .map((p) => {
    const rs = approved.filter((r) => r.property_id === p.id)
    return { slug: p.slug, n: rs.length, avg: rs.length ? rs.reduce((s, r) => s + r.overall_rating, 0) / rs.length : null }
  })
  .filter((x) => x.n >= 3 && (x.avg! < 3.0 || x.avg! > 4.5))
check('Average ratings between 3.0 and 4.5 (places with 3+ reviews)', avgBad.length === 0, avgBad.map((x) => `${x.slug}=${x.avg?.toFixed(2)}`).join(', '))
check('Not every review is five stars', approved.some((r) => r.overall_rating < 5))
check('Ratings within 1–5', reviews.every((r) => r.overall_rating >= 1 && r.overall_rating <= 5))
const types = new Set(approved.map((r) => r.review_type))
check('Every review type is represented', ['general', 'tip', 'expectation_vs_reality', 'hidden_cost', 'rule_experience', 'safety_report'].every((t) => types.has(t)), [...types].join(', '))
check('5 safety reports', approved.filter((r) => r.review_type === 'safety_report').length === 5)
const safetyFactual = approved.filter((r) => r.review_type === 'safety_report' && !/\b(my experience|in my experience|to me|my own|I felt|felt)\b/i.test(r.body))
check('Safety reports are written as personal experience', safetyFactual.length === 0, safetyFactual.map((r) => r.id).join(', '))
check('Moderation queue has pending, flagged and rejected reviews', ['pending', 'flagged', 'rejected'].every((s) => reviews.some((r) => r.moderation_status === s)))
check('Reviews shown as verified only with approved residency', approved.every((r) => r.residency_verification !== 'approved' || !!one(`SELECT 1 AS x FROM residency_verifications WHERE user_id = ? AND property_id = ? AND status = 'approved'`, r.user_id, r.property_id)))

// ---------------- review text agrees with the listing ----------------
section = 'Review text matches the listing'
const amen = (pid: string, id: string) => !!one('SELECT 1 AS x FROM property_amenities WHERE property_id = ? AND amenity_id = ?', pid, id)
const sf = new Map<string, any>(safety.map((s) => [s.property_id, s]))
const fd = new Map<string, any>(foodRows.map((f) => [f.property_id, f]))
const rl = new Map<string, any>(rulesRows.map((r) => [r.property_id, r]))
const rules: [string, (r: Row) => boolean][] = [
  ['No CCTV praise where CCTV is none', (r) => sf.get(r.property_id).cctv !== 'none' || !/cctv|camera/i.test(r.body) || /\bno (cctv|camera)|not a single camera|isn'?t any (cctv|camera)/i.test(r.body)],
  ['No AC mention where no room has AC', (r) => roomsOf(r.property_id).some((x) => x.ac === 1) || !/\bAC\b|air[- ]?con/.test(r.body) || /\bno AC\b|non-AC/i.test(r.body)],
  ['No mess/meal praise where there is no food service', (r) => fd.get(r.property_id).food_included !== 'none' || !/\bmess\b|\bmeals?\b|\bthe food\b/i.test(r.body)],
  ['No guard mention where there is no guard', (r) => sf.get(r.property_id).security_guard !== 'none' || !/\bguard\b|watchman/i.test(r.body) || /\bno (security )?guard/i.test(r.body)],
  ['Guard described as round-the-clock only where 24x7', (r) => !/guard at the gate all day and night|guard .*round the clock|24 hours/i.test(r.body) || sf.get(r.property_id).security_guard === '24x7'],
  ['Female warden/matron only where one lives on site', (r) => !/lady warden|female warden|warden chechi|\bmatron\b/i.test(r.body) || sf.get(r.property_id).female_warden_resident === 1],
  ['"No resident warden" only where there is none', (r) => !/no (resident )?warden/i.test(r.body) || sf.get(r.property_id).female_warden_resident === 0],
  ['Lift mentioned only where there is a lift', (r) => !/\blift\b/i.test(r.body) || amen(r.property_id, 'lift')],
  ['Biometric/keycard mentioned only where present', (r) => !/biometric|fingerprint|keycard/i.test(r.body) || sf.get(r.property_id).biometric_or_keycard_entry === 1],
  ['Curfew times match the listed gate time', (r) => {
    const m = r.body.match(/gate (?:closes|is locked) at (\d{1,2})(?::(\d{2}))?/i)
    if (!m) return true
    const g = rl.get(r.property_id).gate_close_time
    if (!g) return false
    const [h, min] = g.split(':').map(Number)
    return (Number(m[1]) % 12) === (h % 12) && Number(m[2] ?? 0) === min
  }],
  ['"No curfew" only where curfew is none', (r) => !/there is no curfew|no-curfew|no curfew/i.test(r.body) || rl.get(r.property_id).curfew_type === 'none'],
  ['Pure veg only where the kitchen is veg only', (r) => !/pure veg/i.test(r.body) || fd.get(r.property_id).veg_options === 'veg_only'],
]
for (const [name, ok] of rules) {
  const bad = reviews.filter((r) => !ok(r))
  check(name, bad.length === 0, bad.map((r) => r.id).join(', '))
}

// ---------------- public API never exposes owner contacts ----------------
async function apiChecks() {
  section = 'Public API exposure'
  const server = createApp().listen(0)
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`
  const owners = all('SELECT owner_name, phone, email FROM owners')
  const secrets = owners.flatMap((o) => [o.phone, o.email, o.owner_name])
  const login = (await (await fetch(`${base}/auth/demo-login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).json()) as any
  const auth = { Authorization: `Bearer ${login.token}`, 'Content-Type': 'application/json' }
  const slugs = props.map((p) => p.slug)
  const urls: [string, RequestInit?][] = [
    ['/meta'], ['/filters'], ['/properties?limit=50'], ['/reviews?limit=100'], ['/compare?ids=' + slugs.slice(0, 3).join(',')],
    ['/saved', { headers: auth }], ['/bookings', { headers: auth }],
    ...slugs.flatMap((s) => [[`/properties/${s}`], [`/properties/${s}/reviews`]] as [string][]),
    ['/search/interpret', { method: 'POST', headers: auth, body: JSON.stringify({ query: 'women PG near Infopark under 9000' }) }],
  ]
  const leaks: string[] = []
  for (const [u, init] of urls) {
    const res = await fetch(base + u, init)
    const text = await res.text()
    if (!res.ok) leaks.push(`${u} -> HTTP ${res.status}`)
    if (/"(owner_name|owner_phone|owner_email|phone)"\s*:/.test(text) || secrets.some((s) => text.includes(s))) leaks.push(u)
  }
  check(`No owner contact field or value in ${urls.length} public responses`, leaks.length === 0, leaks.join(', '))
  const pending = (await (await fetch(`${base}/properties/tulsi-nest-womens-pg/reviews`)).json()) as any
  check('Pending/flagged/rejected reviews are not public', !pending.results.some((r: Row) => r.id.startsWith('rev_queue')))
  check('Every public seed review is labelled as a sample', pending.results.every((r: Row) => r.is_sample === true))
  const detail = (await (await fetch(`${base}/properties/nila-womens-hostel`)).json()) as any
  check('Unverified place does not show a Verified badge', detail.verified_badge === false)
  const anjili = (await (await fetch(`${base}/properties/anjili-womens-hostel`)).json()) as any
  check('Under 3 reviews shows "not enough reviews yet"', anjili.review_summary.enough === false && anjili.rating === null && /Not enough reviews/.test(anjili.review_summary.message))
  server.close()
}

await apiChecks()

// ---------------- report ----------------
let current = ''
for (const r of results) {
  if (r.section !== current) {
    current = r.section
    console.log(`\n${current}`)
  }
  console.log(`  ${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? `  →  ${r.detail}` : ''}`)
}
const failed = results.filter((r) => !r.ok).length
console.log(`\n${results.length - failed}/${results.length} checks passed${failed ? `, ${failed} FAILED` : ''}.`)
process.exit(failed ? 1 : 0)
