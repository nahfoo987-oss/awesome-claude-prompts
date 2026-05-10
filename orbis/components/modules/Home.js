import { useState, useEffect } from 'react'

export default function Home({ state, onNav }) {
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-GB', { hour12: false }))
      setDate(now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const stats = [
    { label: 'Notes',    value: state.notes.length,    mod: 'notes'   },
    { label: 'Journals', value: state.journals.length,  mod: 'journal' },
    { label: 'Goals',    value: state.goals.length,     mod: 'goals'   },
    { label: 'Memories', value: state.memories.length,  mod: 'settings'},
  ]

  const actions = [
    { label: 'Ask ORBIS',    desc: 'Multi-model AI advisor',    mod: 'advisor' },
    { label: 'New note',     desc: 'Add to your knowledge base', mod: 'notes'   },
    { label: 'Open journal', desc: 'Write today\'s entry',       mod: 'journal' },
    { label: 'Review goals', desc: 'Track your objectives',      mod: 'goals'   },
  ]

  return (
    <div className="fade-in" style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 12, color: '#8b949e', marginBottom: 4 }}>{date}</div>
          <div style={{ fontSize: 26, fontWeight: 600, color: '#e6edf3', letterSpacing: -0.5 }}>{greeting}.</div>
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 300, color: '#484f58', letterSpacing: 2 }}>{time}</div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {stats.map(s => (
          <button key={s.label} onClick={() => onNav(s.mod)}
            style={{ background: '#0d1117', border: '1px solid #21262d', borderRadius: 10, padding: '16px', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#30363d'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#21262d'}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#e6edf3', fontVariantNumeric: 'tabular-nums', marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#8b949e' }}>{s.label}</div>
          </button>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#484f58', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Quick actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {actions.map(a => (
            <button key={a.label} onClick={() => onNav(a.mod)}
              style={{ display: 'flex', gap: 12, alignItems: 'center', background: '#0d1117', border: '1px solid #21262d', borderRadius: 10, padding: '14px 16px', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#30363d'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#21262d'}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#e6edf3', marginBottom: 2 }}>{a.label}</div>
                <div style={{ fontSize: 12, color: '#8b949e' }}>{a.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent notes */}
      {state.notes.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#484f58', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Recent notes</div>
          <div style={{ border: '1px solid #21262d', borderRadius: 10, overflow: 'hidden' }}>
            {[...state.notes].sort((a, b) => b.updated - a.updated).slice(0, 5).map((n, i, arr) => (
              <button key={n.id} onClick={() => onNav('notes')}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'transparent', border: 'none', borderBottom: i < arr.length - 1 ? '1px solid #21262d' : 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#0d1117'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span style={{ fontSize: 13, color: '#c9d1d9', fontWeight: 400 }}>{n.title}</span>
                <span style={{ fontSize: 11, color: '#484f58' }}>{new Date(n.updated).toLocaleDateString('en-GB')}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Status */}
      <div style={{ display: 'flex', gap: 20, paddingTop: 4, borderTop: '1px solid #21262d' }}>
        {[
          { label: 'Supabase', ok: true },
          { label: 'Claude',   ok: !!state.apiKeys?.claude },
          { label: 'GPT',      ok: !!state.apiKeys?.gpt },
          { label: 'Gemini',   ok: !!state.apiKeys?.gemini },
        ].map(x => (
          <div key={x.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#484f58' }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: x.ok ? '#3fb950' : '#30363d' }} />
            {x.label}
          </div>
        ))}
      </div>
    </div>
  )
}
