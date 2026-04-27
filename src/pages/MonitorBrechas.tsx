import { useState, useEffect } from 'react'
import { useMotorBrechas } from '../hooks/useMotorBrechas'
import { useSearchIndex } from '../context/SearchIndexContext'
import { useEmbedder } from '../context/EmbedderContext'
import type { GapResult, SearchHit } from '../types'

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

// ── HitRow ────────────────────────────────────────────────────────────────────

function HitRow({ hit, index, normalizedSim }: { hit: SearchHit; index: number; normalizedSim: number }) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), index * 60 + 100)
    return () => clearTimeout(t)
  }, [index])

  const barColor = hit.tipo === 'dataset' ? 'var(--accent)' : 'var(--agenda-genero)'

  return (
    <div
      className="hit-row"
      style={{ '--row-delay': `${index * 60}ms` } as React.CSSProperties}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
        <span className="hit-titulo">{hit.titulo}</span>
        {hit.calidad && (
          <span className={`gap-category-badge ${calidadClass[hit.calidad] ?? 'parcial'}`}
            style={{ flexShrink: 0, fontSize: 10 }}>
            {hit.calidad}
          </span>
        )}
      </div>
      <div className="hit-meta">
        {hit.fuente && <span>{hit.fuente}</span>}
        {hit.pais && <><span className="hit-meta-sep">·</span><span>{hit.pais}</span></>}
        {hit.anio && <><span className="hit-meta-sep">·</span><span>{hit.anio}</span></>}
      </div>
      <div className="hit-sim-wrap">
        <div className="hit-sim-track">
          <div
            className="hit-sim-bar"
            style={{
              width: animated ? `${normalizedSim * 100}%` : '0%',
              background: barColor,
              transition: `width 0.6s cubic-bezier(0.4,0,0.2,1) ${index * 60}ms`,
            }}
          />
        </div>
        <span className="hit-sim-pct" title="Similitud coseno con tu pregunta">
          {(hit.similitud * 100).toFixed(1)}%
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

      <div className="termometro-wrap">
        <div className="termometro-track">
          <div className="termometro-level" style={{ height: `${pct}%` }} />
          {[0, 50, 100].map(mark => (
            <div key={mark} style={{
              position: 'absolute',
              bottom: `${mark}%`,
              left: '100%',
              marginLeft: 4,
              fontSize: 9,
              fontFamily: 'var(--mono)',
              color: 'var(--ink-light)',
              transform: 'translateY(50%)',
              whiteSpace: 'nowrap',
            }}>{mark}</div>
          ))}
        </div>
        <span className="termometro-pct label-mono">{pct}%</span>
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

function ResultsColumns({ resultado }: { resultado: GapResult }) {
  const allHits = [...resultado.datasets, ...resultado.normativas]
  const maxSim = Math.max(...allHits.map(h => h.similitud), 0.001)
  const normalize = (h: SearchHit) => h.similitud / maxSim

  return (
    <div className="results-columns">
      <div className="results-col">
        <div className="results-col-header">
          <span className="label-mono">Datasets</span>
          <span className="results-col-count">{resultado.datasets.length}</span>
        </div>
        {resultado.datasets.length === 0
          ? <p className="results-empty">Sin datasets relacionados</p>
          : resultado.datasets.map((hit, i) => (
              <HitRow key={hit.id} hit={hit} index={i} normalizedSim={normalize(hit)} />
            ))
        }
      </div>
      <div className="results-col">
        <div className="results-col-header">
          <span className="label-mono">Normativas</span>
          <span className="results-col-count">{resultado.normativas.length}</span>
        </div>
        {resultado.normativas.length === 0
          ? <p className="results-empty">Sin normativas relacionadas</p>
          : resultado.normativas.map((hit, i) => (
              <HitRow key={hit.id} hit={hit} index={i} normalizedSim={normalize(hit)} />
            ))
        }
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

  const handleBuscar = () => {
    if (query.trim().length >= 5) buscar(query.trim())
  }

  const handleLimpiar = () => {
    limpiar()
    setQuery('')
  }

  if (embedderStatus === 'loading' || embedderStatus === 'error') {
    return (
      <main className="motor-page">
        <div className="container">
          <div className="hero">
            <p className="hero-eyebrow">Monitor de Brechas</p>
            <h1>¿Qué datos <em>faltan</em>?</h1>
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
          <p className="hero-eyebrow">Monitor de Brechas</p>
          <h1>¿Qué datos <em>faltan</em>?</h1>
          <p className="hero-sub">Escribe una pregunta sobre datos de género en América Latina.</p>
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
              <ResultsColumns resultado={resultado} />
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
