// Itemised cost estimate. Every amount comes from the database; the UI never computes prices.
import type { DB } from '../db'
import { parseJson } from '../db'
import { badRequest, notFound } from '../lib/http'
import { inr, roomLabel } from '../lib/labels'
import type { Estimate, EstimateInput, EstimateLine, OtherCharge, RoomType } from '../../../shared/types'
import { config } from '../config'

const ROOM_TYPES: RoomType[] = ['single', 'double', 'triple', 'dorm']
const DAY = 24 * 60 * 60 * 1000

/** Calendar date in India, so "today" matches what the person booking sees. */
export const todayIst = (now = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now)

const addDays = (isoDate: string, days: number) => new Date(Date.parse(`${isoDate}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10)

export function validateEstimateInput(raw: unknown): EstimateInput {
  const body = (raw ?? {}) as Record<string, unknown>
  const room_type = String(body.room_type ?? '') as RoomType
  if (!ROOM_TYPES.includes(room_type)) throw badRequest('INVALID_ROOM_TYPE', 'Choose a room type: single, double, triple or dorm.')
  const move_in_date = String(body.move_in_date ?? '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(move_in_date) || Number.isNaN(Date.parse(move_in_date))) {
    throw badRequest('INVALID_MOVE_IN', 'Enter a move-in date as YYYY-MM-DD.')
  }
  const duration_months = Number(body.duration_months)
  if (!Number.isInteger(duration_months) || duration_months < 1) {
    throw badRequest('INVALID_DURATION', 'Duration must be a whole number of months.')
  }
  return { room_type, move_in_date, duration_months, include_mess: body.include_mess === true || body.include_mess === 'true' }
}

export function computeEstimate(db: DB, slug: string, input: EstimateInput, now = new Date()): Estimate {
  const p = db
    .prepare(
      `SELECT p.*, f.food_included FROM properties p
       JOIN areas a ON a.id = p.area_id
       LEFT JOIN food_details f ON f.property_id = p.id
       WHERE p.slug = ? AND a.slug = ?`,
    )
    .get(slug, config.activeArea) as Record<string, any> | undefined
  if (!p) throw notFound('We couldn’t find that place.')

  const room = db.prepare('SELECT * FROM room_inventory WHERE property_id = ? AND room_type = ?').get(p.id, input.room_type) as Record<string, any> | undefined
  if (!room) {
    const offered = (db.prepare('SELECT room_type FROM room_inventory WHERE property_id = ?').all(p.id) as { room_type: string }[]).map((r) => r.room_type)
    throw badRequest('ROOM_TYPE_NOT_FOUND', `${p.name} doesn’t list a ${input.room_type} room. Available types: ${offered.join(', ')}.`, { offered })
  }

  if (input.duration_months < p.min_stay_months || input.duration_months > p.max_stay_months) {
    throw badRequest(
      'INVALID_DURATION',
      `Stays here must be between ${p.min_stay_months} and ${p.max_stay_months} months.`,
      { min_stay_months: p.min_stay_months, max_stay_months: p.max_stay_months },
    )
  }

  const today = todayIst(now)
  const latest = addDays(today, config.maxMoveInDays)
  if (input.move_in_date <= today) throw badRequest('INVALID_MOVE_IN', 'Choose a move-in date from tomorrow onwards.', { earliest: addDays(today, 1) })
  if (input.move_in_date > latest) {
    throw badRequest('INVALID_MOVE_IN', `Requests can be made up to ${config.maxMoveInDays} days ahead. Choose a date on or before ${latest}.`, { latest })
  }

  const months = input.duration_months
  const lines: EstimateLine[] = []
  const notes: string[] = []
  const label = roomLabel(room as any)

  lines.push({
    key: 'rent',
    label: `Rent × ${months} month${months > 1 ? 's' : ''}`,
    amount: room.rent_per_bed * months,
    detail: `${inr(room.rent_per_bed)} a month per bed · ${label}`,
    refundable: false,
    kind: 'rent',
  })

  let includeMess = input.include_mess
  if (room.mess_cost_per_month != null) {
    if (includeMess) {
      lines.push({
        key: 'mess',
        label: `Mess × ${months} month${months > 1 ? 's' : ''}`,
        amount: room.mess_cost_per_month * months,
        detail: `${inr(room.mess_cost_per_month)} a month, optional`,
        refundable: false,
        kind: 'mess',
      })
    } else {
      notes.push(`Mess is optional here at ${inr(room.mess_cost_per_month)} a month. It is not included in this estimate.`)
    }
  } else {
    includeMess = false
    if (p.food_included === 'included') notes.push('Meals are included in the rent.')
    else if (p.food_included === 'none') notes.push('This place has no food service.')
  }

  if (p.maintenance_charge > 0) {
    lines.push({
      key: 'maintenance',
      label: `Maintenance × ${months} months`,
      amount: p.maintenance_charge * months,
      detail: `${inr(p.maintenance_charge)} a month`,
      refundable: false,
      kind: 'recurring',
    })
  }

  const charges = parseJson<OtherCharge[]>(p.other_charges, [])
  charges.forEach((c, i) => {
    const count = c.frequency === 'monthly' ? months : c.frequency === 'yearly' ? Math.ceil(months / 12) : 1
    lines.push({
      key: `charge_${i}`,
      label: c.frequency === 'monthly' ? `${c.name} × ${months} months` : c.name,
      amount: c.amount * count,
      detail:
        c.frequency === 'monthly'
          ? `${inr(c.amount)} a month`
          : c.frequency === 'yearly'
            ? `${inr(c.amount)} a year`
            : `One-time${c.refundable ? ', refundable' : ''}`,
      refundable: c.refundable,
      kind: c.frequency === 'one_time' ? 'one_time' : 'recurring',
    })
  })

  lines.push({
    key: 'deposit',
    label: 'Security deposit',
    amount: p.security_deposit,
    detail: 'Refundable when you leave, subject to the notice terms',
    refundable: true,
    kind: 'deposit',
  })

  if (p.electricity_policy === 'metered') notes.push('Electricity is billed on the meter and is not included in this estimate.')
  if (p.electricity_policy === 'included') notes.push('Electricity is included in the rent.')
  notes.push(`Notice period: ${p.notice_period_days} days. ${p.notice_terms ?? ''}`.trim())
  notes.push('Havenly does not take any payment. If the owner accepts, you pay the property directly after visiting.')

  const total = lines.reduce((s, l) => s + l.amount, 0)
  const refundable = lines.filter((l) => l.refundable).reduce((s, l) => s + l.amount, 0)
  const advance = Math.max(1, p.advance_months)
  const monthlyRecurring =
    room.rent_per_bed +
    (includeMess ? room.mess_cost_per_month : 0) +
    p.maintenance_charge +
    charges.filter((c) => c.frequency === 'monthly').reduce((s, c) => s + c.amount, 0)
  const dueAtMoveIn =
    monthlyRecurring * Math.min(advance, months) +
    charges.filter((c) => c.frequency !== 'monthly').reduce((s, c) => s + c.amount, 0) +
    p.security_deposit

  const residentReported = (
    db
      .prepare(`SELECT reported_summary FROM reported_differences WHERE property_id = ? AND field_name LIKE 'costs.%' AND status != 'resolved'`)
      .all(p.id) as { reported_summary: string }[]
  ).map((r) => r.reported_summary)

  return {
    property_slug: p.slug,
    room_type: input.room_type,
    room_label: label,
    move_in_date: input.move_in_date,
    duration_months: months,
    include_mess: includeMess,
    lines,
    estimated_total: total,
    refundable_total: refundable,
    non_refundable_total: total - refundable,
    due_at_move_in: dueAtMoveIn,
    notes,
    resident_reported_costs: residentReported,
    computed_at: now.toISOString(),
  }
}
