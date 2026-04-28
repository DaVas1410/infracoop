import { useState, useEffect } from 'react'
import { BarChart, Bar, Cell } from 'recharts'
import { useNavigate } from 'react-router-dom'
import { useMotorBrechas } from '../hooks/useMotorBrechas'
import { useSearchIndex } from '../context/SearchIndexContext'
import { useEmbedder } from '../context/EmbedderContext'
import type { GapResult, SearchHit } from '../types'

const CHIP_KEYWORDS: Record<string, string[]> = {
  'Gobierno Abierto':      ['estadística', 'oficial', 'gobierno', 'abierto', 'transparencia', 'rendición', 'público', 'nacional', 'ministerio', 'instituto', 'censos', 'registro', 'administrativo'],
  'DDHH':                  ['género', 'violencia', 'salud', 'reproductiva', 'discriminación', 'derechos', 'mujeres', 'interseccionalidad', 'comunidad', 'vulnerabilidad', 'migrante', 'indígena', 'justicia', 'litigios', 'femicidio'],
  'Cooperación Digital':   ['tecnología', 'digital', 'sistema', 'plataforma', 'datos', 'interoperabilidad', 'infraestructura', 'algoritmo', 'software', 'TIC', 'conectividad', 'inteligencia artificial', 'cooperación'],
  'Gobernanza Cooperativa':['comunidad', 'cooperativa', 'colectivo', 'organización', 'sociedad civil', 'participación', 'ciudadana', 'gobernanza', 'OSC', 'cooperativismo', 'autogestión', 'barrio', 'territorial'],
}

function scoreHit(titulo: string, keywords: string[]): number {
  const text = titulo.toLowerCase()
  return keywords.reduce((acc, kw) => acc + (text.includes(kw.toLowerCase()) ? 1 : 0), 0)
}

const LOADING_STEPS = [
  'Buscando similitudes…',
  'Calculando score de brecha…',
  'Cruzando normativas…',
  'Registrando pregunta…',
]

const calidadClass: Record<string, string> = {
  Completa: 'cubierta', Parcial: 'parcial', Nula: 'critica',
}

// ── Helper (exported for tests) ───────────────────────────────────────────────

export function normalizeSimToMax(hits: { similitud: number }[]): number[] {
  if (hits.length === 0) return []
  const max = Math.max(...hits.map(h => h.similitud))
  if (max === 0) return hits.map(() => 0)
  return hits.map(h => h.similitud / max)
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

// ── SearchBox ─────────────────────────────────────────────────────────────────

interface SearchBoxProps {
  value: string
  onChange: (v: string) => void
  onSearch: () => void
  onClear: () => void
  isLoading: boolean
  isDisabled: boolean
  indexError: string | null
  isIndexReady: boolean
}

function SearchBox({
  value, onChange, onSearch, onClear,
  isLoading, isDisabled, indexError, isIndexReady,
}: SearchBoxProps) {
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    if (!isLoading) { setStepIndex(0); return }
    const t = setInterval(() => setStepIndex(i => (i + 1) % LOADING_STEPS.length), 700)
    return () => clearInterval(t)
  }, [isLoading])

  return (
    <div className="search-box">
      {indexError && <p className="search-error">{indexError}</p>}
      <textarea
        className="search-textarea"
        placeholder="¿Qué datos de género necesitas? Ej: «¿Existen datos sobre feminicidio desagregados por estado?»"
        maxLength={400}
        value={value}
        rows={3}
        disabled={isLoading}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onSearch() }}
      />
      {isLoading && (
        <p className="search-loading-step">{LOADING_STEPS[stepIndex]}</p>
      )}
      <div className="search-footer">
        <span className="char-count">{value.length} / 400</span>
        {!isIndexReady && !indexError && (
          <span className="index-loading-note label-mono">Cargando motor…</span>
        )}
        <div className="search-actions">
          {value && !isLoading && (
            <button className="btn-ghost" onClick={onClear}>Limpiar</button>
          )}
          <button
            className="btn-primary"
            onClick={onSearch}
            disabled={isDisabled}
          >
            Buscar brecha →
          </button>
        </div>
      </div>
    </div>
  )
}

// ── qualityDims ───────────────────────────────────────────────────────────────

function qualityDims(hit: SearchHit): { label: string; value: number; color: string }[] {
  // 2000 + 24 = 2024 reference year; clamp keeps values in [0.15, 1] for years beyond it
  const anioScore = hit.anio
    ? Math.max(0.15, Math.min(1, (hit.anio - 2000) / 24))
    : 0.15
  const calidadScore =
    hit.calidad === 'Completa' ? 1
    : hit.calidad === 'Parcial' ? 0.55
    : 0.15

  // SVG fill doesn't evaluate CSS vars — use hex values from tokens.css
  const color = (v: number) =>
    v >= 0.7 ? '#3F7A4E' : v >= 0.4 ? '#C77B0E' : '#E6DEF1'

  const orgScore  = hit.fuente !== null ? 0.9 : 0.15
  const geoScore  = hit.pais   !== null ? 0.9 : 0.15

  return [
    { label: 'org',  value: orgScore,     color: color(orgScore) },
    { label: 'geo',  value: geoScore,     color: color(geoScore) },
    { label: 'año',  value: anioScore,    color: color(anioScore) },
    { label: 'meta', value: calidadScore, color: color(calidadScore) },
  ]
}

// ── HitRow ────────────────────────────────────────────────────────────────────

function HitRow({ hit, index, normalizedSim }: { hit: SearchHit; index: number; normalizedSim: number }) {
  const [animated, setAnimated] = useState(false)
  const dims = qualityDims(hit)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), index * 60 + 100)
    return () => clearTimeout(t)
  }, [index])

  return (
    <div
      className="hit-row"
      style={{ '--row-delay': `${index * 60}ms` } as React.CSSProperties}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
        <span className="hit-titulo">{hit.titulo}</span>
        {hit.calidad && (
          <span
            className={`gap-category-badge ${calidadClass[hit.calidad] ?? 'parcial'}`}
            style={{ flexShrink: 0, fontSize: 10 }}
            title={`Calidad del dato — Completa: bien documentado y accesible · Parcial: incompleto o con restricciones · Nula: dato ausente o no sistematizado`}
          >
            {hit.calidad}
          </span>
        )}
      </div>
      <div className="hit-meta">
        {hit.fuente && <span>{hit.fuente}</span>}
        {hit.pais && <><span className="hit-meta-sep">·</span><span>{hit.pais}</span></>}
        {hit.anio && <><span className="hit-meta-sep">·</span><span>{hit.anio}</span></>}
      </div>
      <div className="hit-sim-wrap" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="hit-sim-label">calidad</span>
        <BarChart
          width={80}
          height={32}
          data={dims}
          margin={{ top: 2, right: 0, bottom: 0, left: 0 }}
          style={{ opacity: animated ? 1 : 0, transition: `opacity 0.4s ease ${index * 60}ms` }}
        >
          <Bar dataKey="value" isAnimationActive animationBegin={index * 80} animationDuration={600} radius={[2, 2, 0, 0]}>
            {dims.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
        <span
          className="hit-sim-pct"
          title={`Similitud semántica: ${(hit.similitud * 100).toFixed(1)}%`}
        >
          {normalizedSim >= 0.66 ? 'alta' : normalizedSim >= 0.33 ? 'media' : 'baja'}
        </span>
      </div>
    </div>
  )
}

// ── ScorePanel ────────────────────────────────────────────────────────────────

function ScorePanel({ resultado }: { resultado: GapResult }) {
  const pct = Math.round(resultado.score * 100)
  const colorMap = {
    critica: 'var(--gap-crit)',
    parcial: 'var(--gap-part)',
    cubierta: 'var(--gap-cov)',
  }
  const color = colorMap[resultado.categoria]

  return (
    <div className="score-panel">
      <div>
        <div className="score-number" style={{ color }}>{pct}</div>
        <div className="score-label label-mono" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          score de brecha
          <Tooltip text="0 = dato completamente cubierto en el corpus · 100 = brecha crítica, pocos o ningún dato disponible para tu pregunta." />
        </div>
        <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--ink-light)', marginTop: 2 }}>
          0 = cubierto · 100 = crítico
        </div>
      </div>
      <span className={`gap-category-badge ${resultado.categoria}`}>
        ● {resultado.categoria}
      </span>

      <div className="score-arc-gauge" aria-label={`Score de brecha: ${pct} de 100`} style={{ color }}>
        <div
          className="score-arc-fill"
          style={{ '--arc-pct': pct } as React.CSSProperties}
        />
        <div className="score-arc-labels">
          <span>0</span>
          <span>100</span>
        </div>
      </div>

      <div className="agenda-score-list">
        {[
          { tipo: 'tecnologica', label: 'Ag. Tecnológica', val: resultado.agendas.tecnologica },
          { tipo: 'datos',       label: 'Ag. de Datos',    val: resultado.agendas.datos },
          { tipo: 'genero',      label: 'Ag. de Género',   val: resultado.agendas.genero },
        ].map(a => (
          <div key={a.tipo} className={`agenda-score-pill ${a.tipo}`}
            title="Proporción de la brecha atribuible a esta agenda, calculada sobre los datasets y normativas encontrados.">
            <span className="label-mono" style={{ fontSize: 10 }}>{a.label}</span>
            <span className="agenda-score-num">{a.val}</span>
          </div>
        ))}
      </div>

      <p className="score-sintesis">{resultado.titulo}</p>
    </div>
  )
}

// ── ResultadoMetaBand ─────────────────────────────────────────────────────────

function ResultadoMetaBand({ resultado }: { resultado: GapResult }) {
  const ds = resultado.datasets.length
  const nm = resultado.normativas.length
  const agendaColor = {
    tecnologica: '#0C447C',
    datos: '#3C3489',
    genero: '#72243E',
  }

  return (
    <div className="resultado-meta-band">
      <div className="resultado-meta-item">
        <span className="resultado-meta-num">{ds}</span>
        <span className="resultado-meta-label">datasets</span>
      </div>
      <span className="resultado-meta-sep">·</span>
      <div className="resultado-meta-item">
        <span className="resultado-meta-num">{nm}</span>
        <span className="resultado-meta-label">normativas</span>
      </div>
      <span className="resultado-meta-sep">·</span>
      {(['tecnologica', 'datos', 'genero'] as const).map(ag => (
        <div key={ag} className="resultado-meta-item">
          <span className="resultado-meta-num" style={{ color: agendaColor[ag], fontSize: '1.1rem' }}>
            {resultado.agendas[ag]}
          </span>
          <span className="resultado-meta-label">{ag}</span>
        </div>
      ))}
      <button
        className="btn-export-pdf"
        onClick={() => window.print()}
        title="Exportar resultado como PDF"
      >
        ↓ PDF
      </button>
    </div>
  )
}

// ── ResultsColumns ────────────────────────────────────────────────────────────

function ResultsColumns({ resultado, selectedChips }: { resultado: GapResult; selectedChips: string[] }) {
  const allHits = [...resultado.datasets, ...resultado.normativas]
  const maxSim = Math.max(...allHits.map(h => h.similitud), 0.001)
  const normalize = (h: SearchHit) => h.similitud / maxSim

  const keywords = selectedChips.flatMap(c => CHIP_KEYWORDS[c] ?? [])

  function sortedHits<T extends { titulo: string }>(hits: T[]): T[] {
    if (keywords.length === 0) return hits
    return [...hits].sort((a, b) => scoreHit(b.titulo, keywords) - scoreHit(a.titulo, keywords))
  }

  const datasets   = sortedHits(resultado.datasets)
  const normativas = sortedHits(resultado.normativas)

  return (
    <div className="results-columns">
      <div className="results-col">
        <div className="results-col-header">
          <div>
            <div className="label-mono">Datasets disponibles</div>
            <div style={{ fontSize: 10, color: 'var(--ink-light)', fontFamily: 'var(--mono)', marginTop: 2 }}>
              Datos existentes ordenados por relevancia para tu consulta
            </div>
          </div>
          <span className="results-col-count">{datasets.length}</span>
        </div>
        {datasets.length === 0
          ? <p className="results-empty">Sin datasets relacionados</p>
          : datasets.map((hit, i) => (
              <HitRow key={hit.id} hit={hit} index={i} normalizedSim={normalize(hit)} />
            ))
        }
        <div className="results-col-legend">
          <span className="results-col-legend-item">
            <span className="results-col-legend-dot" style={{ background: 'var(--gap-cov)' }} />
            Completa — dato accesible y bien documentado
          </span>
          <span className="results-col-legend-item">
            <span className="results-col-legend-dot" style={{ background: 'var(--gap-part)' }} />
            Parcial — incompleto o con restricciones
          </span>
          <span className="results-col-legend-item">
            <span className="results-col-legend-dot" style={{ background: 'var(--gap-crit)' }} />
            Nula — dato ausente o no sistematizado
          </span>
        </div>
      </div>
      <div className="results-col">
        <div className="results-col-header">
          <div>
            <div className="label-mono">Marcos normativos relevantes</div>
            <div style={{ fontSize: 10, color: 'var(--ink-light)', fontFamily: 'var(--mono)', marginTop: 2 }}>
              Leyes y normativas que regulan o exigen este tipo de dato
            </div>
          </div>
          <span className="results-col-count">{normativas.length}</span>
        </div>
        {normativas.length === 0
          ? <p className="results-empty">Sin normativas relacionadas</p>
          : normativas.map((hit, i) => (
              <HitRow key={hit.id} hit={hit} index={i} normalizedSim={normalize(hit)} />
            ))
        }
        <div className="results-col-legend">
          <span className="results-col-legend-item">
            <span className="results-col-legend-dot" style={{ background: 'var(--gap-cov)' }} />
            Completa — dato accesible y bien documentado
          </span>
          <span className="results-col-legend-item">
            <span className="results-col-legend-dot" style={{ background: 'var(--gap-part)' }} />
            Parcial — incompleto o con restricciones
          </span>
          <span className="results-col-legend-item">
            <span className="results-col-legend-dot" style={{ background: 'var(--gap-crit)' }} />
            Nula — dato ausente o no sistematizado
          </span>
        </div>
      </div>
    </div>
  )
}

// ── ChipsBar ──────────────────────────────────────────────────────────────────

const ADVOCACY_CHIPS = [
  'Gobierno Abierto',
  'DDHH',
  'Cooperación Digital',
  'Gobernanza Cooperativa',
]

function ChipsBar({ resultado, query, selected, onToggle }: {
  resultado: GapResult; query: string; selected: string[]; onToggle: (chip: string) => void
}) {
  const navigate = useNavigate()

  function handleDescargar() {
    navigate('/diagnostico', { state: { resultado, query, chips: selected } })
  }

  return (
    <div className="chips-bar">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span className="chips-bar-label">Termómetro de Incidencia</span>
        <span style={{ fontSize: 12, color: 'var(--ink-light)', fontFamily: 'var(--sans)' }}>
          Elegí los marcos de incidencia para personalizar el diagnóstico.
        </span>
      </div>
      <div className="chips-bar-row">
        {ADVOCACY_CHIPS.map(chip => {
          const isSelected = selected.includes(chip)
          return (
            <button
              key={chip}
              className={`chip${isSelected ? ' selected' : ''}`}
              onClick={() => onToggle(chip)}
            >
              {chip}
            </button>
          )
        })}
        <button
          className="btn-primary"
          style={{ marginLeft: 'auto', fontSize: 12, padding: '6px 14px' }}
          onClick={handleDescargar}
        >
          {selected.length > 0 ? `Descargar diagnóstico (${selected.length}) →` : 'Descargar diagnóstico →'}
        </button>
      </div>
    </div>
  )
}

// ── MonitorBrechas ────────────────────────────────────────────────────────────

export function MonitorBrechas() {
  const { isReady, error: indexError } = useSearchIndex()
  const { resultado, isLoading, error: searchError, buscar, limpiar } = useMotorBrechas()
  const { status: embedderStatus, progress: embedderProgress, error: embedderError } = useEmbedder()
  const [query, setQuery] = useState('')
  const [selectedChips, setSelectedChips] = useState<string[]>([])

  function toggleChip(chip: string) {
    setSelectedChips(prev =>
      prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip]
    )
  }

  const handleBuscar = () => {
    if (query.trim().length >= 5) {
      setSelectedChips([])
      buscar(query.trim())
    }
  }

  const handleLimpiar = () => {
    limpiar()
    setQuery('')
    setSelectedChips([])
  }

  if (embedderStatus === 'loading' || embedderStatus === 'error') {
    return (
      <main className="motor-page">
        <div className="container">
          <div className="hero">
            <p className="hero-eyebrow">Monitoreo de brechas</p>
            <h1>¿Qué datos nos <em>faltan</em>?</h1>
          </div>
          <div className="search-box" style={{ textAlign: 'center', padding: '2rem' }}>
            {embedderStatus === 'error' ? (
              <p className="search-error">{embedderError ?? 'Error cargando el modelo semántico'}</p>
            ) : (
              <>
                <p className="label-mono" style={{ marginBottom: 8 }}>{embedderProgress}</p>
                <div style={{
                  height: 4, background: 'var(--ink-faint)',
                  borderRadius: 2, overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', width: '60%',
                    background: 'var(--accent)',
                    borderRadius: 2,
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }} />
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="motor-page">
      <div className="container">
        <div className="hero">
          <p className="hero-eyebrow">Monitoreo de brechas</p>
          <h1>¿Qué datos nos <em>faltan</em>?</h1>
          <p className="hero-sub">
            Escribí una pregunta sobre datos de género que te interese. El monitor busca qué datos existen,
            qué exige la normativa vigente y dónde está la brecha de datos teniendo en cuenta tu info.
          </p>
          <div style={{
            marginTop: '1.25rem',
            padding: '.75rem 1rem',
            borderLeft: '3px solid var(--accent)',
            borderRadius: '0 var(--r) var(--r) 0',
            background: 'var(--paper)',
          }}>
            <p style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--accent)', letterSpacing: '.06em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 5 }}>
              * ¿Por qué te solicitamos una pregunta?
            </p>
            <p style={{ fontSize: 13, color: 'var(--ink-light)', lineHeight: 1.7, margin: 0 }}>
              El objetivo del monitor es poner en evidencia qué datos tenemos vs qué datos queremos.
              DCL pone la lupa en la primera instancia de cualquier proceso de recolección de datos,
              el problema detrás de esos datos. En el ciclo de datos esa primera fase se llama{' '}
              <em style={{ color: 'var(--ink-mid)' }}>problematización</em> y es allí donde queremos incidir.
            </p>
          </div>
        </div>

        <div className="motor-search">
          <SearchBox
            value={query}
            onChange={setQuery}
            onSearch={handleBuscar}
            onClear={handleLimpiar}
            isLoading={isLoading}
            isDisabled={!isReady || isLoading || query.trim().length < 5}
            indexError={indexError}
            isIndexReady={isReady}
          />
          {searchError && (
            <p className="search-error" style={{ marginTop: 8, borderRadius: 'var(--r)' }}>
              {searchError}
            </p>
          )}
        </div>
      </div>

      {resultado && (
        <div className="motor-results">
          <div className="motor-results-inner">
            <ScorePanel resultado={resultado} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <ResultadoMetaBand resultado={resultado} />
              <ResultsColumns resultado={resultado} selectedChips={selectedChips} />
              <ChipsBar resultado={resultado} query={query} selected={selectedChips} onToggle={toggleChip} />
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
