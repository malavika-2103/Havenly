import { Link } from 'react-router-dom'
import { Shield, Users, Eye, AlertTriangle, ArrowRight, Search as SearchIcon } from '../components/Icons'

const PILLARS = [
  {
    icon: Shield,
    title: 'Verified residents only',
    body: 'Reviewers prove they stayed at the exact property using redacted receipts or agreements. Evidence stays private, always — only the badge shows publicly.',
  },
  {
    icon: Eye,
    title: 'Three kinds of information',
    body: 'Every listing separates what the owner claims, what Havenly checked on-site, and what verified residents report — so you always know the basis of what you’re reading.',
  },
  {
    icon: AlertTriangle,
    title: 'Honest about gaps',
    body: 'When residents report a facility that doesn’t match the listing, we highlight it as a report — not a verdict — and the owner can respond with evidence.',
  },
]

const FAQS = [
  {
    q: 'Does Havenly take bookings or payments?',
    a: 'No payments, ever. You send a booking request with an itemised estimate. The owner accepts or declines, and if they accept you pay the property directly after visiting. A request never holds a bed until the owner accepts. In this demo, owner responses are simulated.',
  },
  {
    q: 'How does residence verification work?',
    a: 'A reviewer submits a redacted rent receipt, rental agreement, or payment record for a specific property. Our team checks name, property and dates while keeping the document private. Approval grants review permission for that property only.',
  },
  {
    q: 'Can property owners post reviews?',
    a: 'Owners can respond to reviews with evidence, but cannot write reviews for their own properties. AI-assisted moderation flags suspicious patterns — review bursts, duplicate text, same-device activity — for human moderators to investigate.',
  },
  {
    q: 'What does “platform verified” mean?',
    a: 'A Havenly team member visited and checked specific facts, such as the gate time, CCTV coverage or Wi-Fi speed. Each checked fact is labelled “Verified by Havenly” with its date. Everything else is labelled “Listed by owner”. A place is only called verified when its rules and safety facts have all been checked.',
  },
  {
    q: 'Is this real data?',
    a: 'Not yet. Every listing and review you see in this demo is a fictional sample, labelled as such. Real listings will be entered by our team after a site visit.',
  },
  {
    q: 'How are safety concerns handled?',
    a: 'We don’t give places a safety score. We list concrete features (CCTV, guards, a resident warden, distance to the main road) with their source, and publish residents’ safety experiences as personal accounts, never as findings about a property.',
  },
]

export default function About() {
  return (
    <>
      <div className="container">
        <div className="about-hero">
          <span className="eyebrow">About Havenly</span>
          <h1 className="display-xl" style={{ marginTop: 12 }}>
            A calmer way to find
            <br />
            your next home.
          </h1>
          <p className="muted" style={{ fontSize: '1.08rem', marginTop: 18 }}>
            Moving to a new city is hard enough without wondering if the PG you’re about to pay a deposit to is real.
            Havenly brings checked listings, honest resident experiences and side-by-side comparison into one calm place, starting with one neighbourhood and doing it properly.
          </p>
        </div>

        <section className="section-tight">
          <div className="pillars">
            {PILLARS.map(({ icon: Icon, title, body }) => (
              <div className="pillar" key={title}>
                <span className="p-icon">
                  <Icon size={26} />
                </span>
                <h3 style={{ fontSize: '1.2rem', marginBottom: 8 }}>{title}</h3>
                <p className="muted" style={{ fontSize: '0.93rem' }}>
                  {body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="section-tight">
          <div className="card card-pad" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 22, alignItems: 'center' }}>
            <span className="p-icon" style={{ margin: 0 }}>
              <Users size={26} />
            </span>
            <div>
              <h3 style={{ marginBottom: 6 }}>AI-assisted moderation, human decisions</h3>
              <p className="muted" style={{ fontSize: '0.93rem' }}>
                Our models help moderators spot duplicate reviews, suspicious rating patterns, and inconsistencies
                between listings and reports. They never declare a property fraudulent on their own — findings go to
                human moderators, and every action is evidence-based. Algorithms narrow the search; people make the
                call.
              </p>
            </div>
          </div>
        </section>

        <section className="section-tight">
          <div className="section-head" style={{ justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <span className="eyebrow">Questions, answered</span>
              <h2 className="display-lg">Frequently asked</h2>
            </div>
          </div>
          <div className="faq">
            {FAQS.map((f) => (
              <div className="faq-item" key={f.q}>
                <h4>{f.q}</h4>
                <p>{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section-tight" style={{ textAlign: 'center', paddingBottom: 40 }}>
          <h2 className="display-lg">Ready to explore?</h2>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
            <Link to="/results" className="btn btn-primary btn-lg">
              <SearchIcon size={18} /> Search stays
            </Link>
            <Link to="/experiences" className="btn btn-outline btn-lg">
              Read experiences <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
