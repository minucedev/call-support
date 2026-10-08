import { Candidate, HEADERS, STATUS_LABEL } from './types'

/** Notes column = Y/N answers prefix + free-text note. */
export function composeNotes(c: Candidate): string {
  const { night, laptop, mip } = c.answers
  const parts: string[] = []
  if (night) parts.push(`Night: ${night}`)
  if (laptop) parts.push(`Laptop: ${laptop}`)
  if (mip) parts.push(`MIP: ${mip}`)
  const prefix = parts.join(' | ')
  const note = c.notes.trim()
  return prefix && note ? `${prefix} | ${note}` : prefix || note
}

const cell = (s: string) => {
  const flat = s.replace(/\t/g, ' ')
  return /[\n"]/.test(flat) ? `"${flat.replace(/"/g, '""')}"` : flat
}

export function toRows(list: Candidate[]): string[][] {
  return list.map((c) => [
    c.name,
    c.phone,
    c.score,
    c.priority,
    c.coverage,
    c.email,
    c.status ? STATUS_LABEL[c.status] : '',
    c.meetingSent ? 'Y' : '',
    composeNotes(c),
  ])
}

/** TSV without header by default, so it pastes straight under the sheet's header row. */
export function toTSV(list: Candidate[], withHeader = false): string {
  const lines = toRows(list).map((r) => r.map(cell).join('\t'))
  if (withHeader) lines.unshift(HEADERS.join('\t'))
  return lines.join('\n')
}

const csvCell = (s: string) => `"${s.replace(/"/g, '""')}"`

export function toCSV(list: Candidate[]): string {
  const rows = [HEADERS as readonly string[], ...toRows(list)]
  return '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n')
}
