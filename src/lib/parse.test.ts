import { describe, expect, it } from 'vitest'
import { parseCandidates } from './parse'
import { toTSV } from './export'

const HEADER =
  'Name\tPhone\tScore (available evidence)\tPriority\tEvidence coverage\tEmail\tCall connected\tMeeting link sent?\tNotes'
const ROW1 = 'Cielo Leyson\tp:+639260047366\t96\tInterview first\t3/8 dimensions\tcieloleyson121@gmail.com\t\t\t'
const ROW2 = 'Marigold Saavedra\tp:09363445057\t79\tStrong pool\t3/8 dimensions\tizzmeau11@gmail.com\t\t\t'
const SAMPLE = [HEADER, ROW1, ROW2].join('\n')

describe('parse/export', () => {
  it('parses rows by header', () => {
    const l = parseCandidates(SAMPLE)
    expect(l).toHaveLength(2)
    expect(l[0].phone).toBe('p:+639260047366')
    expect(l[1].email).toBe('izzmeau11@gmail.com')
  })

  it('round-trips unchanged data', () => {
    expect(toTSV(parseCandidates(SAMPLE), true)).toBe(SAMPLE)
  })

  it('works without header and with short rows', () => {
    const l = parseCandidates('A B\tp:+63900\t10\tX\t3/8\ta@b.c')
    expect(l[0].name).toBe('A B')
    expect(l[0].email).toBe('a@b.c')
  })

  it('exports status, answers and notes, and re-imports status', () => {
    const l = parseCandidates(ROW1)
    l[0].status = 'green'
    l[0].answers.night = 'Y'
    l[0].notes = 'good'
    const cols = toTSV(l).split('\t')
    expect(cols[6]).toBe('Green - Passed')
    expect(cols[8]).toBe('Night: Y | good')
    expect(parseCandidates(toTSV(l))[0].status).toBe('green')
  })
})
