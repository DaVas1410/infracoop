export interface AgendaTopico {
  nombre: string
  count: number
}

export interface AgendaMonitor {
  id: 'tecnologica' | 'datos' | 'genero'
  label: string
  color: string
  colorBg: string
  barColor: string
  total: number
  preguntas_semana: number
  topicos: [AgendaTopico, AgendaTopico, AgendaTopico]
}

export interface MapaTopic {
  topic: string
  total: number
  score: number
  criticas: number
  parciales: number
  cubiertas: number
}

export const AGENDA_MONITOR: AgendaMonitor[] = [
  {
    id: 'tecnologica', label: 'Agenda Tecnológica',
    color: '#0C447C', colorBg: '#E6F1FB', barColor: '#378ADD',
    total: 34, preguntas_semana: 8,
    topicos: [
      { nombre: 'Brecha digital', count: 14 },
      { nombre: 'IA y sesgos', count: 11 },
      { nombre: 'Acceso a internet', count: 9 },
    ],
  },
  {
    id: 'datos', label: 'Agenda de Datos',
    color: '#3C3489', colorBg: '#EEEDFE', barColor: '#7F77DD',
    total: 51, preguntas_semana: 13,
    topicos: [
      { nombre: 'Calidad estadística', count: 19 },
      { nombre: 'Datos abiertos', count: 18 },
      { nombre: 'Marcos normativos', count: 14 },
    ],
  },
  {
    id: 'genero', label: 'Agenda de Género',
    color: '#72243E', colorBg: '#FBEAF0', barColor: '#D4537E',
    total: 81, preguntas_semana: 21,
    topicos: [
      { nombre: 'Salud reproductiva', count: 31 },
      { nombre: 'Violencia de género', count: 27 },
      { nombre: 'Justicia y litigios', count: 23 },
    ],
  },
]

export const MAPA_TOPICS: MapaTopic[] = [
  { topic: 'Salud reproductiva',   total: 48, score: 0.79, criticas: 31, parciales: 12, cubiertas: 5 },
  { topic: 'Violencia de género',  total: 35, score: 0.65, criticas: 19, parciales: 14, cubiertas: 2 },
  { topic: 'Justicia y litigios',  total: 22, score: 0.71, criticas: 14, parciales:  7, cubiertas: 1 },
  { topic: 'Interseccionalidad',   total: 18, score: 0.83, criticas: 15, parciales:  3, cubiertas: 0 },
  { topic: 'Tecnologías y datos',  total: 11, score: 0.58, criticas:  5, parciales:  6, cubiertas: 0 },
]
