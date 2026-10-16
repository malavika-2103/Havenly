import { Link } from 'react-router-dom'
import { properties } from '../data/properties'
import { useStore } from '../lib/store'
import PropertyCard from '../components/PropertyCard'
import { Heart, ArrowRight } from '../components/Icons'

export default function Saved() {
  const { saved, compare } = useStore()
  const list = properties.filter((p) => saved.includes(p.id))

  return (
    <div className="container" style={{ padding: '44px 0 80px' }}>
      <div className="section-head">
        <div>
          <span className="eyebrow">Your shortlist</span>
          <h1 className="display-lg">Saved places</h1>
          <p>
            {list.length} saved · {compare.length} in compare (up to 3)
          </p>
        </div>
        {compare.length >= 2 && (
          <Link to="/compare" className="btn btn-primary">
            Compare now <ArrowRight size={16} />
          </Link>
        )}
      </div>

      {list.length === 0 ? (
        <div className="empty-state">
          <Heart size={34} style={{ color: 'var(--mauve)' }} />
          <h3>Nothing saved yet</h3>
          <p className="muted">Tap the heart on any listing to keep it here for later.</p>
          <Link to="/results" className="btn btn-primary" style={{ marginTop: 18 }}>
            Explore stays <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        list.map((p) => <PropertyCard key={p.id} p={p} />)
      )}
    </div>
  )
}
