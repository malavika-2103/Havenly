import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getProperty, CATEGORY_LABELS } from '../data/properties'
import Art from '../components/Art'
import DemoNotice from '../components/DemoNotice'
import RatingBars from '../components/RatingBars'
import { useStore } from '../lib/store'
import {
  Heart,
  HeartFill,
  Scales,
  Shield,
  AlertTriangle,
  Info,
  MapPin,
  StarFill,
  ThumbsUp,
  Camera,
  Key,
  Users,
  Utensils,
  Calendar,
  Moon,
  Wifi,
  Power,
  Snowflake,
  Bath,
  Book,
  Water,
  Car,
  Elevator,
  Dumbbell,
  Broom,
  Trash,
  Clock,
  Check,
  Bus,
  Kitchen,
  Terrace,
  Eye,
} from '../components/Icons'

const facilityIcon = (icon: string) => {
  const map: Record<string, typeof Wifi> = {
    wifi: Wifi,
    power: Power,
    ac: Snowflake,
    laundry: Broom,
    bath: Bath,
    study: Book,
    water: Water,
    parking: Car,
    lift: Elevator,
    gym: Dumbbell,
    kitchen: Kitchen,
    terrace: Terrace,
    broom: Broom,
    shield: Shield,
    bus: Bus,
  }
  return map[icon] ?? Check
}

export default function PropertyPage() {
  const { id } = useParams()
  const p = getProperty(id)
  const { saved, compare, toggleSave, toggleCompare, toast } = useStore()
  const [helpful, setHelpful] = useState<string[]>([])
  const [moveIn, setMoveIn] = useState('')
  const [months, setMonths] = useState(11)
  const [occupancy, setOccupancy] = useState('Double sharing')
  const [modal, setModal] = useState(false)

  if (!p) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <h2 className="display-md">We couldn’t find that place</h2>
        <Link to="/results" className="btn btn-primary" style={{ marginTop: 18 }}>
          Back to search
        </Link>
      </div>
    )
  }

  const isSaved = saved.includes(p.id)
  const isCompared = compare.includes(p.id)
  const monthly = p.rent
  const deposit = p.deposit
  const foodMonthly = p.food === 'Optional' ? 3200 : 0
  const estimate = (monthly + foodMonthly) * months + deposit

  const gallery = [p.art, 'room', 'window', 'lobby'] as const

  const bookingRef = `HV-${p.id.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`

  return (
    <div className="container">
      <nav className="breadcrumb">
        <Link to="/">Home</Link> <span>/</span> <Link to="/results">Search</Link> <span>/</span>
        <Link to={`/results?locality=${encodeURIComponent(p.locality)}`}>{p.locality}</Link> <span>/</span>
        <span style={{ color: 'var(--plum)' }}>{p.name}</span>
      </nav>
      <DemoNotice />

      <div className="unit-head">
        <div>
          <div className="unit-title-row">
            <h1 className="display-md">{p.name}</h1>
            <span className="badge badge-soft">{p.type}</span>
            {p.verified ? (
              <span className="badge badge-verified">
                <Shield size={13} /> Verified {p.verifiedOn}
              </span>
            ) : (
              <span className="badge badge-warn">
                <AlertTriangle size={13} /> Verification pending
              </span>
            )}
          </div>
          <div className="muted" style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <MapPin size={16} /> {p.landmark}, {p.locality}, {p.city} · {p.distance}
            <span className="badge badge-sage" style={{ marginLeft: 6 }}>
              {p.gender}
            </span>
          </div>
        </div>
        <div className="unit-actions">
          <button className={`btn btn-sm ${isSaved ? 'btn-primary' : 'btn-outline'}`} onClick={() => toggleSave(p.id, p.name)}>
            {isSaved ? <HeartFill size={16} /> : <Heart size={16} />} {isSaved ? 'Saved' : 'Save'}
          </button>
          <button className={`btn btn-sm ${isCompared ? 'btn-primary' : 'btn-outline'}`} onClick={() => toggleCompare(p.id, p.name)}>
            <Scales size={16} /> {isCompared ? 'In compare' : 'Compare'}
          </button>
        </div>
      </div>

      <div className="gallery">
        {gallery.map((scene, i) => (
          <div className="g-item" key={i} onClick={() => toast('Photo viewer coming soon — imagine full-screen photos here')}>
            <Art variant={scene} />
            {i === 3 && (
              <span className="gallery-more">
                <Camera size={14} style={{ verticalAlign: -2, marginRight: 6 }} />
                View all 24 photos
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="unit-grid">
        <div>
          <section className="unit-section">
            <h2>At a glance</h2>
            <div className="info-grid">
              <div className="info-tile">
                <div className="label">Rent starts at</div>
                <div className="value">₹{p.rent.toLocaleString('en-IN')} / month</div>
              </div>
              <div className="info-tile">
                <div className="label">Deposit</div>
                <div className="value">₹{p.deposit.toLocaleString('en-IN')} (refundable)</div>
              </div>
              <div className="info-tile">
                <div className="label">Food</div>
                <div className="value">
                  {p.food} · {p.foodType.split(',')[0]}
                </div>
              </div>
              <div className="info-tile">
                <div className="label">Curfew</div>
                <div className="value">{p.curfew === 'Fixed' ? `Fixed · ${p.curfewTime}` : p.curfew === 'No curfew' ? 'No curfew' : `Flexible · ${p.curfewTime}`}</div>
              </div>
              <div className="info-tile">
                <div className="label">WiFi</div>
                <div className="value">
                  {p.wifi} · {p.wifiSpeed}
                </div>
              </div>
              <div className="info-tile">
                <div className="label">Availability</div>
                <div className="value">{p.availability}</div>
              </div>
            </div>
            <p className="muted" style={{ marginTop: 18, fontSize: '0.95rem' }}>
              {p.about}
            </p>
          </section>

          <section className="unit-section">
            <h2>Facilities</h2>
            <div className="facility-grid">
              {p.amenities.map((a) => {
                const Icon = facilityIcon(a.icon)
                return (
                  <div key={a.label} className={`facility${a.has ? '' : ' no'}`}>
                    <Icon size={18} /> {a.label}
                  </div>
                )
              })}
              <div className="facility">
                <Trash size={18} /> Garbage: {p.garbage.toLowerCase()}
              </div>
              <div className="facility">
                <Broom size={18} /> {p.cleaning}
              </div>
              <div className="facility">
                <Eye size={18} /> {p.security}
              </div>
            </div>
            <div className="cost-note">
              <Info size={15} />
              <span>
                Facilities marked with a line-through are listed by the owner but <b>not reported by residents</b> —
                double-check on your visit.
              </span>
            </div>
          </section>

          <section className="unit-section">
            <h2>Cost breakdown</h2>
            <table className="cost-table">
              <tbody>
                {p.costs.map((c) => (
                  <tr key={c.label}>
                    <td>
                      {c.label}
                      {c.note && <div className="tiny muted">{c.note}</div>}
                    </td>
                    <td>{typeof c.amount === 'number' ? `₹${c.amount.toLocaleString('en-IN')}` : c.amount}</td>
                  </tr>
                ))}
                <tr className="total">
                  <td>Typical first payment</td>
                  <td>₹{(p.rent + p.deposit + (p.food === 'Optional' ? 3200 : 0)).toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
            <div className="cost-note">
              <Info size={15} />
              <span>
                Costs are compiled from the listing and verified resident receipts. Electricity is often billed
                separately — the “typical” range is what residents actually reported paying.
              </span>
            </div>
          </section>

          <section className="unit-section">
            <h2>House rules</h2>
            <div className="rules-list">
              {p.rules.map((r) => {
                const Icon = r.icon === 'moon' ? Moon : r.icon === 'users' ? Users : r.icon === 'utensils' ? Utensils : Calendar
                return (
                  <div className="rule" key={r.label}>
                    <span className="r-icon">
                      <Icon size={18} />
                    </span>
                    <div>
                      <b>{r.label}</b>
                      <span>{r.value}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="unit-section">
            <h2>
              What residents say <span className="badge badge-resident">Verified reviews only</span>
            </h2>
            <div className="rating-summary">
              <div className="big-score">
                <div className="num">{p.rating.toFixed(1)}</div>
                <div className="stars">
                  <StarFill size={16} style={{ verticalAlign: -3 }} /> <StarFill size={16} style={{ verticalAlign: -3 }} /> <StarFill size={16} style={{ verticalAlign: -3 }} /> <StarFill size={16} style={{ verticalAlign: -3 }} />{' '}
                  <StarFill size={16} style={{ verticalAlign: -3, opacity: 0.35 }} />
                </div>
                <div className="count">{p.reviewCount} verified resident reviews</div>
              </div>
              <RatingBars categories={p.categories} />
            </div>

            <div style={{ marginTop: 22 }}>
              <h3 style={{ fontSize: '1.05rem', marginBottom: 12 }}>Resident highlights</h3>
              {p.highlights.map((h) => (
                <div key={h} style={{ display: 'flex', gap: 10, padding: '8px 0', fontSize: '0.92rem' }}>
                  <Check size={17} style={{ color: 'var(--olive)', flexShrink: 0, marginTop: 3 }} />
                  <span className="muted">{h}</span>
                </div>
              ))}
            </div>
          </section>

          {p.concerns.length > 0 && (
            <section className="unit-section">
              <h2>
                <AlertTriangle size={20} style={{ color: '#9c5a2c' }} /> Reported differences
              </h2>
              {p.concerns.map((c) => (
                <div className="discrepancy" key={c.title}>
                  <span className="d-icon">
                    <AlertTriangle size={19} />
                  </span>
                  <div>
                    <b>{c.title}</b>
                    <p>{c.detail}</p>
                  </div>
                </div>
              ))}
              <div className="moderation-note">
                <Info size={14} />
                <span>
                  These are resident reports, not confirmed findings. Havenly’s moderators cross-check patterns across
                  multiple reviews before highlighting them, and property owners can respond with evidence.
                </span>
              </div>
            </section>
          )}

          <section className="unit-section">
            <h2>Reviews ({p.reviews.length})</h2>
            {p.reviews.map((r) => (
              <div className="review" key={r.author}>
                <div className="review-head">
                  <div className="reviewer">
                    <span className="r-avatar">{r.initials}</span>
                    <div>
                      <b>{r.author}</b>
                      <span>
                        {r.stay} · {r.month}
                      </span>
                    </div>
                  </div>
                  <span className="review-stars">
                    <StarFill size={14} style={{ verticalAlign: -2 }} /> {r.rating}.0
                  </span>
                </div>
                <h4>{r.title}</h4>
                <p>{r.body}</p>
                <div className="review-tags">
                  <span className="badge badge-verified">
                    <Shield size={12} /> Verified resident
                  </span>
                  {r.tags.map((t) => (
                    <span key={t} className="badge badge-soft">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="helpful-row">
                  <button
                    className={`helpful-btn${helpful.includes(r.author) ? ' ' : ''}`}
                    onClick={() => {
                      if (!helpful.includes(r.author)) {
                        setHelpful([...helpful, r.author])
                        toast('Thanks — marked as helpful')
                      }
                    }}
                  >
                    <ThumbsUp size={14} /> Helpful ({r.helpful + (helpful.includes(r.author) ? 1 : 0)})
                  </button>
                  <button className="helpful-btn" onClick={() => toast('Report submitted to moderators')}>
                    <AlertTriangle size={14} /> Report
                  </button>
                </div>
              </div>
            ))}
            <div className="moderation-note">
              <Shield size={14} />
              <span>
                Only users who submitted redacted rent receipts or agreements for this specific property can review it.
                Evidence stays private and is never shown publicly.
              </span>
            </div>
          </section>

          <section className="unit-section" style={{ borderBottom: 'none' }}>
            <h2>Location & nearby</h2>
            <div className="location-card">
              <div className="map-blob">
                <span className="pin">
                  <MapPin size={44} />
                </span>
              </div>
              <ul className="landmark-list">
                {p.landmarks.map((l) => (
                  <li key={l.label}>
                    <span>{l.label}</span>
                    <b>{l.dist}</b>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        <aside className="booking-card">
          <div className="booking-price">
            <span className="p">₹{p.rent.toLocaleString('en-IN')}</span>
            <small>/month</small>
          </div>
          <div className="booking-rating">
            <StarFill size={15} style={{ color: 'var(--plum)' }} /> <b>{p.rating.toFixed(1)}</b> · {p.reviewCount} verified
            reviews · {p.availability}
          </div>

          <div className="book-field">
            <label>Move-in date</label>
            <input type="date" value={moveIn} onChange={(e) => setMoveIn(e.target.value)} />
          </div>
          <div className="book-field">
            <label>Room preference</label>
            <select value={occupancy} onChange={(e) => setOccupancy(e.target.value)}>
              {p.roomTypes.map((rt) => (
                <option key={rt}>{rt}</option>
              ))}
            </select>
          </div>
          <div className="book-field">
            <label>Duration</label>
            <select value={months} onChange={(e) => setMonths(Number(e.target.value))}>
              {[3, 6, 11].map((m) => (
                <option key={m} value={m}>
                  {m} month{m > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="book-estimate">
            <div className="row">
              <span>
                Rent × {months} month{months > 1 ? 's' : ''}
              </span>
              <span>₹{(monthly * months).toLocaleString('en-IN')}</span>
            </div>
            {p.food === 'Optional' && (
              <div className="row">
                <span>Mess (optional)</span>
                <span>₹{(3200 * months).toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="row">
              <span>Refundable deposit</span>
              <span>₹{deposit.toLocaleString('en-IN')}</span>
            </div>
            <div className="row total">
              <span>Estimated total</span>
              <span>₹{estimate.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button className="btn btn-primary btn-block btn-lg" onClick={() => setModal(true)}>
            <Key size={18} /> Request booking
          </button>
          <button
            className="btn btn-secondary btn-block"
            style={{ marginTop: 10 }}
            onClick={() => toast(`Message sent to ${p.name} — they usually reply within a day`)}
          >
            <Clock size={16} /> Ask about availability
          </button>

          <div className="safety-note">
            <Shield size={16} />
            <span>
              <b>Before you pay:</b> always visit in person and verify the warden’s ID. Havenly shares information and
              reports — no platform can guarantee safety, so trust your visit too.
            </span>
          </div>
        </aside>
      </div>

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <span className="m-icon">
              <Check size={34} />
            </span>
            <h3>Booking request sent!</h3>
            <p>
              We’ve forwarded your request for <b>{p.name}</b> ({occupancy}
              {moveIn ? `, moving in ${new Date(moveIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}). The
              property owner typically responds within 24 hours.
            </p>
            <div className="ref">{bookingRef}</div>
            <button className="btn btn-primary btn-block" onClick={() => setModal(false)}>
              Done
            </button>
            <p className="tiny muted" style={{ marginTop: 14 }}>
              Havenly does not collect payment. Pay only after your visit, and only to verified account details.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
