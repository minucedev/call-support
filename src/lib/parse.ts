import { Candidate, HEADERS, Status } from './types'

/** Parse tab-separated text (Google Sheets clipboard), honouring "quoted" cells. */
export function parseTSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  const s = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (quoted) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          cell += '"'
          i++
        } else quoted = false
      } else cell += c
    } else if (c === '"' && cell === '') {
      quoted = true
    } else if (c === '\t') {
      row.push(cell)
      cell = ''
    } else if (c === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else cell += c
  }
  if (cell !== '' || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''))
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '')

const FIELD_BY_HEADER: Record<string, number> = Object.fromEntries(
  HEADERS.map((h, i) => [norm(h), i]),
)

export function statusFromText(v: string): Status {
  const t = v.trim().toLowerCase()
  if (t.startsWith('red')) return 'red'
  if (t.startsWith('green')) return 'green'
  if (t.startsWith('blue')) return 'blue'
  if (t.startsWith('yellow')) return 'yellow'
  return ''
}

let counter = 0
const newId = () => `${Date.now().toString(36)}-${(counter++).toString(36)}`

/** Phone digits only, for duplicate detection ("09.." and "+639.." match). */
export const phoneKey = (p: string) => p.replace(/\D/g, '').replace(/^0/, '63')

export function parseCandidates(text: string): Candidate[] {
  const rows = parseTSV(text)
  if (!rows.length) return []

  // Map pasted column index -> canonical column index, by header name when a header row exists.
  const first = rows[0].map(norm)
  const hasHeader = first.includes('name') && first.includes('phone')
  const colOf: number[] = hasHeader
    ? first.map((h) => (h in FIELD_BY_HEADER ? FIELD_BY_HEADER[h] : -1))
    : HEADERS.map((_, i) => i)
  const body = hasHeader ? rows.slice(1) : rows

  return body
    .map((r) => {
      const v: string[] = HEADERS.map(() => '')
      r.forEach((cell, i) => {
        const target = colOf[i]
        if (target !== undefined && target >= 0) v[target] = cell.trim()
      })
      const meeting = v[7].toLowerCase()
      const c: Candidate = {
        id: newId(),
        name: v[0],
        phone: v[1],
        score: v[2],
        priority: v[3],
        coverage: v[4],
        email: v[5],
        status: statusFromText(v[6]),
        meetingSent: ['y', 'yes', 'true', 'x'].includes(meeting),
        notes: v[8],
        answers: { night: '', laptop: '', mip: '' },
      }
      return c
    })
    .filter((c) => c.name || c.phone || c.email)
}
