import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { Dataset } from '../types'

const mockDatasets: Dataset[] = [
  { id: 'DS-001', titulo: 'ENDIREH 2021', fuente_organismo: 'INEGI',
    pais_iso3: 'MEX', anio_publicacion: 2021, subtema: null,
    agendas: ['Ag. Género'], calidad: 'Completa', frecuencia: null,
    desagregacion_geo: null, accesibilidad_formato: null, url_descarga: null,
    url_valida: true, descripcion_notas: null, es_sintetico: false,
    created_at: '2024-01-01T00:00:00Z', embedding: null },
]

vi.mock('../services/dataService', () => ({
  getDatasets: vi.fn().mockResolvedValue(mockDatasets),
  getNormativas: vi.fn().mockResolvedValue([]),
  getPreguntas: vi.fn().mockResolvedValue([]),
}))

vi.mock('../services/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

describe('useDatasets', () => {
  it('returns loading true initially, then data', async () => {
    const { useDatasets } = await import('../hooks/useDatasets')
    const { result } = renderHook(() => useDatasets())

    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.datasets).toEqual(mockDatasets)
    expect(result.current.error).toBeNull()
  })
})

describe('useNormativas', () => {
  it('returns loading true initially, then empty array', async () => {
    const { useNormativas } = await import('../hooks/useNormativas')
    const { result } = renderHook(() => useNormativas())

    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.normativas).toEqual([])
  })
})

import { supabase } from '../services/supabase'
import { useLandingStats } from '../hooks/useLandingStats'

describe('useLandingStats', () => {
  function makeCountChain(count: number) {
    return {
      select: vi.fn().mockResolvedValue({ count, error: null }),
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(supabase.from as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(makeCountChain(42))   // datasets
      .mockReturnValueOnce(makeCountChain(35))   // normativas
      .mockReturnValueOnce(makeCountChain(150))  // preguntas
  })

  it('returns dataset, normativa, and pregunta counts', async () => {
    const { result } = renderHook(() => useLandingStats())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.datasets).toBe(42)
    expect(result.current.normativas).toBe(35)
    expect(result.current.preguntas).toBe(150)
  })

  it('starts in loading state', () => {
    ;(supabase.from as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(makeCountChain(0))
      .mockReturnValueOnce(makeCountChain(0))
      .mockReturnValueOnce(makeCountChain(0))
    const { result } = renderHook(() => useLandingStats())
    expect(result.current.isLoading).toBe(true)
  })
})
