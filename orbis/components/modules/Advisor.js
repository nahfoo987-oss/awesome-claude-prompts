import { useState, useRef } from 'react'

const ORBIS_SYSTEM = `You are ORBIS — an elite British executive intelligence and second brain. You think with razor-sharp precision, speak with measured authority, and advise with the gravitas of a seasoned Whitehall mandarin combined with the analytical rigour of a McKinsey partner.
Use British English. Be concise, structured, and intellectually fearless. Never pad or flatter.`

const MODELS = {
  claude: { name: 'Claude',  color: '#2f81f7' },
  gpt:    { name: 'GPT-4o',  color: '#8b949e' },
  gemini: { name: 'Gemini',  color: '#3fb950' },
}

function ragSearch(notes, journals, query) {
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  if (!words.length) return ''
  const score = t => words.reduce((a, w) => a + (t.toLowerCase().includes(w) ? 1 : 0), 0)
  const items = [
    ...notes.map(n => ({ text: `[Note: ${n.title}]\n${n.body}`, s: score(n.title + ' ' + n.body) })),
    ...journals.map(j => ({ text: `[Journal ${j.date}]\n${j.body}`, s: score(j.body) })),
  ].filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 3)
  if (!items.length) return ''
  return '--- Context from your knowledge base ---\n' + items.map(x => x.text).join('\n\n') + '\n---\n\n'
}

async function callAI(model, prompt, system, key) {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, system, apiKey: key }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data.text
}

function detectConflicts(responses) {
  const pairs = [[/\byes\b/i,/\bno\b/i],[/\bshould\b/i,/\bshouldn't\b/i],[/\bincreas/i,/\bdecreas/i]]
  const conflicts = []
  const keys = Object.keys(responses)
  for (let i = 0; i < keys.length; i++) for (let j = i+1; j < keys.length; j++) {
    const a = responses[keys[i]] || '', b = responses[keys[j]] || ''
    pairs.forEach(([pa, pb]) => {
      if ((pa.test(a) && pb.test(b)) || (pa.test(b) && pb.test(a)))
        conflicts.push(`${MODELS[keys[i]]?.name} vs ${MODELS[keys[j]]?.name}`)
    })
  }
  return [...new Set(conflicts)]
}

const btn = (active) => ({
  padding: '7px 16px', borderRadius: 8, border: `1px solid ${active ? '#2f81f7' : '#21262d'}`,
  background: active ? 'rgba(47,129,247,0.1)' : 'transparent',
  color: active ? '#2f81f7' : '#8b949e', cursor: 'pointer', fontSize: 13, fontWeight: 500,
  transition: 'all 0.15s',
})

export default function Advisor({ state, speak }) {
  const [prompt, setPrompt] = useState('')
  const [responses, setResponses] = useState({})
  const [loading, setLoading] = useState({})
  const [errors, setErrors] = useState({})
  const [rag, setRag] = useState(0)
  const [done, setDone] = useState(false)

  const hasAnyKey = state.apiKeys?.claude || state.apiKeys?.gpt || state.apiKeys?.gemini

  const run = async () => {
    if (!prompt.trim() || !hasAnyKey) return
    const ctx = ragSearch(state.notes || [], state.journals || [], prompt)
    setRag(ctx ? ctx.split('[').length - 1 : 0)
    const full = ctx + prompt
    setResponses({}); setErrors({}); setDone(false)

    const callers = []
    if (state.apiKeys?.claude) callers.push(['claude', () => callAI('claude', full, ORBIS_SYSTEM, state.apiKeys.claude)])
    if (state.apiKeys?.gpt)    callers.push(['gpt',    () => callAI('gpt',    full, null, state.apiKeys.gpt)])
    if (state.apiKeys?.gemini) callers.push(['gemini', () => callAI('gemini', full, null, state.apiKeys.gemini)])

    setLoading(Object.fromEntries(callers.map(([k]) => [k, true])))
    const results = {}

    await Promise.all(callers.map(async ([key, fn]) => {
      try {
        const text = await fn()
        results[key] = text
        setResponses(p => ({ ...p, [key]: text }))
      } catch (e) {
        setErrors(p => ({ ...p, [key]: e.message }))
      } finally {
        setLoading(p => ({ ...p, [key]: false }))
      }
    }))
    setDone(true)
    // Speak the Claude response if available
    if (results.claude && speak) speak(results.claude)
  }

  const conflicts = done ? detectConflicts(responses) : []
  const agree = Math.max(0, 100 - conflicts.length * 20)

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3' }}>Advisor</div>

      {/* Input */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && e.ctrlKey && run()}
          placeholder="Ask anything across all models… (Ctrl+Enter to submit)"
          style={{ background: '#0d1117', border: '1px solid #21262d', borderRadius: 10, color: '#e6edf3', padding: '12px 14px', fontSize: 13, lineHeight: 1.6, resize: 'vertical', minHeight: 72, outline: 'none', transition: 'border-color 0.15s' }}
          onFocus={e => e.target.style.borderColor = '#30363d'}
          onBlur={e => e.target.style.borderColor = '#21262d'}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {rag > 0 && <span style={{ fontSize: 11, color: '#3fb950' }}>{rag} context source(s) from your notes</span>}
          {!rag && <span />}
          {!hasAnyKey && <span style={{ fontSize: 11, color: '#d29922' }}>Add API keys in Settings to enable</span>}
          <button onClick={run} disabled={!prompt.trim() || !hasAnyKey || Object.values(loading).some(Boolean)}
            style={{ padding: '7px 20px', background: '#2f81f7', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', opacity: (!prompt.trim() || !hasAnyKey) ? 0.5 : 1, transition: 'opacity 0.15s' }}>
            {Object.values(loading).some(Boolean) ? 'Running…' : 'Query all'}
          </button>
        </div>
      </div>

      {/* Response columns */}
      <div style={{ display: 'flex', gap: 12, flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {Object.entries(MODELS).map(([key, cfg]) => (
          state.apiKeys?.[key] ? (
            <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, background: '#0d1117', border: '1px solid #21262d', borderRadius: 10, padding: 14, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: cfg.color }}>{cfg.name}</span>
                {loading[key] && <span style={{ fontSize: 11, color: '#484f58', marginLeft: 'auto' }}>Thinking…</span>}
              </div>
              <div style={{ flex: 1, overflowY: 'auto', fontSize: 13, lineHeight: 1.7, color: '#c9d1d9' }}>
                {errors[key]    && <span style={{ color: '#f85149' }}>{errors[key]}</span>}
                {responses[key] && responses[key]}
                {!loading[key] && !responses[key] && !errors[key] && <span style={{ color: '#484f58' }}>Waiting for query</span>}
              </div>
            </div>
          ) : null
        ))}
      </div>

      {/* Consensus */}
      {done && Object.keys(responses).length > 1 && (
        <div style={{ background: '#0d1117', border: '1px solid #21262d', borderRadius: 10, padding: '12px 14px', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#8b949e', marginBottom: 8 }}>
            <span style={{ fontWeight: 500 }}>Agreement</span>
            <span style={{ color: agree > 70 ? '#3fb950' : agree > 40 ? '#d29922' : '#f85149', fontWeight: 600 }}>{agree}%</span>
          </div>
          <div style={{ height: 3, background: '#21262d', borderRadius: 2 }}>
            <div style={{ height: '100%', borderRadius: 2, width: `${agree}%`, background: agree > 70 ? '#3fb950' : agree > 40 ? '#d29922' : '#f85149', transition: 'width 0.8s ease' }} />
          </div>
          {conflicts.length > 0 && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#d29922' }}>Conflicts: {conflicts.join(' · ')}</div>
          )}
        </div>
      )}
    </div>
  )
}
