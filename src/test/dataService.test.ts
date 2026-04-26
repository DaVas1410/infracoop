import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Dataset, Pregunta } from '../types'

const mockDatasets: Dataset[] = [
  {
    id: 'DS-001', titulo: 'ENDIREH 2021', fuente_organismo: 'INEGI',
    pais_iso3: 'MEX', anio_publicacion: 2021, subtema: 'violencia',
    agendas: ['Ag. Género', 'Ag. Datos'], calidad: 'Completa',
    frecuencia: 'Quinquenal', desagregacion_geo: 'Municipal',
    accesibilidad_formato: 'CSV', url_descarga: 'https://inegi.org.mx',
    url_valida: true, descripcion_notas: null, es_sintetico: false,
    created_at: '2024-01-01T00:00:00Z',
  },
]

// Chainable + thenable mock — works regardless of whether .eq()/.contains() are called
function makeQuery(result: { data: unknown; error: { message: string } | null }) {
  const q: Record<string, unknown> = {}
  const self = () => q
  q.select = vi.fn().mockReturnValue(q)
  q.eq = vi.fn().mockReturnValue(q)
  q.contains = vi.fn().mockReturnValue(q)
  q.gte = vi.fn().mockReturnValue(q)
  q.order = vi.fn().mockReturnValue(q)
  // thenable: makes `await query` resolve to `result`
  q.then = (resolve: (v: unknown) => void, _reject: unknown) => Promise.resolve(result).then(resolve)
  return q
}

const mockFrom = vi.fn()
vi.mock('../services/supabase', () => ({
  supabase: { from: mockFrom },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getDatasets', () => {
  it('returns datasets array', async () => {
    mockFrom.mockReturnValue(makeQuery({ data: mockDatasets, error: null }))
    const { getDatasets } = await import('../services/dataService')
    const result = await getDatasets()
    expect(result).toEqual(mockDatasets)
  })

  it('filters by synthetic flag from env', async () => {
    mockFrom.mockReturnValue(makeQuery({ data: [], error: null }))
    const { getDatasets } = await import('../services/dataService')
    await getDatasets()
    expect(mockFrom).toHaveBeenCalledWith('datasets')
  })

  it('throws on Supabase error', async () => {
    mockFrom.mockReturnValue(makeQuery({ data: null, error: { message: 'DB error' } }))
    const { getDatasets } = await import('../services/dataService')
    await expect(getDatasets()).rejects.toThrow('DB error')
  })
})

describe('insertPregunta', () => {
  it('inserts and returns the pregunta', async () => {
    const mockPregunta: Pregunta = {
      id: 'uuid-1', texto: 'datos feminicidio', fecha: '2026-01-01T00:00:00Z',
      agenda_clasificada: null, resultado_score: null, datasets_encontrados: [],
      es_sintetico: false,
    }
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockPregunta, error: null }),
        }),
      }),
    })
    const { insertPregunta } = await import('../services/dataService')
    const result = await insertPregunta('datos feminicidio')
    expect(result.texto).toBe('datos feminicidio')
  })
})

describe('submitFormulario', () => {
  it('inserts into formularios_publicados when mode is directo', async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    })
    const { submitFormulario } = await import('../services/dataService')
    const data = { titulo: 'Test', fuente_organismo: 'INEGI', pais_iso3: 'MEX',
      anio_publicacion: 2024, subtema: 'test', agendas: [], frecuencia: 'Anual',
      desagregacion_geo: 'Nacional', accesibilidad_formato: 'CSV',
      url_descarga: 'https://example.com', descripcion_notas: '', ingresado_por: 'test' }
    await submitFormulario(data, 'directo')
    expect(mockFrom).toHaveBeenCalledWith('formularios_publicados')
  })

  it('inserts into formularios_en_revision when mode is revision', async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    })
    const { submitFormulario } = await import('../services/dataService')
    const data = { titulo: 'Test', fuente_organismo: 'INEGI', pais_iso3: 'MEX',
      anio_publicacion: 2024, subtema: 'test', agendas: [], frecuencia: 'Anual',
      desagregacion_geo: 'Nacional', accesibilidad_formato: 'CSV',
      url_descarga: 'https://example.com', descripcion_notas: '', ingresado_por: 'test' }
    await submitFormulario(data, 'revision')
    expect(mockFrom).toHaveBeenCalledWith('formularios_en_revision')
  })
})
