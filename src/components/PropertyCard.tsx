import { Link } from 'react-router-dom'
import { Property } from '../data/properties'
import { useStore } from '../lib/store'
import Art from './Art'
import { Heart, HeartFill, Scales, MapPin, Wifi, Moon, Utensils, StarFill, Shield, AlertTriangle } from './Icons'

export default function PropertyCard({ p }: { p: Property }) {
  const { saved, compare, toggleSave, toggleCompare } = useStore()

  return (
    <article className="listing">
      <button
        className={`listing-save${saved.includes(p.id) ? ' on' : ''}`}
        onClick={() => toggleSave(p.id, p.name)}
        aria-label={saved.includes(p.id) ? 'Remove from saved' : 'Save this place'}
      >
        {saved.includes(p.id) ? <HeartFill size={18} /> : <Heart size={18} />}
      </button>

      <Link to={`/property/${p.id}`} className="listing-thumb">
        <span className="type-tag">{p.type}</span>
        <Art variant={p.art} />
      </Link>

      <div className="listing-body">
        <div className="listing-top">
          <div>
            <Link to={`/property/${p.id}`}>
              <h3 className="listing-title">{p.name}</h3>
            </Link>
            <div className="listing-loc">
              <MapPin size={15} /> {p.locality}, {p.city} · {p.distance}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              {p.verified ? (
                <span className="badge badge-verified">
                  <Shield size={13} /> Platform verified · {p.verifiedOn}
                </span>
              ) : (
                <span className="badge badge-warn">
                  <AlertTriangle size={13} /> Verification pending
                </span>
              )}
              <span className="badge badge-resident">{p.reviewCount} resident reviews</span>
            </div>
          </div>
          <span className="rating-pill">
            <StarFill size={14} /> {p.rating.toFixed(1)}
          </span>
        </div>

        <div className="listing-facts">
          <span className="fact">
            <Wifi size={14} /> WiFi: {p.wifi}
          </span>
          <span className="fact">
            <Moon size={14} /> {p.curfew === 'Fixed' ? `Curfew ${p.curfewTime?.match(/\d+\s?PM/)?.[0] ?? 'fixed'}` : p.curfew === 'No curfew' ? 'No curfew' : 'Flexible curfew'}
          </span>
          <span className="fact">
            <Utensils size={14} /> Food {p.food.toLowerCase()}
          </span>
          <span className="fact">{p.roomTypes[0]}</span>
          {p.ac && <span className="fact">AC available</span>}
        </div>

        {p.concerns.length > 0 && (
          <div className="concern-line">
            <AlertTriangle size={15} />
            <span>{p.concerns[0].title}</span>
          </div>
        )}

        <div className="listing-foot">
          <div>
            <div className="price">
              ₹{p.rent.toLocaleString('en-IN')} <small>/month</small>
            </div>
            <span className="tiny muted">Deposit ₹{p.deposit.toLocaleString('en-IN')} · {p.food === 'Included' ? 'food included' : 'food extra'}</span>
          </div>
          <div className="listing-actions">
            <button
              className={`btn btn-sm ${compare.includes(p.id) ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => toggleCompare(p.id, p.name)}
            >
              <Scales size={16} /> {compare.includes(p.id) ? 'In compare' : 'Compare'}
            </button>
            <Link to={`/property/${p.id}`} className="btn btn-primary btn-sm">
              View place
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}
