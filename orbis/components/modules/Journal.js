import { useState } from 'react'

const ORBIS_SYSTEM = `You are ORBIS — a wise, concise British intelligence advisor. Provide brief, insightful journal reflections. Be direct and thoughtful.`

async function callAI(prompt, key) {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'claude', prompt, system: ORBIS_SYSTEM, apiKey: key }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data.text
}

export default function Journal({ state, dispatch }) {
  const [selected, setSelected] = useState(null)
  const [reflecting, setReflecting] = useState(false)

  const j = state.journals.find(x => x.id === selected)
  const today = new Date().toISOString().split('T')[0]

  const addToday = () => {
    if (!state.journals.find(jj => jj.date === today)) {
      dispatch({ type: 'ADD_JOURNAL', v: today })
    }
    const existing = state.journals.find(jj => jj.date === today)
    setSelected(existing?.id || Date.now())
  }

  const getReflection = async () => {
    if (!j?.body || !state.apiKeys?.claude) return
    setReflecting(true)
    try {
      const text = await callAI(`Provide a brief, insightful reflection on this journal entry:\n\n${j.body}`, state.apiKeys.claude)
      dispatch({ type: 'UPD_JOURNAL', id: j.id, v: { reflection: text } })
    } catch {}
    setReflecting(false)
  }

  return (
    <div className="fade-in" style={{ display: 'flex', height: '100%', gap: 0 }}>

      {/* Sidebar */}
      <div style={{ width: 200, flexShrink: 0, borderRight: '1px solid #21262d', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ padding: '0 0 10px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#8b949e', marginBottom: 8 }}>Journal</div>
          <button onClick={addToday}
            style={{ width: '100%', padding: '7px 10px', background: '#0d1117', border: '1px solid #21262d', borderRadius: 8, color: '#c9d1d9', cursor: 'pointer', fontSize: 13, textAlign: 'left' }}>
            + Today's entry
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[...state.journals].reverse().map(jj => (
            <button key={jj.id} onClick={() => setSelected(jj.id)}
              style={{ padding: '8px 10px', borderRadius: 7, border: 'none', background: selected === jj.id ? '#161b22' : 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s' }}
              onMouseEnter={e => { if (selected !== jj.id) e.currentTarget.style.background = '#0d1117' }}
              onMouseLeave={e => { if (selected !== jj.id) e.currentTarget.style.background = 'transparent' }}>
              <div style={{ fontSize: 13, color: selected === jj.id ? '#e6edf3' : '#c9d1d9' }}>{jj.date}</div>
              <div style={{ display: 'flex', gap: 3, marginTop: 3 }}>
                {[1,2,3,4,5].map(n => (
                  <div key={n} style={{ width: 5, height: 5, borderRadius: '50%', background: n <= jj.mood ? '#2f81f7' : '#21262d' }} />
                ))}
              </div>
            </button>
          ))}
          {state.journals.length === 0 && <div style={{ color: '#484f58', fontSize: 12, padding: '4px 0' }}>No entries yet.</div>}
        </div>
      </div>

      {/* Editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, paddingLeft: 24, overflow: 'hidden' }}>
        {j ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3' }}>{j.date}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => dispatch({ type: 'UPD_JOURNAL', id: j.id, v: { mood: n } })}
                    style={{ width: 18, height: 18, borderRadius: '50%', border: 'none', background: n <= j.mood ? '#2f81f7' : '#21262d', cursor: 'pointer', transition: 'background 0.15s' }} />
                ))}
              </div>
              <span style={{ fontSize: 11, color: '#484f58', marginLeft: 4 }}>mood</span>
              <button onClick={() => { dispatch({ type: 'DEL_JOURNAL', id: j.id }); setSelected(null) }}
                style={{ marginLeft: 'auto', padding: '4px 10px', background: 'transparent', border: '1px solid #21262d', borderRadius: 6, color: '#484f58', cursor: 'pointer', fontSize: 12 }}>
                delete
              </button>
            </div>

            <textarea value={j.body} onChange={e => dispatch({ type: 'UPD_JOURNAL', id: j.id, v: { body: e.target.value } })}
              placeholder="Write your thoughts…"
              style={{ flex: 1, background: '#0d1117', border: '1px solid #21262d', borderRadius: 10, color: '#c9d1d9', padding: '14px', fontSize: 13, lineHeight: 1.8, resize: 'none', outline: 'none', transition: 'border-color 0.15s' }}
              onFocus={e => e.target.style.borderColor = '#30363d'}
              onBlur={e => e.target.style.borderColor = '#21262d'} />

            {state.apiKeys?.claude && (
              <div style={{ flexShrink: 0 }}>
                <button onClick={getReflection} disabled={reflecting || !j.body}
                  style={{ padding: '7px 16px', background: 'transparent', border: '1px solid #21262d', borderRadius: 8, color: '#8b949e', cursor: reflecting ? 'not-allowed' : 'pointer', fontSize: 13, transition: 'border-color 0.15s' }}>
                  {reflecting ? 'Reflecting…' : 'Get ORBIS reflection'}
                </button>
              </div>
            )}

            {j.reflection && (
              <div style={{ flexShrink: 0, background: '#0d1117', border: '1px solid #21262d', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#484f58', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>Reflection</div>
                <div style={{ fontSize: 13, color: '#c9d1d9', lineHeight: 1.7 }}>{j.reflection}</div>
              </div>
            )}
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#484f58', fontSize: 13 }}>
            Select an entry or create today's
          </div>
        )}
      </div>
    </div>
  )
}
