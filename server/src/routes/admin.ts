// Admin API (requires ADMIN_TOKEN). The only place owner contact details are ever read.
import { Router } from 'express'
import crypto from 'node:crypto'
import { getDb, nowIso, parseJson } from '../db'
import { config } from '../config'
import { route, badRequest, notFound, conflict } from '../lib/http'
import { requireAdmin } from '../auth'
import { adminSetStatus, listBookings } from '../services/bookings'
import { purgeDemo } from '../services/demoData'
import { notifyWaitlist } from '../services/push'

type Row = Record<string, any>

const PROPERTY_FIELDS = [
  'name', 'type', 'gender_policy', 'occupant_focus', 'sub_area_id', 'address_line', 'lat', 'lng', 'description', 'year_established', 'floors',
  'security_deposit', 'advance_months', 'notice_period_days', 'notice_terms', 'min_stay_months', 'max_stay_months', 'maintenance_charge',
  'electricity_policy', 'other_charges', 'art',
]
const ROOM_FIELDS = ['occupancy', 'ac', 'attached_bathroom', 'furnished', 'rent_per_bed', 'mess_cost_per_month', 'total_beds', 'available_beds', 'next_available_date', 'waitlist_open']

const pick = (body: Row, fields: string[]) =>
  Object.fromEntries(
    fields.filter((f) => body[f] !== undefined).map((f) => [f, typeof body[f] === 'boolean' ? (body[f] ? 1 : 0) : f === 'other_charges' && typeof body[f] !== 'string' ? JSON.stringify(body[f]) : body[f]]),
  )

const slugify = (s: string) => s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function refreshRentRange(propertyId: string) {
  getDb()
    .prepare(
      `UPDATE properties SET rent_min = (SELECT MIN(rent_per_bed) FROM room_inventory WHERE property_id = ?),
       rent_max = (SELECT MAX(rent_per_bed) FROM room_inventory WHERE property_id = ?), updated_at = ? WHERE id = ? AND EXISTS (SELECT 1 FROM room_inventory WHERE property_id = ?)`,
    )
    .run(propertyId, propertyId, nowIso(), propertyId, propertyId)
}

export function adminRoutes() {
  const r = Router()
  r.use(requireAdmin)
  const db = () => getDb()

  r.get(
    '/overview',
    route(() => {
      const n = (sql: string) => (db().prepare(sql).get() as { n: number }).n
      return {
        properties: n('SELECT COUNT(*) n FROM properties'),
        bookings_open: n(`SELECT COUNT(*) n FROM booking_requests WHERE status IN ('submitted','owner_notified')`),
        reviews_pending: n(`SELECT COUNT(*) n FROM reviews WHERE moderation_status = 'pending'`),
        reviews_flagged: n(`SELECT COUNT(*) n FROM reviews WHERE moderation_status = 'flagged'`),
        residency_pending: n(`SELECT COUNT(*) n FROM residency_verifications WHERE status = 'pending'`),
        unverified_properties: n(`SELECT COUNT(*) n FROM properties WHERE verification_status != 'verified'`),
        demo_rows: n(`SELECT COUNT(*) n FROM properties WHERE data_source = 'demo_seed'`),
      }
    }),
  )

  // ---------- properties ----------
  r.get(
    '/properties',
    route(() => ({
      results: db()
        .prepare(
          `SELECT p.id, p.slug, p.name, p.type, p.verification_status, p.last_verified_at, p.rent_min, p.rent_max, p.data_source, s.name AS sub_area,
             o.owner_name, o.phone AS owner_phone, o.email AS owner_email,
             (SELECT COALESCE(SUM(available_beds),0) FROM room_inventory WHERE property_id = p.id) AS beds_available,
             (SELECT COUNT(*) FROM fact_provenance WHERE property_id = p.id AND source = 'platform_verified') AS verified_facts
           FROM properties p JOIN sub_areas s ON s.id = p.sub_area_id LEFT JOIN owners o ON o.property_id = p.id ORDER BY p.name`,
        )
        .all(),
    })),
  )
  r.get(
    '/properties/:id',
    route((req) => {
      const p = db().prepare('SELECT * FROM properties WHERE id = ? OR slug = ?').get(req.params.id, req.params.id) as Row | undefined
      if (!p) throw notFound()
      return {
        property: { ...p, other_charges: parseJson(p.other_charges, []) },
        owner: db().prepare('SELECT owner_name, phone, email FROM owners WHERE property_id = ?').get(p.id) ?? null,
        rooms: db().prepare('SELECT * FROM room_inventory WHERE property_id = ? ORDER BY rent_per_bed').all(p.id),
        provenance: db().prepare('SELECT * FROM fact_provenance WHERE property_id = ? ORDER BY field_name, source').all(p.id),
      }
    }),
  )
  r.post(
    '/properties',
    route((req) => {
      const body = req.body ?? {}
      const required = ['name', 'type', 'gender_policy', 'occupant_focus', 'sub_area_id', 'address_line', 'lat', 'lng', 'description', 'security_deposit', 'electricity_policy']
      const missing = required.filter((f) => body[f] === undefined || body[f] === '')
      if (missing.length) throw badRequest('MISSING_FIELDS', `Missing: ${missing.join(', ')}`, { missing })
      const sub = db().prepare('SELECT area_id FROM sub_areas WHERE id = ?').get(body.sub_area_id) as Row | undefined
      if (!sub) throw badRequest('INVALID_SUB_AREA', 'Unknown sub_area_id.')
      const slug = slugify(body.slug ?? body.name)
      const id = `prop_${slug.replace(/-/g, '_')}`
      const now = nowIso()
      const row = {
        ...pick(body, PROPERTY_FIELDS),
        id, slug, area_id: sub.area_id, rent_min: Number(body.rent_min ?? 1), rent_max: Number(body.rent_max ?? body.rent_min ?? 1),
        verification_status: 'not_verified', last_verified_at: null, created_at: now, updated_at: now,
        data_source: body.data_source === 'demo_seed' ? 'demo_seed' : 'manual_verified',
        other_charges: typeof body.other_charges === 'string' ? body.other_charges : JSON.stringify(body.other_charges ?? []),
      }
      const cols = Object.keys(row)
      db().prepare(`INSERT INTO properties (${cols.join(', ')}) VALUES (${cols.map((c) => '@' + c).join(', ')})`).run(row)
      return { id, slug }
    }, 201),
  )
  r.patch(
    '/properties/:id',
    route((req) => {
      const fields = pick(req.body ?? {}, PROPERTY_FIELDS)
      if (!Object.keys(fields).length) throw badRequest('NO_FIELDS', 'Nothing to update.')
      const res = db()
        .prepare(`UPDATE properties SET ${Object.keys(fields).map((f) => `${f} = @${f}`).join(', ')}, updated_at = @updated_at WHERE id = @id`)
        .run({ ...fields, updated_at: nowIso(), id: req.params.id })
      if (!res.changes) throw notFound()
      return { updated: true }
    }),
  )
  r.delete(
    '/properties/:id',
    route((req) => {
      const res = db().prepare('DELETE FROM properties WHERE id = ?').run(req.params.id)
      if (!res.changes) throw notFound()
      return { deleted: true }
    }),
  )

  // Verification status can only be raised when platform_verified provenance exists.
  r.post(
    '/properties/:id/verification',
    route((req) => {
      const status = String(req.body?.status ?? '')
      if (!['not_verified', 'partially_verified', 'verified'].includes(status)) throw badRequest('INVALID_STATUS', 'Use not_verified, partially_verified or verified.')
      const verified = (db().prepare(`SELECT COUNT(*) n FROM fact_provenance WHERE property_id = ? AND source = 'platform_verified'`).get(req.params.id) as { n: number }).n
      if (status !== 'not_verified' && verified === 0) {
        throw conflict('NO_EVIDENCE', 'Add at least one platform_verified provenance record before marking this place as verified.')
      }
      const now = nowIso()
      const res = db()
        .prepare('UPDATE properties SET verification_status = ?, last_verified_at = CASE WHEN ? = ? THEN last_verified_at ELSE ? END, updated_at = ? WHERE id = ?')
        .run(status, status, 'not_verified', now, now, req.params.id)
      if (!res.changes) throw notFound()
      return { status }
    }),
  )

  // ---------- room inventory ----------
  r.post(
    '/properties/:id/rooms',
    route((req) => {
      const body = req.body ?? {}
      if (!['single', 'double', 'triple', 'dorm'].includes(body.room_type)) throw badRequest('INVALID_ROOM_TYPE', 'room_type must be single, double, triple or dorm.')
      const now = nowIso()
      const row = {
        occupancy: 1, ac: 0, attached_bathroom: 0, furnished: 1, mess_cost_per_month: null, next_available_date: null, waitlist_open: 0,
        ...pick(body, ROOM_FIELDS),
        id: `room_${req.params.id.replace(/^prop_/, '')}_${body.room_type}`, property_id: req.params.id, room_type: body.room_type,
        availability_updated_at: now, created_at: now, updated_at: now, data_source: 'manual_verified',
      }
      const cols = Object.keys(row)
      db().prepare(`INSERT INTO room_inventory (${cols.join(', ')}) VALUES (${cols.map((c) => '@' + c).join(', ')})`).run(row)
      refreshRentRange(req.params.id)
      return { id: row.id }
    }, 201),
  )
  r.patch(
    '/rooms/:roomId',
    route((req) => {
      const fields = pick(req.body ?? {}, ROOM_FIELDS)
      if (!Object.keys(fields).length) throw badRequest('NO_FIELDS', 'Nothing to update.')
      const now = nowIso()
      const before = db().prepare('SELECT available_beds FROM room_inventory WHERE id = ?').get(req.params.roomId) as Row | undefined
      const res = db()
        .prepare(`UPDATE room_inventory SET ${Object.keys(fields).map((f) => `${f} = @${f}`).join(', ')}, availability_updated_at = @now, updated_at = @now WHERE id = @id`)
        .run({ ...fields, now, id: req.params.roomId })
      if (!res.changes) throw notFound()
      const room = db().prepare('SELECT property_id, room_type, available_beds FROM room_inventory WHERE id = ?').get(req.params.roomId) as Row
      refreshRentRange(room.property_id)
      // A full room just got a bed back: tell the waitlist.
      if (before?.available_beds === 0 && room.available_beds > 0) notifyWaitlist(db(), room.property_id, room.room_type)
      return { updated: true }
    }),
  )
  r.delete(
    '/rooms/:roomId',
    route((req) => {
      const room = db().prepare('SELECT property_id FROM room_inventory WHERE id = ?').get(req.params.roomId) as Row | undefined
      if (!room) throw notFound()
      db().prepare('DELETE FROM room_inventory WHERE id = ?').run(req.params.roomId)
      refreshRentRange(room.property_id)
      return { deleted: true }
    }),
  )

  // ---------- provenance ----------
  r.post(
    '/properties/:id/provenance',
    route((req) => {
      const b = req.body ?? {}
      if (!['owner_listed', 'platform_verified', 'resident_reported'].includes(b.source)) throw badRequest('INVALID_SOURCE', 'source must be owner_listed, platform_verified or resident_reported.')
      if (!b.field_name) throw badRequest('MISSING_FIELD', 'field_name is required, for example safety.cctv.')
      if (b.source === 'platform_verified' && (!b.evidence_type || !b.verified_by)) throw badRequest('MISSING_EVIDENCE', 'platform_verified needs evidence_type and verified_by.')
      const now = nowIso()
      const id = `prov_${crypto.randomUUID().slice(0, 12)}`
      db()
        .prepare(
          `INSERT INTO fact_provenance (id, property_id, field_name, source, evidence_type, verified_at, verified_by, note, created_at, updated_at, data_source)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual_verified')`,
        )
        .run(id, req.params.id, b.field_name, b.source, b.evidence_type ?? null, b.source === 'platform_verified' ? now : null, b.verified_by ?? null, b.note ?? null, now, now)
      return { id }
    }, 201),
  )
  r.patch(
    '/provenance/:id',
    route((req) => {
      const fields = pick(req.body ?? {}, ['source', 'evidence_type', 'verified_by', 'note'])
      if (!Object.keys(fields).length) throw badRequest('NO_FIELDS', 'Nothing to update.')
      const res = db()
        .prepare(`UPDATE fact_provenance SET ${Object.keys(fields).map((f) => `${f} = @${f}`).join(', ')}, updated_at = @now WHERE id = @id`)
        .run({ ...fields, now: nowIso(), id: req.params.id })
      if (!res.changes) throw notFound()
      return { updated: true }
    }),
  )
  r.delete('/provenance/:id', route((req) => ({ deleted: db().prepare('DELETE FROM fact_provenance WHERE id = ?').run(req.params.id).changes > 0 })))

  // ---------- verification queue ----------
  r.get(
    '/verification-queue',
    route(() => ({
      properties: db()
        .prepare(
          `SELECT p.id, p.slug, p.name, p.verification_status, p.last_verified_at,
             (SELECT COUNT(*) FROM fact_provenance f WHERE f.property_id = p.id AND f.source = 'platform_verified') AS verified_facts,
             (SELECT COUNT(*) FROM fact_provenance f WHERE f.property_id = p.id AND f.source = 'owner_listed') AS owner_listed_facts
           FROM properties p WHERE p.verification_status != 'verified' ORDER BY p.verification_status DESC, p.name`,
        )
        .all(),
      residency: db()
        .prepare(
          `SELECT rv.id, rv.evidence_type, rv.status, rv.created_at, u.display_name, p.name AS property_name, p.slug AS property_slug
           FROM residency_verifications rv JOIN users u ON u.id = rv.user_id JOIN properties p ON p.id = rv.property_id
           WHERE rv.status = 'pending' ORDER BY rv.created_at`,
        )
        .all(),
    })),
  )
  r.post(
    '/residency/:id',
    route((req) => {
      const status = String(req.body?.status ?? '')
      if (!['approved', 'rejected'].includes(status)) throw badRequest('INVALID_STATUS', 'Use approved or rejected.')
      const rv = db().prepare('SELECT * FROM residency_verifications WHERE id = ?').get(req.params.id) as Row | undefined
      if (!rv) throw notFound()
      const now = nowIso()
      db().transaction(() => {
        db().prepare('UPDATE residency_verifications SET status = ?, reviewed_by = ?, reviewed_at = ?, updated_at = ? WHERE id = ?').run(status, 'Admin (demo)', now, now, rv.id)
        db()
          .prepare('UPDATE reviews SET residency_verification = ?, updated_at = ? WHERE user_id = ? AND property_id = ?')
          .run(status === 'approved' ? 'approved' : 'unverified', now, rv.user_id, rv.property_id)
      })()
      return { status }
    }),
  )

  // ---------- review moderation ----------
  r.get(
    '/reviews',
    route((req) => {
      const status = String(req.query.status ?? 'pending')
      const statuses = status === 'all' ? ['pending', 'flagged', 'rejected', 'approved'] : status.split(',')
      return {
        results: db()
          .prepare(
            `SELECT r.id, r.display_name, r.overall_rating, r.title, r.body, r.review_type, r.residency_verification, r.moderation_status,
               r.moderation_note, r.report_count, r.created_at, r.data_source, p.name AS property_name, p.slug AS property_slug
             FROM reviews r JOIN properties p ON p.id = r.property_id
             WHERE r.moderation_status IN (${statuses.map(() => '?').join(', ')}) ORDER BY r.created_at DESC LIMIT 200`,
          )
          .all(...statuses),
      }
    }),
  )
  r.post(
    '/reviews/:id/moderate',
    route((req) => {
      const status = String(req.body?.status ?? '')
      if (!['approved', 'rejected', 'flagged', 'pending'].includes(status)) throw badRequest('INVALID_STATUS', 'Use approved, rejected, flagged or pending.')
      const res = db()
        .prepare('UPDATE reviews SET moderation_status = ?, moderation_note = COALESCE(?, moderation_note), updated_at = ? WHERE id = ?')
        .run(status, req.body?.note ?? null, nowIso(), req.params.id)
      if (!res.changes) throw notFound()
      return { status }
    }),
  )

  // ---------- booking queue ----------
  r.get('/bookings', route((req) => ({ results: listBookings(db(), { status: (req.query.status as string) || undefined }) })))
  r.post('/bookings/:reference/status', route((req) => adminSetStatus(db(), req.params.reference, String(req.body?.status ?? ''), req.body?.note)))

  r.get(
    '/waitlists',
    route(() => ({
      rooms: db()
        .prepare(
          `SELECT p.name AS property_name, w.room_type, COUNT(*) AS people FROM room_waitlist w JOIN properties p ON p.id = w.property_id GROUP BY w.property_id, w.room_type`,
        )
        .all(),
      areas: db().prepare('SELECT area_slug, COUNT(*) AS people FROM area_waitlist GROUP BY area_slug').all(),
    })),
  )

  r.post(
    '/purge-demo',
    route((req) => {
      if (req.body?.confirm !== 'PURGE') throw badRequest('CONFIRM_REQUIRED', 'Send {"confirm": "PURGE"} to remove all demo_seed data.')
      return { removed: db().transaction(() => purgeDemo(db()))() }
    }),
  )

  r.get('/config', route(() => ({ active_area: config.activeArea, demo_mode: config.demoMode, booking_expiry_hours: config.bookingExpiryHours })))

  return r
}
