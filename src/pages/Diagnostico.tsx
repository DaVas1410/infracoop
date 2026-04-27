import { useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import type { GapResult } from '../types'

interface DiagnosticoState {
  resultado: GapResult
  query: string
  chips: string[]
}

const CHIP_CONTEXT: Record<string, { titulo: string; descripcion: string }> = {
  'Gobierno Abierto': {
    titulo: 'Diagnóstico para Gobierno Abierto',
    descripcion: 'En el marco de transparencia, rendición de cuentas y participación ciudadana, esta brecha señala datos que el Estado debería producir y publicar de forma abierta.',
  },
  'DDHH': {
    titulo: 'Diagnóstico desde DDHH',
    descripcion: 'Desde una perspectiva de derechos humanos, la ausencia de estos datos compromete la capacidad del Estado de cumplir sus obligaciones de producir evidencia sobre el goce efectivo de derechos.',
  },
  'Cooperación Digital': {
    titulo: 'Diagnóstico para Cooperación Digital',
    descripcion: 'En el contexto de la cooperación internacional para la gobernanza digital y los datos, esta brecha identifica áreas prioritarias donde se requiere apoyo técnico y financiero.',
  },
  'Gobernanza Cooperativa': {
    titulo: 'Diagnóstico para Gobernanza Cooperativa',
    descripcion: 'Bajo un modelo de datos cooperativos y gobernanza ciudadana, esta brecha señala la oportunidad de que las comunidades produzcan y controlen los datos que las representan.',
  },
}

export function Diagnostico() {
  const location = useLocation()
  const state = location.state as DiagnosticoState | null

  useEffect(() => {
    if (state) {
      const t = setTimeout(() => window.print(), 600)
      return () => clearTimeout(t)
    }
  }, [state])

  if (!state) {
    return (
      <div className="diagnostico-page">
        <Link to="/brechas" className="diagnostico-back">← Volver al motor</Link>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink-light)' }}>
          No hay diagnóstico para mostrar.
        </p>
      </div>
    )
  }

  const { resultado, query, chips } = state
  const pct = Math.round(resultado.score * 100)

  const reportTitulo = chips.length === 1
    ? CHIP_CONTEXT[chips[0]]?.titulo ?? 'Diagnóstico de incidencia'
    : chips.length > 1
      ? `Diagnóstico de incidencia — ${chips.join(', ')}`
      : 'Diagnóstico de incidencia'

  const chipContexts = chips
    .map(c => CHIP_CONTEXT[c])
    .filter(Boolean)
  const colorMap: Record<string, string> = {
    critica: 'var(--gap-crit)',
    parcial: 'var(--gap-part)',
    cubierta: 'var(--gap-cov)',
  }
  const color = colorMap[resultado.categoria]

  return (
    <div className="diagnostico-page">
      <Link to="/brechas" className="diagnostico-back">← Volver al motor</Link>

      <div className="diagnostico-logo">
        Infra<span>.</span>Coop
      </div>
      <div className="diagnostico-sub">Motor de brechas · {reportTitulo}</div>

      <div className="diagnostico-query">"{query}"</div>

      <div className="diagnostico-score-row">
        <div>
          <div className="diagnostico-score-num" style={{ color }}>{pct}</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-light)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
            score de brecha
          </div>
        </div>
        <span className={`gap-category-badge ${resultado.categoria}`} style={{ alignSelf: 'flex-start' }}>
          ● {resultado.categoria}
        </span>
        <div style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-light)', lineHeight: 1.6 }}>
          <div>Ag. Tecnológica: <strong style={{ color: 'var(--agenda-tec)' }}>{resultado.agendas.tecnologica}</strong></div>
          <div>Ag. de Datos: <strong style={{ color: 'var(--agenda-datos)' }}>{resultado.agendas.datos}</strong></div>
          <div>Ag. de Género: <strong style={{ color: 'var(--agenda-genero)' }}>{resultado.agendas.genero}</strong></div>
        </div>
      </div>

      {chips.length > 0 && (
        <div style={{ marginBottom: '1.75rem', padding: '1rem 1.25rem', background: 'var(--accent-bg, #EEEDFE)', borderRadius: 'var(--r)', borderLeft: '3px solid var(--accent)' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--accent)', marginBottom: '.6rem' }}>
            Agenda de incidencia
          </div>
          <div className="diagnostico-chips-row" style={{ marginBottom: chipContexts.length > 0 ? '.75rem' : 0 }}>
            {chips.map(c => <span key={c} className="diagnostico-chip">{c}</span>)}
          </div>
          {chipContexts.map((ctx, i) => (
            <p key={i} style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--ink-mid)', marginTop: i > 0 ? '.5rem' : 0 }}>
              {ctx.descripcion}
            </p>
          ))}
        </div>
      )}

      <div className="diagnostico-section-title">Datasets disponibles</div>
      {resultado.datasets.length === 0
        ? <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-light)' }}>Sin datasets relacionados</p>
        : resultado.datasets.map(hit => (
          <div key={hit.id} className="diagnostico-hit">
            <div className="diagnostico-hit-title">{hit.titulo}</div>
            <div className="diagnostico-hit-meta">
              {[hit.fuente, hit.pais, hit.anio].filter(Boolean).join(' · ')}
            </div>
          </div>
        ))
      }

      <div className="diagnostico-section-title">Marcos normativos</div>
      {resultado.normativas.length === 0
        ? <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-light)' }}>Sin normativas relacionadas</p>
        : resultado.normativas.map(hit => (
          <div key={hit.id} className="diagnostico-hit">
            <div className="diagnostico-hit-title">{hit.titulo}</div>
            <div className="diagnostico-hit-meta">
              {[hit.fuente, hit.pais].filter(Boolean).join(' · ')}
            </div>
          </div>
        ))
      }

      <div className="diagnostico-footer">
        <span>Data Cooperativas Latinas · Mozilla Fellowship 2024–2026</span>
        <span>Infra.Coop Motor de Brechas v0.4</span>
      </div>
    </div>
  )
}
