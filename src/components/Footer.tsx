import { Link } from 'react-router-dom'
import DemoNotice from './DemoNotice'
import { useStore } from '../lib/store'

export default function Footer() {
  const { meta } = useStore()
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="logo">
              havenly <span className="spark">✦</span>
            </div>
            <p>
              A calmer way to find PGs, hostels and shared rentals when you move to a new city, with resident
              reviews, transparent costs, and clear labels on who said what.
            </p>
          </div>
          <div>
            <h5>Explore</h5>
            <Link to="/results?type=PG">PGs</Link>
            <Link to="/results?type=Hostel">Hostels</Link>
            <Link to="/results?type=Shared%20Rental">Shared rentals</Link>
            <Link to="/experiences">Resident experiences</Link>
          </div>
          <div>
            <h5>Platform</h5>
            <Link to="/about">How verification works</Link>
            <Link to="/requests">My booking requests</Link>
            <Link to="/saved">Your shortlist</Link>
            <Link to="/compare">Compare places</Link>
          </div>
          <div>
            <h5>Support</h5>
            <Link to="/about">Help centre</Link>
            <Link to="/about">Report a listing</Link>
            <Link to="/about">Safety guidelines</Link>
            <Link to="/about">Contact us</Link>
          </div>
        </div>
        <DemoNotice tone="dark" />
        <div className="footer-bottom">
          <span>© 2026 Havenly{meta ? ` · Now covering ${meta.active_area.name}, ${meta.active_area.district}` : ''}</span>
          <span>Havenly is an information & decision-support platform. It does not guarantee safety, and it never takes payment.</span>
        </div>
      </div>
    </footer>
  )
}
