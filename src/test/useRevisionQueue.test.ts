import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

vi.mock('../services/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

vi.mock('../services/dataService', () => ({
  aprobarFormulario: vi.fn().mockResolvedValue(undefined),
  rechazarFormulario: vi.fn().mockResolvedValue(undefined),
  aprobarNormativa: vi.fn().mockResolvedValue(undefined),
  rechazarNormativa: vi.fn().mockResolvedValue(undefined),
}))

import { supabase } from '../services/supabase'
import { aprobarFormulario, rechazarFormulario, aprobarNormativa, rechazarNormativa } from '../services/dataService'
import { useRevisionQueue } from '../hooks/useRevisionQueue'

const mockFormularios = [
  { id: 'f1', titulo: 'Dataset A', fuente_organismo: 'INE', pais_iso3: 'MEX', status: 'pendiente', created_at: '2026-04-01T00:00:00Z' },
  { id: 'f2', titulo: 'Dataset B', fuente_organismo: null, pais_iso3: 'ARG', status: 'pendiente', created_at: '2026-04-02T00:00:00Z' },
]
const mockNormativas = [
  { id: 'n1', nombre: 'Ley X', organismo_emisor: 'Congreso', pais_alcance: 'COL', status: 'pendiente', created_at: '2026-04-03T00:00:00Z' },
]

function makeChain(data: unknown[]) {
  return {
    select: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data, error: null }),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  ;(supabase.from as ReturnType<typeof vi.fn>)
    .mockReturnValueOnce(makeChain(mockFormularios))
    .mockReturnValueOnce(makeChain(mockNormativas))
})

describe('useRevisionQueue', () => {
  it('loads and maps items from both tables', async () => {
    const { result } = renderHook(() => useRevisionQueue())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.items).toHaveLength(3)
    expect(result.current.items[0]).toMatchObject({ id: 'f1', tipo: 'dataset', titulo: 'Dataset A', pais: 'MEX' })
    expect(result.current.items[2]).toMatchObject({ id: 'n1', tipo: 'normativa', titulo: 'Ley X' })
  })

  it('starts in loading state', () => {
    ;(supabase.from as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(makeChain(mockFormularios))
      .mockReturnValueOnce(makeChain(mockNormativas))
    const { result } = renderHook(() => useRevisionQueue())
    expect(result.current.isLoading).toBe(true)
  })

  it('aprobar dataset calls aprobarFormulario and removes item', async () => {
    const { result } = renderHook(() => useRevisionQueue())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.aprobar(result.current.items[0])
    })

    expect(aprobarFormulario).toHaveBeenCalledWith('f1')
    expect(result.current.items.find(i => i.id === 'f1')).toBeUndefined()
  })

  it('rechazar normativa calls rechazarNormativa and removes item', async () => {
    const { result } = renderHook(() => useRevisionQueue())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const normItem = result.current.items.find(i => i.tipo === 'normativa')!

    await act(async () => {
      await result.current.rechazar(normItem)
    })

    expect(rechazarNormativa).toHaveBeenCalledWith('n1')
    expect(result.current.items.find(i => i.id === 'n1')).toBeUndefined()
  })

  it('rechazar dataset calls rechazarFormulario', async () => {
    const { result } = renderHook(() => useRevisionQueue())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.rechazar(result.current.items[0])
    })

    expect(rechazarFormulario).toHaveBeenCalledWith('f1')
  })

  it('aprobar normativa calls aprobarNormativa', async () => {
    const { result } = renderHook(() => useRevisionQueue())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const normItem = result.current.items.find(i => i.tipo === 'normativa')!

    await act(async () => {
      await result.current.aprobar(normItem)
    })

    expect(aprobarNormativa).toHaveBeenCalledWith('n1')
  })
})
