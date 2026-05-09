/**
 * Goals & Roadmap Tracker — Kanban board with milestones, progress bars, AI roadmap generation
 */
import { useState } from 'react'

const STATUS_COLS = [
  { id: 'todo',   label: 'QUEUED',      color: '#64748b' },
  { id: 'active', label: 'IN PROGRESS', color: '#f97316' },
  { id: 'done',   label: 'COMPLETE',    color: '#00ff88' },
]

function ProgressBar({ value, color }) {
  return (
    <div style={{ height: 3, background: '#1e293b', borderRadius: 2, marginTop: 8 }}>
      <div style={{
        height: '100%', borderRadius: 2, transition: 'width 0.6s ease',
        width: `${Math.min(100, value)}%`, background: color,
        boxShadow: `0 0 6px ${color}88`
      }} />
    </div>
  )
}

function MilestoneList({ goal, dispatch }) {
  const [text, setText] = useState('')
  return (
    <div style={{ marginTop: 8 }}>
      {(goal.milestones || []).map(m => (
        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <button onClick={() => dispatch({ type: 'TOGGLE_MILESTONE', goalId: goal.id, milestoneId: m.id })}
            style={{
              width: 14, height: 14, borderRadius: 2, flexShrink: 0,
              border: `1px solid ${m.done ? '#00ff88' : '#334155'}`,
              background: m.done ? '#00ff8822' : 'transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
            {m.done && <span style={{ color: '#00ff88', fontSize: 9 }}>✓</span>}
          </button>
          <span style={{
            color: m.done ? '#334155' : '#94a3b8', fontSize: 11,
            textDecoration: m.done ? 'line-through' : 'none'
          }}>{m.text}</span>
          <button onClick={() => dispatch({ type: 'DELETE_MILESTONE', goalId: goal.id, milestoneId: m.id })}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#334155', cursor: 'pointer', fontSize: 10 }}>
            ×
          </button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
        <input value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && text.trim()) {
              dispatch({ type: 'ADD_MILESTONE', goalId: goal.id, text: text.trim() })
              setText('')
            }
          }}
          placeholder="Add milestone..."
          style={{
            flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid #1e293b',
            borderRadius: 3, color: '#94a3b8', padding: '4px 7px', fontSize: 10, outline: 'none'
          }}
        />
      </div>
    </div>
  )
}

function GoalCard({ goal, dispatch, colColor }) {
  const [expanded, setExpanded] = useState(false)
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false)
  const done = (goal.milestones || []).filter(m => m.done).length
  const total = (goal.milestones || []).length
  const progress = goal.progress ?? (total ? Math.round(done / total * 100) : 0)

  const generateRoadmap = async (apiKey) => {
    if (!apiKey || !goal.title) return
    setGeneratingRoadmap(true)
    try {
      const prompt = `For the goal "${goal.title}"${goal.description ? ` (${goal.description})` : ''}, generate exactly 5 concrete, actionable milestones as a numbered list (1. 2. 3. 4. 5.). Each milestone should be 5-10 words. No extra text.`
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model: 'claude-opus-4-7', max_tokens: 200, messages: [{ role: 'user', content: prompt }] })
      })
      const data = await res.json()
      const text = data.content?.[0]?.text || ''
      const milestones = text.split('\n')
        .filter(l => /^\d+\./.test(l.trim()))
        .map(l => l.replace(/^\d+\.\s*/, '').trim())
        .filter(Boolean)
      milestones.forEach(text => dispatch({ type: 'ADD_MILESTONE', goalId: goal.id, text }))
    } catch {}
    setGeneratingRoadmap(false)
  }

  return (
    <div style={{
      background: 'rgba(0,0,0,0.2)', border: `1px solid ${colColor}22`,
      borderRadius: 8, padding: 12, marginBottom: 8
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>{goal.title}</div>
          {goal.description && (
            <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>{goal.description}</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {STATUS_COLS.map(col => (
            <button key={col.id}
              onClick={() => dispatch({ type: 'UPDATE_GOAL', id: goal.id, payload: { status: col.id } })}
              style={{
                width: 8, height: 8, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: goal.status === col.id ? col.color : '#1e293b',
                boxShadow: goal.status === col.id ? `0 0 6px ${col.color}` : 'none'
              }} title={col.label} />
          ))}
          <button onClick={() => dispatch({ type: 'DELETE_GOAL', id: goal.id })}
            style={{ background: 'none', border: 'none', color: '#334155', cursor: 'pointer', fontSize: 12, marginLeft: 4 }}>
            ×
          </button>
        </div>
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, color: '#64748b' }}>
        <span>{total ? `${done}/${total} milestones` : 'No milestones'}</span>
        <span style={{ color: colColor }}>{progress}%</span>
      </div>
      <ProgressBar value={progress} color={colColor} />

      <button onClick={() => setExpanded(e => !e)} style={{
        background: 'none', border: 'none', color: '#475569', cursor: 'pointer',
        fontSize: 10, marginTop: 8, letterSpacing: 1, padding: 0
      }}>
        {expanded ? '▲ COLLAPSE' : '▼ MILESTONES'}
      </button>

      {expanded && (
        <>
          <MilestoneList goal={goal} dispatch={dispatch} />
          {window.__orbisState?.apiKeys?.claude && (
            <button onClick={() => generateRoadmap(window.__orbisState.apiKeys.claude)}
              disabled={generatingRoadmap}
              style={{
                marginTop: 8, width: '100%', padding: '5px',
                background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)',
                borderRadius: 4, color: '#f97316', cursor: 'pointer', fontSize: 10, letterSpacing: 1
              }}>
              {generatingRoadmap ? 'GENERATING...' : '◈ AI ROADMAP'}
            </button>
          )}
        </>
      )}
    </div>
  )
}

export default function GoalsModule({ state, dispatch }) {
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [adding, setAdding] = useState(false)

  const goals = state.goals || []

  const addGoal = () => {
    if (!newTitle.trim()) return
    dispatch({ type: 'ADD_GOAL', title: newTitle.trim(), description: newDesc.trim() })
    setNewTitle('')
    setNewDesc('')
    setAdding(false)
  }

  const totalDone = goals.filter(g => g.status === 'done').length
  const totalActive = goals.filter(g => g.status === 'active').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ color: '#f97316', fontSize: 13, letterSpacing: 2, fontWeight: 700 }}>◎ GOALS & ROADMAP</span>
        <span style={{ color: '#334155', fontSize: 11 }}>
          {totalActive} active · {totalDone} complete · {goals.length} total
        </span>
        <button onClick={() => setAdding(a => !a)} style={{
          marginLeft: 'auto', padding: '5px 14px',
          background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)',
          borderRadius: 4, color: '#f97316', cursor: 'pointer', fontSize: 11, letterSpacing: 1
        }}>
          {adding ? 'CANCEL' : '+ ADD GOAL'}
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div style={{
          background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.2)',
          borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 8
        }}>
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
            placeholder="Goal title..."
            style={{
              background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(249,115,22,0.2)',
              borderRadius: 4, color: '#e2e8f0', padding: '8px 10px', fontSize: 13, outline: 'none'
            }}
          />
          <input value={newDesc} onChange={e => setNewDesc(e.target.value)}
            placeholder="Description (optional)..."
            style={{
              background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(249,115,22,0.1)',
              borderRadius: 4, color: '#94a3b8', padding: '6px 10px', fontSize: 12, outline: 'none'
            }}
          />
          <button onClick={addGoal} style={{
            alignSelf: 'flex-end', padding: '6px 16px',
            background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)',
            borderRadius: 4, color: '#f97316', cursor: 'pointer', fontSize: 11
          }}>
            CREATE GOAL
          </button>
        </div>
      )}

      {/* Kanban */}
      <div style={{ display: 'flex', gap: 12, flex: 1, overflow: 'hidden' }}>
        {STATUS_COLS.map(col => {
          const colGoals = goals.filter(g => g.status === col.id)
          return (
            <div key={col.id} style={{
              flex: 1, display: 'flex', flexDirection: 'column', gap: 6,
              border: `1px solid ${col.color}18`, borderRadius: 8, padding: 12,
              background: `${col.color}04`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: col.color, boxShadow: `0 0 6px ${col.color}` }} />
                <span style={{ color: col.color, fontSize: 11, letterSpacing: 2, fontWeight: 700 }}>{col.label}</span>
                <span style={{ color: '#334155', fontSize: 10, marginLeft: 'auto' }}>{colGoals.length}</span>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {colGoals.length === 0 && (
                  <div style={{ color: '#1e3a5f', fontSize: 11, textAlign: 'center', marginTop: 20 }}>Empty</div>
                )}
                {colGoals.map(goal => (
                  <GoalCard key={goal.id} goal={goal} dispatch={dispatch} colColor={col.color} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
