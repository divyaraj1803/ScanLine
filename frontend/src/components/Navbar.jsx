import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="site-header">
      <div className="nav-inner">
        <NavLink to="/" className="brand">
          <span><span className="brand-dot" />SCANLINE</span>
          <span className="brand-sub">IMAGE FORENSICS • v2.0</span>
        </NavLink>

        <ul className="nav-links">
          {[
            { to: '/',        icon: 'fa-radar',            label: 'Scanner' },
            { to: '/history', icon: 'fa-clock-rotate-left', label: 'History' },
            { to: '/models',  icon: 'fa-microchip',         label: 'Models' },
            { to: '/batch',   icon: 'fa-layer-group',       label: 'Batch & API' },
            { to: '/about',   icon: 'fa-shield-halved',     label: 'FAQ' },
          ].map(({ to, icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                end={to === '/'}
              >
                <i className={`fa-solid ${icon}`} />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div>
          {user ? (
            <span className="nav-user-chip">
              <i className="fa-solid fa-circle-user" />
              {user.username}
              <button
                onClick={() => { logout(); navigate('/') }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: '0.85rem', padding: '0 0.2rem' }}
                title="Logout"
              >
                <i className="fa-solid fa-arrow-right-from-bracket" />
              </button>
            </span>
          ) : (
            <NavLink to="/login" className="nav-auth-btn">
              <i className="fa-solid fa-right-to-bracket" /> Sign In
            </NavLink>
          )}
        </div>
      </div>
    </header>
  )
}
