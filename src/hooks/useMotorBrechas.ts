import { useState, useCallback } from 'react'
import { useSearchIndex } from '../context/SearchIndexContext'
import { search } from '../services/searchService'
import { calcularScore, calcularAgendas, generarTitulo } from '../services/scoreService'
import { insertPregunta } from '../services/dataService'
import type { GapResult } from '../types'

interface MotorState {
  resultado: GapResult | null
  isLoading: boolean
  error: string | null
}

export function useMotorBrechas() {
  const { index } = useSearchIndex()
  const [state, setState] = useState<MotorState>({
    resultado: null,
    isLoading: false,
    error: null,
  })

  const buscar = useCallback(async (query: string) => {
    if (!index) return
    setState(s => ({ ...s, isLoading: true, error: null }))

    try {
      const hits = search(query, index)
      const { score, categoria } = calcularScore(hits.datasets, hits.normativas)
      const agendas = calcularAgendas(hits.datasets, hits.normativas, score)
      const titulo = generarTitulo(categoria, hits.datasets, hits.normativas)

      const resultado: GapResult = {
        score, categoria, titulo, agendas,
        datasets: hits.datasets,
        normativas: hits.normativas,
      }

      setState({ resultado, isLoading: false, error: null })

      insertPregunta(query, score, hits.datasets.map(h => h.id)).catch(() => {
        // fire-and-forget: no bloquea la UX
      })
    } catch (err) {
      setState({
        resultado: null,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Error al buscar',
      })
    }
  }, [index])

  const limpiar = useCallback(() => {
    setState({ resultado: null, isLoading: false, error: null })
  }, [])

  return { ...state, buscar, limpiar }
}
