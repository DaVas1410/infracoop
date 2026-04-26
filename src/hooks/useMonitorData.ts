import { useState, useEffect } from 'react'
import { getPreguntas } from '../services/dataService'
import { AGENDA_MONITOR, MAPA_TOPICS, type AgendaMonitor, type MapaTopic } from '../data/monitorData'

interface MonitorDataState {
  agendas: AgendaMonitor[]
  topics: MapaTopic[]
  totalPreguntas: number
  isReady: boolean
  error: string | null
}

export function useMonitorData(): MonitorDataState {
  const [state, setState] = useState<MonitorDataState>({
    agendas: AGENDA_MONITOR,
    topics: MAPA_TOPICS,
    totalPreguntas: 0,
    isReady: false,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    getPreguntas()
      .then(preguntas => {
        if (cancelled) return
        setState({
          agendas: AGENDA_MONITOR,
          topics: MAPA_TOPICS,
          totalPreguntas: preguntas.length,
          isReady: true,
          error: null,
        })
      })
      .catch(err => {
        if (cancelled) return
        setState(s => ({
          ...s,
          totalPreguntas: 0,
          isReady: true,
          error: err instanceof Error ? err.message : 'Error al cargar datos',
        }))
      })

    return () => { cancelled = true }
  }, [])

  return state
}
