/**
 * Journal Module — Daily entries with mood tracking, streak counter, and AI reflection
 */
import { useState, useEffect } from 'react'

const MOODS = [
  { emoji: '🔥', label: 'Fired up',  value: 5, color: '#ef4444' },
  { emoji: '⚡', label: 'Energised', value: 4, color: '#f59e0b' },
  { emoji: '💧', label: 'Calm',      value: 3, color: '#00d4ff' },
  { emoji: '🌧️', label: 'Low',       value: 2, color: '#7c3aed' },
  { emoji: '💀', label: 'Drained',   value: 1, color: '#334155' },
]

function moodByValue(v) { return MOODS.find(m => m.value === v) || MOODS[2] }

function calcStreak(journals) {
  if (!journals.length) return 0
  const sorted = [...journals].sort((a, b) => b.date.localeCompare(a.date))
  let streak = 0
  let cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  for (const j of sorted) {
    const d = new Date(j.date)
    d.setHours(0, 0, 0, 0)
    const diff = Math.round((cursor - d) / 86400000)
    if (diff <= 1) { streak++; cursor = d } else break
  }
  return streak
}

export default function JournalModule({ state, dispatch }) {
  const [selectedId, setSelectedId] = useState(null)
  const [reflecting, setReflecting] = useState(false)
  const [newEntryDate] = useState(() => new Date().toISOString().slice(0, 10))

  const journals = state.journals || []
  const streak = calcStreak(journals)
  const entry = journals.find(j => j.id === selectedId)

  const createToday = () => {
    const existing = journals.find(j => j.date === newEntryDate)
    if (existing) { setSelectedId(existing.id); return }
    dispatch({ type: 'ADD_JOURNAL', date: newEntryDate })
  }

  useEffect(() => {
    if (journals.length && !selectedId) setSelectedId(journals[journals.length - 1].id)
  }, [journals.length])

  const reflect = async () => {
    if (!entry?.body || !state.apiKeys.claude) return
    setReflecting(true)
    try {
      const prompt = `You are a thoughtful, warm journaling coach. The user wrote this journal entry:\n\n"${entry.body}"\n\nTheir mood today: ${moodByValue(entry.mood || 3).label}.\n\nWrite a short, insightful reflection (3-4 sentences) that:\n1. Mirrors back what you heard\n2. Surfaces one deeper pattern or theme\n3. Offers one actionable question for them to sit with\n\nBe warm and direct. No bullet points.`
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': state.apiKeys.claude, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model: 'claude-opus-4-7', max_tokens: 400, messages: [{ role: 'user', content: prompt }] })
      })
      const data = await res.json()
      const reflection = data.content?.[0]?.text || 'Unable to generate reflection.'
      dispatch({ type: 'UPDATE_JOURNAL', id: entry.id, payload: { reflection } })
    } catch (e) {
      dispatch({ type: 'UPDATE_JOURNAL', id: entry.id, payload: { reflection: `Error: ${e.message}` } })
    }
    setReflecting(false)
  }

  return (
    <div style={{ display: 'flex', gap: 16, height: '100%' }}>
      {/* Sidebar */}
      <div style={{ width: 200, display: 'flex', flexDirection: 'column', gap: 8, borderRight: '1px solid rgba(236,72,153,0.1)', paddingRight: 16 }}>
        <div style={{ color: '#ec4899', fontSize: 12, letterSpacing: 2, fontWeight: 700 }}>◈ JOURNAL</div>

        {/* Streak */}
        <div style={{
          background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.2)',
          borderRadius: 6, padding: '10px 12px', textAlign: 'center'
        }}>
          <div style={{ fontSize: 28 }}>🔥</div>
          <div style={{ color: '#ec4899', fontSize: 20, fontWeight: 700 }}>{streak}</div>
          <div style={{ color: '#64748b', fontSize: 10, letterSpacing: 1 }}>DAY STREAK</div>
        </div>

        <button onClick={createToday} style={{
          background: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.3)',
          borderRadius: 6, color: '#ec4899', cursor: 'pointer', padding: '8px',
          fontSize: 11, letterSpacing: 1
        }}>
          + TODAY'S ENTRY
        </button>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[...journals].sort((a, b) => b.date.localeCompare(a.date)).map(j => {
            const mood = moodByValue(j.mood || 3)
            return (
              <div key={j.id} onClick={() => setSelectedId(j.id)} style={{
                padding: '8px 10px', borderRadius: 4, cursor: 'pointer',
                border: `1px solid ${selectedId === j.id ? 'rgba(236,72,153,0.4)' : 'transparent'}`,
                background: selectedId === j.id ? 'rgba(236,72,153,0.08)' : 'transparent',
                display: 'flex', alignItems: 'center', gap: 8
              }}>
                <span style={{ fontSize: 14 }}>{mood.emoji}</span>
                <div>
                  <div style={{ color: selectedId === j.id ? '#ec4899' : '#94a3b8', fontSize: 11, fontWeight: 600 }}>
                    {j.date}
                  </div>
                  <div style={{ color: '#334155', fontSize: 10 }}>
                    {j.body?.slice(0, 20) || 'Empty'}...
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {entry ? (
          <>
            {/* Mood picker */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#64748b', fontSize: 11 }}>MOOD:</span>
              {MOODS.map(m => (
                <button key={m.value} onClick={() => dispatch({ type: 'UPDATE_JOURNAL', id: entry.id, payload: { mood: m.value } })}
                  title={m.label}
                  style={{
                    fontSize: 18, background: 'none', border: 'none', cursor: 'pointer',
                    opacity: (entry.mood || 3) === m.value ? 1 : 0.3,
                    transform: (entry.mood || 3) === m.value ? 'scale(1.3)' : 'scale(1)',
                    transition: 'all 0.2s'
                  }}>
                  {m.emoji}
                </button>
              ))}
              <span style={{ color: '#334155', fontSize: 10, marginLeft: 4 }}>{entry.date}</span>
              <button onClick={() => dispatch({ type: 'DELETE_JOURNAL', id: entry.id })}
                style={{
                  marginLeft: 'auto', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 4, color: '#ef4444', cursor: 'pointer', padding: '3px 8px', fontSize: 10
                }}>
                DELETE
              </button>
            </div>

            <textarea
              value={entry.body || ''}
              onChange={e => dispatch({ type: 'UPDATE_JOURNAL', id: entry.id, payload: { body: e.target.value } })}
              placeholder="What happened today? What are you thinking about? What do you want to remember?&#10;&#10;Write freely — this is for you."
              style={{
                flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(236,72,153,0.1)',
                borderRadius: 6, color: '#e2e8f0', padding: '14px 16px', fontSize: 13,
                lineHeight: 2, resize: 'none', outline: 'none', minHeight: 200
              }}
            />

            {/* AI Reflection */}
            <div style={{ border: '1px solid rgba(236,72,153,0.15)', borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ color: '#ec4899', fontSize: 12, letterSpacing: 2, fontWeight: 700 }}>◈ AI REFLECTION</span>
                <button onClick={reflect}
                  disabled={!entry.body || !state.apiKeys.claude || reflecting}
                  style={{
                    marginLeft: 'auto', padding: '5px 14px',
                    background: state.apiKeys.claude ? 'rgba(236,72,153,0.15)' : 'rgba(100,116,139,0.1)',
                    border: `1px solid ${state.apiKeys.claude ? 'rgba(236,72,153,0.3)' : '#334155'}`,
                    borderRadius: 4, color: state.apiKeys.claude ? '#ec4899' : '#475569',
                    cursor: state.apiKeys.claude && !reflecting ? 'pointer' : 'not-allowed',
                    fontSize: 11, letterSpacing: 1
                  }}>
                  {reflecting ? 'REFLECTING...' : 'GENERATE ◈'}
                </button>
              </div>
              {!state.apiKeys.claude && (
                <div style={{ color: '#475569', fontSize: 12 }}>Add Claude API key in Config to enable AI reflections.</div>
              )}
              {entry.reflection ? (
                <div style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.8, fontStyle: 'italic' }}>
                  "{entry.reflection}"
                </div>
              ) : (
                <div style={{ color: '#1e3a5f', fontSize: 12 }}>
                  Write an entry and click Generate to receive an AI reflection.
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <div style={{ fontSize: 40 }}>📓</div>
            <div style={{ color: '#1e3a5f', fontSize: 13 }}>Click "Today's Entry" to begin journaling</div>
          </div>
        )}
      </div>
    </div>
  )
}
