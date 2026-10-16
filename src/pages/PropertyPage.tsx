import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Art from '../components/Art'
import DemoNotice from '../components/DemoNotice'
import RatingBars from '../components/RatingBars'
import BookingCard from '../components/BookingCard'
import ReviewCard from '../components/ReviewCard'
import FactList from '../components/FactList'
import SourceBadge from '../components/SourceBadge'
import { VerificationBadge, to12 } from '../components/PropertyCard'
import { Loading, ErrorState } from '../components/States'
import { api, formatDate, inr } from '../lib/api'
import { useAsync, useStore } from '../lib/store'
import type { ArtScene, PropertyDetail } from '../../shared/types'
import {
  Heart, HeartFill, Scales, AlertTriangle, Info, MapPin, StarFill, Wifi, Power, Snowflake, Bath, Book, Water, Car, Elevator,
  Broom, Kitchen, Check, Shield, Moon, Utensils, Users, Bus,
} from '../components/Icons'

const ICON: Record<string, typeof Wifi> = {
  wifi: Wifi, ac: Snowflake, laundry: Broom, power: Power, bath: Bath, lift: Elevator, parking: Car, study: Book,
  cupboard: Check, kitchen: Kitchen, water: Water, broom: Broom,
}
const SCENES: ArtScene[] = ['building', 'room', 'window', 'lobby', 'kitchen', 'terrace']

export default function PropertyPage() {
  const { id = '' } = useParams()
  const detail = useAsync(() => api.property(id), [id])
  const [reviewSort, setReviewSort] = useState('helpful')
  const reviews = useAsync(() => api.propertyReviews(id, reviewSort), [id, reviewSort])

  if (detail.loading && !detail.data) return <div className="container"><Loading label="Loading this place…" /></div>
  if (detail.error || !detail.data)
    return (
      <div className="container" style={{ padding: '60px 0' }}>
        <ErrorState error={detail.error ?? new Error('Not found')} onRetry={detail.reload} />
        <p style={{ textAlign: 'center' }}>
          <Link to="/results">Back to search</Link>
        </p>
      </div>
    )
  return <Property p={detail.data} reviews={reviews} reviewSort={reviewSort} setReviewSort={setReviewSort} />
}

function Property({ p, reviews, reviewSort, setReviewSort }: { p: PropertyDetail; reviews: ReturnType<typeof useAsync<Awaited<ReturnType<typeof api.propertyReviews>>>>; reviewSort: string; setReviewSort: (s: string) => void }) {
  const { saved, compare, toggleSave, toggleCompare, optionLabel, toast } = useStore()
  const isSaved = saved.includes(p.slug)
  const isCompared = compare.includes(p.slug)
  const gallery = [p.art, ...SCENES.filter((s) => s !== p.art)].slice(0, 3)
  const rule = (field: string) => p.facts.rules.find((f) => f.field === field)
  const food = p.facts.food.find((f) => f.field === 'food.food_included')
  const s = p.review_summary

  return (
    <div className="container">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link> <span>/</span> <Link to="/results">Search</Link> <span>/</span>
        <Link to={`/results?sub_area=${p.sub_area.slug}`}>{p.sub_area.name}</Link> <span>/</span>
        <span style={{ color: 'var(--plum)' }}>{p.name}</span>
      </nav>
      <DemoNotice />

      <div className="unit-head">
        <div>
          <div className="unit-title-row">
            <h1 className="display-md">{p.name}</h1>
            <span className="badge badge-soft">{optionLabel('type', p.type)}</span>
            <VerificationBadge p={p} />
          </div>
          <div className="muted unit-sub">
            <MapPin size={16} /> {p.address_line.includes(p.sub_area.name) ? p.address_line : `${p.address_line}, ${p.sub_area.name}`}, {p.area.name}
            <span className="badge badge-sage">{optionLabel('gender_policy', p.gender_policy)}</span>
            <span className="badge badge-sage">{optionLabel('occupant_focus', p.occupant_focus === 'both' ? 'working_professionals' : p.occupant_focus)}{p.occupant_focus === 'both' ? ' and students' : ''}</span>
          </div>
          <div className="source-legend">
            <span className="tiny muted">How to read this page:</span>
            <SourceBadge source="owner_listed" /> <SourceBadge source="platform_verified" /> <SourceBadge source="resident_reported" />
            <span className="tiny muted">
              {p.source_counts.platform_verified} verified · {p.source_counts.owner_listed} listed · {p.source_counts.resident_reported} resident reports
            </span>
          </div>
        </div>
        <div className="unit-actions">
          <button className={`btn btn-sm ${isSaved ? 'btn-primary' : 'btn-outline'}`} onClick={() => toggleSave(p.slug, p.name)}>
            {isSaved ? <HeartFill size={16} /> : <Heart size={16} />} {isSaved ? 'Saved' : 'Save'}
          </button>
          <button className={`btn btn-sm ${isCompared ? 'btn-primary' : 'btn-outline'}`} onClick={() => toggleCompare(p.slug, p.name)}>
            <Scales size={16} /> {isCompared ? 'In compare' : 'Compare'}
          </button>
        </div>
      </div>

      <div className="gallery">
        {gallery.map((scene, i) => (
          <button className="g-item" key={i} onClick={() => toast('Real photos arrive with image uploads. These are illustrations.')} aria-label="Illustration">
            <Art variant={scene} />
            {i === 2 && <span className="gallery-more">Illustrations · photos coming soon</span>}
          </button>
        ))}
      </div>

      <div className="unit-grid">
        <div style={{ minWidth: 0 }}>
          {p.reported_differences.length > 0 && (
            <section className="unit-section" aria-labelledby="diffs">
              <h2 id="diffs">
                <AlertTriangle size={20} style={{ color: 'var(--warn-ink)' }} /> What residents report differently
              </h2>
              {p.reported_differences.map((d) => (
                <div className="discrepancy" key={d.id}>
                  <span className="d-icon">
                    <AlertTriangle size={19} />
                  </span>
                  <div>
                    <b>{d.title}</b>
                    <p>
                      <span className="diff-label">Listing says:</span> {d.listed_value}
                    </p>
                    <p>
                      <span className="diff-label">Residents report:</span> {d.reported_summary}{' '}
                      <span className="tiny muted">
                        Based on{' '}
                        {d.supporting_review_ids.map((rid, i) => (
                          <span key={rid}>
                            <a href={`#${rid}`}>review {i + 1}</a>
                            {i < d.supporting_review_ids.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                        .
                      </span>
                    </p>
                    {d.owner_response && (
                      <p>
                        <span className="diff-label">Owner response:</span> {d.owner_response}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              <div className="moderation-note">
                <Info size={14} />
                <span>These are resident reports, not confirmed findings. We only show one when at least two residents describe it, and owners can respond.</span>
              </div>
            </section>
          )}

          <section className="unit-section">
            <h2>At a glance</h2>
            <div className="info-grid">
              <div className="info-tile">
                <div className="label">Rent per bed</div>
                <div className="value">
                  {inr(p.from_rent)}
                  {p.rent_max > p.from_rent ? `–${inr(p.rent_max)}` : ''} / month
                </div>
              </div>
              <div className="info-tile">
                <div className="label">Deposit</div>
                <div className="value">{inr(p.costs.security_deposit)} (refundable)</div>
              </div>
              <div className="info-tile">
                <div className="label">
                  <Utensils size={13} /> Food
                </div>
                <div className="value">{food?.display}</div>
              </div>
              <div className="info-tile">
                <div className="label">
                  <Moon size={13} /> Curfew
                </div>
                <div className="value">
                  {rule('rules.curfew_type')?.display}
                  {p.gate_close_time ? ` · gate ${to12(p.gate_close_time)}` : ''}
                </div>
              </div>
              <div className="info-tile">
                <div className="label">
                  <Wifi size={13} /> Wi-Fi (listed)
                </div>
                <div className="value">
                  {p.wifi.speed_mbps} Mbps · {p.wifi.free ? 'free' : 'paid add-on'}
                </div>
              </div>
              <div className="info-tile">
                <div className="label">Free beds</div>
                <div className="value">{p.beds_available > 0 ? `${p.beds_available} as last updated` : 'Full right now'}</div>
              </div>
            </div>
            <p className="muted unit-about">{p.description}</p>
          </section>

          <section className="unit-section">
            <h2>Rooms and availability</h2>
            <div className="table-scroll">
              <table className="rooms-table">
                <thead>
                  <tr>
                    <th>Room</th>
                    <th>Rent per bed</th>
                    <th>Mess</th>
                    <th>Beds</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {p.rooms.map((r) => (
                    <tr key={r.id}>
                      <td>{r.label}</td>
                      <td className="num">{inr(r.rent_per_bed)}</td>
                      <td>{r.mess_cost_per_month != null ? `${inr(r.mess_cost_per_month)} optional` : food?.value === 'included' ? 'Included' : '—'}</td>
                      <td>
                        {r.status === 'available' ? (
                          <span className="status-pill ok">{r.available_beds} of {r.total_beds} free</span>
                        ) : (
                          <span className="status-pill full">Full{r.status === 'full_waitlist' ? ' · waitlist open' : ''}</span>
                        )}
                        {r.next_available_date && r.status !== 'available' && <div className="tiny muted">From {formatDate(r.next_available_date)}</div>}
                      </td>
                      <td className="tiny muted">{formatDate(r.availability_updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="cost-note">
              <Info size={15} />
              <span>Availability is as last updated by the listing, not live. A booking request doesn’t hold a bed until the owner accepts.</span>
            </p>
          </section>

          <section className="unit-section">
            <h2>Costs</h2>
            <table className="cost-table">
              <tbody>
                <tr>
                  <td>Security deposit (refundable)</td>
                  <td>{inr(p.costs.security_deposit)}</td>
                </tr>
                <tr>
                  <td>Rent paid in advance</td>
                  <td>{p.costs.advance_months} month{p.costs.advance_months > 1 ? 's' : ''}</td>
                </tr>
                {p.costs.maintenance_charge > 0 && (
                  <tr>
                    <td>Maintenance</td>
                    <td>{inr(p.costs.maintenance_charge)} a month</td>
                  </tr>
                )}
                <tr>
                  <td>Electricity</td>
                  <td>{p.costs.electricity_label}</td>
                </tr>
                {p.costs.other_charges.map((c) => (
                  <tr key={c.name}>
                    <td>
                      {c.name}
                      {c.refundable && <span className="tiny muted"> (refundable)</span>}
                    </td>
                    <td>
                      {inr(c.amount)} {c.frequency === 'monthly' ? 'a month' : c.frequency === 'yearly' ? 'a year' : 'once'}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td>Notice period</td>
                  <td>{p.costs.notice_period_days} days</td>
                </tr>
              </tbody>
            </table>
            <p className="cost-note">
              <Info size={15} />
              <span>
                {p.costs.notice_terms} All amounts are as listed by the owner. Use the booking card for an itemised estimate.
              </span>
            </p>
          </section>

          <section className="unit-section">
            <h2>Facilities</h2>
            <div className="facility-grid">
              {p.amenities.map((a) => {
                const Icon = ICON[a.icon] ?? Check
                return (
                  <div key={a.id} className="facility" title={a.note ?? undefined}>
                    <Icon size={18} /> {a.label}
                    {a.note && <span className="tiny muted"> · {a.note}</span>}
                  </div>
                )
              })}
            </div>
            <p className="tiny muted" style={{ marginTop: 10 }}>
              Facilities are as listed by the owner.
            </p>
          </section>

          <section className="unit-section">
            <h2>House rules</h2>
            <FactList facts={p.facts.rules} />
          </section>

          <section className="unit-section">
            <h2>
              <Shield size={20} /> Safety features
            </h2>
            <p className="muted section-intro">Individual features and where each one comes from. Havenly doesn’t combine these into a safety score.</p>
            <FactList facts={p.facts.safety} />
          </section>

          <section className="unit-section">
            <h2>
              <Wifi size={20} /> Wi-Fi
            </h2>
            <FactList facts={p.facts.wifi} />
          </section>

          <section className="unit-section">
            <h2>
              <Utensils size={20} /> Food
            </h2>
            <FactList facts={p.facts.food} />
          </section>

          <section className="unit-section">
            <h2>
              <Broom size={20} /> Cleaning and garbage
            </h2>
            <FactList facts={p.facts.cleaning} />
          </section>

          <section className="unit-section" aria-labelledby="reviews-h">
            <h2 id="reviews-h">
              <Users size={20} /> What residents say
            </h2>
            {s.count === 0 ? (
              <p className="muted">No reviews yet. This place was listed recently.</p>
            ) : (
              <>
                <div className="rating-summary">
                  <div className="big-score">
                    {s.enough ? (
                      <>
                        <div className="num">{s.average?.toFixed(1)}</div>
                        <div className="stars">
                          <StarFill size={16} />
                        </div>
                        <div className="count">
                          {s.count} reviews · {s.verified_resident_count} with a verified stay
                        </div>
                      </>
                    ) : (
                      <div className="count">{s.message}</div>
                    )}
                  </div>
                  {s.enough ? <RatingBars categories={s.categories} /> : <p className="muted">Category ratings appear once there are enough reviews.</p>}
                </div>

                <div className="reviews-toolbar">
                  <span className="tiny muted">Every review here is a fictional sample for the demo.</span>
                  <select id="review-sort" className="sort-select" value={reviewSort} onChange={(e) => setReviewSort(e.target.value)} aria-label="Sort reviews">
                    <option value="helpful">Most helpful</option>
                    <option value="recent">Most recent</option>
                    <option value="rating_low">Lowest rated first</option>
                  </select>
                </div>
                {reviews.loading && !reviews.data && <Loading label="Loading reviews…" />}
                {reviews.error && <ErrorState error={reviews.error} onRetry={reviews.reload} />}
                {reviews.data?.results.map((r) => <ReviewCard key={r.id} r={r} />)}
              </>
            )}
          </section>

          <section className="unit-section" style={{ borderBottom: 'none' }}>
            <h2>
              <Bus size={20} /> Location and commute
            </h2>
            <p className="muted section-intro">Approximate location. Times are estimates from the map, in normal daytime traffic.</p>
            <div className="table-scroll">
              <table className="rooms-table">
                <thead>
                  <tr>
                    <th>To</th>
                    <th>Walk</th>
                    <th>Auto</th>
                    <th>Bus</th>
                    <th>Distance</th>
                  </tr>
                </thead>
                <tbody>
                  {p.commute.map((c) => (
                    <tr key={c.landmark.slug}>
                      <td>{c.landmark.name}</td>
                      <td className="num">{c.minutes_walk > 45 ? '—' : `${c.minutes_walk} min`}</td>
                      <td className="num">{c.minutes_auto} min</td>
                      <td className="num">{c.minutes_bus} min</td>
                      <td className="num">{c.distance_km} km</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <BookingCard p={p} />
      </div>
    </div>
  )
}
