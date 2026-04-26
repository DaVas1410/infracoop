import { useState } from 'react'
import { Layout } from '../components/Layout'
import { EVOLUCION_MOCK, type SemanaSnapshot } from '../data/evolucionData'

const AGENDA_COLORS = {
  tecnologica: { color: '#0C447C', bar: '#378ADD', label: 'Agenda Tecnológica' },
  datos:       { color: '#3C3489', bar: '#7F77DD', label: 'Agenda de Datos' },
  genero:      { color: '#72243E', bar: '#D4537E', label: 'Agenda de Género' },
} as const

type AgendaKey = keyof typeof AGENDA_COLORS

function MetricaCard({
  eyebrow, num, numColor, delta, deltaClass,
}: { eyebrow: string; num: number | string; numColor: string; delta: string; deltaClass: string }) {
  return (
    <div className="evolucion-card">
      <div className="evolucion-card-eyebrow">{eyebrow}</div>
      <div className="evolucion-card-num" style={{ color: numColor }}>{num}</div>
      <div className={`evolucion-card-delta ${deltaClass}`}>{delta}</div>
    </div>
  )
}

function EvolucionChart({ selectedIdx }: { selectedIdx: number }) {
  return (
    <div className="chart-section">
      <div className="chart-title">Evolución semanal de brechas por agenda</div>
      <div className="chart-bars">
        {EVOLUCION_MOCK.map((sem, i) => {
          const isInitial = i === 0
          const isSelected = i === selectedIdx
          const opacity = isInitial || isSelected ? 1 : i < selectedIdx ? 0.4 : 0.15
          return (
            <div key={sem.semana} className="chart-bar-group" style={{ opacity }}>
              <div className="chart-bar-row">
                {(['tecnologica', 'datos', 'genero'] as AgendaKey[]).map(ag => (
                  <div
                    key={ag}
                    className="chart-bar"
                    style={{
                      height: `${sem.agendas[ag].score}%`,
                      background: AGENDA_COLORS[ag].bar,
                    }}
                    title={`${AGENDA_COLORS[ag].label}: ${sem.agendas[ag].score}%`}
                  />
                ))}
              </div>
              <div
                className="chart-bar-label"
                style={{ fontWeight: isInitial || isSelected ? 600 : 400 }}
              >
                {isInitial ? 'Inicial' : sem.label.replace('Semana ', 'S')}
              </div>
            </div>
          )
        })}
      </div>
      <div className="chart-legend">
        {(['tecnologica', 'datos', 'genero'] as AgendaKey[]).map(ag => (
          <div key={ag} className="chart-legend-item">
            <div className="chart-legend-dot" style={{ background: AGENDA_COLORS[ag].bar }} />
            {AGENDA_COLORS[ag].label}
          </div>
        ))}
      </div>
    </div>
  )
}

function AgendaEvolCard({
  agendaKey, snapshot, baseSnapshot, selectedIdx,
}: {
  agendaKey: AgendaKey
  snapshot: SemanaSnapshot
  baseSnapshot: SemanaSnapshot
  selectedIdx: number
}) {
  const cfg = AGENDA_COLORS[agendaKey]
  const curr = snapshot.agendas[agendaKey]
  const base = baseSnapshot.agendas[agendaKey]
  const delta = curr.score - base.score

  return (
    <div className="agenda-evol-card" style={{ borderLeftColor: cfg.bar }}>
      <div className="agenda-evol-header">
        <div>
          <div className="agenda-evol-title" style={{ color: cfg.color }}>{cfg.label}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-mid)', marginTop: 2 }}>
            Score brecha: <strong>{curr.score}/100</strong>
            {delta !== 0 && (
              <span style={{
                fontSize: 11, fontFamily: 'var(--mono)',
                color: delta > 0 ? 'var(--gap-crit)' : 'var(--ok)',
              }}>
                {' '}({delta > 0 ? '+' : ''}{delta} vs estado inicial)
              </span>
            )}
          </div>
        </div>
        <div className="agenda-evol-badges">
          {EVOLUCION_MOCK.slice(0, selectedIdx + 1).map((sem, i) => (
            <span
              key={sem.semana}
              className="semana-badge"
              style={{
                background: i === selectedIdx ? cfg.bar : i === 0 ? 'var(--ink)' : 'var(--ink-faint)',
                color: i === selectedIdx || i === 0 ? 'white' : 'var(--ink-light)',
              }}
            >
              {i === 0 ? 'Base' : i === selectedIdx
                ? `${sem.agendas[agendaKey].score}%`
                : sem.agendas[agendaKey].score}
            </span>
          ))}
        </div>
      </div>
      <div className="agenda-evol-stats">
        <span>Brechas críticas: <strong style={{ color: 'var(--gap-crit)' }}>{curr.criticas}</strong></span>
        <span>Preguntas nuevas: <strong style={{ color: cfg.color }}>{curr.nuevas}</strong></span>
      </div>
      <div className="agenda-evol-bars">
        <div>
          <div className="evol-bar-label">Estado inicial</div>
          <div className="evol-bar-track">
            <div className="evol-bar-fill" style={{ width: `${base.score}%`, background: 'var(--ink-mid)', opacity: 0.4 }} />
          </div>
          <div className="evol-bar-pct">{base.score}%</div>
        </div>
        <div>
          <div className="evol-bar-label">{snapshot.label}</div>
          <div className="evol-bar-track">
            <div className="evol-bar-fill" style={{ width: `${curr.score}%`, background: cfg.bar }} />
          </div>
          <div className="evol-bar-pct">{curr.score}%</div>
        </div>
      </div>
    </div>
  )
}

export function DatosQueremos() {
  const [selectedIdx, setSelectedIdx] = useState(1)
  const selected = EVOLUCION_MOCK[selectedIdx]
  const base = EVOLUCION_MOCK[0]
  const deltaC = selected.brechas_criticas - base.brechas_criticas

  return (
    <Layout>
      <main className="datos-page">
        <div className="hero">
          <p className="hero-eyebrow">¿Qué datos queremos?</p>
          <h1>Los datos que <em>necesitamos</em></h1>
          <p className="hero-sub">
            Estado inicial anclado versus evolución semanal según preguntas ingresadas.
          </p>
        </div>

        <div className="semana-tabs">
          {EVOLUCION_MOCK.slice(1).map((sem, i) => (
            <button
              key={sem.semana}
              className={`semana-tab${selectedIdx === i + 1 ? ' active' : ''}`}
              onClick={() => setSelectedIdx(i + 1)}
            >
              {sem.label}
            </button>
          ))}
        </div>

        <div className="metricas-compare">
          <div>
            <div className="metricas-col-label">Estado inicial</div>
            <MetricaCard eyebrow="Preguntas ingresadas" num={0} numColor="var(--ink)" delta="Base — sin preguntas" deltaClass="delta-neu" />
            <MetricaCard eyebrow="Brechas críticas" num={base.brechas_criticas} numColor="var(--gap-crit)" delta="Estado base" deltaClass="delta-neu" />
            <MetricaCard eyebrow="Brechas parciales" num={base.brechas_parciales} numColor="var(--gap-part)" delta={`${base.brechas_cubiertas} cubiertas`} deltaClass="delta-neu" />
          </div>
          <div>
            <div className="metricas-col-label">{selected.label}</div>
            <MetricaCard eyebrow="Preguntas ingresadas" num={selected.total_preguntas} numColor="var(--ink)" delta={`+${selected.total_preguntas} desde inicio`} deltaClass="delta-pos" />
            <MetricaCard eyebrow="Brechas críticas" num={selected.brechas_criticas} numColor="var(--gap-crit)" delta={`+${deltaC} nuevas detectadas`} deltaClass={deltaC > 0 ? 'delta-pos' : 'delta-neu'} />
            <MetricaCard eyebrow="Brechas parciales" num={selected.brechas_parciales} numColor="var(--gap-part)" delta={`${selected.brechas_cubiertas} cubiertas`} deltaClass="delta-neu" />
          </div>
        </div>

        <EvolucionChart selectedIdx={selectedIdx} />

        <div className="agenda-evol-list">
          {(['tecnologica', 'datos', 'genero'] as AgendaKey[]).map(ag => (
            <AgendaEvolCard
              key={ag}
              agendaKey={ag}
              snapshot={selected}
              baseSnapshot={base}
              selectedIdx={selectedIdx}
            />
          ))}
        </div>
      </main>
    </Layout>
  )
}
