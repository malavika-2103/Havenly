import { Link } from 'react-router-dom'
import { properties, Property } from '../data/properties'
import { useStore } from '../lib/store'
import Art from '../components/Art'
import { Info, Shield, AlertTriangle, Scales, ArrowRight, StarFill } from '../components/Icons'

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`

export default function Compare() {
  const { compare, toggleCompare, clearCompare, saved, toggleSave } = useStore()
  const list = properties.filter((p) => compare.includes(p.id))

  if (list.length === 0) {
    return (
      <div className="container" style={{ padding: '44px 0 80px' }}>
        <h1 className="display-lg">Compare places</h1>
        <div className="empty-state" style={{ marginTop: 26 }}>
          <Scales size={34} style={{ color: 'var(--mauve)' }} />
          <h3>Add places to compare</h3>
          <p className="muted">Use the “Compare” button on any listing — you can compare up to three places side by side.</p>
          <Link to="/results" className="btn btn-primary" style={{ marginTop: 18 }}>
            Find places to compare <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    )
  }

  // rows definition: label, getter, whether lower is better
  const rows: { label: string; get: (p: Property) => string; best?: 'low' | 'high'; num?: (p: Property) => number }[] = [
    { label: 'Rent / month', get: (p) => inr(p.rent), best: 'low', num: (p) => p.rent },
    { label: 'Deposit', get: (p) => inr(p.deposit), best: 'low', num: (p) => p.deposit },
    { label: 'Type', get: (p) => p.type },
    { label: 'Resident rating', get: (p) => `${p.rating.toFixed(1)} ★ (${p.reviewCount})`, best: 'high', num: (p) => p.rating },
    { label: 'Food', get: (p) => `${p.food} · ${p.foodType.split(',')[0]}` },
    { label: 'Curfew', get: (p) => (p.curfew === 'Fixed' ? `Fixed · ${p.curfewTime?.match(/\d+\s?PM/)?.[0] ?? ''}` : p.curfew) },
    { label: 'WiFi', get: (p) => `${p.wifi} · ${p.wifiSpeed.split(',')[0]}` },
    { label: 'Cleaning', get: (p) => p.cleaning },
    { label: 'Garbage disposal', get: (p) => p.garbage },
    { label: 'Power backup', get: (p) => (p.powerBackup ? 'Yes' : 'No') },
    { label: 'Security', get: (p) => p.security.split(',')[0] },
    { label: 'Distance', get: (p) => p.distance },
    {
      label: 'Platform verification',
      get: (p) => (p.verified ? `Verified ${p.verifiedOn}` : 'Pending'),
    },
    { label: 'Reported concerns', get: (p) => (p.concerns.length ? `${p.concerns.length} noted` : 'None reported') },
  ]

  const bestIndex = (row: (typeof rows)[0]) => {
    if (!row.best || !row.num || list.length < 2) return -1
    const values = list.map(row.num)
    const target = row.best === 'low' ? Math.min(...values) : Math.max(...values)
    return values.indexOf(target)
  }

  return (
    <div className="container" style={{ padding: '44px 0 80px' }}>
      <div className="section-head">
        <div>
          <span className="eyebrow">Side by side</span>
          <h1 className="display-lg">Compare places</h1>
          <p>Comparing {list.length} of 3 places · “Best” marks the strongest value on each row</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline btn-sm" onClick={clearCompare}>
            Clear all
          </button>
          <Link to="/results" className="btn btn-secondary btn-sm">
            Add more places
          </Link>
        </div>
      </div>

      <div className="compare-wrap card" style={{ padding: '0 4px' }}>
        <table className="compare-table">
          <thead>
            <tr>
              <th className="row-label" />
              {list.map((p) => (
                <th key={p.id} className="compare-card-head">
                  <div className="art" style={{ height: 110 }}>
                    <Art variant={p.art} />
                  </div>
                  <Link to={`/property/${p.id}`}>
                    <b style={{ color: 'var(--plum-ink)', fontSize: '1.02rem' }}>{p.name}</b>
                  </Link>
                  <div className="tiny muted" style={{ marginTop: 2 }}>
                    {p.locality}, {p.city}
                  </div>
                  <button
                    className="link-btn"
                    style={{ marginTop: 8 }}
                    onClick={() => toggleCompare(p.id, p.name)}
                  >
                    Remove
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const best = bestIndex(row)
              return (
                <tr key={row.label}>
                  <td className="row-label">{row.label}</td>
                  {list.map((p, i) => (
                    <td key={p.id}>
                      {row.get(p)}
                      {i === best && list.length >= 2 && <span className="compare-best">Best</span>}
                      {row.label === 'Platform verification' && (
                        <div style={{ marginTop: 6 }}>
                          {p.verified ? (
                            <span className="badge badge-verified">
                              <Shield size={12} /> Verified
                            </span>
                          ) : (
                            <span className="badge badge-warn">
                              <AlertTriangle size={12} /> Pending
                            </span>
                          )}
                        </div>
                      )}
                      {row.label === 'Resident rating' && (
                        <div style={{ marginTop: 4, fontSize: '0.8rem', color: 'var(--plum)' }}>
                          <StarFill size={12} style={{ verticalAlign: -2 }} /> by verified residents only
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              )
            })}
            <tr>
              <td className="row-label">Actions</td>
              {list.map((p) => (
                <td key={p.id}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Link to={`/property/${p.id}`} className="btn btn-primary btn-sm">
                      View place
                    </Link>
                    <button className="btn btn-outline btn-sm" onClick={() => toggleSave(p.id, p.name)}>
                      {saved.includes(p.id) ? 'Saved ✓' : 'Save'}
                    </button>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="cost-note" style={{ marginTop: 18 }}>
        <Info size={15} />
        <span>
          Comparison reflects listing data plus verified resident reports. Differences in “reported concerns” often tell
          you more than star ratings do.
        </span>
      </div>
    </div>
  )
}
