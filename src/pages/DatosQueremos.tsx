import { useState, useMemo } from 'react'
import { Layout } from '../components/Layout'
import { useEvolucionStats } from '../hooks/useEvolucionStats'
import type { SemanaStats } from '../types'

const AGENDA_CFG = {
  tecnologica: { color: '#0C447C', bar: '#378ADD', label: 'Agenda Tecnológica' },
  datos:       { color: '#3C3489', bar: '#7F77DD', label: 'Agenda de Datos' },
  genero:      { color: '#72243E', bar: '#D4537E', label: 'Agenda de Género' },
} as const

type AgendaKey = keyof typeof AGENDA_CFG

// ── Helpers (exported for tests) ─────────────────────────────────────────────

export function parseIsoWeek(isoWeek: string): { year: number; week: number } {
  const [year, wPart] = isoWeek.split('-W')
  return { year: Number(year), week: Number(wPart) }
}

export function isoWeekToNum(isoWeek: string): number {
  const { year, week } = parseIsoWeek(isoWeek)
  return year * 100 + week
}

export function filterSemanasByRange(
  semanas: SemanaStats[],
  desde: string,
  hasta: string
): SemanaStats[] {
  const desdeNum = isoWeekToNum(desde)
  const hastaNum = isoWeekToNum(hasta)
  return semanas.filter(s => {
    const n = isoWeekToNum(s.isoWeek)
    return n >= desdeNum && n <= hastaNum
  })
}

export function deriveYears(semanas: { isoWeek: string }[]): number[] {
  const years = new Set(semanas.map(s => parseIsoWeek(s.isoWeek).year))
  return [...years].sort((a, b) => a - b)
}

export function deriveWeeksForYear(semanas: { isoWeek: string }[], year: number): number[] {
  const weeks = semanas
    .filter(s => parseIsoWeek(s.isoWeek).year === year)
    .map(s => parseIsoWeek(s.isoWeek).week)
  return [...new Set(weeks)].sort((a, b) => a - b)
}

// ── RangoSelector ─────────────────────────────────────────────────────────────

interface IsoWeekValue { year: number; week: number }

interface RangoSelectorProps {
  semanas: SemanaStats[]
  desde: IsoWeekValue
  hasta: IsoWeekValue
  onDesdeChange: (v: IsoWeekValue) => void
  onHastaChange: (v: IsoWeekValue) => void
}

function RangoSelector({ semanas, desde, hasta, onDesdeChange, onHastaChange }: RangoSelectorProps) {
  const years = deriveYears(semanas)

  const desdeWeeks = deriveWeeksForYear(semanas, desde.year)
  const hastaWeeks = deriveWeeksForYear(semanas, hasta.year)

  function handleDesdeYear(year: number) {
    const weeks = deriveWeeksForYear(semanas, year)
    const week = weeks[0] ?? 1
    const newDesde = { year, week }
    onDesdeChange(newDesde)
    if (isoWeekToNum(`${hasta.year}-W${String(hasta.week).padStart(2,'0')}`) <
        isoWeekToNum(`${year}-W${String(week).padStart(2,'0')}`)) {
      onHastaChange(newDesde)
    }
  }

  function handleDesdeWeek(week: number) {
    const newDesde = { ...desde, week }
    onDesdeChange(newDesde)
    if (isoWeekToNum(`${hasta.year}-W${String(hasta.week).padStart(2,'0')}`) <
        isoWeekToNum(`${newDesde.year}-W${String(week).padStart(2,'0')}`)) {
      onHastaChange(newDesde)
    }
  }

  function handleHastaYear(year: number) {
    const weeks = deriveWeeksForYear(semanas, year)
    const week = weeks[weeks.length - 1] ?? 52
    onHastaChange({ year, week })
  }

  return (
    <div className="rango-selector">
      <div className="rango-selector-title">Rango de tiempo</div>
      <div className="rango-row">
        <div>
          <label>Desde</label>
          <div className="rango-selects">
            <select className="rango-select" value={desde.year}
              onChange={e => handleDesdeYear(Number(e.target.value))}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select className="rango-select" value={desde.week}
              onChange={e => handleDesdeWeek(Number(e.target.value))}>
              {desdeWeeks.map(w => (
                <option key={w} value={w}>S{String(w).padStart(2,'0')}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label>Hasta</label>
          <div className="rango-selects">
            <select className="rango-select" value={hasta.year}
              onChange={e => handleHastaYear(Number(e.target.value))}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select className="rango-select" value={hasta.week}
              onChange={e => onHastaChange({ ...hasta, week: Number(e.target.value) })}>
              {hastaWeeks.map(w => (
                <option key={w} value={w}>S{String(w).padStart(2,'0')}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── MetricaCard ───────────────────────────────────────────────────────────────

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

// ── StackedWeekChart ──────────────────────────────────────────────────────────

function StackedWeekChart({ semanas, selectedIdx }: { semanas: SemanaStats[]; selectedIdx: number }) {
  const maxNuevas = Math.max(...semanas.map(s => s.nuevas), 1)

  return (
    <div className="chart-section">
      <div className="chart-title">Preguntas nuevas por semana — distribución por severidad de brecha</div>
      <div className="chart-bars-scroll">
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

// ── AgendaDemandCard ──────────────────────────────────────────────────────────

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

// ── DatosQueremos ─────────────────────────────────────────────────────────────

export function DatosQueremos() {
  const { semanas, topTemas, baseline, isReady, error } = useEvolucionStats()

  const initialDesde = useMemo(() => {
    if (semanas.length === 0) return { year: new Date().getFullYear(), week: 1 }
    return parseIsoWeek(semanas[0].isoWeek)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semanas.length > 0 ? semanas[0].isoWeek : ''])

  const initialHasta = useMemo(() => {
    if (semanas.length === 0) return { year: new Date().getFullYear(), week: 52 }
    return parseIsoWeek(semanas[semanas.length - 1].isoWeek)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semanas.length > 0 ? semanas[semanas.length - 1].isoWeek : ''])

  const [desde, setDesde] = useState<{ year: number; week: number } | null>(null)
  const [hasta, setHasta] = useState<{ year: number; week: number } | null>(null)

  const effectiveDesde = desde ?? initialDesde
  const effectiveHasta = hasta ?? initialHasta

  const desdeStr = `${effectiveDesde.year}-W${String(effectiveDesde.week).padStart(2,'0')}`
  const hastaStr = `${effectiveHasta.year}-W${String(effectiveHasta.week).padStart(2,'0')}`

  const filteredSemanas = useMemo(
    () => filterSemanasByRange(semanas, desdeStr, hastaStr),
    [semanas, desdeStr, hastaStr]
  )

  const selectedIdx = filteredSemanas.length - 1
  const selected = filteredSemanas[selectedIdx]

  const totalAcumuladas = filteredSemanas[filteredSemanas.length - 1]?.acumuladas ?? 0
  const maxTopTema = topTemas[0]?.count ?? 1

  const sidebarMetrics = selected ? [
    { eyebrow: 'Preguntas en rango', num: totalAcumuladas, numColor: 'var(--ink)', sub: `${filteredSemanas.length} semanas` },
    { eyebrow: 'Brechas críticas', num: selected.criticas, numColor: 'var(--gap-crit)', sub: `${selected.parciales} parciales` },
    { eyebrow: 'Score promedio', num: `${Math.round(selected.score_promedio * 100)}%`, numColor: 'var(--gap-part)', sub: 'en el rango' },
  ] : []

  return (
    <Layout>
      <main className="datos-page">
        <div className="hero">
          <p className="hero-eyebrow">¿Qué queremos?</p>
          <h1>La demanda <em>revelada</em> por las preguntas</h1>
          <p className="hero-sub">
            {isReady
              ? `${totalAcumuladas} preguntas · demanda semanal de datos faltantes`
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
          <div className="datos-layout">
            {/* ── Sidebar ── */}
            <aside className="datos-sidebar">
              <RangoSelector
                semanas={semanas}
                desde={effectiveDesde}
                hasta={effectiveHasta}
                onDesdeChange={v => setDesde(v)}
                onHastaChange={v => setHasta(v)}
              />

              <div className="metricas-compare" style={{ gridTemplateColumns: '1fr', gap: '.75rem' }}>
                <div>
                  <div className="metricas-col-label">Corpus base</div>
                  <MetricaCard eyebrow="Score brecha base" num={`${Math.round(baseline.score * 100)}%`} numColor="var(--ink)" sub="Antes de cualquier pregunta" />
                  <MetricaCard eyebrow="Tópicos críticos" num={baseline.criticas} numColor="var(--gap-crit)" sub="Sin cobertura" />
                </div>
                {selected && (
                  <div style={{ marginTop: '.5rem' }}>
                    <div className="metricas-col-label">Rango seleccionado</div>
                    {sidebarMetrics.map(m => (
                      <MetricaCard key={m.eyebrow} {...m} />
                    ))}
                  </div>
                )}
              </div>

              {topTemas.length > 0 && (
                <>
                  <p className="mapa-section-title" style={{ marginTop: '1.5rem' }}>Temas más demandados</p>
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
            </aside>

            {/* ── Main content ── */}
            <div className="datos-main">
              <StackedWeekChart semanas={filteredSemanas} selectedIdx={selectedIdx} />

              {selected && (
                <div className="agenda-evol-list" style={{ marginTop: '2rem' }}>
                  {(['tecnologica', 'datos', 'genero'] as AgendaKey[]).map(ag => (
                    <AgendaDemandCard key={ag} agKey={ag} sem={selected} baseline={baseline} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </Layout>
  )
}
