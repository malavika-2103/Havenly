import { Link } from 'react-router-dom'
import SearchBar from '../components/SearchBar'
import Art from '../components/Art'
import { House, Building, Shield, Users, Heart, ArrowRight, Sparkle, StarFill } from '../components/Icons'
import { properties } from '../data/properties'

const TYPES = [
  {
    to: '/results?type=PG',
    icon: House,
    title: 'PGs',
    sub: 'Homely stays, made easy',
    alt: false,
  },
  {
    to: '/results?type=Hostel',
    icon: Building,
    title: 'Hostels',
    sub: 'A safe space, always',
    alt: true,
  },
  {
    to: '/results?type=Shared%20Rental',
    icon: Users,
    title: 'Shared Rentals',
    sub: 'Live together, better',
    alt: false,
  },
]

const STEPS = [
  {
    n: '01',
    title: 'Search your way',
    body: 'Type what you actually want — “women’s PG near Infopark under 9000 with food” — and Havenly reads the intent, not just keywords.',
  },
  {
    n: '02',
    title: 'See what’s verified',
    body: 'Every property separates what the owner claims, what Havenly checked, and what verified residents actually experienced — including the gaps.',
  },
  {
    n: '03',
    title: 'Shortlist & decide',
    body: 'Save your favourites and compare up to three places side by side on rent, curfew, food, safety and real resident ratings.',
  },
]

const QUOTES = [
  {
    text: 'The hot-water timing on the listing was wrong, and three resident reviews said so before I ever paid a visit. That’s the part no other site showed me.',
    who: 'Priyanka M.',
    stay: 'Willow House, Chittethukara',
  },
  {
    text: 'I compared a ₹8.5k hostel and a ₹16k PG side by side — curfew, food, power backup, all of it in one table. Finally chose with my eyes open.',
    who: 'Lakshmi V.',
    stay: 'Student, Thrikkakara',
  },
  {
    text: 'Reviews here are from people who actually stayed. You can feel the difference in the detail — they mention the caretaker’s name, not just “nice place”.',
    who: 'Aditi W.',
    stay: 'Casa Amor, Edachira',
  },
]

export default function Home() {
  const topRated = [...properties].sort((a, b) => b.rating - a.rating).slice(0, 3)

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
              perfect stay,
              <br />
              <em>with confidence.</em>
            </h1>
            <p className="hero-sub">
              Discover verified PGs and hostels, read real experiences from women who’ve actually lived there, and
              choose a safe, comfortable home away from home.
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
                <b>Verified Listings</b>
                <span>Know it’s legit</span>
              </div>
            </div>
            <div className="trust-item">
              <span className="trust-icon">
                <Users size={22} />
              </span>
              <div>
                <b>Real Resident Reviews</b>
                <span>Hear from women like you</span>
              </div>
            </div>
            <div className="trust-item">
              <span className="trust-icon">
                <Heart size={22} />
              </span>
              <div>
                <b>Personalized for You</b>
                <span>Find what fits your needs</span>
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
              <span className="eyebrow">Loved by residents</span>
              <h2 className="display-lg">Top-rated near you</h2>
              <p>Highest-rated by verified residents this month</p>
            </div>
            <Link to="/results" className="btn btn-secondary">
              See all stays <ArrowRight size={16} />
            </Link>
          </div>

          <div className="explore-cards">
            {topRated.map((p) => (
              <Link key={p.id} to={`/property/${p.id}`} className="explore-card">
                <span className={`corner${p.type === 'Hostel' ? ' alt' : ''}`} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span className="badge badge-soft">{p.type}</span>
                  <span className="rating-pill">
                    <StarFill size={13} /> {p.rating.toFixed(1)}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.15rem' }}>{p.name}</h3>
                <p>
                  {p.locality}, {p.city} · from ₹{p.rent.toLocaleString('en-IN')}/mo
                </p>
                <span className="explore-arrow">
                  <ArrowRight size={17} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">How it works</span>
              <h2 className="display-lg">Three steps to a safer choice</h2>
            </div>
          </div>
          <div className="steps">
            {STEPS.map((s) => (
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <span className="eyebrow" style={{ color: 'var(--cream)' }}>
                  Experiences
                </span>
                <h2 className="display-lg" style={{ marginTop: 8 }}>
                  Real experiences. <Sparkle size={22} style={{ verticalAlign: 'middle' }} /> Better decisions.
                </h2>
                <p style={{ marginTop: 10, maxWidth: 540, color: '#e9d3c7' }}>
                  Every review comes from a woman who proved she actually stayed there — no fake ratings, no owner
                  self-promotion, no opinions from people who never walked through the door.
                </p>
              </div>
              <Link to="/experiences" className="btn" style={{ background: 'var(--cream)', color: 'var(--plum)' }}>
                Explore Experiences <ArrowRight size={16} />
              </Link>
            </div>
            <div className="teaser-grid">
              {QUOTES.map((q) => (
                <div className="quote-card" key={q.who}>
                  <div className="stars" style={{ color: 'var(--cream)', marginBottom: 8 }}>
                    ★★★★★
                  </div>
                  <p>“{q.text}”</p>
                  <div className="who">
                    <span className="dot">{q.who.split(' ').map((w) => w[0]).join('')}</span>
                    <div>
                      <b style={{ display: 'block' }}>{q.who}</b>
                      <span style={{ opacity: 0.75 }}>{q.stay}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-tight" style={{ paddingBottom: 80 }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className="display-lg">Ready to find your haven?</h2>
          <p className="muted" style={{ margin: '12px auto 26px', maxWidth: 520 }}>
            Tell us what matters to you — budget, food, curfew, safety — and we’ll help you find places that actually
            fit.
          </p>
          <Link to="/results" className="btn btn-primary btn-lg">
            <Sparkle size={18} /> Start your search
          </Link>
        </div>
      </section>
    </>
  )
}
