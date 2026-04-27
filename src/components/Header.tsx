import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/',          label: '¿Qué es Infra.Coop?',  num: '04' },
  { to: '/brechas',   label: 'Monitor de Brechas',    num: '01' },
  { to: '/colectivo', label: 'Monitor Colectivo',     num: '02' },
  { to: '/datos',     label: '¿Qué datos queremos?',  num: '03' },
  { to: '/ingresar',  label: 'Ingresar datos',        num: '05' },
]

export function Header() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <NavLink to="/" className="site-logo" aria-label="Infra.Coop inicio">
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

      </div>
    </header>
  )
}

