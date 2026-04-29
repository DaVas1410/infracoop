import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'

interface LandingStats {
  datasets: number
  normativas: number
  preguntas: number
  isLoading: boolean
  error: string | null
}

export function useLandingStats(): LandingStats {
  const [datasets,   setDatasets]   = useState(0)
  const [normativas, setNormativas] = useState(0)
  const [preguntas,  setPreguntas]  = useState(0)
  const [isLoading,  setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)

  useEffect(() => {
    async function fetchCounts() {
      try {
        const [
          { count: ds },
          { count: nm },
          { count: pq },
        ] = await Promise.all([
          supabase.from('datasets').select('*', { count: 'exact', head: true }),
          supabase.from('normativas').select('*', { count: 'exact', head: true }),
          supabase.from('preguntas').select('*', { count: 'exact', head: true }),
        ])
        setDatasets(ds ?? 0)
        setNormativas(nm ?? 0)
        setPreguntas(pq ?? 0)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error cargando estadísticas')
      } finally {
        setLoading(false)
      }
    }
    fetchCounts()
  }, [])

  return { datasets, normativas, preguntas, isLoading, error }
}
