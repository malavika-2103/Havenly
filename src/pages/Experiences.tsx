import { Link } from 'react-router-dom'
import { properties } from '../data/properties'
import { useStore } from '../lib/store'
import Art from '../components/Art'
import { Shield, StarFill, ArrowRight, Users } from '../components/Icons'

export default function Experiences() {
  const { toast } = useStore()
  const feed = properties
    .flatMap((p) => p.reviews.map((r) => ({ p, r })))
    .sort((a, b) => b.r.helpful - a.r.helpful)
    .slice(0, 10)

  return (
    <div className="container" style={{ padding: '44px 0 80px' }}>
      <div className="section-head">
        <div>
          <span className="eyebrow">Experiences</span>
          <h1 className="display-lg">What living there is really like</h1>
          <p>
            Every review below is from a woman who verified her stay with a redacted receipt or agreement — reviewed by
            moderators, never published with evidence attached.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => toast('Review flow: verify your stay first, then write')}>
          <Users size={16} /> Write a review
        </button>
      </div>

      <div className="exp-feed">
        {feed.map(({ p, r }, i) => (
          <article className="exp-item" key={i}>
            <div>
              <div className="meta">
                <span className="badge badge-soft">{p.type}</span>
                <Link to={`/property/${p.id}`} style={{ fontWeight: 800, color: 'var(--plum-ink)' }}>
                  {p.name}
                </Link>
                <span className="tiny muted">
                  {p.locality}, {p.city} · {r.month}
                </span>
                <span className="badge badge-verified">
                  <Shield size={12} /> Verified resident
                </span>
              </div>
              <h3 style={{ fontSize: '1.12rem', marginBottom: 6 }}>{r.title}</h3>
              <p className="muted" style={{ fontSize: '0.92rem', maxWidth: 760 }}>
                {r.body}
              </p>
              <div className="helpful-row">
                <span>
                  <StarFill size={13} style={{ color: 'var(--plum)', verticalAlign: -2 }} /> {r.rating}.0 ·{' '}
                  {r.stay} · found helpful by {r.helpful} residents
                </span>
              </div>
            </div>
            <Link
              to={`/property/${p.id}`}
              style={{ width: 150, height: 110, borderRadius: 16, overflow: 'hidden', flexShrink: 0 }}
            >
              <Art variant={p.art} />
            </Link>
          </article>
        ))}
      </div>

      <div className="card card-pad" style={{ marginTop: 30, textAlign: 'center' }}>
        <h3 style={{ marginBottom: 8 }}>Have you lived somewhere we should know about?</h3>
        <p className="muted" style={{ maxWidth: 540, margin: '0 auto 18px' }}>
          Submit a redacted rent receipt or rental agreement for a specific property — once verified, your review gets
          the “verified resident” badge that owners can’t buy.
        </p>
        <button className="btn btn-primary" onClick={() => toast('Verification starts from your profile → Review requests')}>
          Verify my stay <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
