import { describe, it, expect, vi } from 'vitest'
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
