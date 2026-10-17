import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { BookingRequest, Estimate, PropertyDetail, RoomType } from '../../shared/types'
import { api, ApiError, formatDate, inr, newIdempotencyKey } from '../lib/api'
import { useStore } from '../lib/store'
import { Key, Shield, StarFill, Check, AlertTriangle, Info, Clock } from './Icons'
import NotificationsToggle from './NotificationsToggle'

const isoDay = (offsetDays: number) => {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Booking REQUEST card. Room options come from room_inventory; every amount comes from the estimate endpoint. */
export default function BookingCard({ p }: { p: PropertyDetail }) {
  const { toast } = useStore()
  const firstOpen = p.rooms.find((r) => r.status === 'available') ?? p.rooms[0]
  const [roomType, setRoomType] = useState<RoomType>(firstOpen.room_type)
  const [moveIn, setMoveIn] = useState(isoDay(14))
  const durations = useMemo(() => {
    const opts = [1, 3, 6, 11, 12, 18, 24].filter((m) => m >= p.costs.min_stay_months && m <= p.costs.max_stay_months)
    return opts.length ? opts : [p.costs.min_stay_months]
  }, [p.costs.min_stay_months, p.costs.max_stay_months])
  const [months, setMonths] = useState(durations.includes(6) ? 6 : durations[0])
  const [mess, setMess] = useState(false)
  const [note, setNote] = useState('')
  const [estimate, setEstimate] = useState<Estimate | null>(null)
  const [estError, setEstError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<ApiError | null>(null)
  const [done, setDone] = useState<BookingRequest | null>(null)
  const [waitlisted, setWaitlisted] = useState<string | null>(null)
  const idemKey = useRef(newIdempotencyKey())

  const room = p.rooms.find((r) => r.room_type === roomType)!
  const isFull = room.available_beds === 0

  useEffect(() => {
    setEstError(null)
    setSubmitError(null)
    idemKey.current = newIdempotencyKey()
    if (!moveIn) return setEstimate(null)
    const ctrl = new AbortController()
    const t = setTimeout(() => {
      api
        .estimate(p.slug, { room_type: roomType, move_in_date: moveIn, duration_months: months, include_mess: mess }, ctrl.signal)
        .then(setEstimate)
        .catch((e) => {
          if (e.name === 'AbortError') return
          setEstimate(null)
          setEstError(e.message)
        })
    }, 200)
    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [p.slug, roomType, moveIn, months, mess])

  const request = async () => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const r = await api.createBooking({ property_slug: p.slug, room_type: roomType, move_in_date: moveIn, duration_months: months, include_mess: mess, note: note || undefined }, idemKey.current)
      setDone(r.booking)
      // A deliberate second request is a new attempt (the server blocks it as a duplicate);
      // the same key only covers double-clicks and retries of this one.
      idemKey.current = newIdempotencyKey()
    } catch (e) {
      setSubmitError(e as ApiError)
    } finally {
      setSubmitting(false)
    }
  }

  const waitlist = async () => {
    try {
      const r = await api.joinWaitlist(p.slug, roomType)
      setWaitlisted(r.message)
      toast('Added to the waitlist')
    } catch (e) {
      toast((e as Error).message)
    }
  }

  return (
    <aside className="booking-card" aria-label="Request a booking">
      <div className="booking-price">
        <span className="p">{inr(room.rent_per_bed)}</span>
        <small>/month per bed</small>
      </div>
      <div className="booking-rating">
        {p.rating != null ? (
          <>
            <StarFill size={15} style={{ color: 'var(--plum)' }} /> <b>{p.rating.toFixed(1)}</b> · {p.review_count} reviews
          </>
        ) : (
          <span>{p.review_summary.message ?? 'No reviews yet'}</span>
        )}
      </div>

      <div className="book-field">
        <label htmlFor="bk-room">Room preference</label>
        <select id="bk-room" value={roomType} onChange={(e) => setRoomType(e.target.value as RoomType)}>
          {p.rooms.map((r) => (
            <option key={r.id} value={r.room_type}>
              {r.label} · {inr(r.rent_per_bed)}
              {r.status === 'available' ? ` · ${r.available_beds} free` : r.status === 'full_waitlist' ? ' · Full, join waitlist' : ' · Full'}
            </option>
          ))}
        </select>
        <span className="tiny muted">
          <Clock size={11} /> Beds as last updated by the listing on {formatDate(room.availability_updated_at)}
        </span>
      </div>

      {isFull ? (
        <div className="full-box">
          <b>{room.label} is full</b>
          <p className="tiny">
            {room.next_available_date ? `The listing expects a bed from ${formatDate(room.next_available_date)}.` : 'No date given by the listing.'}
          </p>
          {room.waitlist_open ? (
            waitlisted ? (
              <>
                <p className="tiny">{waitlisted}</p>
                <NotificationsToggle compact />
              </>
            ) : (
              <button className="btn btn-primary btn-block" onClick={waitlist}>
                Join the waitlist
              </button>
            )
          ) : (
            <p className="tiny muted">This listing isn’t taking a waitlist right now.</p>
          )}
        </div>
      ) : (
        <>
          <div className="book-field">
            <label htmlFor="bk-date">Move-in date</label>
            <input id="bk-date" type="date" value={moveIn} min={isoDay(1)} max={isoDay(90)} onChange={(e) => setMoveIn(e.target.value)} />
          </div>
          <div className="book-field">
            <label htmlFor="bk-months">Duration</label>
            <select id="bk-months" value={months} onChange={(e) => setMonths(Number(e.target.value))}>
              {durations.map((m) => (
                <option key={m} value={m}>
                  {m} month{m > 1 ? 's' : ''}
                </option>
              ))}
            </select>
            <span className="tiny muted">
              Stays here run {p.costs.min_stay_months}–{p.costs.max_stay_months} months.
            </span>
          </div>
          {room.mess_cost_per_month != null && (
            <label className="check-row">
              <input id="bk-mess" type="checkbox" checked={mess} onChange={(e) => setMess(e.target.checked)} />
              Add the optional mess ({inr(room.mess_cost_per_month)} a month)
            </label>
          )}

          <div className="book-estimate" aria-live="polite">
            {estError && <p className="form-error">{estError}</p>}
            {!estError && !estimate && <p className="tiny muted">Calculating…</p>}
            {estimate && (
              <>
                {estimate.lines.map((l) => (
                  <div className="row" key={l.key} title={l.detail}>
                    <span>
                      {l.label}
                      {l.refundable && <em className="refund"> refundable</em>}
                    </span>
                    <span>{inr(l.amount)}</span>
                  </div>
                ))}
                <div className="row total">
                  <span>Estimated total</span>
                  <span>{inr(estimate.estimated_total)}</span>
                </div>
                <div className="row sub">
                  <span>Due at move-in (to the property)</span>
                  <span>{inr(estimate.due_at_move_in)}</span>
                </div>
                <div className="row sub">
                  <span>Of which refundable</span>
                  <span>{inr(estimate.refundable_total)}</span>
                </div>
                {estimate.resident_reported_costs.map((c) => (
                  <p className="estimate-warn" key={c}>
                    <AlertTriangle size={13} /> Residents report: {c}
                  </p>
                ))}
                <ul className="estimate-notes">
                  {estimate.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div className="book-field">
            <label htmlFor="bk-note">Note for the owner (optional)</label>
            <input id="bk-note" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Joining Infopark on 1 Dec" />
          </div>

          {submitError && (
            <div className="form-error">
              {submitError.message}
              {submitError.code === 'DUPLICATE_REQUEST' && (
                <>
                  {' '}
                  <Link to="/requests">See my requests</Link>
                </>
              )}
            </div>
          )}

          <button className="btn btn-primary btn-block btn-lg" onClick={request} disabled={!estimate || submitting}>
            <Key size={18} /> {submitting ? 'Sending request…' : 'Request booking'}
          </button>
          <p className="tiny muted" style={{ marginTop: 8 }}>
            This sends a request. It doesn’t hold a bed and no payment is taken.
          </p>
        </>
      )}

      <div className="safety-note">
        <Shield size={16} />
        <span>
          <b>Before you pay:</b> visit in person. Havenly shares listings and resident reports. It can’t guarantee safety, so trust your visit too.
        </span>
      </div>

      {done && (
        <div className="modal-backdrop" onClick={() => setDone(null)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="bk-done-title" onClick={(e) => e.stopPropagation()}>
            <span className="m-icon">
              <Check size={34} />
            </span>
            <h3 id="bk-done-title">Request recorded</h3>
            <p>
              Your request for <b>{done.property.name}</b> ({done.room_label}, moving in {formatDate(done.move_in_date)}, {done.duration_months} months) has been recorded.
            </p>
            <div className="ref">{done.reference}</div>
            <p className="demo-callout">
              <Info size={14} /> In this demo the owner’s response is simulated. No message is actually sent and no bed is held until the owner accepts.
            </p>
            <p className="tiny muted">
              The request expires on {formatDate(done.expires_at, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })} if there’s no response. Havenly never takes payment. If accepted, you pay the property directly after visiting.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <Link to="/requests" className="btn btn-primary" style={{ flex: 1 }}>
                View my requests
              </Link>
              <button className="btn btn-outline" onClick={() => setDone(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
