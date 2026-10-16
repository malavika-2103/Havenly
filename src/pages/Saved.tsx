import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAsync, useStore } from '../lib/store'
import PropertyCard from '../components/PropertyCard'
import { Loading, ErrorState, Empty } from '../components/States'
import { Heart, ArrowRight } from '../components/Icons'

export default function Saved() {
  const { saved, compare, user } = useStore()
  // Re-fetch when the saved set changes so un-saving from a card removes it here.
  const list = useAsync(() => (user ? api.saved() : Promise.resolve({ results: [] })), [user?.id, saved.join(',')])
  const items = (list.data?.results ?? []).filter((p) => saved.includes(p.slug))

  return (
    <div className="container page-pad">
      <div className="section-head">
        <div>
          <span className="eyebrow">Your shortlist</span>
          <h1 className="display-lg">Saved places</h1>
          <p>
            {items.length} saved · {compare.length} of 3 in compare · saved to your account
          </p>
        </div>
        {compare.length >= 2 && (
          <Link to="/compare" className="btn btn-primary">
            Compare now <ArrowRight size={16} />
          </Link>
        )}
      </div>
      {list.loading && !list.data && <Loading />}
      {list.error && <ErrorState error={list.error} onRetry={list.reload} />}
      {list.data && items.length === 0 && (
        <Empty title="Nothing saved yet" icon={<Heart size={30} style={{ color: 'var(--mauve)' }} />}>
          <p className="muted">Tap the heart on any listing to keep it here.</p>
          <Link to="/results" className="btn btn-primary" style={{ marginTop: 18 }}>
            Explore stays <ArrowRight size={16} />
          </Link>
        </Empty>
      )}
      {items.map((p) => (
        <PropertyCard key={p.id} p={p} />
      ))}
    </div>
  )
}
