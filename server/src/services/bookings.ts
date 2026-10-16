// Booking REQUESTS. Nothing here reserves a bed or takes payment. A bed is only decremented when
// the owner accepts (simulated by an admin in the demo).
import crypto from 'node:crypto'
import type { DB } from '../db'
import { nowIso, parseJson } from '../db'
import { config } from '../config'
import { badRequest, conflict, notFound } from '../lib/http'
import { label, roomLabel } from '../lib/labels'
import { computeEstimate, validateEstimateInput } from './estimate'
import type { BookingRequest, BookingStatus, Estimate } from '../../../shared/types'

type Row = Record<string, any>
const OPEN: BookingStatus[] = ['submitted', 'owner_notified']
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ' // no 0/O, 1/I/L

function newReference(db: DB) {
  for (;;) {
    const bytes = crypto.randomBytes(8)
    const chars = [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join('')
    const ref = `HV-${chars.slice(0, 4)}-${chars.slice(4, 8)}`
    if (!db.prepare('SELECT 1 FROM booking_requests WHERE reference = ?').get(ref)) return ref
  }
}

/** Requests expire lazily: any read past expires_at with no owner response moves them to "expired". */
export function expireStale(db: DB, now = nowIso()) {
  const stale = db.prepare(`SELECT id, status_history FROM booking_requests WHERE status IN ('submitted', 'owner_notified') AND expires_at < ?`).all(now) as Row[]
  for (const r of stale) {
    const history = parseJson<any[]>(r.status_history, [])
    history.push({ status: 'expired', at: now, by: 'system', note: 'No owner response within the request window.' })
    db.prepare(`UPDATE booking_requests SET status = 'expired', status_history = ?, updated_at = ? WHERE id = ?`).run(JSON.stringify(history), now, r.id)
  }
}

const SELECT = `SELECT b.*, p.slug AS p_slug, p.name AS p_name, p.art AS p_art, s.name AS p_sub_area, ri.ac AS r_ac, ri.attached_bathroom AS r_bath
  FROM booking_requests b JOIN properties p ON p.id = b.property_id JOIN sub_areas s ON s.id = p.sub_area_id
  LEFT JOIN room_inventory ri ON ri.property_id = b.property_id AND ri.room_type = b.room_type`

export function toBooking(r: Row): BookingRequest {
  return {
    id: r.id,
    reference: r.reference,
    property: { slug: r.p_slug, name: r.p_name, sub_area: r.p_sub_area, art: r.p_art },
    room_type: r.room_type,
    room_label: roomLabel({ room_type: r.room_type, occupancy: r.occupancy, ac: r.r_ac, attached_bathroom: r.r_bath }),
    occupancy: r.occupancy,
    move_in_date: r.move_in_date,
    duration_months: r.duration_months,
    estimate: parseJson<Estimate>(r.estimate_snapshot, {} as Estimate),
    status: r.status,
    status_label: label('booking_status', r.status),
    status_history: parseJson(r.status_history, []),
    note_from_user: r.note_from_user,
    expires_at: r.expires_at,
    created_at: r.created_at,
    simulated: true,
    data_source: r.data_source,
  }
}

export function getBooking(db: DB, reference: string, userId?: string) {
  expireStale(db)
  const r = db.prepare(`${SELECT} WHERE b.reference = ?${userId ? ' AND b.user_id = ?' : ''}`).get(...(userId ? [reference, userId] : [reference])) as Row | undefined
  if (!r) throw notFound('We couldn’t find a request with that reference.')
  return toBooking(r)
}

export function listBookings(db: DB, opts: { userId?: string; status?: string }) {
  expireStale(db)
  const where: string[] = []
  const params: unknown[] = []
  if (opts.userId) {
    where.push('b.user_id = ?')
    params.push(opts.userId)
  }
  if (opts.status) {
    where.push('b.status = ?')
    params.push(opts.status)
  }
  const rows = db.prepare(`${SELECT}${where.length ? ' WHERE ' + where.join(' AND ') : ''} ORDER BY b.created_at DESC`).all(...params) as Row[]
  return rows.map(toBooking)
}

export function createBooking(db: DB, userId: string, body: Record<string, unknown>, idempotencyKey?: string) {
  const slug = String(body.property_slug ?? '')
  const key = idempotencyKey ? String(idempotencyKey).slice(0, 100) : null

  // Repeated submit with the same key returns the original request instead of creating another.
  if (key) {
    const existing = db.prepare('SELECT reference FROM booking_requests WHERE user_id = ? AND idempotency_key = ?').get(userId, key) as Row | undefined
    if (existing) return { booking: getBooking(db, existing.reference), replayed: true }
  }

  const input = validateEstimateInput(body)
  const estimate = computeEstimate(db, slug, input) // validates property, room type, duration and dates
  const p = db.prepare('SELECT id, name FROM properties WHERE slug = ?').get(slug) as Row
  const room = db.prepare('SELECT * FROM room_inventory WHERE property_id = ? AND room_type = ?').get(p.id, input.room_type) as Row

  if (room.available_beds <= 0) {
    throw conflict('ROOM_FULL', `${roomLabel(room as any)} at ${p.name} is full as last updated by the listing.`, {
      waitlist_open: room.waitlist_open === 1,
      next_available_date: room.next_available_date,
    })
  }

  expireStale(db)
  const dup = db
    .prepare(`SELECT reference FROM booking_requests WHERE user_id = ? AND property_id = ? AND room_type = ? AND status IN (${OPEN.map(() => '?').join(', ')})`)
    .get(userId, p.id, input.room_type, ...OPEN) as Row | undefined
  if (dup) {
    throw conflict('DUPLICATE_REQUEST', `You already have an open request for this room type (${dup.reference}). Cancel it first to send a new one.`, { reference: dup.reference })
  }

  const now = nowIso()
  const reference = newReference(db)
  const expires = new Date(Date.now() + config.bookingExpiryHours * 3600_000).toISOString()
  const note = body.note ? String(body.note).slice(0, 500) : null
  const history = [{ status: 'submitted', at: now, by: 'user', note: 'Request recorded. No bed is held and no payment is taken.' }]
  db.prepare(
    `INSERT INTO booking_requests (id, reference, user_id, property_id, room_type, occupancy, move_in_date, duration_months, include_mess,
      estimate_snapshot, status, status_history, note_from_user, idempotency_key, expires_at, created_at, updated_at, data_source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?, ?, ?, ?, ?, ?, 'user_submitted')`,
  ).run(
    `bk_${crypto.randomUUID().slice(0, 12)}`, reference, userId, p.id, input.room_type, room.occupancy, input.move_in_date, input.duration_months,
    estimate.include_mess ? 1 : 0, JSON.stringify(estimate), JSON.stringify(history), note, key, expires, now, now,
  )
  return { booking: getBooking(db, reference), replayed: false }
}

export function cancelBooking(db: DB, userId: string, reference: string) {
  const b = db.prepare('SELECT * FROM booking_requests WHERE reference = ? AND user_id = ?').get(reference, userId) as Row | undefined
  if (!b) throw notFound('We couldn’t find a request with that reference.')
  if (!['submitted', 'owner_notified', 'accepted'].includes(b.status)) {
    throw conflict('CANNOT_CANCEL', `This request is already ${label('booking_status', b.status).toLowerCase()}.`)
  }
  return setStatus(db, b, 'cancelled_by_user', 'user', null)
}

const TRANSITIONS: Record<string, BookingStatus[]> = {
  submitted: ['owner_notified', 'accepted', 'declined', 'cancelled_by_user'],
  owner_notified: ['accepted', 'declined', 'cancelled_by_user'],
  accepted: ['cancelled_by_user'],
}

function setStatus(db: DB, b: Row, status: BookingStatus, by: string, note: string | null) {
  if (!TRANSITIONS[b.status]?.includes(status)) throw conflict('INVALID_TRANSITION', `Can’t move a request from ${b.status} to ${status}.`)
  const now = nowIso()
  const tx = db.transaction(() => {
    if (status === 'accepted') {
      const res = db
        .prepare(`UPDATE room_inventory SET available_beds = available_beds - 1, availability_updated_at = ?, updated_at = ? WHERE property_id = ? AND room_type = ? AND available_beds > 0`)
        .run(now, now, b.property_id, b.room_type)
      if (res.changes === 0) throw conflict('ROOM_FULL', 'No free beds left in this room type, so the request can’t be accepted.')
    }
    if (b.status === 'accepted' && status === 'cancelled_by_user') {
      db.prepare(`UPDATE room_inventory SET available_beds = MIN(total_beds, available_beds + 1), availability_updated_at = ?, updated_at = ? WHERE property_id = ? AND room_type = ?`).run(
        now, now, b.property_id, b.room_type,
      )
    }
    const history = parseJson<any[]>(b.status_history, [])
    history.push({ status, at: now, by, note })
    db.prepare('UPDATE booking_requests SET status = ?, status_history = ?, updated_at = ? WHERE id = ?').run(status, JSON.stringify(history), now, b.id)
  })
  tx()
  return getBooking(db, b.reference)
}

/** Admin-only: simulate the owner's side of the lifecycle for the demo. */
export function adminSetStatus(db: DB, reference: string, status: string, note?: string) {
  if (!['owner_notified', 'accepted', 'declined'].includes(status)) throw badRequest('INVALID_STATUS', 'Status must be owner_notified, accepted or declined.')
  expireStale(db)
  const b = db.prepare('SELECT * FROM booking_requests WHERE reference = ?').get(reference) as Row | undefined
  if (!b) throw notFound('Booking request not found.')
  return setStatus(db, b, status as BookingStatus, 'admin', note ?? 'Simulated owner response for the demo.')
}

export function joinWaitlist(db: DB, userId: string, slug: string, roomType: string) {
  const p = db.prepare(`SELECT p.id, p.name FROM properties p JOIN areas a ON a.id = p.area_id WHERE p.slug = ? AND a.slug = ?`).get(slug, config.activeArea) as Row | undefined
  if (!p) throw notFound('We couldn’t find that place.')
  const room = db.prepare('SELECT * FROM room_inventory WHERE property_id = ? AND room_type = ?').get(p.id, roomType) as Row | undefined
  if (!room) throw badRequest('ROOM_TYPE_NOT_FOUND', 'That room type isn’t listed here.')
  if (room.available_beds > 0) throw badRequest('ROOM_HAS_BEDS', 'This room type has free beds, so you can send a booking request instead.')
  if (room.waitlist_open !== 1) throw conflict('WAITLIST_CLOSED', 'The listing isn’t taking a waitlist for this room type right now.', { next_available_date: room.next_available_date })
  const now = nowIso()
  db.prepare(
    `INSERT OR IGNORE INTO room_waitlist (id, user_id, property_id, room_type, created_at, updated_at, data_source) VALUES (?, ?, ?, ?, ?, ?, 'user_submitted')`,
  ).run(`wl_${crypto.randomUUID().slice(0, 12)}`, userId, p.id, roomType, now, now)
  const position = (
    db
      .prepare(`SELECT COUNT(*) AS n FROM room_waitlist WHERE property_id = ? AND room_type = ? AND created_at <= (SELECT created_at FROM room_waitlist WHERE user_id = ? AND property_id = ? AND room_type = ?)`)
      .get(p.id, roomType, userId, p.id, roomType) as Row
  ).n
  return { joined: true, position, next_available_date: room.next_available_date, message: `You’re number ${position} on the waitlist. In the demo, no notification is actually sent.` }
}
