import { NavLink, Link, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { Search } from './Icons'
import { useStore } from '../lib/store'

const LINKS = [
  ['/experiences', 'Experiences'],
  ['/saved', 'Saved'],
  ['/compare', 'Compare'],
  ['/about', 'About'],
] as const

export default function Navbar() {
  const { saved, compare, user, resetUser } = useStore()
  const [menu, setMenu] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const location = useLocation()
  useEffect(() => setMenu(false), [location.pathname])
  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setMenu(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])
  const count = (to: string) => (to === '/saved' ? saved.length : to === '/compare' ? compare.length : 0)

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="logo">
          havenly <span className="spark">✦</span>
        </Link>

        <nav className="nav-links" aria-label="Main">
          {LINKS.map(([to, label]) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              {label}
              {count(to) > 0 && <span className="nav-count">{count(to)}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="nav-actions" ref={ref}>
          <Link to="/results" className="icon-btn" aria-label="Search stays">
            <Search />
          </Link>
          <span className="nav-divider" />
          <button className="avatar-btn" title="Your account" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
            {user?.display_name[0] ?? '·'}
          </button>
          {menu && (
            <div className="profile-menu" role="menu">
              <div className="profile-who">
                Signed in as <b>{user?.display_name ?? '…'}</b>
                <span className="tiny muted">Demo account</span>
              </div>
              <Link role="menuitem" to="/requests">
                My booking requests
              </Link>
              {LINKS.map(([to, label]) => (
                <Link role="menuitem" key={to} to={to} className="menu-mobile-only">
                  {label}
                  {count(to) > 0 ? ` (${count(to)})` : ''}
                </Link>
              ))}
              <Link role="menuitem" to="/admin">
                Admin (demo)
              </Link>
              <button role="menuitem" onClick={() => resetUser()}>
                Start a fresh demo session
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
