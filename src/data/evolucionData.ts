export interface AgendaEvolucion {
  score: number
  criticas: number
  nuevas: number
}

export interface SemanaSnapshot {
  semana: number
  label: string
  total_preguntas: number
  brechas_criticas: number
  brechas_parciales: number
  brechas_cubiertas: number
  agendas: {
    tecnologica: AgendaEvolucion
    datos: AgendaEvolucion
    genero: AgendaEvolucion
  }
}

export const EVOLUCION_MOCK: SemanaSnapshot[] = [
  {
    semana: 0, label: 'Estado inicial', total_preguntas: 0,
    brechas_criticas: 42, brechas_parciales: 28, brechas_cubiertas: 8,
    agendas: {
      tecnologica: { score: 68, criticas: 12, nuevas:  0 },
      datos:       { score: 71, criticas: 17, nuevas:  0 },
      genero:      { score: 79, criticas: 13, nuevas:  0 },
    },
  },
  {
    semana: 1, label: 'Semana 1', total_preguntas: 18,
    brechas_criticas: 47, brechas_parciales: 31, brechas_cubiertas: 8,
    agendas: {
      tecnologica: { score: 70, criticas: 14, nuevas:  8 },
      datos:       { score: 73, criticas: 19, nuevas: 13 },
      genero:      { score: 81, criticas: 14, nuevas: 21 },
    },
  },
  {
    semana: 2, label: 'Semana 2', total_preguntas: 39,
    brechas_criticas: 54, brechas_parciales: 35, brechas_cubiertas: 9,
    agendas: {
      tecnologica: { score: 72, criticas: 16, nuevas: 12 },
      datos:       { score: 75, criticas: 22, nuevas: 19 },
      genero:      { score: 83, criticas: 16, nuevas: 34 },
    },
  },
  {
    semana: 3, label: 'Semana 3', total_preguntas: 62,
    brechas_criticas: 61, brechas_parciales: 38, brechas_cubiertas: 10,
    agendas: {
      tecnologica: { score: 69, criticas: 18, nuevas: 20 },
      datos:       { score: 74, criticas: 24, nuevas: 28 },
      genero:      { score: 85, criticas: 19, nuevas: 42 },
    },
  },
  {
    semana: 4, label: 'Semana 4', total_preguntas: 90,
    brechas_criticas: 71, brechas_parciales: 44, brechas_cubiertas: 11,
    agendas: {
      tecnologica: { score: 71, criticas: 21, nuevas: 34 },
      datos:       { score: 76, criticas: 28, nuevas: 51 },
      genero:      { score: 87, criticas: 22, nuevas: 81 },
    },
  },
]
