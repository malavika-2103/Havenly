import { Link } from 'react-router-dom'
import type { PropertySummary } from '../../shared/types'
import { useStore } from '../lib/store'
import { inr, formatDate } from '../lib/api'
import Art from './Art'
import { Heart, HeartFill, Scales, MapPin, Wifi, Moon, Utensils, StarFill, Shield, AlertTriangle, Bus } from './Icons'

export function VerificationBadge({ p }: { p: Pick<PropertySummary, 'verified_badge' | 'verification_status' | 'last_verified_at'> }) {
  if (p.verified_badge)
    return (
      <span className="badge badge-verified" title="Demo verification record">
        <Shield size={13} /> Verified by Havenly · {formatDate(p.last_verified_at, { month: 'short', year: 'numeric' })} · demo
      </span>
    )
  if (p.verification_status === 'partially_verified')
    return (
      <span className="badge badge-partial">
        <Shield size={13} /> Partly verified
      </span>
    )
  return (
    <span className="badge badge-warn">
      <AlertTriangle size={13} /> Not yet verified
    </span>
  )
}

export function RatingPill({ p }: { p: Pick<PropertySummary, 'rating' | 'review_count'> }) {
  if (p.rating != null)
    return (
      <span className="rating-pill" title={`${p.review_count} reviews`}>
        <StarFill size={14} /> {p.rating.toFixed(1)}
      </span>
    )
  return <span className="rating-pill rating-none">{p.review_count ? `${p.review_count} review${p.review_count > 1 ? 's' : ''}` : 'No reviews'}</span>
}

export default function PropertyCard({ p }: { p: PropertySummary }) {
  const { saved, compare, toggleSave, toggleCompare, optionLabel } = useStore()
  const isSaved = saved.includes(p.slug)
  const curfew =
    p.curfew_type === 'none' ? 'No curfew' : `${optionLabel('curfew_type', p.curfew_type)} curfew${p.gate_close_time ? ` · ${to12(p.gate_close_time)}` : ''}`

  return (
    <article className="listing">
      <button className={`listing-save${isSaved ? ' on' : ''}`} onClick={() => toggleSave(p.slug, p.name)} aria-label={isSaved ? 'Remove from saved' : 'Save this place'}>
        {isSaved ? <HeartFill size={18} /> : <Heart size={18} />}
      </button>

      <Link to={`/property/${p.slug}`} className="listing-thumb" aria-label={p.name}>
        <span className="type-tag">{optionLabel('type', p.type)}</span>
        {p.beds_available === 0 && <span className="full-tag">Full</span>}
        <Art variant={p.art} />
      </Link>

      <div className="listing-body">
        <div className="listing-top">
          <div>
            <Link to={`/property/${p.slug}`}>
              <h3 className="listing-title">{p.name}</h3>
            </Link>
            <div className="listing-loc">
              <MapPin size={15} /> {p.sub_area.name} · {optionLabel('gender_policy', p.gender_policy)}
            </div>
            {p.nearest && (
              <div className="listing-loc">
                <Bus size={15} /> {p.nearest.minutes_auto} min by auto to {p.nearest.landmark}
              </div>
            )}
            <div className="badge-row">
              <VerificationBadge p={p} />
              {p.data_source === 'demo_seed' && <span className="badge badge-demo">Sample listing</span>}
            </div>
          </div>
          <RatingPill p={p} />
        </div>

        <div className="listing-facts">
          <span className="fact">
            <Wifi size={14} /> {p.wifi.speed_mbps} Mbps{p.wifi.free ? '' : ' · paid'}
          </span>
          <span className="fact">
            <Moon size={14} /> {curfew}
          </span>
          <span className="fact">
            <Utensils size={14} /> {optionLabel('food_included', p.food_included)}
          </span>
          <span className="fact">{p.room_types.map((r) => optionLabel('room_type', r)).join(' · ')}</span>
          {p.has_ac_rooms && <span className="fact">AC rooms</span>}
        </div>

        {p.top_reported_difference && (
          <div className="concern-line">
            <AlertTriangle size={15} />
            <span>
              {p.top_reported_difference}
              {p.reported_difference_count > 1 ? ` (+${p.reported_difference_count - 1} more)` : ''}
            </span>
          </div>
        )}

        <div className="listing-foot">
          <div>
            <div className="price">
              {inr(p.from_rent)} <small>/month per bed{p.rent_max > p.from_rent ? ' and up' : ''}</small>
            </div>
            <span className="tiny muted">
              Deposit {inr(p.security_deposit)} · {p.beds_available > 0 ? `${p.beds_available} beds free as last updated` : 'No free beds as last updated'}
            </span>
          </div>
          <div className="listing-actions">
            <button className={`btn btn-sm ${compare.includes(p.slug) ? 'btn-primary' : 'btn-outline'}`} onClick={() => toggleCompare(p.slug, p.name)}>
              <Scales size={16} /> {compare.includes(p.slug) ? 'In compare' : 'Compare'}
            </button>
            <Link to={`/property/${p.slug}`} className="btn btn-primary btn-sm">
              View place
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}

export const to12 = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return `${h % 12 === 0 ? 12 : h % 12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h >= 12 ? 'PM' : 'AM'}`
}
