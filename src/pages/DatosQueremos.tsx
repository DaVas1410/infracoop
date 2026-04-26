import { Layout } from '../components/Layout'

export function DatosQueremos() {
  return (
    <Layout>
      <div className="hero">
        <p className="hero-eyebrow">¿Qué datos queremos?</p>
        <h1>Los datos que <em>necesitamos</em></h1>
        <p className="hero-sub">Datos más buscados, brechas por agenda, y datos existentes con calidad insuficiente.</p>
      </div>
      <p style={{ color: 'var(--ink-light)', fontFamily: 'var(--mono)', fontSize: '13px' }}>
        — Análisis de demanda: próximamente (Épica 4) —
      </p>
    </Layout>
  )
}
