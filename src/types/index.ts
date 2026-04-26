export interface Dataset {
  id: string
  titulo: string
  fuente_organismo: string | null
  pais_iso3: string | null
  anio_publicacion: number | null
  subtema: string | null
  agendas: string[]
  calidad: 'Completa' | 'Parcial' | 'Nula' | null
  frecuencia: string | null
  desagregacion_geo: string | null
  accesibilidad_formato: string | null
  url_descarga: string | null
  url_valida: boolean
  descripcion_notas: string | null
  es_sintetico: boolean
  created_at: string
}

export interface Normativa {
  id: string
  nombre: string
  organismo_emisor: string | null
  tipo: string | null
  pais_alcance: string | null
  anio_adopcion: number | null
  articulo_numeral: string | null
  obligacion_datos: string | null
  agendas: string[]
  url_texto_oficial: string | null
  descripcion_notas: string | null
  es_sintetico: boolean
  created_at: string
}

export interface Pregunta {
  id: string
  texto: string
  fecha: string
  agenda_clasificada: string | null
  resultado_score: number | null
  datasets_encontrados: string[]
  es_sintetico: boolean
}

export interface FormularioData {
  titulo: string
  fuente_organismo: string
  pais_iso3: string
  anio_publicacion: number | null
  subtema: string
  agendas: string[]
  frecuencia: string
  desagregacion_geo: string
  accesibilidad_formato: string
  url_descarga: string
  descripcion_notas: string
  ingresado_por: string
}

export interface DatasetFilters {
  agenda?: string
  pais?: string
  calidad?: 'Completa' | 'Parcial' | 'Nula'
  sintetico?: boolean
}

export interface NormativaFilters {
  agenda?: string
  pais_alcance?: string
  sintetico?: boolean
}

export interface SearchHit {
  id: string
  titulo: string
  fuente: string | null
  pais: string | null
  anio: number | null
  calidad: string | null
  similitud: number
  tipo: 'dataset' | 'normativa'
  agendas: string[]
}

export interface AgendaScores {
  tecnologica: number
  datos: number
  genero: number
}

export interface GapResult {
  score: number
  categoria: 'critica' | 'parcial' | 'cubierta'
  titulo: string
  datasets: SearchHit[]
  normativas: SearchHit[]
  agendas: AgendaScores
}
