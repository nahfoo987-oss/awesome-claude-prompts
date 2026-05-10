import Head from 'next/head'
import { useState, useEffect, useReducer, useRef, useCallback, useMemo, createContext, useContext } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '../lib/supabase'
import Sidebar   from '../components/Sidebar'
import Home      from '../components/modules/Home'
import Advisor   from '../components/modules/Advisor'
import Notes     from '../components/modules/Notes'
import Journal   from '../components/modules/Journal'
import Goals     from '../components/modules/Goals'
import Agents    from '../components/modules/Agents'
import Settings  from '../components/modules/Settings'

// ─── State ────────────────────────────────────────────────────────────────────
const INIT = {
  notes: [], journals: [], goals: [],
  agentMessages: {}, synthHistory: [],
  apiKeys: { claude: '', gpt: '', gemini: '' },
  memories: [], graphNodes: [], graphLinks: [],
}

function reducer(s, a) {
  switch (a.type) {
    case 'LOAD':  return { ...s, ...a.v }
    case 'KEYS':  return { ...s, apiKeys: { ...s.apiKeys, ...a.v } }

    case 'ADD_NOTE': {
      const n = { id: Date.now(), title: a.v, body: '', tags: [], updated: Date.now() }
      return { ...s, notes: [...s.notes, n], graphNodes: [...s.graphNodes, { id: n.id, label: a.v, type: 'note', updated: Date.now() }] }
    }
    case 'UPD_NOTE': {
      const notes = s.notes.map(n => n.id === a.id ? { ...n, ...a.v, updated: Date.now() } : n)
      const note = notes.find(n => n.id === a.id)
      let nodes = s.graphNodes.map(nd => nd.id === a.id ? { ...nd, label: note?.title, updated: Date.now() } : nd)
      let links = s.graphLinks.filter(l => (typeof l.source === 'object' ? l.source.id : l.source) !== a.id)
      if (a.v.body) {
        const wlRe = /\[\[([^\]]+)\]\]/g; let m
        while ((m = wlRe.exec(a.v.body)) !== null) {
          const target = notes.find(n => n.title.toLowerCase() === m[1].toLowerCase())
          if (target) links = [...links, { source: a.id, target: target.id }]
        }
        const tags = [...new Set((a.v.body.match(/#(\w+)/g)||[]).map(t => t.slice(1)))]
        if (tags.length) { const idx = notes.findIndex(n => n.id === a.id); if (idx >= 0) notes[idx] = { ...notes[idx], tags } }
      }
      return { ...s, notes, graphNodes: nodes, graphLinks: links }
    }
    case 'DEL_NOTE': return { ...s, notes: s.notes.filter(n => n.id !== a.id), graphNodes: s.graphNodes.filter(n => n.id !== a.id), graphLinks: s.graphLinks.filter(l => l.source !== a.id && l.target !== a.id) }

    case 'ADD_JOURNAL': return { ...s, journals: [...s.journals, { id: Date.now(), date: a.v, body: '', mood: 3, reflection: '' }] }
    case 'UPD_JOURNAL': return { ...s, journals: s.journals.map(j => j.id === a.id ? { ...j, ...a.v } : j) }
    case 'DEL_JOURNAL': return { ...s, journals: s.journals.filter(j => j.id !== a.id) }

    case 'ADD_GOAL': return { ...s, goals: [...s.goals, { id: Date.now(), title: a.v, description: '', status: 'todo', progress: 0, milestones: [], created: Date.now() }] }
    case 'UPD_GOAL': return { ...s, goals: s.goals.map(g => g.id === a.id ? { ...g, ...a.v } : g) }
    case 'DEL_GOAL': return { ...s, goals: s.goals.filter(g => g.id !== a.id) }
    case 'ADD_MS':   return { ...s, goals: s.goals.map(g => g.id === a.id ? { ...g, milestones: [...g.milestones, { id: Date.now(), text: a.v, done: false }] } : g) }
    case 'TOGGLE_MS': {
      const goals = s.goals.map(g => {
        if (g.id !== a.id) return g
        const ms = g.milestones.map(m => m.id === a.mid ? { ...m, done: !m.done } : m)
        return { ...g, milestones: ms, progress: ms.length ? Math.round(ms.filter(m => m.done).length / ms.length * 100) : 0 }
      }); return { ...s, goals }
    }
    case 'DEL_MS': return { ...s, goals: s.goals.map(g => g.id === a.id ? { ...g, milestones: g.milestones.filter(m => m.id !== a.mid) } : g) }

    case 'AGENT_MSG': return { ...s, agentMessages: { ...s.agentMessages, [a.id]: [...(s.agentMessages[a.id]||[]), a.v] } }
    case 'CLEAR_AGENT': { const msgs = { ...s.agentMessages }; delete msgs[a.id]; return { ...s, agentMessages: msgs } }

    case 'ADD_MEMORY':  return { ...s, memories: [a.v, ...s.memories].slice(0, 10) }
    case 'DEL_MEMORY':  return { ...s, memories: s.memories.filter((_, i) => i !== a.i) }

    default: return s
  }
}

// ─── ElevenLabs speak ─────────────────────────────────────────────────────────
function useSpeak() {
  const [muted, setMuted] = useState(false)
  const audioRef = useRef(null)
  const speak = useCallback(async (text) => {
    if (muted || !text) return
    try {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
      const res = await fetch('/api/speak', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: text.slice(0, 800) }) })
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url); audioRef.current = audio; audio.play()
      audio.onended = () => URL.revokeObjectURL(url)
    } catch {}
  }, [muted])
  return { speak, muted, setMuted }
}

// ─── History module (inline, simple) ─────────────────────────────────────────
function History({ state }) {
  const [sel, setSel] = useState(null)
  const item = state.synthHistory?.[sel]
  return (
    <div className="fade-in" style={{ display: 'flex', height: '100%', gap: 0 }}>
      <div style={{ width: 260, flexShrink: 0, borderRight: '1px solid #21262d', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#8b949e', marginBottom: 8 }}>History · {state.synthHistory?.length || 0}</div>
        {(state.synthHistory || []).map((h, i) => (
          <button key={i} onClick={() => setSel(i)}
            style={{ padding: '8px 10px', borderRadius: 7, border: 'none', background: sel === i ? '#161b22' : 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s' }}
            onMouseEnter={e => { if (sel !== i) e.currentTarget.style.background = '#0d1117' }}
            onMouseLeave={e => { if (sel !== i) e.currentTarget.style.background = 'transparent' }}>
            <div style={{ fontSize: 12, color: '#c9d1d9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.prompt?.slice(0,50)}</div>
            <div style={{ fontSize: 10, color: '#484f58', marginTop: 2 }}>{new Date(h.ts).toLocaleString('en-GB')}</div>
          </button>
        ))}
        {!state.synthHistory?.length && <div style={{ color: '#484f58', fontSize: 12 }}>No sessions yet.</div>}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', paddingLeft: 20 }}>
        {item ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3', borderBottom: '1px solid #21262d', paddingBottom: 10 }}>{item.prompt}</div>
            {Object.entries(item.responses || {}).map(([model, text]) => (
              <div key={model} style={{ background: '#0d1117', border: '1px solid #21262d', borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#8b949e', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>{model}</div>
                <div style={{ fontSize: 13, color: '#c9d1d9', lineHeight: 1.7 }}>{text}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: '#484f58', fontSize: 13 }}>Select a session to review</div>
        )}
      </div>
    </div>
  )
}

// ─── Command palette ──────────────────────────────────────────────────────────
const PALETTE_ITEMS = [
  { label: 'Home',     id: 'home'    },
  { label: 'Advisor',  id: 'advisor' },
  { label: 'Notes',    id: 'notes'   },
  { label: 'Journal',  id: 'journal' },
  { label: 'Goals',    id: 'goals'   },
  { label: 'Agents',   id: 'agents'  },
  { label: 'History',  id: 'history' },
  { label: 'Settings', id: 'settings'},
]

function CommandPalette({ onNav, onClose }) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const inputRef = useRef(null)
  const items = q ? PALETTE_ITEMS.filter(i => i.label.toLowerCase().includes(q.toLowerCase())) : PALETTE_ITEMS
  useEffect(() => { inputRef.current?.focus() }, [])
  const run = item => { onNav(item.id); onClose() }
  const onKey = e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel(v => Math.min(v+1, items.length-1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSel(v => Math.max(v-1, 0)) }
    if (e.key === 'Enter' && items[sel]) run(items[sel])
    if (e.key === 'Escape') onClose()
  }
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 100 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 520, background: '#0d1117', border: '1px solid #30363d', borderRadius: 12, overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid #21262d' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#484f58" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input ref={inputRef} value={q} onChange={e => { setQ(e.target.value); setSel(0) }} onKeyDown={onKey}
            placeholder="Go to…"
            style={{ flex: 1, background: 'transparent', border: 'none', color: '#e6edf3', fontSize: 14, outline: 'none' }} />
          <kbd style={{ background: '#161b22', borderRadius: 4, padding: '2px 6px', fontSize: 11, color: '#484f58' }}>ESC</kbd>
        </div>
        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
          {items.map((item, i) => (
            <div key={item.id} onClick={() => run(item)} onMouseEnter={() => setSel(i)}
              style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', cursor: 'pointer', background: sel === i ? '#161b22' : 'transparent', borderLeft: sel === i ? '2px solid #2f81f7' : '2px solid transparent', fontSize: 13, color: sel === i ? '#e6edf3' : '#8b949e', transition: 'background 0.08s' }}>
              {item.label}
            </div>
          ))}
          {!items.length && <div style={{ padding: '16px', color: '#484f58', fontSize: 13 }}>No results</div>}
        </div>
      </div>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
const OrbRoom3D = dynamic(() => import('../components/OrbRoom3D'), { ssr: false })

export default function App() {
  const [s, dispatch]   = useReducer(reducer, INIT)
  const [session, setSession] = useState(null)
  const [ready, setReady]     = useState(false)
  const [mod, setMod]         = useState('home')
  const [showPalette, setShowPalette] = useState(false)
  const { speak, muted, setMuted }    = useSpeak()
  const supabase = useMemo(() => createClient(), [])
  const saveTimer = useRef(null)
  const bootDone = useRef(false)

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess)
      if (!sess) { window.location.href = '/login'; return }
      setReady(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, sess) => {
      setSession(sess)
      if (!sess) window.location.href = '/login'
    })
    return () => subscription.unsubscribe()
  }, [])

  // Load data
  useEffect(() => {
    if (!session?.user?.id) return
    supabase.from('user_state').select('data').eq('user_id', session.user.id).maybeSingle()
      .then(({ data }) => { if (data?.data) dispatch({ type: 'LOAD', v: data.data }); bootDone.current = true })
  }, [session?.user?.id])

  // Save data (debounced)
  useEffect(() => {
    if (!bootDone.current || !session?.user?.id) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      const { activeModule, theme, ...payload } = s
      supabase.from('user_state').upsert({ user_id: session.user.id, data: payload, updated_at: new Date().toISOString() })
    }, 1500)
    return () => clearTimeout(saveTimer.current)
  }, [s.notes, s.journals, s.goals, s.agentMessages, s.synthHistory, s.memories, s.apiKeys, s.graphNodes, s.graphLinks])

  // Keyboard shortcuts
  useEffect(() => {
    const h = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowPalette(v => !v) }
      if (e.key === 'Escape') setShowPalette(false)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  // Expose state for 3D graph
  useEffect(() => { if (typeof window !== 'undefined') window.__orbisState = s }, [s])

  if (!ready) return null

  const MODULE_LABEL = { home: 'Home', advisor: 'Advisor', notes: 'Notes', journal: 'Journal', goals: 'Goals', agents: 'Agents', history: 'History', orbs3d: '3D Graph', settings: 'Settings' }

  const renderModule = () => {
    switch (mod) {
      case 'home':     return <Home     state={s} onNav={setMod} />
      case 'advisor':  return <Advisor  state={s} speak={speak} />
      case 'notes':    return <Notes    state={s} dispatch={dispatch} />
      case 'journal':  return <Journal  state={s} dispatch={dispatch} />
      case 'goals':    return <Goals    state={s} dispatch={dispatch} />
      case 'agents':   return <Agents   state={s} dispatch={dispatch} speak={speak} />
      case 'history':  return <History  state={s} />
      case 'orbs3d':   return <OrbRoom3D />
      case 'settings': return <Settings state={s} dispatch={dispatch} session={session} supabase={supabase} />
      default:         return <Home     state={s} onNav={setMod} />
    }
  }

  return (
    <>
      <Head>
        <title>ORBIS</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {showPalette && <CommandPalette onNav={setMod} onClose={() => setShowPalette(false)} />}

      <Sidebar
        active={mod} onNav={setMod}
        user={session?.user}
        onLogout={async () => { await supabase.auth.signOut(); window.location.href = '/login' }}
        voiceMuted={muted} onVoiceToggle={() => setMuted(v => !v)}
      />

      <main style={{ marginLeft: 216, height: '100vh', display: 'flex', flexDirection: 'column', background: '#000' }}>
        {/* Topbar */}
        <div style={{ height: 46, borderBottom: '1px solid #21262d', display: 'flex', alignItems: 'center', paddingInline: 24, gap: 12, flexShrink: 0, background: '#0d1117' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3' }}>{MODULE_LABEL[mod]}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setShowPalette(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'transparent', border: '1px solid #21262d', borderRadius: 7, color: '#484f58', cursor: 'pointer', fontSize: 12 }}>
              <span>Go to</span>
              <kbd style={{ background: '#161b22', borderRadius: 3, padding: '1px 5px', fontSize: 10, color: '#484f58', fontFamily: 'monospace' }}>⌘K</kbd>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#3fb950' }} />
              <span style={{ fontSize: 11, color: '#484f58' }}>Connected</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: mod === 'notes' || mod === 'journal' || mod === 'agents' || mod === 'goals' || mod === 'orbs3d' || mod === 'history' ? '24px 24px 24px 24px' : 28 }}>
          {renderModule()}
        </div>
      </main>
    </>
  )
}
