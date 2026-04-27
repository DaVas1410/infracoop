import { useState } from 'react'
import { Layout } from '../components/Layout'
import { useRevisionQueue } from '../hooks/useRevisionQueue'
import type { ItemRevision } from '../hooks/useRevisionQueue'

export function Revisar() {
  const { items, isLoading, error, aprobar, rechazar } = useRevisionQueue()
  const [actionItem, setActionItem] = useState<string | null>(null)

  async function handleAprobar(item: ItemRevision) {
    setActionItem(item.id)
    await aprobar(item).catch(() => {})
    setActionItem(null)
  }

  async function handleRechazar(item: ItemRevision) {
    setActionItem(item.id)
    await rechazar(item).catch(() => {})
    setActionItem(null)
  }

  return (
    <Layout>
      <main className="container" style={{ paddingTop: '2rem' }}>
        <div className="hero">
          <p className="hero-eyebrow">Panel curatorial</p>
          <h1>Cola de <em>revisión</em></h1>
          <p className="hero-sub">
            {isLoading ? 'Cargando…' : `${items.length} ítems pendientes`}
          </p>
        </div>

        {error && (
          <p style={{ color: 'var(--warn)', fontFamily: 'var(--mono)', fontSize: 12 }}>{error}</p>
        )}

        {items.length === 0 && !isLoading && (
          <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink-light)' }}>
            — Cola vacía —
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
          {items.map(item => (
            <div key={item.id} style={{
              background: 'var(--surface)',
              border: '1px solid var(--ink-faint)',
              borderRadius: 'var(--r)',
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}>
              <span style={{
                fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase',
                color: item.tipo === 'dataset' ? 'var(--accent)' : 'var(--agenda-genero)',
                flexShrink: 0,
              }}>{item.tipo}</span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, marginBottom: 2 }}>{item.titulo}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-light)' }}>
                  {[item.fuente, item.pais].filter(Boolean).join(' · ')}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <button
                  className="btn-ghost"
                  style={{ color: 'var(--warn)', borderColor: 'var(--warn)' }}
                  disabled={actionItem === item.id}
                  onClick={() => handleRechazar(item)}
                >Rechazar</button>
                <button
                  className="btn-primary"
                  disabled={actionItem === item.id}
                  onClick={() => handleAprobar(item)}
                >Aprobar</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </Layout>
  )
}
