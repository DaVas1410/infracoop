import { Layout } from '../components/Layout'
import { useMonitorData } from '../hooks/useMonitorData'
import type { AgendaMonitor, MapaTopic } from '../data/monitorData'

function AgendaCard({ agenda }: { agenda: AgendaMonitor }) {
  const maxCount = Math.max(...agenda.topicos.map(t => t.count))
  return (
    <div className="agenda-monitor-card" style={{ borderTopColor: agenda.barColor }}>
      <div className="agenda-monitor-eyebrow" style={{ color: agenda.color }}>
        {agenda.label}
      </div>
      <div className="agenda-monitor-total" style={{ color: agenda.color }}>
        {agenda.total}
      </div>
      <div className="agenda-monitor-label">
        preguntas · +{agenda.preguntas_semana} esta semana
      </div>
      <div className="agenda-topic-list">
        {agenda.topicos.map(t => (
          <div key={t.nombre} className="agenda-topic-row">
            <span className="agenda-topic-name">{t.nombre}</span>
            <div className="agenda-topic-bar-wrap">
              <div
                className="agenda-topic-bar-fill"
                style={{
                  width: `${Math.round((t.count / maxCount) * 100)}%`,
                  background: agenda.barColor,
                }}
              />
            </div>
            <span className="agenda-topic-count">{t.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MapaCard({ topic, maxTotal }: { topic: MapaTopic; maxTotal: number }) {
  const cat = topic.score >= 0.75 ? 'critica' : topic.score >= 0.5 ? 'parcial' : 'cubierta'
  const colors = {
    critica: 'var(--gap-crit)',
    parcial: 'var(--gap-part)',
    cubierta: 'var(--gap-cov)',
  }
  const color = colors[cat]
  return (
    <div className="mapa-card">
      <div className="mapa-card-topic">{topic.topic}</div>
      <div className="mapa-card-count" style={{ color }}>{topic.total}</div>
      <div className="mapa-card-label">preguntas sin respuesta completa</div>
      <div className="mapa-mini-bar">
        <div
          className="mapa-mini-fill"
          style={{ width: `${Math.round((topic.total / maxTotal) * 100)}%`, background: color }}
        />
      </div>
      <div className="mapa-card-breakdown">
        <span style={{ color: 'var(--gap-crit)' }}>{topic.criticas} críticas</span>
        <span style={{ color: 'var(--gap-part)' }}>{topic.parciales} parciales</span>
        <span style={{ color: 'var(--gap-cov)' }}>{topic.cubiertas} cubiertas</span>
      </div>
    </div>
  )
}

export function MonitorColectivo() {
  const { agendas, topics, totalPreguntas, isReady, error } = useMonitorData()
  const maxTotal = Math.max(...topics.map(t => t.total))

  return (
    <Layout>
      <main className="monitor-page">
        <div className="hero">
          <p className="hero-eyebrow">Monitor Colectivo</p>
          <h1>El mapa <em>colectivo</em> de brechas</h1>
          <p className="hero-sub">
            {isReady
              ? `${totalPreguntas} preguntas ingresadas · distribución por agenda y tópico`
              : 'Cargando datos…'}
          </p>
        </div>

        {error && (
          <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--warn)', marginBottom: '1rem' }}>
            {error}
          </p>
        )}

        <div className="monitor-grid">
          {agendas.map(a => <AgendaCard key={a.id} agenda={a} />)}
        </div>

        <p className="mapa-section-title">Mapa de tópicos</p>
        <div className="mapa-grid">
          {topics.map(t => <MapaCard key={t.topic} topic={t} maxTotal={maxTotal} />)}
        </div>
      </main>
    </Layout>
  )
}
