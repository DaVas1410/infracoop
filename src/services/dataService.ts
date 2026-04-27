import { supabase } from './supabase'
import type { Dataset, Normativa, Pregunta, FormularioData, NormativaFormData, DatasetFilters, NormativaFilters } from '../types'

const useSynthetic = import.meta.env.VITE_USE_SYNTHETIC_DATA === 'true'

export async function getDatasets(filters?: DatasetFilters): Promise<Dataset[]> {
  let query = supabase.from('datasets').select('*')

  if (!useSynthetic) {
    query = query.eq('es_sintetico', false)
  }
  if (filters?.agenda) {
    query = query.contains('agendas', [filters.agenda])
  }
  if (filters?.pais) {
    query = query.eq('pais_iso3', filters.pais)
  }
  if (filters?.calidad) {
    query = query.eq('calidad', filters.calidad)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data as Dataset[]) ?? []
}

export async function getNormativas(filters?: NormativaFilters): Promise<Normativa[]> {
  let query = supabase.from('normativas').select('*')

  if (!useSynthetic) {
    query = query.eq('es_sintetico', false)
  }
  if (filters?.agenda) {
    query = query.contains('agendas', [filters.agenda])
  }
  if (filters?.pais_alcance) {
    query = query.eq('pais_alcance', filters.pais_alcance)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data as Normativa[]) ?? []
}

export async function getPreguntas(desde?: string): Promise<Pregunta[]> {
  let query = supabase.from('preguntas').select('*').order('fecha', { ascending: false })

  if (desde) {
    query = query.gte('fecha', desde)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data as Pregunta[]) ?? []
}

export async function insertPregunta(
  texto: string,
  score?: number,
  datasetsEncontrados?: string[]
): Promise<Pregunta> {
  const { data, error } = await supabase
    .from('preguntas')
    .insert({
      texto,
      ...(score != null && { resultado_score: score }),
      ...(datasetsEncontrados?.length && { datasets_encontrados: datasetsEncontrados }),
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Pregunta
}

export async function submitFormulario(
  formulario: FormularioData,
  modo: 'directo' | 'revision'
): Promise<string | null> {
  const tabla = modo === 'directo' ? 'formularios_publicados' : 'formularios_en_revision'
  const payload = modo === 'revision'
    ? { ...formulario, status: 'pendiente' }
    : formulario

  if (modo === 'directo') {
    const { data, error } = await supabase.from(tabla).insert(payload).select('id').single()
    if (error) throw new Error(error.message)
    return (data as { id: string }).id
  }

  const { error } = await supabase.from(tabla).insert(payload)
  if (error) throw new Error(error.message)
  return null
}

export async function submitNormativa(
  normativa: NormativaFormData,
  modo: 'directo' | 'revision'
): Promise<string | null> {
  const tabla = modo === 'directo' ? 'normativas' : 'normativas_en_revision'
  const payload = modo === 'revision'
    ? { ...normativa, status: 'pendiente' }
    : normativa

  if (modo === 'directo') {
    const { data, error } = await supabase.from(tabla).insert(payload).select('id').single()
    if (error) throw new Error(error.message)
    return (data as { id: string }).id
  }

  const { error } = await supabase.from(tabla).insert(payload)
  if (error) throw new Error(error.message)
  return null
}

export async function updateEmbedding(
  tabla: 'datasets' | 'normativas',
  id: string,
  embedding: number[]
): Promise<void> {
  const { error } = await supabase
    .from(tabla)
    .update({ embedding })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function aprobarFormulario(id: string): Promise<void> {
  const { data, error: readErr } = await supabase
    .from('formularios_en_revision').select('*').eq('id', id).single()
  if (readErr || !data) throw new Error(readErr?.message ?? 'No encontrado')

  const { status: _s, ...payload } = data as Record<string, unknown>
  const { error: insErr } = await supabase.from('formularios_publicados').insert(payload)
  if (insErr) throw new Error(insErr.message)

  await supabase.from('formularios_en_revision').delete().eq('id', id)
}

export async function rechazarFormulario(id: string): Promise<void> {
  const { error } = await supabase
    .from('formularios_en_revision').update({ status: 'rechazado' }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function aprobarNormativa(id: string): Promise<void> {
  const { data, error: readErr } = await supabase
    .from('normativas_en_revision').select('*').eq('id', id).single()
  if (readErr || !data) throw new Error(readErr?.message ?? 'No encontrado')

  const { status: _s, ...payload } = data as Record<string, unknown>
  const { error: insErr } = await supabase.from('normativas').insert(payload)
  if (insErr) throw new Error(insErr.message)

  await supabase.from('normativas_en_revision').delete().eq('id', id)
}

export async function rechazarNormativa(id: string): Promise<void> {
  const { error } = await supabase
    .from('normativas_en_revision').update({ status: 'rechazado' }).eq('id', id)
  if (error) throw new Error(error.message)
}
