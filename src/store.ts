import { useCallback, useEffect, useRef, useState } from 'react'
import { Candidate, Status } from './lib/types'
import { parseCandidates, phoneKey } from './lib/parse'

const KEY = 'quick-routing:v1'

interface Saved {
  list: Candidate[]
  current: number
  caller: string
}

function load(): Saved {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw) as Saved
      if (Array.isArray(s.list)) return { list: s.list, current: s.current ?? 0, caller: s.caller ?? '' }
    }
  } catch {
    /* corrupted or blocked storage: start empty */
  }
  return { list: [], current: 0, caller: '' }
}

export function useStore() {
  const [state, setState] = useState<Saved>(load)
  const [saveError, setSaveError] = useState(false)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
      setSaveError(false)
    } catch {
      setSaveError(true)
    }
  }, [state])

  const { list, current, caller } = state
  const candidate: Candidate | undefined = list[current]

  const setCaller = useCallback((caller: string) => setState((s) => ({ ...s, caller })), [])

  const goto = useCallback(
    (i: number) =>
      setState((s) => ({ ...s, current: Math.max(0, Math.min(s.list.length - 1, i)) })),
    [],
  )

  const patch = useCallback((id: string, p: Partial<Candidate>) => {
    setState((s) => ({ ...s, list: s.list.map((c) => (c.id === id ? { ...c, ...p } : c)) }))
  }, [])

  /** Set the result for the current candidate and jump to the next one not yet rated. */
  const rate = useCallback((status: Exclude<Status, ''>) => {
    setState((s) => {
      const cur = s.list[s.current]
      if (!cur) return s
      const nextList = s.list.map((c) => (c.id === cur.id ? { ...c, status } : c))
      const n = nextList.length
      let next = s.current
      for (let k = 1; k <= n; k++) {
        const i = (s.current + k) % n
        if (i !== s.current && !nextList[i].status) {
          next = i
          break
        }
      }
      if (next === s.current && s.current < n - 1) next = s.current + 1
      return { ...s, list: nextList, current: next }
    })
  }, [])

  /** Returns how many rows were added (duplicates by phone/email are skipped when appending). */
  const stateRef = useRef(state)
  stateRef.current = state
  const importText = useCallback((text: string, mode: 'replace' | 'append') => {
    const parsed = parseCandidates(text)
    const cur = stateRef.current
    let fresh = parsed
    if (mode === 'append') {
      const seenPhone = new Set(cur.list.map((c) => phoneKey(c.phone)).filter(Boolean))
      const seenEmail = new Set(cur.list.map((c) => c.email.toLowerCase()).filter(Boolean))
      fresh = parsed.filter(
        (c) =>
          !(c.phone && seenPhone.has(phoneKey(c.phone))) &&
          !(c.email && seenEmail.has(c.email.toLowerCase())),
      )
    }
    setState((s) =>
      mode === 'replace' ? { ...s, list: fresh, current: 0 } : { ...s, list: [...s.list, ...fresh] },
    )
    return fresh.length
  }, [])

  const restore = useCallback((json: string) => {
    const s = JSON.parse(json) as Saved
    if (!Array.isArray(s.list)) throw new Error('Invalid backup')
    setState({ list: s.list, current: s.current ?? 0, caller: s.caller ?? '' })
  }, [])

  const clear = useCallback(() => setState((s) => ({ ...s, list: [], current: 0 })), [])

  return { list, current, caller, candidate, saveError, setCaller, goto, patch, rate, importText, restore, clear, state }
}
