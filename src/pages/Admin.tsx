import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, formatDate, inr, session } from '../lib/api'
import { useAsync, useStore } from '../lib/store'
import { Loading, ErrorState } from '../components/States'
import { Shield, Info } from '../components/Icons'
import type { BookingRequest } from '../../shared/types'

type Tab = 'bookings' | 'reviews' | 'verification' | 'properties'

export default function Admin() {
  const [token, setToken] = useState(session.adminToken() ?? '')
  const [authed, setAuthed] = useState(!!session.adminToken())
  const [tab, setTab] = useState<Tab>('bookings')

  const signIn = (e: FormEvent) => {
    e.preventDefault()
    session.setAdminToken(token.trim())
    setAuthed(true)
  }

  if (!authed)
    return (
      <div className="container page-pad" style={{ maxWidth: 520 }}>
        <h1 className="display-md">Admin</h1>
        <p className="muted">Enter the admin token from the server’s .env file (ADMIN_TOKEN).</p>
        <form onSubmit={signIn} className="admin-login">
          <label htmlFor="admin-token" className="sr-only">
            Admin token
          </label>
          <input id="admin-token" type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Admin token" autoComplete="off" />
          <button className="btn btn-primary" type="submit">
            Open admin
          </button>
        </form>
      </div>
    )

  return (
    <div className="container page-pad">
      <div className="section-head">
        <div>
          <span className="eyebrow">Admin · demo</span>
          <h1 className="display-lg">Operations</h1>
          <p>Owner contact details appear only on this screen. Owner responses here are simulated for the demo.</p>
        </div>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => {
            session.setAdminToken(null)
            setAuthed(false)
          }}
        >
          Sign out of admin
        </button>
      </div>
      <Overview onAuthError={() => setAuthed(false)} />
      <div className="pill-options admin-tabs" role="tablist">
        {(['bookings', 'reviews', 'verification', 'properties'] as Tab[]).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={`pill-option${tab === t ? ' on' : ''}`} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {tab === 'bookings' && <Bookings />}
      {tab === 'reviews' && <Reviews />}
      {tab === 'verification' && <Verification />}
      {tab === 'properties' && <Properties />}
    </div>
  )
}

function Overview({ onAuthError }: { onAuthError: () => void }) {
  const o = useAsync(() => api.admin.get('/overview'), [])
  if (o.error) {
    if ((o.error as any).status === 401) onAuthError()
    return <ErrorState error={o.error} />
  }
  if (!o.data) return null
  const d = o.data
  return (
    <div className="admin-stats">
      {[
        ['Open requests', d.bookings_open],
        ['Reviews pending', d.reviews_pending],
        ['Reviews flagged', d.reviews_flagged],
        ['Stays to verify', d.residency_pending],
        ['Places not fully verified', d.unverified_properties],
      ].map(([l, n]) => (
        <div className="admin-stat" key={l}>
          <b>{n}</b>
          <span>{l}</span>
        </div>
      ))}
    </div>
  )
}

function Bookings() {
  const { toast } = useStore()
  const list = useAsync(() => api.admin.get<{ results: BookingRequest[] }>('/bookings'), [])
  const act = (ref: string, status: string) =>
    api.admin
      .post(`/bookings/${ref}/status`, { status })
      .then(() => {
        toast(`${ref}: ${status.replace('_', ' ')}`)
        list.reload()
      })
      .catch((e) => toast(e.message))
  if (list.loading && !list.data) return <Loading />
  if (list.error) return <ErrorState error={list.error} onRetry={list.reload} />
  return (
    <div className="table-scroll card">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Reference</th>
            <th>Place and room</th>
            <th>Move-in</th>
            <th>Estimate</th>
            <th>Status</th>
            <th>Simulate owner</th>
          </tr>
        </thead>
        <tbody>
          {list.data!.results.map((b) => (
            <tr key={b.id}>
              <td className="mono">{b.reference}</td>
              <td>
                {b.property.name}
                <div className="tiny muted">{b.room_label}</div>
              </td>
              <td>
                {formatDate(b.move_in_date)}
                <div className="tiny muted">{b.duration_months} months</div>
              </td>
              <td className="num">{inr(b.estimate.estimated_total)}</td>
              <td>
                <span className="status-pill">{b.status_label}</span>
                {b.data_source === 'demo_seed' && <div className="tiny muted">sample</div>}
              </td>
              <td>
                <div className="admin-actions">
                  {b.status === 'submitted' && (
                    <button className="btn btn-sm btn-outline" onClick={() => act(b.reference, 'owner_notified')}>
                      Notify owner
                    </button>
                  )}
                  {(b.status === 'submitted' || b.status === 'owner_notified') && (
                    <>
                      <button className="btn btn-sm btn-primary" onClick={() => act(b.reference, 'accepted')}>
                        Accept
                      </button>
                      <button className="btn btn-sm btn-outline" onClick={() => act(b.reference, 'declined')}>
                        Decline
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Reviews() {
  const { toast } = useStore()
  const [status, setStatus] = useState('pending,flagged')
  const list = useAsync(() => api.admin.get<{ results: any[] }>(`/reviews?status=${status}`), [status])
  const moderate = (id: string, s: string) =>
    api.admin
      .post(`/reviews/${id}/moderate`, { status: s })
      .then(() => {
        toast(`Review ${s}`)
        list.reload()
      })
      .catch((e) => toast(e.message))
  return (
    <>
      <div className="pill-options" style={{ marginBottom: 14 }}>
        {[
          ['pending,flagged', 'Needs a decision'],
          ['rejected', 'Rejected'],
        ].map(([v, l]) => (
          <button key={v} className={`pill-option${status === v ? ' on' : ''}`} onClick={() => setStatus(v)}>
            {l}
          </button>
        ))}
      </div>
      {list.loading && !list.data && <Loading />}
      {list.error && <ErrorState error={list.error} onRetry={list.reload} />}
      {list.data?.results.length === 0 && <p className="muted">Nothing here.</p>}
      {list.data?.results.map((r) => (
        <div className="card card-pad admin-review" key={r.id}>
          <div className="request-top">
            <div>
              <b>{r.title}</b> · {r.overall_rating}★
              <div className="tiny muted">
                {r.display_name} · <Link to={`/property/${r.property_slug}`}>{r.property_name}</Link> · {formatDate(r.created_at)} · stay {r.residency_verification}
              </div>
            </div>
            <span className={`status-pill ${r.moderation_status === 'flagged' ? 'full' : 'pending'}`}>{r.moderation_status}</span>
          </div>
          <p>{r.body}</p>
          {r.moderation_note && (
            <p className="tiny">
              <Info size={12} /> {r.moderation_note}
            </p>
          )}
          {r.report_count > 0 && <p className="tiny muted">Reported {r.report_count} times</p>}
          <div className="admin-actions">
            <button className="btn btn-sm btn-primary" onClick={() => moderate(r.id, 'approved')}>
              Approve
            </button>
            <button className="btn btn-sm btn-outline" onClick={() => moderate(r.id, 'rejected')}>
              Reject
            </button>
          </div>
        </div>
      ))}
    </>
  )
}

function Verification() {
  const { toast } = useStore()
  const q = useAsync(() => api.admin.get('/verification-queue'), [])
  const decide = (id: string, status: string) =>
    api.admin
      .post(`/residency/${id}`, { status })
      .then(() => {
        toast(`Stay ${status}`)
        q.reload()
      })
      .catch((e) => toast(e.message))
  if (q.loading && !q.data) return <Loading />
  if (q.error) return <ErrorState error={q.error} onRetry={q.reload} />
  return (
    <>
      <h3 className="admin-h">Residency checks</h3>
      <p className="tiny muted">Evidence files are never stored or shown publicly. Approving marks this person’s reviews of that place as a verified stay.</p>
      {q.data.residency.length === 0 && <p className="muted">No stays waiting.</p>}
      {q.data.residency.map((r: any) => (
        <div className="card card-pad admin-review" key={r.id}>
          <b>{r.display_name}</b> · {r.property_name} · {r.evidence_type.replace('_', ' ')} · {formatDate(r.created_at)}
          <div className="admin-actions">
            <button className="btn btn-sm btn-primary" onClick={() => decide(r.id, 'approved')}>
              Approve stay
            </button>
            <button className="btn btn-sm btn-outline" onClick={() => decide(r.id, 'rejected')}>
              Reject
            </button>
          </div>
        </div>
      ))}
      <h3 className="admin-h">Places not fully verified</h3>
      <div className="table-scroll card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Place</th>
              <th>Status</th>
              <th>Verified facts</th>
              <th>Owner-listed facts</th>
            </tr>
          </thead>
          <tbody>
            {q.data.properties.map((p: any) => (
              <tr key={p.id}>
                <td>
                  <Link to={`/property/${p.slug}`}>{p.name}</Link>
                </td>
                <td>{p.verification_status.replace('_', ' ')}</td>
                <td className="num">{p.verified_facts}</td>
                <td className="num">{p.owner_listed_facts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function Properties() {
  const { toast } = useStore()
  const list = useAsync(() => api.admin.get<{ results: any[] }>('/properties'), [])
  const [open, setOpen] = useState<string | null>(null)
  const detail = useAsync(() => (open ? api.admin.get(`/properties/${open}`) : Promise.resolve(null)), [open])
  const setBeds = (roomId: string, available_beds: number) =>
    api.admin
      .patch(`/rooms/${roomId}`, { available_beds })
      .then(() => {
        toast('Availability updated')
        detail.reload()
        list.reload()
      })
      .catch((e) => toast(e.message))

  if (list.loading && !list.data) return <Loading />
  if (list.error) return <ErrorState error={list.error} onRetry={list.reload} />
  return (
    <div className="table-scroll card">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Place</th>
            <th>Rent</th>
            <th>Beds free</th>
            <th>
              <Shield size={12} /> Owner (admin only)
            </th>
            <th />
          </tr>
        </thead>
        <tbody>
          {list.data!.results.map((p) => [
            <tr key={p.id}>
              <td>
                {p.name}
                <div className="tiny muted">
                  {p.sub_area} · {p.verification_status.replace('_', ' ')} · {p.data_source}
                </div>
              </td>
              <td className="num">
                {inr(p.rent_min)}–{inr(p.rent_max)}
              </td>
              <td className="num">{p.beds_available}</td>
              <td className="tiny">
                {p.owner_name}
                <div className="muted">
                  {p.owner_phone} · {p.owner_email}
                </div>
              </td>
              <td>
                <button className="link-btn" onClick={() => setOpen(open === p.id ? null : p.id)}>
                  {open === p.id ? 'Close' : 'Inventory'}
                </button>
              </td>
            </tr>,
            open === p.id && detail.data ? (
              <tr key={`${p.id}-rooms`}>
                <td colSpan={5}>
                  {detail.data.rooms.map((r: any) => (
                    <div className="admin-room" key={r.id}>
                      <span>
                        {r.room_type} · {inr(r.rent_per_bed)} · {r.available_beds}/{r.total_beds} free
                      </span>
                      <button className="btn btn-sm btn-outline" disabled={r.available_beds <= 0} onClick={() => setBeds(r.id, r.available_beds - 1)}>
                        −1 bed
                      </button>
                      <button className="btn btn-sm btn-outline" disabled={r.available_beds >= r.total_beds} onClick={() => setBeds(r.id, r.available_beds + 1)}>
                        +1 bed
                      </button>
                    </div>
                  ))}
                </td>
              </tr>
            ) : null,
          ])}
        </tbody>
      </table>
    </div>
  )
}
