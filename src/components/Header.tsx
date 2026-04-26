import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/',          label: '¿Qué es Infra.Coop?',  num: '04' },
  { to: '/brechas',   label: 'Monitor de Brechas',    num: '01' },
  { to: '/colectivo', label: 'Monitor Colectivo',     num: '02' },
  { to: '/datos',     label: '¿Qué datos queremos?',  num: '03' },
]

export function Header() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <NavLink to="/" className="site-logo" aria-label="Infra.Coop inicio">
          <LogoMark />
          <div className="site-logo-text">
            <div className="site-logo-name">
              Infra<span style={{ color: 'var(--accent)' }}>.</span>Coop
            </div>
            <div className="site-logo-sub">Motor de brechas · v0.4</div>
          </div>
        </NavLink>

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

        <div className="site-header-meta">
          <span className="site-header-dot" />
          42 datasets · 35 normativas · ALyC
        </div>
      </div>
    </header>
  )
}

function LogoMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 36 36" aria-hidden="true" style={{ flexShrink: 0 }}>
      <rect x="0.5" y="0.5" width="35" height="35" rx="9" fill="#F5F0FF" stroke="#6C3FA0" strokeOpacity=".35" />
      <rect x="9"  y="9"  width="5" height="18" fill="#6C3FA0" />
      <rect x="22" y="9"  width="5" height="18" fill="#1A0A2E" />
      <path d="M14 18 L22 12 L22 24 Z" fill="#FAF7F2" stroke="#6C3FA0" strokeWidth="1" />
    </svg>
  )
}
