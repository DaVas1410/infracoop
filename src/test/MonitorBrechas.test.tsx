import { describe, it, expect } from 'vitest'
import { normalizeSimToMax } from '../pages/MonitorBrechas'

describe('normalizeSimToMax', () => {
  it('maps the highest value to 1.0', () => {
    const hits = [{ similitud: 0.12 }, { similitud: 0.08 }, { similitud: 0.04 }]
    const norm = normalizeSimToMax(hits)
    expect(norm[0]).toBeCloseTo(1.0)
  })

  it('preserves relative ordering', () => {
    const hits = [{ similitud: 0.12 }, { similitud: 0.06 }, { similitud: 0.03 }]
    const norm = normalizeSimToMax(hits)
    expect(norm[0]).toBeGreaterThan(norm[1])
    expect(norm[1]).toBeGreaterThan(norm[2])
  })

  it('scales correctly: 0.06 / 0.12 = 0.5', () => {
    const hits = [{ similitud: 0.12 }, { similitud: 0.06 }]
    const norm = normalizeSimToMax(hits)
    expect(norm[1]).toBeCloseTo(0.5)
  })

  it('handles all-zero similitudes without dividing by zero', () => {
    const hits = [{ similitud: 0 }, { similitud: 0 }]
    const norm = normalizeSimToMax(hits)
    expect(norm[0]).toBe(0)
    expect(norm[1]).toBe(0)
  })

  it('handles empty array', () => {
    expect(normalizeSimToMax([])).toEqual([])
  })
})
