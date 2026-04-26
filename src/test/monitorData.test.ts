import { describe, it, expect } from 'vitest'
import { AGENDA_MONITOR, MAPA_TOPICS } from '../data/monitorData'

describe('AGENDA_MONITOR', () => {
  it('tiene exactamente 3 agendas', () => {
    expect(AGENDA_MONITOR).toHaveLength(3)
  })

  it('cada agenda tiene id, label, color, barColor, total, preguntas_semana y topicos', () => {
    for (const a of AGENDA_MONITOR) {
      expect(a).toHaveProperty('id')
      expect(a).toHaveProperty('label')
      expect(a).toHaveProperty('color')
      expect(a).toHaveProperty('barColor')
      expect(a).toHaveProperty('total')
      expect(a).toHaveProperty('preguntas_semana')
      expect(a.topicos).toHaveLength(3)
    }
  })
})

describe('MAPA_TOPICS', () => {
  it('tiene exactamente 5 tópicos', () => {
    expect(MAPA_TOPICS).toHaveLength(5)
  })

  it('cada tópico tiene topic, total, score, criticas, parciales, cubiertas', () => {
    for (const t of MAPA_TOPICS) {
      expect(t).toHaveProperty('topic')
      expect(t).toHaveProperty('total')
      expect(typeof t.score).toBe('number')
      expect(t.score).toBeGreaterThanOrEqual(0)
      expect(t.score).toBeLessThanOrEqual(1)
      expect(t.criticas + t.parciales + t.cubiertas).toBe(t.total)
    }
  })
})
