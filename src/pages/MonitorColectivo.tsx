import { Layout } from '../components/Layout'
import { useMonitorStats } from '../hooks/useMonitorStats'
import type { AgendaStat, TopicStat } from '../types'

// ── Helpers (exported for tests) ─────────────────────────────────────────────

export function calcTopicsCriticas(topics: TopicStat[]): number {
  return topics.filter(t => t.categoria === 'critica').length
}

export function calcCoberturaMedia(topics: TopicStat[]): number {
  if (topics.length === 0) return 0
  const mean = topics.reduce((acc, t) => acc + t.gap_score, 0) / topics.length
  return Math.round((1 - mean) * 100)
}

// ── Tooltip ───────────────────────────────────────────────────────────────────

function Tooltip({ text }: { text: string }) {
  return (
    <span className="tooltip-wrap">
      <span className="tooltip-icon" tabIndex={0}>i</span>
      <span className="tooltip-bubble">{text}</span>
    </span>
  )
}

// ── MetricsBand ───────────────────────────────────────────────────────────────

function MetricsBand({ totalDatasets, totalNormativas, topics }: {
  totalDatasets: number
  totalNormativas: number
  topics: TopicStat[]
}) {
  const criticas = calcTopicsCriticas(topics)
  const cobertura = calcCoberturaMedia(topics)

  return (
    <div className="metrics-band">
      <div className="metrics-band-card">
        <div className="metrics-band-num">{totalDatasets + totalNormativas}</div>
        <div className="metrics-band-label">total entradas</div>
      </div>
      <div className="metrics-band-card">
        <div className="metrics-band-num">3</div>
        <div className="metrics-band-label">agendas activas</div>
      </div>
      <div className="metrics-band-card">
        <div className="metrics-band-num" style={{ color: criticas > 0 ? 'var(--gap-crit)' : 'var(--gap-cov)' }}>
          {criticas}
        </div>
        <div className="metrics-band-label">tópicos críticos</div>
      </div>
      <div className="metrics-band-card">
        <div className="metrics-band-num" style={{ color: cobertura >= 50 ? 'var(--gap-cov)' : 'var(--gap-crit)' }}>
          {cobertura}%
        </div>
        <div className="metrics-band-label">cobertura media</div>
      </div>
    </div>
  )
}

// ── AgendaCard ────────────────────────────────────────────────────────────────

function AgendaCard({ a }: { a: AgendaStat }) {
  const totalCalidad = a.calidad_dist.Completa + a.calidad_dist.Parcial + a.calidad_dist.Nula || 1
  const pct = (n: number) => `${Math.round((n / totalCalidad) * 100)}%`

  return (
    <div className="agenda-monitor-card" style={{ borderTopColor: a.barColor, color: a.color }}>
      <div className="agenda-monitor-eyebrow" style={{ color: a.color }}>{a.label}</div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <div className="agenda-monitor-total" style={{ color: a.color }}>{a.datasets_en_agenda}</div>
        <Tooltip text="Datasets clasificados bajo esta agenda en el corpus. Incluye todos los datasets independientemente de su calidad." />
      </div>
      <div className="agenda-monitor-label" style={{ color: 'var(--ink-light)' }}>datasets disponibles en esta agenda</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
        <div className="calidad-bar" style={{ flex: 1 }}>
          <div className="calidad-segment" style={{ width: pct(a.calidad_dist.Completa), background: 'var(--gap-cov)' }} />
          <div className="calidad-segment" style={{ width: pct(a.calidad_dist.Parcial),  background: 'var(--gap-part)' }} />
          <div className="calidad-segment" style={{ width: pct(a.calidad_dist.Nula),     background: 'var(--ink-faint)' }} />
        </div>
        <Tooltip text="Calidad de los metadatos: Completa = todos los campos requeridos presentes. Parcial = faltan algunos campos. Nula = sin metadatos." />
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

// ── TopicCard ─────────────────────────────────────────────────────────────────

function TopicCard({ t }: { t: TopicStat }) {
  const colors = { critica: 'var(--gap-crit)', parcial: 'var(--gap-part)', cubierta: 'var(--gap-cov)' }
  const labels = { critica: 'brecha crítica', parcial: 'brecha parcial', cubierta: 'bien cubierto' }
  const color = colors[t.categoria]

  return (
    <div className="topic-card">
      <div className="topic-card-label">{t.label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <div className="topic-score-big" style={{ color }}>{Math.round(t.gap_score * 100)}%</div>
        <Tooltip text="Score de brecha: 0% = tópico bien cubierto en el corpus. 100% = brecha crítica, pocos o ningún dato disponible." />
      </div>
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

// ── MonitorColectivo ──────────────────────────────────────────────────────────

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

        {isReady && (
          <MetricsBand
            totalDatasets={totalDatasets}
            totalNormativas={totalNormativas}
            topics={topics}
          />
        )}

        <p className="mapa-section-title">Cobertura por agenda</p>
        <p className="section-description">
          Cada agenda agrupa los datasets según el marco temático al que pertenecen.
          La barra de calidad indica qué porcentaje de los datasets tiene metadatos completos, parciales o nulos.
        </p>
        <div className="monitor-grid">
          {agendas.map(a => <AgendaCard key={a.id} a={a} />)}
        </div>

        <p className="mapa-section-title">Cobertura por tópico</p>
        <p className="section-description">
          El score de brecha mide qué tan cubierto está cada tópico en el corpus — mayor % = menos cubierto.
          0% = completamente cubierto · 100% = brecha crítica sin datos.
        </p>
        <div className="mapa-grid">
          {topics.map(t => <TopicCard key={t.id} t={t} />)}
        </div>
      </main>
    </Layout>
  )
}
