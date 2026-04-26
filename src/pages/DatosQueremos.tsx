import { useState } from 'react'
import { Layout } from '../components/Layout'
import { useEvolucionStats } from '../hooks/useEvolucionStats'
import type { SemanaStats } from '../types'

const AGENDA_CFG = {
  tecnologica: { color: '#0C447C', bar: '#378ADD', label: 'Agenda Tecnológica' },
  datos:       { color: '#3C3489', bar: '#7F77DD', label: 'Agenda de Datos' },
  genero:      { color: '#72243E', bar: '#D4537E', label: 'Agenda de Género' },
} as const

type AgendaKey = keyof typeof AGENDA_CFG

function MetricaCard({ eyebrow, num, numColor, sub }: {
  eyebrow: string; num: number | string; numColor: string; sub: string
}) {
  return (
    <div className="evolucion-card">
      <div className="evolucion-card-eyebrow">{eyebrow}</div>
      <div className="evolucion-card-num" style={{ color: numColor }}>{num}</div>
      <div className="evolucion-card-delta delta-neu">{sub}</div>
    </div>
  )
}

function StackedWeekChart({ semanas, selectedIdx }: { semanas: SemanaStats[]; selectedIdx: number }) {
  const maxNuevas = Math.max(...semanas.map(s => s.nuevas), 1)

  return (
    <div className="chart-section">
      <div className="chart-title">Preguntas nuevas por semana — distribución por severidad de brecha</div>
      <div className="chart-bars">
        {semanas.map((s, i) => {
          const isSelected = i === selectedIdx
          const opacity = isSelected ? 1 : i < selectedIdx ? 0.45 : 0.15
          const totalH = 90
          const scale = s.nuevas / maxNuevas
          const critH = Math.round((s.criticas  / (s.nuevas || 1)) * totalH * scale)
          const parcH = Math.round((s.parciales / (s.nuevas || 1)) * totalH * scale)
          const cubH  = Math.round((s.cubiertas / (s.nuevas || 1)) * totalH * scale)

          return (
            <div key={s.isoWeek} className="stack-bar-group" style={{ opacity }}>
              <div className="stack-bar" style={{ height: totalH * scale }}>
                <div className="stack-segment" style={{ height: cubH,  background: 'var(--gap-cov)' }} />
                <div className="stack-segment" style={{ height: parcH, background: 'var(--gap-part)' }} />
                <div className="stack-segment" style={{ height: critH, background: 'var(--gap-crit)' }} />
              </div>
              <div className="chart-bar-label" style={{ fontWeight: isSelected ? 600 : 400 }}>
                {s.label.replace('Sem. ', 'S')}
              </div>
            </div>
          )
        })}
      </div>
      <div className="chart-legend">
        {[
          { label: 'Brecha crítica', color: 'var(--gap-crit)' },
          { label: 'Brecha parcial', color: 'var(--gap-part)' },
          { label: 'Bien cubierta',  color: 'var(--gap-cov)' },
        ].map(l => (
          <div key={l.label} className="chart-legend-item">
            <div className="chart-legend-dot" style={{ background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  )
}

function AgendaDemandCard({ agKey, sem, baseline }: {
  agKey: AgendaKey; sem: SemanaStats; baseline: { score: number }
}) {
  const cfg = AGENDA_CFG[agKey]
  const ag = sem.por_agenda[agKey]
  const baseScore = Math.round(baseline.score * 100)

  return (
    <div className="agenda-evol-card" style={{ borderLeftColor: cfg.bar }}>
      <div className="agenda-evol-header">
        <div>
          <div className="agenda-evol-title" style={{ color: cfg.color }}>{cfg.label}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-mid)', marginTop: 2 }}>
            Score promedio brecha: <strong>{Math.round(ag.score_avg * 100)}%</strong>
          </div>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-light)' }}>
          {ag.nuevas} preguntas esta semana
        </div>
      </div>
      <div className="agenda-evol-bars">
        <div>
          <div className="evol-bar-label">Cobertura inicial del corpus</div>
          <div className="evol-bar-track">
            <div className="evol-bar-fill" style={{ width: `${baseScore}%`, background: 'var(--ink-mid)', opacity: 0.4 }} />
          </div>
          <div className="evol-bar-pct">{baseScore}% brecha base</div>
        </div>
        <div>
          <div className="evol-bar-label">Demanda observada ({sem.label})</div>
          <div className="evol-bar-track">
            <div className="evol-bar-fill" style={{ width: `${Math.round(ag.score_avg * 100)}%`, background: cfg.bar }} />
          </div>
          <div className="evol-bar-pct">{Math.round(ag.score_avg * 100)}% en preguntas</div>
        </div>
      </div>
    </div>
  )
}

export function DatosQueremos() {
  const { semanas, topTemas, baseline, isReady, error } = useEvolucionStats()
  const [selectedIdx, setSelectedIdx] = useState(0)

  const selected = semanas[selectedIdx]
  const totalAcumuladas = semanas.at(-1)?.acumuladas ?? 0
  const maxTopTema = topTemas[0]?.count ?? 1

  return (
    <Layout>
      <main className="datos-page">
        <div className="hero">
          <p className="hero-eyebrow">¿Qué queremos?</p>
          <h1>La demanda <em>revelada</em> por las preguntas</h1>
          <p className="hero-sub">
            {isReady
              ? `${totalAcumuladas} preguntas ingresadas · demanda semanal de datos faltantes`
              : 'Cargando demanda…'}
          </p>
        </div>

        {error && (
          <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--warn)', marginBottom: '1rem' }}>
            {error}
          </p>
        )}

        {semanas.length === 0 && isReady && (
          <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink-light)' }}>
            — Aún no hay preguntas ingresadas —
          </p>
        )}

        {semanas.length > 0 && (
          <>
            <div className="semana-tabs">
              {semanas.map((s, i) => (
                <button
                  key={s.isoWeek}
                  className={`semana-tab${selectedIdx === i ? ' active' : ''}`}
                  onClick={() => setSelectedIdx(i)}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="metricas-compare">
              <div>
                <div className="metricas-col-label">Estado inicial del corpus</div>
                <MetricaCard eyebrow="Score brecha base" num={`${Math.round(baseline.score * 100)}%`} numColor="var(--ink)" sub="Antes de cualquier pregunta" />
                <MetricaCard eyebrow="Tópicos críticos" num={baseline.criticas} numColor="var(--gap-crit)" sub="Sin cobertura en el corpus" />
                <MetricaCard eyebrow="Tópicos parciales" num={baseline.parciales} numColor="var(--gap-part)" sub={`${baseline.cubiertas} bien cubiertos`} />
              </div>
              {selected && (
                <div>
                  <div className="metricas-col-label">{selected.label}</div>
                  <MetricaCard eyebrow="Preguntas acumuladas" num={selected.acumuladas} numColor="var(--ink)" sub={`+${selected.nuevas} esta semana`} />
                  <MetricaCard eyebrow="Brechas críticas reveladas" num={selected.criticas} numColor="var(--gap-crit)" sub={`${selected.parciales} parciales · ${selected.cubiertas} cubiertas`} />
                  <MetricaCard eyebrow="Score promedio de brecha" num={`${Math.round(selected.score_promedio * 100)}%`} numColor="var(--gap-part)" sub="En preguntas de esta semana" />
                </div>
              )}
            </div>

            <StackedWeekChart semanas={semanas} selectedIdx={selectedIdx} />

            {topTemas.length > 0 && (
              <>
                <p className="mapa-section-title">Temas más demandados</p>
                <p style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--ink-light)', marginBottom: '1rem' }}>
                  Subtemas de los datasets encontrados al responder preguntas — lo más buscado revela lo más faltante.
                </p>
                <div className="top-temas-list">
                  {topTemas.map((t, i) => (
                    <div key={t.subtema} className="top-tema-row">
                      <span className="top-tema-rank">#{i + 1}</span>
                      <span className="top-tema-name">{t.subtema}</span>
                      <div className="top-tema-bar-wrap">
                        <div className="top-tema-bar-fill" style={{ width: `${Math.round((t.count / maxTopTema) * 100)}%` }} />
                      </div>
                      <span className="top-tema-count">{t.count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {selected && (
              <div className="agenda-evol-list" style={{ marginTop: '2rem' }}>
                {(['tecnologica', 'datos', 'genero'] as AgendaKey[]).map(ag => (
                  <AgendaDemandCard key={ag} agKey={ag} sem={selected} baseline={baseline} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </Layout>
  )
}
