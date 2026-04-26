import { supabase } from './supabase'
import type { Dataset, Normativa, Pregunta, FormularioData, DatasetFilters, NormativaFilters } from '../types'

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
): Promise<void> {
  const tabla = modo === 'directo' ? 'formularios_publicados' : 'formularios_en_revision'
  const payload = modo === 'revision'
    ? { ...formulario, status: 'pendiente' }
    : formulario

  const { error } = await supabase.from(tabla).insert(payload)
  if (error) throw new Error(error.message)
}
