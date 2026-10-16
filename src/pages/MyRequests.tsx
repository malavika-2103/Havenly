import { Link } from 'react-router-dom'
import { api, formatDate, inr } from '../lib/api'
import { useAsync, useStore } from '../lib/store'
import Art from '../components/Art'
import { Loading, ErrorState, Empty } from '../components/States'
import { Key, Info, ArrowRight } from '../components/Icons'
import type { BookingStatus } from '../../shared/types'

const TONE: Record<BookingStatus, string> = {
  submitted: 'pending',
  owner_notified: 'pending',
  accepted: 'ok',
  declined: 'full',
  expired: 'muted',
  cancelled_by_user: 'muted',
}

export default function MyRequests() {
  const { user, toast } = useStore()
  const list = useAsync(() => (user ? api.bookings() : Promise.resolve({ results: [] })), [user?.id])

  const cancel = (ref: string) =>
    api
      .cancelBooking(ref)
      .then(() => {
        toast(`Cancelled ${ref}`)
        list.reload()
      })
      .catch((e) => toast(e.message))

  return (
    <div className="container page-pad">
      <div className="section-head">
        <div>
          <span className="eyebrow">Your account</span>
          <h1 className="display-lg">My booking requests</h1>
          <p>Requests are not bookings. A bed is only held if the owner accepts, and you pay the property directly after visiting.</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={list.reload}>
          Refresh
        </button>
      </div>
      <p className="demo-callout">
        <Info size={14} /> Demo: owner responses are simulated from the admin screen. No messages are sent and no payment is taken.
      </p>

      {list.loading && !list.data && <Loading />}
      {list.error && <ErrorState error={list.error} onRetry={list.reload} />}
      {list.data && list.data.results.length === 0 && (
        <Empty title="No requests yet" icon={<Key size={30} style={{ color: 'var(--mauve)' }} />}>
          <p className="muted">Open a place and use “Request booking” on the right.</p>
          <Link to="/results" className="btn btn-primary" style={{ marginTop: 18 }}>
            Find a place <ArrowRight size={16} />
          </Link>
        </Empty>
      )}

      <div className="request-list">
        {list.data?.results.map((b) => (
          <article className="request-card" key={b.id}>
            <Link to={`/property/${b.property.slug}`} className="request-art" aria-label={b.property.name}>
              <Art variant={b.property.art} />
            </Link>
            <div className="request-body">
              <div className="request-top">
                <div>
                  <Link to={`/property/${b.property.slug}`}>
                    <h3>{b.property.name}</h3>
                  </Link>
                  <span className="tiny muted">
                    {b.room_label} · moving in {formatDate(b.move_in_date)} · {b.duration_months} months
                  </span>
                </div>
                <span className={`status-pill ${TONE[b.status]}`}>{b.status_label}</span>
              </div>
              <div className="request-meta">
                <span>
                  Reference <b className="mono">{b.reference}</b>
                </span>
                <span>Estimated total {inr(b.estimate.estimated_total)}</span>
                <span>Due at move-in {inr(b.estimate.due_at_move_in)}</span>
                {(b.status === 'submitted' || b.status === 'owner_notified') && <span>Expires {formatDate(b.expires_at, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</span>}
              </div>
              <ol className="timeline">
                {b.status_history.map((h, i) => (
                  <li key={i}>
                    <b>{h.status.replace(/_/g, ' ')}</b> · {formatDate(h.at, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                    {h.note && <span className="muted"> · {h.note}</span>}
                  </li>
                ))}
              </ol>
              {['submitted', 'owner_notified', 'accepted'].includes(b.status) && (
                <button className="btn btn-outline btn-sm" onClick={() => cancel(b.reference)}>
                  Cancel request
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
