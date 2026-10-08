import { useEffect, useRef, useState } from 'react'
import { useStore } from './store'
import { Candidate, STATUS_KEYS, STATUS_LABEL } from './lib/types'
import { toCSV, toTSV } from './lib/export'
import { SCRIPT, fill } from './lib/script'

const BTN_TEXT: Record<(typeof STATUS_KEYS)[number], string> = {
  red: 'No answer',
  green: 'Passed / Final Interview',
  blue: 'Failed',
  yellow: 'Callback',
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

export default function App() {
  const store = useStore()
  const { list, current, candidate, caller } = store
  const [showImport, setShowImport] = useState(false)
  const [toast, setToast] = useState('')
  const restoreRef = useRef<HTMLInputElement>(null)

  const say = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(''), 2500)
  }

  // Keyboard: 1-4 rate, arrows navigate (ignored while typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || e.ctrlKey || e.metaKey || e.altKey) return
      if (showImport || !candidate) return
      const n = Number(e.key)
      if (n >= 1 && n <= 4) store.rate(STATUS_KEYS[n - 1])
      else if (e.key === 'ArrowRight') store.goto(current + 1)
      else if (e.key === 'ArrowLeft') store.goto(current - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!candidate || showImport) {
    return (
      <ImportScreen
        hasData={list.length > 0}
        onCancel={() => setShowImport(false)}
        onImport={(text, mode) => {
          const n = store.importText(text, mode)
          setShowImport(false)
          say(`Loaded ${n} candidates`)
        }}
      />
    )
  }

  const done = list.filter((c) => c.status).length

  const exportAll = async (onlyDone: boolean, kind: 'copy' | 'csv') => {
    const rows = onlyDone ? list.filter((c) => c.status) : list
    if (kind === 'csv') return download('call-results.csv', toCSV(rows), 'text/csv;charset=utf-8')
    say((await copy(toTSV(rows))) ? `Copied ${rows.length} rows, paste into the Sheet` : 'Copy failed')
  }

  return (
    <div className="app">
      <header className="top">
        <strong>Call Queue</strong>
        <input
          className="caller"
          placeholder="Your name"
          value={caller}
          onChange={(e) => store.setCaller(e.target.value)}
        />
        <span className="progress">
          {done}/{list.length} done
        </span>
        <span className="spacer" />
        <button className="primary" onClick={() => exportAll(false, 'copy')}>
          Copy results
        </button>
        <details className="more">
          <summary>More</summary>
          <div className="menu" onClick={(e) => (e.currentTarget.parentElement as HTMLDetailsElement).removeAttribute('open')}>
            <button onClick={() => exportAll(true, 'copy')}>Copy (called only)</button>
            <button onClick={() => exportAll(false, 'csv')}>Download CSV</button>
            <button onClick={() => setShowImport(true)}>Add / replace list</button>
            <button onClick={() => download('call-queue-backup.json', JSON.stringify(store.state), 'application/json')}>Backup</button>
            <button onClick={() => restoreRef.current?.click()}>Restore</button>
          </div>
        </details>
        <input
          ref={restoreRef}
          type="file"
          accept=".json"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (!f) return
            try {
              store.restore(await f.text())
              say('Restored')
            } catch {
              say('Invalid backup file')
            }
          }}
        />
      </header>
      {store.saveError && <div className="warn">Could not save to browser storage. Export your results now.</div>}

      <div className="main">
        <section className="info">
          <Info c={candidate} index={current} total={list.length} onCopy={async (t) => say((await copy(t)) ? 'Copied' : 'Copy failed')} />
        </section>

        <section className="script">
          <Script c={candidate} caller={caller} onAnswer={(f, v) => store.patch(candidate.id, { answers: { ...candidate.answers, [f]: candidate.answers[f] === v ? '' : v } })} />
        </section>

        <section className="result">
          <h3>Result</h3>
          {STATUS_KEYS.map((k, i) => (
            <button
              key={k}
              className={`status ${k} ${candidate.status === k ? 'on' : ''}`}
              onClick={() => store.rate(k)}
              title={STATUS_LABEL[k]}
            >
              <kbd>{i + 1}</kbd> {BTN_TEXT[k]}
            </button>
          ))}
          <label className="check">
            <input
              type="checkbox"
              checked={candidate.meetingSent}
              onChange={(e) => store.patch(candidate.id, { meetingSent: e.target.checked })}
            />
            Meeting link sent?
          </label>
          <label className="notes">
            Notes
            <textarea
              value={candidate.notes}
              onChange={(e) => store.patch(candidate.id, { notes: e.target.value })}
              placeholder="Optional notes"
            />
          </label>
          <div className="nav">
            <button onClick={() => store.goto(current - 1)} disabled={current === 0}>
              ← Prev
            </button>
            <button onClick={() => store.goto(current + 1)} disabled={current === list.length - 1}>
              Next →
            </button>
          </div>
        </section>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

function Info({ c, index, total, onCopy }: { c: Candidate; index: number; total: number; onCopy: (t: string) => void }) {
  const phone = c.phone.replace(/^p:/i, '').trim()
  const Field = ({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) => (
    <div className="field">
      <div className="label">{label}</div>
      {copyable && value ? (
        <button className="copyval" title="Click to copy" onClick={() => onCopy(value)}>
          {value}
        </button>
      ) : (
        <div className="val">{value || '-'}</div>
      )}
    </div>
  )
  return (
    <>
      <div className="counter">
        Candidate {index + 1} of {total}
      </div>
      <h1>{c.name}</h1>
      <Field label="Phone (click to copy)" value={phone} copyable />
      <Field label="Email (click to copy)" value={c.email} copyable />
      <div className="meta">
        <Field label="Score" value={c.score} />
        <Field label="Priority" value={c.priority} />
        <Field label="Evidence" value={c.coverage} />
      </div>
    </>
  )
}

function Script({ c, caller, onAnswer }: { c: Candidate; caller: string; onAnswer: (f: 'night' | 'laptop' | 'mip', v: 'Y' | 'N') => void }) {
  return (
    <>
      {SCRIPT.map((sec) => (
        <details key={sec.title} open={!sec.optional} className="sec">
          <summary>{sec.title}</summary>
          {sec.steps.map((st, i) => (
            <div key={i} className={`step ${st.kind}`}>
              {st.kind === 'hint' ? '→ ' : ''}
              {fill(st.text, c.name, caller)}
              {st.field && (
                <div className="yn">
                  {(['Y', 'N'] as const).map((v) => (
                    <button
                      key={v}
                      className={c.answers[st.field!] === v ? `on ${v}` : ''}
                      onClick={() => onAnswer(st.field!, v)}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </details>
      ))}
    </>
  )
}

function ImportScreen({ hasData, onImport, onCancel }: { hasData: boolean; onImport: (t: string, m: 'replace' | 'append') => void; onCancel: () => void }) {
  const [text, setText] = useState('')
  return (
    <div className="import">
      <h1>Call Queue</h1>
      <p>Copy the rows from Google Sheets (including the header row if you have it) and paste them here.</p>
      <textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste here…" />
      <div className="actions">
        {hasData ? (
          <>
            <button className="primary" disabled={!text.trim()} onClick={() => onImport(text, 'append')}>
              Add to current list (skip duplicates)
            </button>
            <button
              disabled={!text.trim()}
              onClick={() => confirm('Replace the whole list and all results?') && onImport(text, 'replace')}
            >
              Replace list
            </button>
            <button onClick={onCancel}>Cancel</button>
          </>
        ) : (
          <button className="primary" disabled={!text.trim()} onClick={() => onImport(text, 'replace')}>
            Load and start calling
          </button>
        )}
      </div>
    </div>
  )
}
