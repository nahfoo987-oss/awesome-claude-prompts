import { useState } from 'react'

const STATUS = { todo: '#484f58', 'in-progress': '#d29922', done: '#3fb950' }

async function callAI(prompt, key) {
  const res = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'claude', prompt, apiKey: key }) })
  const data = await res.json(); if (data.error) throw new Error(data.error); return data.text
}

export default function Goals({ state, dispatch }) {
  const [sel, setSel]     = useState(null)
  const [newGoal, setNewGoal] = useState('')
  const [newMs, setNewMs] = useState('')
  const [roadmap, setRoadmap] = useState('')
  const [loading, setLoading] = useState(false)

  const goal = state.goals.find(g => g.id === sel)

  const getAIRoadmap = async () => {
    if (!goal || !state.apiKeys?.claude) return
    setLoading(true)
    try { const t = await callAI(`Create a concise 5-step strategic roadmap for this goal:\n\nGoal: ${goal.title}\n${goal.description}`, state.apiKeys.claude); setRoadmap(t) }
    catch {}
    setLoading(false)
  }

  return (
    <div className="fade-in" style={{ display: 'flex', height: '100%', gap: 0 }}>

      {/* Sidebar */}
      <div style={{ width: 240, flexShrink: 0, borderRight: '1px solid #21262d', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#8b949e', marginBottom: 8 }}>Goals · {state.goals.length}</div>
        <input value={newGoal} onChange={e => setNewGoal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && newGoal.trim()) { dispatch({ type: 'ADD_GOAL', v: newGoal.trim() }); setNewGoal('') } }}
          placeholder="New goal (Enter)…"
          style={{ background: '#000', border: '1px solid #21262d', borderRadius: 8, color: '#e6edf3', padding: '7px 10px', fontSize: 13, outline: 'none', width: '100%' }} />
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {state.goals.map(g => (
            <button key={g.id} onClick={() => { setSel(g.id); setRoadmap('') }}
              style={{ padding: '9px 10px', borderRadius: 8, border: 'none', background: sel === g.id ? '#161b22' : 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s' }}
              onMouseEnter={e => { if (sel !== g.id) e.currentTarget.style.background = '#0d1117' }}
              onMouseLeave={e => { if (sel !== g.id) e.currentTarget.style.background = 'transparent' }}>
              <div style={{ fontSize: 13, color: '#e6edf3', fontWeight: sel === g.id ? 500 : 400 }}>{g.title}</div>
              <div style={{ height: 2, background: '#21262d', borderRadius: 2, marginTop: 6 }}>
                <div style={{ height: '100%', borderRadius: 2, width: `${g.progress}%`, background: '#2f81f7', transition: 'width 0.4s' }} />
              </div>
              <div style={{ fontSize: 11, color: STATUS[g.status], marginTop: 3 }}>{g.status} · {g.progress}%</div>
            </button>
          ))}
          {state.goals.length === 0 && <div style={{ color: '#484f58', fontSize: 12 }}>No goals yet.</div>}
        </div>
      </div>

      {/* Detail */}
      <div style={{ flex: 1, overflowY: 'auto', paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {goal ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: '#e6edf3' }}>{goal.title}</span>
              <select value={goal.status} onChange={e => dispatch({ type: 'UPD_GOAL', id: goal.id, v: { status: e.target.value } })}
                style={{ marginLeft: 'auto', background: '#0d1117', border: '1px solid #21262d', borderRadius: 6, color: '#8b949e', padding: '4px 8px', fontSize: 12, cursor: 'pointer' }}>
                {['todo','in-progress','done'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={() => { dispatch({ type: 'DEL_GOAL', id: goal.id }); setSel(null) }}
                style={{ padding: '4px 10px', background: 'transparent', border: '1px solid #21262d', borderRadius: 6, color: '#484f58', cursor: 'pointer', fontSize: 12 }}>delete</button>
            </div>

            <textarea value={goal.description} onChange={e => dispatch({ type: 'UPD_GOAL', id: goal.id, v: { description: e.target.value } })}
              placeholder="Add a description…"
              style={{ background: '#0d1117', border: '1px solid #21262d', borderRadius: 10, color: '#c9d1d9', padding: '12px 14px', fontSize: 13, lineHeight: 1.7, resize: 'none', outline: 'none', minHeight: 80, transition: 'border-color 0.15s' }}
              onFocus={e => e.target.style.borderColor = '#30363d'}
              onBlur={e => e.target.style.borderColor = '#21262d'} />

            {/* Milestones */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#484f58', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Milestones · {goal.progress}%</div>
              <div style={{ height: 3, background: '#21262d', borderRadius: 2, marginBottom: 10 }}>
                <div style={{ height: '100%', borderRadius: 2, width: `${goal.progress}%`, background: '#2f81f7', transition: 'width 0.5s' }} />
              </div>
              <input value={newMs} onChange={e => setNewMs(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && newMs.trim()) { dispatch({ type: 'ADD_MS', id: goal.id, v: newMs.trim() }); setNewMs('') } }}
                placeholder="Add milestone (Enter)…"
                style={{ background: '#000', border: '1px solid #21262d', borderRadius: 8, color: '#e6edf3', padding: '7px 10px', fontSize: 13, outline: 'none', width: '100%', marginBottom: 8 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {goal.milestones.map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#0d1117', border: '1px solid #21262d', borderRadius: 8 }}>
                    <input type="checkbox" checked={m.done} onChange={() => dispatch({ type: 'TOGGLE_MS', id: goal.id, mid: m.id })} style={{ cursor: 'pointer', accentColor: '#2f81f7', width: 14, height: 14 }} />
                    <span style={{ flex: 1, fontSize: 13, color: m.done ? '#484f58' : '#c9d1d9', textDecoration: m.done ? 'line-through' : 'none' }}>{m.text}</span>
                    <button onClick={() => dispatch({ type: 'DEL_MS', id: goal.id, mid: m.id })} style={{ background: 'none', border: 'none', color: '#484f58', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
                  </div>
                ))}
              </div>
            </div>

            {state.apiKeys?.claude && (
              <button onClick={getAIRoadmap} disabled={loading}
                style={{ alignSelf: 'flex-start', padding: '7px 16px', background: 'transparent', border: '1px solid #21262d', borderRadius: 8, color: '#8b949e', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 13, transition: 'border-color 0.15s' }}>
                {loading ? 'Generating…' : 'Generate roadmap'}
              </button>
            )}

            {roadmap && (
              <div style={{ background: '#0d1117', border: '1px solid #21262d', borderRadius: 10, padding: '14px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#484f58', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>Roadmap</div>
                <div style={{ fontSize: 13, color: '#c9d1d9', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{roadmap}</div>
              </div>
            )}
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#484f58', fontSize: 13 }}>
            Select or create a goal
          </div>
        )}
      </div>
    </div>
  )
}
