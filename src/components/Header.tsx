import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { to: '/',          label: '¿Qué es Infra.Coop?',  num: '01' },
  { to: '/brechas',   label: 'Monitor de Brechas',    num: '02' },
  { to: '/colectivo', label: 'Monitor Colectivo',     num: '03' },
  { to: '/datos',     label: '¿Qué datos queremos?',  num: '04' },
  { to: '/ingresar',  label: 'Ingresar datos',        num: '05' },
]

export function Header() {
  const { user, signOut } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const closeDrawer = () => setDrawerOpen(false)

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <NavLink to="/" className="site-logo" aria-label="Infra.Coop inicio" onClick={closeDrawer}>
          <div className="site-logo-text">
            <div className="site-logo-name">
              Infra<span style={{ color: 'var(--accent)' }}>.</span>Coop
            </div>
            <div className="site-logo-sub" aria-hidden="true">Motor de brechas · v0.4</div>
          </div>
        </NavLink>

        {/* Desktop nav pills */}
        <nav className="site-nav" aria-label="Navegación principal">
          {NAV_ITEMS.map(({ to, label, num }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-pill${isActive ? ' active' : ''}`}
            >
              <span className="nav-pill-num">{num}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }} className="site-header-user">
            <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--ink-light)' }}>
              {user.email}
            </span>
            <button
              onClick={signOut}
              style={{
                fontFamily: 'var(--mono)',
                fontSize: '11px',
                padding: '2px 8px',
                border: '1px solid var(--ink-light)',
                background: 'transparent',
                cursor: 'pointer',
                borderRadius: '3px',
                color: 'var(--ink)',
              }}
            >
              Salir
            </button>
          </div>
        )}

        {/* Mobile hamburger toggle */}
        <button
          className="nav-toggle"
          aria-label={drawerOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(o => !o)}
        >
          {drawerOpen ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="2" y1="2" x2="16" y2="16"/>
              <line x1="16" y1="2" x2="2" y2="16"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="2" y1="5" x2="16" y2="5"/>
              <line x1="2" y1="9" x2="16" y2="9"/>
              <line x1="2" y1="13" x2="16" y2="13"/>
            </svg>
          )}
        </button>
      </div>

      {/* Overlay */}
      {drawerOpen && (
        <div className="nav-drawer-overlay" onClick={closeDrawer} aria-hidden="true" />
      )}

      {/* Slide-in drawer */}
      <nav className={`nav-drawer${drawerOpen ? ' open' : ''}`} aria-label="Navegación móvil">
        {NAV_ITEMS.map(({ to, label, num }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-drawer-item${isActive ? ' active' : ''}`}
            onClick={closeDrawer}
          >
            <span className="nav-drawer-num">{num}</span>
            {label}
          </NavLink>
        ))}

        <div className="nav-drawer-footer">
          <span>Motor de brechas · v0.4</span>
          {user && (
            <>
              <span>{user.email}</span>
              <button
                onClick={() => { signOut(); closeDrawer() }}
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: '11px',
                  padding: '4px 10px',
                  border: '1px solid var(--ink-light)',
                  background: 'transparent',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  color: 'var(--ink)',
                  alignSelf: 'flex-start',
                }}
              >
                Salir
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
