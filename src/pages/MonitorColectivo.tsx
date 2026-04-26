import { Layout } from '../components/Layout'

export function MonitorColectivo() {
  return (
    <Layout>
      <div className="hero">
        <p className="hero-eyebrow">Monitor Colectivo</p>
        <h1>El mapa <em>colectivo</em> de brechas</h1>
        <p className="hero-sub">Visualizaciones de brechas por agenda, evolución temporal y distribución geográfica.</p>
      </div>
      <p style={{ color: 'var(--ink-light)', fontFamily: 'var(--mono)', fontSize: '13px' }}>
        — Visualizaciones: próximamente (Épica 3) —
      </p>
    </Layout>
  )
}
