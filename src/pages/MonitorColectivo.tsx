import { Layout } from '../components/Layout'
import { useMonitorStats } from '../hooks/useMonitorStats'
import type { AgendaStat, TopicStat } from '../types'

function AgendaCard({ a }: { a: AgendaStat }) {
  const totalCalidad = a.calidad_dist.Completa + a.calidad_dist.Parcial + a.calidad_dist.Nula || 1
  const pct = (n: number) => `${Math.round((n / totalCalidad) * 100)}%`

  return (
    <div className="agenda-monitor-card" style={{ borderTopColor: a.barColor }}>
      <div className="agenda-monitor-eyebrow" style={{ color: a.color }}>{a.label}</div>

      <div className="agenda-monitor-total" style={{ color: a.color }}>{a.datasets_en_agenda}</div>
      <div className="agenda-monitor-label">datasets disponibles en esta agenda</div>

      <div className="calidad-bar">
        <div className="calidad-segment" style={{ width: pct(a.calidad_dist.Completa), background: 'var(--gap-cov)' }} />
        <div className="calidad-segment" style={{ width: pct(a.calidad_dist.Parcial),  background: 'var(--gap-part)' }} />
        <div className="calidad-segment" style={{ width: pct(a.calidad_dist.Nula),     background: 'var(--ink-faint)' }} />
      </div>
      <div className="calidad-legend">
        <span><span className="calidad-dot" style={{ background: 'var(--gap-cov)' }} />{a.calidad_dist.Completa} completos</span>
        <span><span className="calidad-dot" style={{ background: 'var(--gap-part)' }} />{a.calidad_dist.Parcial} parciales</span>
        <span><span className="calidad-dot" style={{ background: 'var(--ink-light)' }} />{a.calidad_dist.Nula} nulos</span>
      </div>

      {a.top_subtemas.length > 0 && (
        <div className="agenda-topic-list" style={{ marginTop: 12 }}>
          {a.top_subtemas.map(t => (
            <div key={t.subtema} className="agenda-topic-row">
              <span className="agenda-topic-name">{t.subtema}</span>
              <span className="agenda-topic-count">{t.count}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 10, fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--ink-light)' }}>
        {a.total} preguntas han explorado esta agenda
      </div>
    </div>
  )
}

function TopicCard({ t }: { t: TopicStat }) {
  const colors = { critica: 'var(--gap-crit)', parcial: 'var(--gap-part)', cubierta: 'var(--gap-cov)' }
  const labels = { critica: 'brecha crítica', parcial: 'brecha parcial', cubierta: 'bien cubierto' }
  const color = colors[t.categoria]

  return (
    <div className="topic-card">
      <div className="topic-card-label">{t.label}</div>
      <div className="topic-score-big" style={{ color }}>{Math.round(t.gap_score * 100)}%</div>
      <div className="topic-score-sublabel" style={{ color }}>{labels[t.categoria]}</div>
      <div className="topic-meta">
        <span>{t.datasets_cubriendo} datasets</span>
        <span>·</span>
        <span>{t.normativas_cubriendo} normativas</span>
        {t.preguntas_relacionadas > 0 && (
          <><span>·</span><span>{t.preguntas_relacionadas} preguntas</span></>
        )}
      </div>
    </div>
  )
}

export function MonitorColectivo() {
  const { agendas, topics, totalPreguntas, totalDatasets, totalNormativas, isReady, error } = useMonitorStats()

  return (
    <Layout>
      <main className="monitor-page">
        <div className="hero">
          <p className="hero-eyebrow">¿Qué tenemos?</p>
          <h1>El corpus de datos <em>disponible</em></h1>
          <p className="hero-sub">
            {isReady
              ? `${totalDatasets} datasets · ${totalNormativas} normativas · ${totalPreguntas} preguntas ingresadas`
              : 'Cargando corpus…'}
          </p>
        </div>

        {error && (
          <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--warn)', marginBottom: '1rem' }}>
            {error}
          </p>
        )}

        <div className="monitor-grid">
          {agendas.map(a => <AgendaCard key={a.id} a={a} />)}
        </div>

        <p className="mapa-section-title">Cobertura por tópico</p>
        <p style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--ink-light)', marginBottom: '1rem' }}>
          Score de brecha calculado sobre el corpus real — mayor % = menos cubierto.
        </p>
        <div className="mapa-grid">
          {topics.map(t => <TopicCard key={t.id} t={t} />)}
        </div>
      </main>
    </Layout>
  )
}
