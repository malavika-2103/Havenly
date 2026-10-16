// Deterministic, idempotent seed. Re-running removes all demo_seed rows and inserts them again
// with the same ids and values (fixed RNG seed, fixed timestamps).
import { openDb } from '../src/db'
import { purgeDemo } from '../src/services/demoData'
import { computeEstimate } from '../src/services/estimate'
import { commuteFor, haversineKm } from '../src/lib/geo'
import { PROVENANCE_FIELDS } from '../src/services/facts'
import { areas } from './data/areas'
import { subAreas } from './data/subAreas'
import { landmarks } from './data/landmarks'
import { amenities } from './data/amenities'
import { properties } from './data/properties'
import { rooms } from './data/rooms'
import { wifi } from './data/wifi'
import { food } from './data/food'
import { cleaning } from './data/cleaning'
import { rules } from './data/rules'
import { safety } from './data/safety'
import { propertyAmenities } from './data/propertyAmenities'
import { owners } from './data/owners'
import { reviews } from './data/reviews'
import { reportedDifferences } from './data/reportedDifferences'
import { partialVerification, pendingResidency, VERIFIER } from './data/verification'
import { bookings } from './data/bookings'

export const SEED_TIME = '2026-10-15T09:00:00.000Z'
const DS = 'demo_seed'

/** mulberry32: tiny deterministic PRNG so every run produces identical data. */
function rng(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const propertyId = (slug: string) => `prop_${slug.replace(/-/g, '_')}`
const b = (v: boolean) => (v ? 1 : 0)

export { PROVENANCE_FIELDS }

export function seed(dbPath?: string) {
  const db = openDb(dbPath)
  const rand = rng(20261017)
  const stamp = { created_at: SEED_TIME, updated_at: SEED_TIME, data_source: DS }

  const insert = (table: string, row: Record<string, unknown>) => {
    const full = { ...stamp, ...row }
    const cols = Object.keys(full)
    db.prepare(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map((c) => '@' + c).join(', ')})`).run(full)
  }

  const run = db.transaction(() => {
    const removed = purgeDemo(db)

    for (const a of areas) insert('areas', { ...a })
    for (const s of subAreas) insert('sub_areas', { ...s })
    for (const l of landmarks) insert('landmarks', { ...l })
    for (const a of amenities) {
      // Reference data, kept across purges.
      db.prepare(
        `INSERT INTO amenities (id, label, icon, created_at, updated_at, data_source) VALUES (?, ?, ?, ?, ?, 'manual_verified')
         ON CONFLICT(id) DO UPDATE SET label = excluded.label, icon = excluded.icon`,
      ).run(a.id, a.label, a.icon, SEED_TIME, SEED_TIME)
    }

    const subBySlug = new Map(subAreas.map((s) => [s.slug, s]))

    for (const p of properties) {
      const pid = propertyId(p.slug)
      const sa = subBySlug.get(p.sub_area)!
      const lat = Math.round((sa.lat + p.offset[0]) * 1e5) / 1e5
      const lng = Math.round((sa.lng + p.offset[1]) * 1e5) / 1e5
      const roomList = rooms[p.slug]
      const rents = roomList.map((r) => r.rent_per_bed)

      insert('properties', {
        id: pid,
        slug: p.slug,
        name: p.name,
        type: p.type,
        gender_policy: p.gender_policy,
        occupant_focus: p.occupant_focus,
        area_id: sa.area_id,
        sub_area_id: sa.id,
        address_line: p.address_line,
        lat,
        lng,
        description: p.description,
        year_established: p.year_established,
        floors: p.floors,
        rent_min: Math.min(...rents),
        rent_max: Math.max(...rents),
        security_deposit: p.security_deposit,
        advance_months: p.advance_months,
        notice_period_days: p.notice_period_days,
        notice_terms: p.notice_terms,
        min_stay_months: p.min_stay_months,
        max_stay_months: p.max_stay_months,
        maintenance_charge: p.maintenance_charge,
        electricity_policy: p.electricity_policy,
        other_charges: JSON.stringify(p.other_charges),
        art: p.art,
        last_verified_at: p.last_verified_at,
        verification_status: p.verification_status,
      })

      for (const r of roomList) {
        insert('room_inventory', {
          id: `room_${pid.slice(5)}_${r.room_type}`,
          property_id: pid,
          room_type: r.room_type,
          occupancy: r.occupancy,
          ac: b(r.ac),
          attached_bathroom: b(r.attached_bathroom),
          furnished: b(r.furnished),
          rent_per_bed: r.rent_per_bed,
          mess_cost_per_month: r.mess_cost_per_month,
          total_beds: r.total_beds,
          available_beds: r.available_beds,
          next_available_date: r.next_available_date,
          availability_updated_at: r.availability_updated_at,
          waitlist_open: b(r.waitlist_open),
        })
      }

      const w = wifi[p.slug]
      insert('wifi_details', { property_id: pid, free: b(w.free), speed_mbps: w.speed_mbps, backup_connection: b(w.backup_connection), coverage: w.coverage, data_cap_gb: w.data_cap_gb })

      const f = food[p.slug]
      insert('food_details', {
        property_id: pid,
        food_included: f.food_included,
        meals_per_day: f.meals_per_day,
        meal_types: JSON.stringify(f.meal_types),
        veg_options: f.veg_options,
        cuisine_tags: JSON.stringify(f.cuisine_tags),
        mess_timing: f.mess_timing,
        common_kitchen_hours: f.common_kitchen_hours,
        self_cooking_allowed: b(f.self_cooking_allowed),
        food_quality_note: f.food_quality_note,
      })

      insert('cleaning_details', { property_id: pid, ...cleaning[p.slug] })

      const r = rules[p.slug]
      insert('rules_details', { property_id: pid, ...r, out_pass_required: b(r.out_pass_required), overnight_guests: b(r.overnight_guests) })

      const s = safety[p.slug]
      insert('safety_features', {
        property_id: pid,
        ...Object.fromEntries(Object.entries(s).map(([k, v]) => [k, typeof v === 'boolean' ? b(v) : v])),
      })

      for (const a of propertyAmenities[p.slug]) {
        const [id, note] = Array.isArray(a) ? a : [a, null]
        insert('property_amenities', { property_id: pid, amenity_id: id, note })
      }

      for (const l of landmarks) {
        const c = commuteFor(haversineKm(lat, lng, l.lat, l.lng))
        insert('commute', { property_id: pid, landmark_id: l.id, ...c })
      }

      // Provenance: one row per listed fact.
      const partial = partialVerification[p.slug]
      for (const [group, fields] of Object.entries(PROVENANCE_FIELDS)) {
        for (const field of fields) {
          const key = `${group}.${field}`
          const verified =
            field !== 'food_quality_note' && (p.verification_status === 'verified' || (p.verification_status === 'partially_verified' && !!partial?.fields.includes(key)))
          insert('fact_provenance', {
            id: `prov_${pid.slice(5)}_${group}_${field}`,
            property_id: pid,
            field_name: key,
            source: verified ? 'platform_verified' : 'owner_listed',
            evidence_type: verified ? (partial?.evidence ?? 'site_visit') : 'owner_form',
            verified_at: verified ? p.last_verified_at : null,
            verified_by: verified ? VERIFIER : null,
            note: verified ? 'Demo verification record for the pitch.' : 'As listed by the owner.',
          })
        }
      }
    }

    for (const o of owners) {
      const pid = propertyId(o.property_slug)
      insert('owners', { id: `owner_${pid.slice(5)}`, property_id: pid, owner_name: o.owner_name, phone: o.phone, email: o.email })
    }

    // Reviewers: one fictional user per review.
    for (const r of reviews) {
      const userId = `usr_${r.id.slice(4)}`
      insert('users', { id: userId, display_name: r.name, email: `${r.id.replace(/_/g, '-')}@example.com`, phone: null })
      const status = r.moderation ?? 'approved'
      const helpful = status === 'approved' ? Math.floor(rand() * 19) : 0
      const createdAt = `${r.created}T${String(8 + Math.floor(rand() * 12)).padStart(2, '0')}:${String(Math.floor(rand() * 60)).padStart(2, '0')}:00.000Z`
      const [clean, foodQ, maint, mgmt, privacy, value, security] = r.cats
      insert('reviews', {
        id: r.id,
        property_id: propertyId(r.property),
        user_id: userId,
        display_name: r.name,
        overall_rating: r.overall,
        rating_cleanliness: clean,
        rating_food_quality: foodQ,
        rating_maintenance: maint,
        rating_management: mgmt,
        rating_privacy: privacy,
        rating_value_for_money: value,
        rating_security: security,
        title: r.title,
        body: r.body,
        review_type: r.type,
        stay_start: `${r.stay[0]}-01`,
        stay_end: r.stay[1] ? `${r.stay[1]}-01` : null,
        currently_staying: b(r.stay[1] === null),
        residency_verification: r.residency,
        moderation_status: status,
        moderation_note: r.moderation_note ?? null,
        helpful_count: helpful,
        report_count: r.report_count ?? 0,
        themes: JSON.stringify(r.themes),
        created_at: createdAt,
        updated_at: createdAt,
      })
      if (r.residency === 'approved') {
        insert('residency_verifications', {
          id: `res_${r.id.slice(4)}`,
          user_id: userId,
          property_id: propertyId(r.property),
          evidence_type: rand() < 0.6 ? 'rent_receipt' : 'rental_agreement',
          status: 'approved',
          reviewed_by: VERIFIER,
          reviewed_at: createdAt,
          note: 'Evidence checked and discarded. Only the status is kept.',
        })
      }
    }
    for (const pr of pendingResidency) {
      const r = reviews.find((x) => x.id === pr.review_id)!
      insert('residency_verifications', {
        id: `res_${r.id.slice(4)}`,
        user_id: `usr_${r.id.slice(4)}`,
        property_id: propertyId(r.property),
        evidence_type: pr.evidence_type,
        status: 'pending',
        reviewed_by: null,
        reviewed_at: null,
        note: null,
      })
    }

    for (const d of reportedDifferences) {
      const pid = propertyId(d.property)
      insert('reported_differences', {
        id: d.id,
        property_id: pid,
        field_name: d.field_name,
        title: d.title,
        listed_value: d.listed_value,
        reported_summary: d.reported_summary,
        supporting_review_ids: JSON.stringify(d.supporting_review_ids),
        status: d.status,
        owner_response: d.owner_response,
      })
      insert('fact_provenance', {
        id: `prov_${d.id}`,
        property_id: pid,
        field_name: d.field_name,
        source: 'resident_reported',
        evidence_type: 'review_pattern',
        verified_at: null,
        verified_by: null,
        note: d.reported_summary,
      })
    }

    // Sample booking requests (from fictional users) so the admin queue has content.
    for (const [i, bk] of bookings.entries()) {
      const userId = `usr_sample_${i + 1}`
      insert('users', { id: userId, display_name: bk.user.name, email: bk.user.email, phone: null })
      const pid = propertyId(bk.property)
      const room = rooms[bk.property].find((r) => r.room_type === bk.room_type)!
      const estimate = computeEstimate(
        db,
        bk.property,
        { room_type: bk.room_type, move_in_date: bk.move_in_date, duration_months: bk.duration_months, include_mess: bk.include_mess },
        new Date(bk.created),
      )
      const history: { status: string; at: string; by: string; note: string | null }[] = [{ status: 'submitted', at: bk.created, by: 'user', note: null }]
      const later = (h: number) => new Date(Date.parse(bk.created) + h * 3600_000).toISOString()
      if (bk.status !== 'submitted') history.push({ status: 'owner_notified', at: later(2), by: 'admin', note: 'Simulated notification for the demo.' })
      if (bk.status === 'accepted' || bk.status === 'declined') history.push({ status: bk.status, at: later(20), by: 'admin', note: 'Simulated owner response for the demo.' })
      insert('booking_requests', {
        id: `bk_sample_${i + 1}`,
        reference: bk.reference,
        user_id: userId,
        property_id: pid,
        room_type: bk.room_type,
        occupancy: room.occupancy,
        move_in_date: bk.move_in_date,
        duration_months: bk.duration_months,
        include_mess: b(bk.include_mess),
        estimate_snapshot: JSON.stringify(estimate),
        status: bk.status,
        status_history: JSON.stringify(history),
        note_from_user: bk.note,
        idempotency_key: null,
        // Sample rows stay open through the pitch window.
        expires_at: '2026-12-31T00:00:00.000Z',
        created_at: bk.created,
        updated_at: history[history.length - 1].at,
      })
    }

    return removed
  })

  const removed = run()
  const count = (t: string) => (db.prepare(`SELECT COUNT(*) n FROM ${t} WHERE data_source = 'demo_seed'`).get() as { n: number }).n
  const summary = ['areas', 'sub_areas', 'landmarks', 'properties', 'room_inventory', 'commute', 'fact_provenance', 'reviews', 'reported_differences', 'owners', 'users', 'booking_requests'].map(
    (t) => `${t}=${count(t)}`,
  )
  const removedTotal = Object.values(removed).reduce((s, n) => s + n, 0)
  db.close()
  return { removedTotal, summary }
}

if (process.argv[1] && /seed\.ts$/.test(process.argv[1])) {
  const { removedTotal, summary } = seed()
  console.log(`Seeded demo data (replaced ${removedTotal} previous demo rows).`)
  console.log(summary.join('  '))
}
