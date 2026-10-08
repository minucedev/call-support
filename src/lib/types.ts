export type Status = '' | 'red' | 'green' | 'blue' | 'yellow'
export type YN = '' | 'Y' | 'N'

export interface Answers {
  night: YN
  laptop: YN
  mip: YN
}

export interface Candidate {
  id: string
  name: string
  phone: string // raw, e.g. "p:+639260047366"
  score: string
  priority: string
  coverage: string
  email: string
  status: Status
  meetingSent: boolean
  notes: string
  answers: Answers
}

export const STATUS_LABEL: Record<Exclude<Status, ''>, string> = {
  red: 'Red - No answer',
  green: 'Green - Passed',
  blue: 'Blue - Failed',
  yellow: 'Yellow - Callback',
}

export const STATUS_KEYS: Exclude<Status, ''>[] = ['red', 'green', 'blue', 'yellow']

export const HEADERS = [
  'Name',
  'Phone',
  'Score (available evidence)',
  'Priority',
  'Evidence coverage',
  'Email',
  'Call connected',
  'Meeting link sent?',
  'Notes',
] as const
