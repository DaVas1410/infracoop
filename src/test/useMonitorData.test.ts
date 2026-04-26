import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useMonitorData } from '../hooks/useMonitorData'

vi.mock('../services/dataService', () => ({
  getPreguntas: vi.fn().mockResolvedValue([
    { id: 'p1', texto: 'test', fecha: '2026-04-26T10:00:00Z',
      agenda_clasificada: 'genero', resultado_score: 0.8,
      datasets_encontrados: [], es_sintetico: false },
    { id: 'p2', texto: 'test2', fecha: '2026-04-26T11:00:00Z',
      agenda_clasificada: 'datos', resultado_score: 0.5,
      datasets_encontrados: [], es_sintetico: false },
  ]),
}))

describe('useMonitorData', () => {
  it('retorna agendas y tópicos de los datos mock', async () => {
    const { result } = renderHook(() => useMonitorData())
    await waitFor(() => expect(result.current.isReady).toBe(true))
    expect(result.current.agendas).toHaveLength(3)
    expect(result.current.topics).toHaveLength(5)
  })

  it('totalPreguntas incluye las preguntas cargadas de Supabase', async () => {
    const { result } = renderHook(() => useMonitorData())
    await waitFor(() => expect(result.current.isReady).toBe(true))
    expect(result.current.totalPreguntas).toBeGreaterThan(0)
  })

  it('error es null cuando todo está bien', async () => {
    const { result } = renderHook(() => useMonitorData())
    await waitFor(() => expect(result.current.isReady).toBe(true))
    expect(result.current.error).toBeNull()
  })
})
