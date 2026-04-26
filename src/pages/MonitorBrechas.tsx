import { Layout } from '../components/Layout'

export function MonitorBrechas() {
  return (
    <Layout>
      <div className="hero">
        <p className="hero-eyebrow">Monitor de Brechas</p>
        <h1>¿Qué datos <em>faltan</em>?</h1>
        <p className="hero-sub">Buscá brechas de datos de género en América Latina.</p>
      </div>
      <p style={{ color: 'var(--ink-light)', fontFamily: 'var(--mono)', fontSize: '13px' }}>
        — Motor de búsqueda: próximamente (Épica 2) —
      </p>
    </Layout>
  )
}
