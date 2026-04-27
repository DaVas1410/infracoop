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

function HitRow({ hit, index }: { hit: SearchHit; index: number }) {
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
              width: animated ? `${hit.similitud * 100}%` : '0%',
              background: barColor,
              transition: `width 0.6s cubic-bezier(0.4,0,0.2,1) ${index * 60}ms`,
            }}
          />
        </div>
        <span className="hit-sim-pct">{Math.round(hit.similitud * 100)}%</span>
      </div>
    </div>
  )
}

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
        <div className="score-label label-mono">score brecha</div>
      </div>
      <span className={`gap-category-badge ${resultado.categoria}`}>
        ● {resultado.categoria}
      </span>

      <div className="termometro-wrap">
        <div className="termometro-track">
          <div className="termometro-level" style={{ height: `${pct}%` }} />
        </div>
        <span className="termometro-pct label-mono">{pct}%</span>
      </div>

      <div className="agenda-score-list">
        {[
          { tipo: 'tecnologica', label: 'Ag. Tecnológica', val: resultado.agendas.tecnologica },
          { tipo: 'datos',       label: 'Ag. de Datos',    val: resultado.agendas.datos },
          { tipo: 'genero',      label: 'Ag. de Género',   val: resultado.agendas.genero },
        ].map(a => (
          <div key={a.tipo} className={`agenda-score-pill ${a.tipo}`}>
            <span className="label-mono" style={{ fontSize: 10 }}>{a.label}</span>
            <span className="agenda-score-num">{a.val}</span>
          </div>
        ))}
      </div>

      <p className="score-sintesis">{resultado.titulo}</p>
    </div>
  )
}

function ResultsColumns({ resultado }: { resultado: GapResult }) {
  return (
    <div className="results-columns">
      <div className="results-col">
        <div className="results-col-header">
          <span className="label-mono">Datasets</span>
          <span className="results-col-count">{resultado.datasets.length}</span>
        </div>
        {resultado.datasets.length === 0
          ? <p className="results-empty">Sin datasets relacionados</p>
          : resultado.datasets.map((hit, i) => <HitRow key={hit.id} hit={hit} index={i} />)
        }
      </div>
      <div className="results-col">
        <div className="results-col-header">
          <span className="label-mono">Normativas</span>
          <span className="results-col-count">{resultado.normativas.length}</span>
        </div>
        {resultado.normativas.length === 0
          ? <p className="results-empty">Sin normativas relacionadas</p>
          : resultado.normativas.map((hit, i) => <HitRow key={hit.id} hit={hit} index={i} />)
        }
      </div>
    </div>
  )
}

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
            <ResultsColumns resultado={resultado} />
          </div>
        </div>
      )}
    </main>
  )
}
