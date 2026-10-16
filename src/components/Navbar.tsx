import { NavLink, Link } from 'react-router-dom'
import { Search } from './Icons'
import { useStore } from '../lib/store'

export default function Navbar() {
  const { saved, compare } = useStore()

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="logo">
          havenly <span className="spark">✦</span>
        </Link>

        <nav className="nav-links">
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Home
          </NavLink>
          <NavLink to="/experiences" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Experiences
          </NavLink>
          <NavLink to="/saved" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Saved
            {saved.length > 0 && <span className="nav-count">{saved.length}</span>}
          </NavLink>
          <NavLink to="/compare" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Compare
            {compare.length > 0 && <span className="nav-count">{compare.length}</span>}
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            About
          </NavLink>
        </nav>

        <div className="nav-actions">
          <Link to="/results" className="icon-btn" aria-label="Search stays">
            <Search />
          </Link>
          <span className="nav-divider" />
          <button className="avatar-btn" title="Your profile">
            A
          </button>
        </div>
      </div>
    </header>
  )
}
