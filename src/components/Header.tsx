import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/', label: '¿Qué es Infra.Coop?' },
  { to: '/brechas', label: 'Monitor de Brechas' },
  { to: '/colectivo', label: 'Monitor Colectivo' },
  { to: '/datos', label: '¿Qué datos queremos?' },
]

export function Header() {
  return (
    <header style={{
      borderBottom: '1px solid var(--ink-faint)',
      padding: '0 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '60px',
      background: 'var(--paper)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      gap: '1rem',
    }}>
      <NavLink to="/" style={{ display: 'flex', alignItems: 'baseline', gap: '2px', textDecoration: 'none' }}>
        <span style={{ fontFamily: 'var(--serif)', fontSize: '22px', color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1 }}>
          Infra.Coop
        </span>
        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', margin: '0 1px 4px' }} />
      </NavLink>

      <nav style={{ display: 'flex', gap: 0, alignItems: 'stretch', overflowX: 'auto' }}>
        {NAV_ITEMS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-pill${isActive ? ' active' : ''}`}
            style={{
              fontSize: '12px',
              fontWeight: 400,
              fontFamily: 'var(--sans)',
              padding: '0 14px',
              height: '60px',
              border: 'none',
              borderBottom: '2px solid transparent',
              cursor: 'pointer',
              background: 'transparent',
              color: 'var(--ink-light)',
              letterSpacing: '0.01em',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
            }}
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <span className="label-mono" style={{ flexShrink: 0 }}>Mozilla Fellowship 2024–26</span>
    </header>
  )
}
