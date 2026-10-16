import { Link } from 'react-router-dom'
import SearchBar from '../components/SearchBar'
import Art from '../components/Art'
import { RatingPill } from '../components/PropertyCard'
import { House, Building, Shield, Users, Heart, ArrowRight, Sparkle } from '../components/Icons'
import { api, inr } from '../lib/api'
import { useAsync, useStore } from '../lib/store'

const TYPES = [
  { to: '/results?type=PG', icon: House, title: 'PGs', sub: 'Meals and a warden, made simple', alt: false },
  { to: '/results?type=Hostel', icon: Building, title: 'Hostels', sub: 'Budget beds, clear rules', alt: true },
  { to: '/results?type=Shared%20Rental', icon: Users, title: 'Shared rentals', sub: 'Flat life with flatmates', alt: false },
]

export default function Home() {
  const { meta } = useStore()
  const top = useAsync(() => api.properties({ sort: 'rating', limit: '3', has_reviews: 'true' }), [])
  const quotes = useAsync(() => api.reviews({ sort: 'helpful', limit: 3 }), [])
  const example = meta?.example_searches[0]

  const steps = [
    {
      n: '01',
      title: 'Search your way',
      body: `Type what you want${example ? `, like “${example.toLowerCase()}”` : ''}. Havenly turns it into filters you can see and edit, and tells you what it can’t filter by.`,
    },
    {
      n: '02',
      title: 'See who said what',
      body: 'Every fact is labelled: listed by the owner, verified by Havenly, or reported by residents. Where residents disagree with a listing, we show both.',
    },
    {
      n: '03',
      title: 'Compare, then request',
      body: 'Compare up to three places side by side, then send a booking request with an itemised estimate. No payment is taken on Havenly.',
    },
  ]

  return (
    <>
      <section className="hero">
        <div className="hero-blob hero-blob-1" />
        <div className="hero-blob hero-blob-2" />
        <div className="hero-blob hero-blob-3" />
        <div className="container hero-inner">
          <div>
            <h1 className="display-xl">
              Find your
              <br />
              next stay,
              <br />
              <em>with confidence.</em>
            </h1>
            <p className="hero-sub">
              PGs, hostels and shared rentals for people moving to a new city. Read what residents actually experienced, see what’s been checked, and send a booking request
              when you’re ready.
            </p>
            <SearchBar />
          </div>
          <div className="hero-art">
            <div className="arch-frame">
              <Art variant="window" />
            </div>
          </div>
        </div>

        <div className="container">
          <div className="trust-strip">
            <div className="trust-item">
              <span className="trust-icon">
                <Shield size={22} />
              </span>
              <div>
                <b>Checked facts, clearly marked</b>
                <span>Owner-listed vs verified</span>
              </div>
            </div>
            <div className="trust-item">
              <span className="trust-icon">
                <Users size={22} />
              </span>
              <div>
                <b>Resident reviews</b>
                <span>Including what didn’t match</span>
              </div>
            </div>
            <div className="trust-item">
              <span className="trust-icon">
                <Heart size={22} />
              </span>
              <div>
                <b>Requests, not payments</b>
                <span>Pay only after you visit</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <div className="explore-band">
            <div>
              <span className="eyebrow">Start here</span>
              <h2 className="display-lg" style={{ marginTop: 8 }}>
                Explore
                <br />
                by type
              </h2>
              <p className="muted" style={{ margin: '10px 0 18px' }}>
                What are you looking for?
              </p>
              <ArrowRight size={38} style={{ color: 'var(--plum)' }} />
            </div>
            <div className="explore-cards">
              {TYPES.map(({ to, icon: Icon, title, sub, alt }) => (
                <Link key={title} to={to} className="explore-card">
                  <span className={`corner${alt ? ' alt' : ''}`} />
                  <div className="explore-icon">
                    <Icon size={40} />
                  </div>
                  <h3>{title}</h3>
                  <p>{sub}</p>
                  <span className="explore-arrow">
                    <ArrowRight size={17} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Rated by residents</span>
              <h2 className="display-lg">Highest rated in {meta?.active_area.name ?? 'the area'}</h2>
              <p>Ratings appear once a place has at least 3 reviews.</p>
            </div>
            <Link to="/results?sort=rating" className="btn btn-secondary">
              See all stays <ArrowRight size={16} />
            </Link>
          </div>
          <div className="explore-cards">
            {top.data?.results.map((p) => (
              <Link key={p.id} to={`/property/${p.slug}`} className="explore-card">
                <span className={`corner${p.type === 'Hostel' ? ' alt' : ''}`} />
                <div className="card-top-row">
                  <span className="badge badge-soft">{p.type}</span>
                  <RatingPill p={p} />
                </div>
                <h3 style={{ fontSize: '1.15rem' }}>{p.name}</h3>
                <p>
                  {p.sub_area.name} · from {inr(p.from_rent)}/mo
                </p>
                <span className="explore-arrow">
                  <ArrowRight size={17} />
                </span>
              </Link>
            ))}
            {top.loading && <p className="muted">Loading…</p>}
          </div>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">How it works</span>
              <h2 className="display-lg">Three steps to a better choice</h2>
            </div>
          </div>
          <div className="steps">
            {steps.map((s) => (
              <div className="step" key={s.n}>
                <div className="step-num">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="teaser">
            <div className="teaser-head">
              <div>
                <span className="eyebrow" style={{ color: 'var(--cream)' }}>
                  Experiences
                </span>
                <h2 className="display-lg" style={{ marginTop: 8 }}>
                  Real experiences. <Sparkle size={22} style={{ verticalAlign: 'middle' }} /> Better decisions.
                </h2>
                <p className="teaser-sub">The most helpful resident reviews, including the ones that point out what the listing doesn’t say.</p>
              </div>
              <Link to="/experiences" className="btn btn-cream">
                Read experiences <ArrowRight size={16} />
              </Link>
            </div>
            <div className="teaser-grid">
              {quotes.data?.results.map((q) => (
                <Link to={`/property/${q.property.slug}#${q.id}`} className="quote-card" key={q.id}>
                  <div className="stars" style={{ color: 'var(--cream)', marginBottom: 8 }} aria-label={`${q.overall_rating} out of 5`}>
                    {'★'.repeat(q.overall_rating)}
                    {'☆'.repeat(5 - q.overall_rating)}
                  </div>
                  <p>“{q.body.length > 220 ? `${q.body.slice(0, 217)}…` : q.body}”</p>
                  <div className="who">
                    <span className="dot">{q.display_name.split(' ').map((w) => w[0]).join('').slice(0, 2)}</span>
                    <div>
                      <b style={{ display: 'block' }}>{q.display_name}</b>
                      <span style={{ opacity: 0.8 }}>
                        {q.property.name} · {q.is_sample ? 'Sample review' : 'Resident'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-tight" style={{ paddingBottom: 80 }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className="display-lg">Ready to find your haven?</h2>
          <p className="muted" style={{ margin: '12px auto 26px', maxWidth: 520 }}>
            Tell us what matters to you, from budget and food to curfew and safety features, and we’ll show places that fit.
          </p>
          <Link to="/results" className="btn btn-primary btn-lg">
            <Sparkle size={18} /> Start your search
          </Link>
        </div>
      </section>
    </>
  )
}
