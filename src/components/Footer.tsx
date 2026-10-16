import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="logo">
              havenly <span className="spark">✦</span>
            </div>
            <p>
              A calmer way for women to find PGs, hostels and shared rentals — with verified resident reviews,
              transparent costs, and honest info about what a place is really like.
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
            <Link to="/about">AI-assisted moderation</Link>
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
        <div className="footer-bottom">
          <span>© 2026 Havenly · Made with care for women on the move</span>
          <span>Havenly is an information & decision-support platform — not a booking guarantee of safety.</span>
        </div>
      </div>
    </footer>
  )
}
