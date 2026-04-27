import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../services/supabase'
import { aprobarFormulario, rechazarFormulario, aprobarNormativa, rechazarNormativa } from '../services/dataService'

export interface ItemRevision {
  id: string
  tipo: 'dataset' | 'normativa'
  titulo: string
  fuente: string | null
  pais: string | null
  status: string
  created_at: string
}

interface RevisionQueue {
  items: ItemRevision[]
  isLoading: boolean
  error: string | null
  aprobar: (item: ItemRevision) => Promise<void>
  rechazar: (item: ItemRevision) => Promise<void>
}

export function useRevisionQueue(): RevisionQueue {
  const [items, setItems]       = useState<ItemRevision[]>([])
  const [isLoading, setLoading] = useState(true)
  const [error, setError]       = useState<string | null>(null)

  async function fetchQueue() {
    setLoading(true)
    try {
      const [{ data: ds }, { data: nm }] = await Promise.all([
        supabase.from('formularios_en_revision')
          .select('id, titulo, fuente_organismo, pais_iso3, status, created_at')
          .neq('status', 'rechazado').order('created_at'),
        supabase.from('normativas_en_revision')
          .select('id, nombre, organismo_emisor, pais_alcance, status, created_at')
          .neq('status', 'rechazado').order('created_at'),
      ])
      const mapped: ItemRevision[] = [
        ...(ds ?? []).map(r => ({
          id: r.id, tipo: 'dataset' as const,
          titulo: r.titulo, fuente: r.fuente_organismo,
          pais: r.pais_iso3, status: r.status, created_at: r.created_at,
        })),
        ...(nm ?? []).map(r => ({
          id: r.id, tipo: 'normativa' as const,
          titulo: r.nombre, fuente: r.organismo_emisor,
          pais: r.pais_alcance, status: r.status, created_at: r.created_at,
        })),
      ]
      setItems(mapped.sort((a, b) => a.created_at.localeCompare(b.created_at)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando cola')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchQueue() }, [])

  const aprobar = useCallback(async (item: ItemRevision) => {
    if (item.tipo === 'dataset') await aprobarFormulario(item.id)
    else await aprobarNormativa(item.id)
    setItems(prev => prev.filter(i => i.id !== item.id))
  }, [])

  const rechazar = useCallback(async (item: ItemRevision) => {
    if (item.tipo === 'dataset') await rechazarFormulario(item.id)
    else await rechazarNormativa(item.id)
    setItems(prev => prev.filter(i => i.id !== item.id))
  }, [])

  return { items, isLoading, error, aprobar, rechazar }
}
