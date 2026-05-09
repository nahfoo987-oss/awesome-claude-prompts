/**
 * ORBIS — Neural Intelligence Interface  v5.0
 * Full-stack: Supabase auth + persistence · Streaming Claude · RAG · Memory
 * Knowledge Graph · Multi-AI Synthesis · Journal · Goals · Named Agents · 3D Orb Room
 */

import Head from 'next/head'
import { useState, useEffect, useRef, useCallback, useReducer, createContext, useContext, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '../lib/supabase'

// ─── ORBIS System Prompt ───────────────────────────────────────────────────────
const ORBIS_SYSTEM = `You are ORBIS — an elite British executive intelligence and second brain. You think with razor-sharp precision, speak with measured authority, and advise with the gravitas of a seasoned Whitehall mandarin combined with the analytical rigour of a McKinsey partner.

Your personality:
- Laconic yet profound. Every word earns its place.
- Intellectually fearless. You challenge assumptions with evidence, not opinion.
- Strategically minded. You see three moves ahead and name the hidden variables others miss.
- Diplomatically direct. You deliver uncomfortable truths with composed confidence.

Your capabilities:
- Synthesise complex, multi-domain information into clear executive insights
- Identify second and third-order consequences of decisions
- Draw on history, philosophy, science, and strategy in equal measure
- Detect cognitive biases and logical fallacies without condescension
- Produce structured analyses, decision frameworks, and roadmaps on demand

Your style:
- Use British English spelling and idiom
- Prefer structured responses with clear hierarchy when complexity demands it
- Never pad. Never hedge needlessly. Never flatter.
- When you lack information, say so plainly — then outline how to obtain it.

You are the user's most trusted advisor. Act accordingly.`

// ─── Utilities ─────────────────────────────────────────────────────────────────
const STOP = new Set(['the','a','an','is','in','it','of','to','and','or','for','on','at','by','with','that','this','was','are','be','from','as','have','has','had','been','will','would','could','should'])

function extractKeywords(text) {
  return [...new Set(
    text.toLowerCase().replace(/[^a-z\s]/g,'').split(/\s+/)
      .filter(w => w.length > 4 && !STOP.has(w))
  )].slice(0, 6)
}

function ragSearch(notes, journals, query) {
  const qw = query.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  if (!qw.length) return { ctx: '', count: 0 }
  const score = (text) => qw.reduce((acc, w) => acc + (text.toLowerCase().includes(w) ? 1 : 0), 0)
  const items = [
    ...notes.map(n => ({ text: `[NOTE: ${n.title}]\n${n.body}`, s: score(n.title + ' ' + n.body) })),
    ...journals.map(j => ({ text: `[JOURNAL ${j.date}]\n${j.body}`, s: score(j.body) })),
  ].filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 3)
  if (!items.length) return { ctx: '', count: 0 }
  return { ctx: '--- RELEVANT CONTEXT FROM YOUR KNOWLEDGE BASE ---\n' + items.map(x => x.text).join('\n\n') + '\n---\n\n', count: items.length }
}

// ─── State ────────────────────────────────────────────────────────────────────
const Ctx = createContext(null)
const useOrbis = () => useContext(Ctx)

const INIT = {
  activeModule: 'home',
  notes: [], journals: [], goals: [],
  customAgents: [], agentMessages: {},
  apiKeys: { claude: '', gpt: '', gemini: '' },
  synthHistory: [], graphNodes: [], graphLinks: [],
  memories: [],
  theme: { mouseX: 0.5, mouseY: 0.5 },
  bootDone: false,
}

function reducer(s, a) {
  switch (a.type) {
    case 'LOAD':  return { ...s, ...a.v }
    case 'BOOT':  return { ...s, bootDone: true }
    case 'MOD':   return { ...s, activeModule: a.v }
    case 'KEYS':  return { ...s, apiKeys: { ...s.apiKeys, ...a.v } }
    case 'THEME': return { ...s, theme: a.v }

    case 'ADD_NOTE': {
      const n = { id: Date.now(), title: a.v, body: '', tags: [], updated: Date.now() }
      return { ...s, notes: [...s.notes, n], graphNodes: [...s.graphNodes, { id: n.id, label: a.v, size: 6, updated: Date.now() }] }
    }
    case 'UPD_NOTE': {
      const notes = s.notes.map(n => n.id === a.id ? { ...n, ...a.v, updated: Date.now() } : n)
      const title = notes.find(n => n.id === a.id)?.title
      let nodes = s.graphNodes.map(nd => nd.id === a.id ? { ...nd, label: title, updated: Date.now() } : nd)
      let links = s.graphLinks
      if (a.v.body) {
        extractKeywords(a.v.body).forEach(kw => {
          const kwId = `kw_${kw}`
          if (!nodes.find(n => n.id === kwId)) nodes = [...nodes, { id: kwId, label: kw, type: 'keyword', size: 4, updated: Date.now() }]
          if (!links.find(l => l.source === a.id && l.target === kwId)) links = [...links, { source: a.id, target: kwId }]
        })
      }
      return { ...s, notes, graphNodes: nodes, graphLinks: links }
    }
    case 'DEL_NOTE': return {
      ...s, notes: s.notes.filter(n => n.id !== a.id),
      graphNodes: s.graphNodes.filter(n => n.id !== a.id),
      graphLinks: s.graphLinks.filter(l => l.source !== a.id && l.target !== a.id),
    }

    case 'ADD_JOURNAL': return { ...s, journals: [...s.journals, { id: Date.now(), date: a.v, body: '', mood: 3, reflection: '' }] }
    case 'UPD_JOURNAL': return { ...s, journals: s.journals.map(j => j.id === a.id ? { ...j, ...a.v } : j) }
    case 'DEL_JOURNAL': return { ...s, journals: s.journals.filter(j => j.id !== a.id) }

    case 'ADD_GOAL': return { ...s, goals: [...s.goals, { id: Date.now(), title: a.v, description: a.desc || '', status: 'todo', progress: 0, milestones: [], created: Date.now() }] }
    case 'UPD_GOAL': return { ...s, goals: s.goals.map(g => g.id === a.id ? { ...g, ...a.v } : g) }
    case 'DEL_GOAL': return { ...s, goals: s.goals.filter(g => g.id !== a.id) }
    case 'ADD_MS': return { ...s, goals: s.goals.map(g => g.id === a.id ? { ...g, milestones: [...g.milestones, { id: Date.now(), text: a.v, done: false }] } : g) }
    case 'TOGGLE_MS': {
      const goals = s.goals.map(g => {
        if (g.id !== a.id) return g
        const ms = g.milestones.map(m => m.id === a.mid ? { ...m, done: !m.done } : m)
        return { ...g, milestones: ms, progress: ms.length ? Math.round(ms.filter(m => m.done).length / ms.length * 100) : 0 }
      })
      return { ...s, goals }
    }
    case 'DEL_MS': return { ...s, goals: s.goals.map(g => g.id === a.id ? { ...g, milestones: g.milestones.filter(m => m.id !== a.mid) } : g) }

    case 'ADD_AGENT': return { ...s, customAgents: [...s.customAgents, a.v] }
    case 'AGENT_MSG': {
      const prev = s.agentMessages[a.id] || []
      return { ...s, agentMessages: { ...s.agentMessages, [a.id]: [...prev, a.v] } }
    }
    case 'CLEAR_AGENT': {
      const msgs = { ...s.agentMessages }; delete msgs[a.id]
      return { ...s, agentMessages: msgs }
    }

    case 'ADD_SYNTH': return { ...s, synthHistory: [a.v, ...s.synthHistory].slice(0, 20) }
    case 'ADD_MEMORY': return { ...s, memories: [a.v, ...s.memories].slice(0, 10) }
    case 'DEL_MEMORY': return { ...s, memories: s.memories.filter((_, i) => i !== a.i) }

    default: return s
  }
}

// ─── Supabase Provider ────────────────────────────────────────────────────────
function Provider({ children }) {
  const [s, d] = useReducer(reducer, INIT)
  const supabase = useMemo(() => createClient(), [])
  const [session, setSession] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const saveTimer = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess)
      setAuthChecked(true)
      if (!sess) window.location.href = '/login'
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, sess) => {
      setSession(sess)
      if (!sess) window.location.href = '/login'
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user?.id) return
    supabase.from('user_state').select('data').eq('user_id', session.user.id).maybeSingle()
      .then(({ data }) => {
        if (data?.data) d({ type: 'LOAD', v: data.data })
        d({ type: 'BOOT' })
      })
  }, [session?.user?.id])

  useEffect(() => {
    if (!s.bootDone || !session?.user?.id) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      const { activeModule, theme, bootDone, ...payload } = s
      supabase.from('user_state').upsert({ user_id: session.user.id, data: payload, updated_at: new Date().toISOString() })
    }, 1500)
    return () => clearTimeout(saveTimer.current)
  }, [s.notes, s.journals, s.goals, s.customAgents, s.agentMessages, s.synthHistory, s.graphNodes, s.graphLinks, s.memories, s.apiKeys, s.bootDone])

  if (!authChecked) return null

  return <Ctx.Provider value={{ s, d, session, supabase }}>{children}</Ctx.Provider>
}

// ─── API Callers (via Next.js server routes) ──────────────────────────────────
async function* streamClaude(prompt, system, apiKey) {
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, system, apiKey }),
  })
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'API error') }
  const reader = res.body.getReader()
  const dec = new TextDecoder()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    for (const line of dec.decode(value).split('\n')) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6)
      if (data === '[DONE]') return
      try {
        const p = JSON.parse(data)
        if (p.type === 'content_block_delta' && p.delta?.text) yield p.delta.text
      } catch {}
    }
  }
}

async function callAI(model, prompt, system, apiKey) {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, system, apiKey }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data.text
}

// ─── Boot Sequence ────────────────────────────────────────────────────────────
const BOOT_LINES = [
  { text: 'ORBIS Neural Interface v5.0.0', delay: 0,    color: '#00d4ff' },
  { text: 'Authenticating identity via Supabase...', delay: 300 },
  { text: 'Neural Net .......................... ONLINE', delay: 700,  color: '#00ff88' },
  { text: 'Knowledge Graph Engine .............. ONLINE', delay: 1000, color: '#00ff88' },
  { text: 'RAG Memory Retrieval ................ ARMED',  delay: 1250, color: '#00ff88' },
  { text: 'Streaming Claude (Opus 4.7) ......... READY',  delay: 1500, color: '#00d4ff' },
  { text: 'Multi-Model Synthesis ............... ACTIVE', delay: 1750, color: '#00ff88' },
  { text: 'Conflict Analysis Module ............ ARMED',  delay: 2000, color: '#f59e0b' },
  { text: 'Journal & Mood Analytics ............ ONLINE', delay: 2200, color: '#00ff88' },
  { text: 'Named AI Agent Framework ............ ONLINE', delay: 2400, color: '#00ff88' },
  { text: 'Knowledge Vault (Supabase RLS) ...... SECURE', delay: 2650, color: '#00ff88' },
  { text: '──────────────────────────────────────────────', delay: 2850, color: '#1e3a5f' },
  { text: 'All systems nominal. ORBIS is online.', delay: 3050, color: '#00d4ff' },
]

function BootSequence({ onComplete }) {
  const [lines, setLines] = useState([])
  const [fading, setFading] = useState(false)
  useEffect(() => {
    BOOT_LINES.forEach((line, i) => {
      setTimeout(() => {
        setLines(prev => [...prev, line])
        if (i === BOOT_LINES.length - 1) {
          setTimeout(() => setFading(true), 400)
          setTimeout(onComplete, 800)
        }
      }, line.delay)
    })
  }, [onComplete])
  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#050510', zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: fading ? 0 : 1, transition: 'opacity 0.7s ease', pointerEvents: fading ? 'none' : 'all',
      fontFamily: "'Courier New', monospace",
    }}>
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 64, fontWeight: 900, letterSpacing: 16, background: 'linear-gradient(135deg,#00d4ff,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ORBIS</div>
        <div style={{ color: '#334155', fontSize: 12, letterSpacing: 8, marginTop: 4 }}>NEURAL INTELLIGENCE INTERFACE</div>
      </div>
      <div style={{ width: 560, background: 'rgba(0,0,0,0.6)', border: '1px solid #0f2d4a', borderRadius: 4, padding: '20px 24px', fontSize: 12 }}>
        {lines.map((line, i) => (
          <div key={i} style={{ color: line.color || '#94a3b8', marginBottom: 3 }}>
            <span style={{ color: '#1e3a5f', marginRight: 8 }}>[{String(i).padStart(2, '0')}]</span>{line.text}
          </div>
        ))}
        {lines.length < BOOT_LINES.length && <span style={{ color: '#00d4ff' }}>█</span>}
      </div>
    </div>
  )
}

// ─── Starfield ────────────────────────────────────────────────────────────────
function Starfield() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    let stars = [], raf
    const resize = () => {
      canvas.width = window.innerWidth; canvas.height = window.innerHeight
      stars = Array.from({ length: 180 }, () => ({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: Math.random() * 1.2 + 0.2, speed: Math.random() * 0.25 + 0.05, op: Math.random() * 0.7 + 0.2, tw: Math.random() * Math.PI * 2 }))
    }
    resize(); window.addEventListener('resize', resize)
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.strokeStyle = 'rgba(0,212,255,0.025)'; ctx.lineWidth = 1
      for (let x = 0; x < canvas.width; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke() }
      for (let y = 0; y < canvas.height; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke() }
      const t = Date.now() / 1000
      stars.forEach(s => {
        const tw = Math.sin(t * 1.5 + s.tw) * 0.3 + 0.7
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200,220,255,${s.op * tw})`; ctx.fill()
        s.y -= s.speed; if (s.y < 0) { s.y = canvas.height; s.x = Math.random() * canvas.width }
      })
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
}

// ─── Neural Particles ─────────────────────────────────────────────────────────
function NeuralParticles() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    let particles = [], mouse = { x: -999, y: -999 }, raf
    const resize = () => {
      canvas.width = window.innerWidth; canvas.height = window.innerHeight
      particles = Array.from({ length: 110 }, () => ({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4 }))
    }
    resize()
    window.addEventListener('resize', resize)
    const onMouse = e => { mouse.x = e.clientX; mouse.y = e.clientY }
    window.addEventListener('mousemove', onMouse, { passive: true })
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        const dx = p.x - mouse.x, dy = p.y - mouse.y
        const dist = Math.hypot(dx, dy)
        if (dist < 160) { const f = (160 - dist) / 160 * 0.8; p.vx += (dx / dist) * f; p.vy += (dy / dist) * f }
        p.vx *= 0.97; p.vy *= 0.97
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(0,212,255,0.5)'; ctx.fill()
      })
      for (let i = 0; i < particles.length; i++) for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y
        const dist = Math.hypot(dx, dy)
        if (dist < 95) {
          ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y)
          ctx.strokeStyle = `rgba(0,212,255,${(1 - dist / 95) * 0.12})`; ctx.lineWidth = 0.5; ctx.stroke()
        }
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); window.removeEventListener('mousemove', onMouse) }
  }, [])
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }} />
}

// ─── Glass Overlay ────────────────────────────────────────────────────────────
function GlassOverlay({ mouseX, mouseY }) {
  const i = Math.hypot(mouseX - 0.5, mouseY - 0.5) * 2
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2, pointerEvents: 'none',
      background: `radial-gradient(ellipse at ${mouseX * 100}% ${mouseY * 100}%, rgba(0,212,255,${0.04 - i * 0.02}), rgba(124,58,237,${0.03 - i * 0.01}) 50%, transparent 80%)`
    }} />
  )
}

// ─── Command Palette ──────────────────────────────────────────────────────────
function CommandPalette({ onClose }) {
  const { s, d } = useOrbis()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const inputRef = useRef(null)

  const items = useMemo(() => {
    const base = [
      { label: 'Home', icon: '⬡', action: () => d({ type: 'MOD', v: 'home' }) },
      { label: 'Advisor', icon: '◈', action: () => d({ type: 'MOD', v: 'advisor' }) },
      { label: 'Knowledge Graph', icon: '◎', action: () => d({ type: 'MOD', v: 'graph' }) },
      { label: 'Notes', icon: '▣', action: () => d({ type: 'MOD', v: 'notes' }) },
      { label: 'Journal', icon: '◉', action: () => d({ type: 'MOD', v: 'journal' }) },
      { label: 'Goals', icon: '◇', action: () => d({ type: 'MOD', v: 'goals' }) },
      { label: 'Agents', icon: '◑', action: () => d({ type: 'MOD', v: 'agents' }) },
      { label: 'Synthesis History', icon: '⊞', action: () => d({ type: 'MOD', v: 'history' }) },
      { label: '3D Orb Room', icon: '⊕', action: () => d({ type: 'MOD', v: 'orbs3d' }) },
      { label: 'Config', icon: '⚙', action: () => d({ type: 'MOD', v: 'settings' }) },
      ...s.notes.map(n => ({ label: n.title, icon: '▣', action: () => d({ type: 'MOD', v: 'notes' }), sub: 'Note' })),
    ]
    return q ? base.filter(item => item.label.toLowerCase().includes(q.toLowerCase())) : base
  }, [q, s.notes])

  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => { setSel(0) }, [q])

  const run = (item) => { item.action(); onClose() }

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel(v => Math.min(v + 1, items.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSel(v => Math.max(v - 1, 0)) }
    if (e.key === 'Enter' && items[sel]) run(items[sel])
    if (e.key === 'Escape') onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(5,5,16,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 120 }}
      onClick={onClose}>
      <div style={{ width: 560, background: 'rgba(5,5,22,0.98)', border: '1px solid rgba(0,212,255,0.25)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 0 80px rgba(0,212,255,0.15)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: '1px solid rgba(0,212,255,0.1)' }}>
          <span style={{ color: '#00d4ff', fontSize: 16 }}>⌘</span>
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} onKeyDown={onKey}
            placeholder="Search modules, notes, commands..."
            style={{ flex: 1, background: 'transparent', border: 'none', color: '#e2e8f0', fontSize: 14, outline: 'none', fontFamily: "'Courier New', monospace" }} />
          <span style={{ color: '#334155', fontSize: 11 }}>ESC</span>
        </div>
        <div style={{ maxHeight: 340, overflowY: 'auto' }}>
          {items.map((item, i) => (
            <div key={i} onClick={() => run(item)} onMouseEnter={() => setSel(i)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', cursor: 'pointer', background: sel === i ? 'rgba(0,212,255,0.08)' : 'transparent', borderLeft: sel === i ? '2px solid #00d4ff' : '2px solid transparent' }}>
              <span style={{ color: '#00d4ff', width: 20, textAlign: 'center' }}>{item.icon}</span>
              <span style={{ color: '#e2e8f0', fontSize: 13 }}>{item.label}</span>
              {item.sub && <span style={{ color: '#334155', fontSize: 11, marginLeft: 'auto' }}>{item.sub}</span>}
            </div>
          ))}
          {!items.length && <div style={{ padding: '20px 18px', color: '#334155', fontSize: 13 }}>No results for "{q}"</div>}
        </div>
      </div>
    </div>
  )
}

// ─── Voice Hook ───────────────────────────────────────────────────────────────
function useVoice(onResult) {
  const [listening, setListening] = useState(false)
  const supported = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  const start = useCallback(() => {
    if (!supported) return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const r = new SR()
    r.continuous = false; r.interimResults = false; r.lang = 'en-GB'
    r.onstart = () => setListening(true)
    r.onend = () => setListening(false)
    r.onresult = e => onResult(Array.from(e.results).map(r => r[0].transcript).join(' '))
    r.start()
  }, [supported, onResult])
  return { listening, start, supported }
}

// ─── Navigation ───────────────────────────────────────────────────────────────
const NAVS = [
  { id: 'home',     label: 'HOME',     icon: '⬡', color: '#00d4ff' },
  { id: 'advisor',  label: 'ADVISOR',  icon: '◈', color: '#7c3aed' },
  { id: 'graph',    label: 'GRAPH',    icon: '◎', color: '#00ff88' },
  { id: 'notes',    label: 'NOTES',    icon: '▣', color: '#f59e0b' },
  { id: 'journal',  label: 'JOURNAL',  icon: '◉', color: '#ec4899' },
  { id: 'goals',    label: 'GOALS',    icon: '◇', color: '#f97316' },
  { id: 'agents',   label: 'AGENTS',   icon: '◑', color: '#a855f7' },
  { id: 'history',  label: 'HISTORY',  icon: '⊞', color: '#06b6d4' },
  { id: 'orbs3d',   label: '3D ROOM',  icon: '⊕', color: '#00d4ff' },
  { id: 'settings', label: 'CONFIG',   icon: '⚙', color: '#ef4444' },
]

function Sidebar() {
  const { s, d } = useOrbis()
  return (
    <nav style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 70, zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, borderRight: '1px solid rgba(0,212,255,0.08)', background: 'rgba(5,5,16,0.7)', backdropFilter: 'blur(12px)' }}>
      <div style={{ color: '#00d4ff', fontSize: 18, fontWeight: 900, marginBottom: 12, letterSpacing: 2 }}>⬡</div>
      {NAVS.map(orb => {
        const active = s.activeModule === orb.id
        return (
          <button key={orb.id} onClick={() => d({ type: 'MOD', v: orb.id })} title={orb.label}
            style={{ width: 42, height: 42, borderRadius: '50%', border: `1px solid ${active ? orb.color : 'rgba(255,255,255,0.06)'}`, background: active ? `${orb.color}22` : 'transparent', color: active ? orb.color : '#475569', fontSize: 17, cursor: 'pointer', transition: 'all 0.2s', boxShadow: active ? `0 0 16px ${orb.color}66` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {orb.icon}
          </button>
        )
      })}
    </nav>
  )
}

// ─── Voice Visualizer ─────────────────────────────────────────────────────────
function VoiceVisualizer({ active, color = '#00d4ff' }) {
  const canvasRef = useRef(null)
  const bars = useRef(Array.from({ length: 32 }, () => 0))
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const bw = canvas.width / bars.current.length
      bars.current.forEach((h, i) => {
        bars.current[i] += ((active ? Math.random() * 0.8 + 0.1 : 0.05) - h) * (active ? 0.3 : 0.1)
        const bh = bars.current[i] * canvas.height
        const g = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - bh)
        g.addColorStop(0, `${color}22`); g.addColorStop(1, color)
        ctx.fillStyle = g; ctx.fillRect(i * bw + 1, canvas.height - bh, bw - 2, bh)
      })
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [active, color])
  return <canvas ref={canvasRef} width={280} height={40} style={{ width: '100%', height: 40, borderRadius: 4 }} />
}

// ─── Home Module ──────────────────────────────────────────────────────────────
function HomeModule() {
  const { s, d, session } = useOrbis()
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-GB', { hour12: false }))
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 36 }}>
      <div style={{ position: 'relative', width: 180, height: 180 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #00d4ff44, #7c3aed22, #050510)', border: '1px solid rgba(0,212,255,0.3)', boxShadow: '0 0 60px rgba(0,212,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, animation: 'float 4s ease-in-out infinite' }}>
          <span style={{ background: 'linear-gradient(135deg,#00d4ff,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>⬡</span>
        </div>
        <div style={{ position: 'absolute', inset: -20, borderRadius: '50%', border: '1px solid rgba(0,212,255,0.1)', animation: 'spin-slow 8s linear infinite' }}>
          <div style={{ position: 'absolute', top: -4, left: '50%', transform: 'translateX(-50%)', width: 8, height: 8, borderRadius: '50%', background: '#00d4ff', boxShadow: '0 0 10px #00d4ff' }} />
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: 12, background: 'linear-gradient(135deg,#00d4ff,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ORBIS</div>
        <div style={{ color: '#334155', fontSize: 10, letterSpacing: 6, marginTop: 4 }}>NEURAL INTELLIGENCE INTERFACE</div>
        <div style={{ color: '#00d4ff', fontSize: 26, fontWeight: 300, marginTop: 10, fontFamily: 'monospace' }}>{time}</div>
        {session && <div style={{ color: '#334155', fontSize: 11, marginTop: 6 }}>{session.user.email}</div>}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', maxWidth: 520 }}>
        {NAVS.filter(o => o.id !== 'home').map(orb => (
          <button key={orb.id} onClick={() => d({ type: 'MOD', v: orb.id })}
            style={{ width: 72, height: 72, borderRadius: '50%', border: `1px solid ${orb.color}44`, background: `${orb.color}11`, color: orb.color, cursor: 'pointer', fontSize: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 24px ${orb.color}66`; e.currentTarget.style.transform = 'scale(1.12)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'scale(1)' }}>
            {orb.icon}<span style={{ fontSize: 8, letterSpacing: 1 }}>{orb.label}</span>
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', fontSize: 10, color: '#334155', borderTop: '1px solid rgba(0,212,255,0.06)', paddingTop: 14 }}>
        {[['NOTES', '#f59e0b', s.notes.length], ['JOURNALS', '#ec4899', s.journals.length], ['GOALS', '#f97316', s.goals.length], ['MEMORIES', '#00d4ff', s.memories.length], ['SYNTHESES', '#7c3aed', s.synthHistory.length]].map(([label, col, count]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: col, boxShadow: `0 0 5px ${col}` }} />
            {label} ({count})
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Multi-AI Advisor ─────────────────────────────────────────────────────────
const MODEL_CFG = {
  claude: { name: 'Claude Opus 4', color: '#00d4ff', icon: '◈' },
  gpt:    { name: 'GPT-4o',        color: '#7c3aed', icon: '◎' },
  gemini: { name: 'Gemini 1.5 Pro',color: '#00ff88', icon: '◇' },
}

function detectConflicts(responses) {
  const pairs = [[/\byes\b/i,/\bno\b/i],[/\bshould\b/i,/\bshouldn't\b|\bshould not\b/i],[/\bincreas/i,/\bdecreas/i],[/\bsimple/i,/\bcomplex/i],[/\brecommend\b/i,/\bavoid\b/i]]
  const conflicts = []; const keys = Object.keys(responses)
  for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) {
    const a = responses[keys[i]] || ''; const b = responses[keys[j]] || ''
    pairs.forEach(([pa, pb]) => {
      if ((pa.test(a) && pb.test(b)) || (pa.test(b) && pb.test(a)))
        conflicts.push(`**${MODEL_CFG[keys[i]]?.name}** vs **${MODEL_CFG[keys[j]]?.name}**`)
    })
  }
  return [...new Set(conflicts)]
}

function AdvisorModule() {
  const { s, d } = useOrbis()
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState({})
  const [responses, setResponses] = useState({})
  const [errors, setErrors] = useState({})
  const [ragCtx, setRagCtx] = useState(null)
  const [showSynth, setShowSynth] = useState(false)
  const { listening, start: startVoice, supported: voiceSupported } = useVoice(t => setPrompt(p => p + t))

  const run = async () => {
    if (!prompt.trim()) return
    const { ctx, count } = ragSearch(s.notes, s.journals, prompt)
    setRagCtx(count > 0 ? count : null)
    const fullPrompt = ctx + prompt
    setResponses({}); setErrors({}); setShowSynth(false)
    const callers = []
    if (s.apiKeys.claude) callers.push(['claude', () => callAI('claude', fullPrompt, ORBIS_SYSTEM, s.apiKeys.claude)])
    if (s.apiKeys.gpt)    callers.push(['gpt',    () => callAI('gpt', fullPrompt, null, s.apiKeys.gpt)])
    if (s.apiKeys.gemini) callers.push(['gemini', () => callAI('gemini', fullPrompt, null, s.apiKeys.gemini)])
    if (!callers.length) return
    setLoading(Object.fromEntries(callers.map(([k]) => [k, true])))
    const newResp = {}
    await Promise.all(callers.map(async ([key, fn]) => {
      try {
        const text = await fn(); newResp[key] = text
        setResponses(prev => ({ ...prev, [key]: text }))
      } catch (e) { setErrors(prev => ({ ...prev, [key]: e.message })) }
      finally { setLoading(prev => ({ ...prev, [key]: false })) }
    }))
    setShowSynth(true)
    d({ type: 'ADD_SYNTH', v: { prompt, responses: newResp, rag: ragCtx, ts: Date.now() } })
  }

  const conflicts = showSynth ? detectConflicts(responses) : []
  const agreeScore = Math.max(0, 100 - conflicts.length * 15)
  const hasKey = s.apiKeys.claude || s.apiKeys.gpt || s.apiKeys.gemini

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
      <div style={{ color: '#7c3aed', fontSize: 13, letterSpacing: 2, fontWeight: 700 }}>◈ MULTI-AI ADVISOR</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && e.ctrlKey && run()}
          placeholder="Enter query... (Ctrl+Enter to submit)"
          style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 6, color: '#e2e8f0', padding: '10px 14px', fontSize: 13, resize: 'vertical', minHeight: 60, outline: 'none', fontFamily: "'Courier New', monospace" }} />
        {voiceSupported && (
          <button onClick={startVoice} style={{ padding: '8px 12px', background: listening ? 'rgba(0,255,136,0.2)' : 'rgba(0,0,0,0.3)', border: `1px solid ${listening ? '#00ff88' : 'rgba(124,58,237,0.2)'}`, borderRadius: 6, color: listening ? '#00ff88' : '#7c3aed', cursor: 'pointer', fontSize: 16, height: 40 }}>
            🎙
          </button>
        )}
        <button onClick={run} disabled={!prompt.trim() || !hasKey || Object.values(loading).some(Boolean)}
          style={{ padding: '0 18px', background: hasKey ? 'rgba(124,58,237,0.15)' : 'rgba(100,116,139,0.1)', border: `1px solid ${hasKey ? '#7c3aed44' : '#334155'}`, borderRadius: 6, color: hasKey ? '#7c3aed' : '#475569', cursor: hasKey ? 'pointer' : 'not-allowed', fontSize: 12, height: 40 }}>
          QUERY ◈
        </button>
      </div>
      {!hasKey && <div style={{ color: '#f59e0b', fontSize: 12 }}>⚠ Add API keys in Config to enable live responses.</div>}
      {ragCtx && <div style={{ color: '#00ff88', fontSize: 11 }}>◈ RAG: {ragCtx} context node(s) injected from your knowledge base.</div>}

      <div style={{ display: 'flex', gap: 12, flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {Object.entries(MODEL_CFG).map(([key, cfg]) => (
          <div key={key} style={{ flex: 1, border: `1px solid ${cfg.color}22`, borderRadius: 8, padding: 14, background: `${cfg.color}08`, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: cfg.color, fontSize: 16 }}>{cfg.icon}</span>
              <span style={{ color: cfg.color, fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>{cfg.name}</span>
              {loading[key] && <span style={{ color: '#64748b', fontSize: 10, marginLeft: 'auto' }}>THINKING...</span>}
            </div>
            <VoiceVisualizer active={!!loading[key]} color={cfg.color} />
            {errors[key] && <div style={{ color: '#ef4444', fontSize: 12 }}>⚠ {errors[key]}</div>}
            {responses[key] && <div style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.7, flex: 1, overflowY: 'auto' }}>{responses[key]}</div>}
            {!loading[key] && !responses[key] && !errors[key] && <div style={{ color: '#1e3a5f', fontSize: 12 }}>Awaiting query...</div>}
          </div>
        ))}
      </div>

      {showSynth && Object.keys(responses).length > 0 && (
        <div style={{ border: '1px solid rgba(124,58,237,0.2)', borderRadius: 8, padding: 16, background: 'rgba(124,58,237,0.05)' }}>
          <div style={{ color: '#7c3aed', fontSize: 12, letterSpacing: 2, marginBottom: 10, fontWeight: 700 }}>◈ ORBIS SYNTHESIS</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 4 }}>
            <span>MODEL CONSENSUS</span>
            <span style={{ color: agreeScore > 70 ? '#00ff88' : agreeScore > 40 ? '#f59e0b' : '#ef4444' }}>{agreeScore}%</span>
          </div>
          <div style={{ height: 3, background: '#1e293b', borderRadius: 2, marginBottom: 12 }}>
            <div style={{ height: '100%', borderRadius: 2, width: `${agreeScore}%`, background: agreeScore > 70 ? '#00ff88' : agreeScore > 40 ? '#f59e0b' : '#ef4444', transition: 'width 1s ease' }} />
          </div>
          {conflicts.length > 0 && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: 10, marginBottom: 10 }}>
              <div style={{ color: '#ef4444', fontSize: 11, letterSpacing: 2, marginBottom: 6 }}>⚠ CONFLICTS</div>
              {conflicts.map((c, i) => <div key={i} style={{ color: '#fca5a5', fontSize: 12, marginBottom: 2 }}>• {c}</div>)}
            </div>
          )}
          <div style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.7 }}>
            {conflicts.length === 0 ? 'All models converge. High confidence in unified output.' : `${conflicts.length} divergence(s) detected. Review before acting.`}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Knowledge Graph ──────────────────────────────────────────────────────────
const KnowledgeGraph = dynamic(() => import('../components/KnowledgeGraph'), { ssr: false })

// ─── Notes Module ─────────────────────────────────────────────────────────────
function NotesModule() {
  const { s, d } = useOrbis()
  const [selected, setSelected] = useState(null)
  const [newTitle, setNewTitle] = useState('')
  const note = s.notes.find(n => n.id === selected)
  return (
    <div style={{ display: 'flex', gap: 16, height: '100%' }}>
      <div style={{ width: 210, borderRight: '1px solid rgba(245,158,11,0.1)', paddingRight: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ color: '#f59e0b', fontSize: 12, letterSpacing: 2, fontWeight: 700 }}>▣ NOTES ({s.notes.length})</div>
        <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && newTitle.trim()) { d({ type: 'ADD_NOTE', v: newTitle.trim() }); setNewTitle('') } }}
          placeholder="New note (Enter)..."
          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 4, color: '#e2e8f0', padding: '6px 8px', fontSize: 11, outline: 'none', fontFamily: "'Courier New', monospace" }} />
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {s.notes.length === 0 && <div style={{ color: '#334155', fontSize: 11 }}>Type a title and press Enter.</div>}
          {s.notes.map(n => (
            <div key={n.id} onClick={() => setSelected(n.id)}
              style={{ padding: '8px 10px', borderRadius: 4, cursor: 'pointer', border: `1px solid ${selected === n.id ? 'rgba(245,158,11,0.4)' : 'transparent'}`, background: selected === n.id ? 'rgba(245,158,11,0.08)' : 'transparent' }}>
              <div style={{ color: selected === n.id ? '#f59e0b' : '#94a3b8', fontSize: 12, fontWeight: 600 }}>{n.title}</div>
              <div style={{ color: '#334155', fontSize: 10, marginTop: 2 }}>{new Date(n.updated).toLocaleDateString('en-GB')}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {note ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input value={note.title} onChange={e => d({ type: 'UPD_NOTE', id: note.id, v: { title: e.target.value } })}
                style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b', fontSize: 16, fontWeight: 700, outline: 'none', padding: '4px 0', fontFamily: "'Courier New', monospace" }} />
              <button onClick={() => { d({ type: 'DEL_NOTE', id: note.id }); setSelected(null) }}
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 4, color: '#ef4444', cursor: 'pointer', padding: '4px 10px', fontSize: 11 }}>DELETE</button>
            </div>
            <textarea value={note.body} onChange={e => d({ type: 'UPD_NOTE', id: note.id, v: { body: e.target.value } })}
              placeholder="Write your thoughts... Keywords are automatically added to the Knowledge Graph."
              style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(245,158,11,0.1)', borderRadius: 6, color: '#e2e8f0', padding: '12px 14px', fontSize: 13, lineHeight: 1.8, resize: 'none', outline: 'none', fontFamily: "'Courier New', monospace" }} />
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e3a5f', fontSize: 13 }}>Select or create a note to begin.</div>
        )}
      </div>
    </div>
  )
}

// ─── Mood Chart ───────────────────────────────────────────────────────────────
function MoodChart({ journals }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0, 0, W, H)
    const cutoff = Date.now() - 30 * 86400000
    const pts = journals.filter(j => new Date(j.date).getTime() > cutoff).sort((a, b) => new Date(a.date) - new Date(b.date))
    if (pts.length < 2) { ctx.fillStyle = '#1e3a5f'; ctx.font = '11px monospace'; ctx.fillText('Need 2+ journal entries for chart', 10, H / 2); return }
    const pad = 16
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H)
    const xScale = (i) => pad + (i / (pts.length - 1)) * (W - pad * 2)
    const yScale = (v) => H - pad - ((v - 1) / 4) * (H - pad * 2)
    const grad = ctx.createLinearGradient(0, 0, W, 0)
    grad.addColorStop(0, '#7c3aed'); grad.addColorStop(1, '#00d4ff')
    ctx.beginPath(); ctx.moveTo(xScale(0), yScale(pts[0].mood))
    pts.slice(1).forEach((p, i) => ctx.lineTo(xScale(i + 1), yScale(p.mood)))
    ctx.strokeStyle = grad; ctx.lineWidth = 2; ctx.stroke()
    ctx.shadowBlur = 8; ctx.shadowColor = '#00d4ff'
    pts.forEach((p, i) => {
      ctx.beginPath(); ctx.arc(xScale(i), yScale(p.mood), 3, 0, Math.PI * 2)
      ctx.fillStyle = '#00d4ff'; ctx.fill()
    })
    ctx.shadowBlur = 0
  }, [journals])
  return <canvas ref={canvasRef} width={520} height={80} style={{ width: '100%', height: 80, borderRadius: 6, border: '1px solid rgba(236,72,153,0.15)' }} />
}

// ─── Journal Module ───────────────────────────────────────────────────────────
function JournalModule() {
  const { s, d } = useOrbis()
  const [selected, setSelected] = useState(null)
  const [reflecting, setReflecting] = useState(false)
  const j = s.journals.find(x => x.id === selected)

  const getReflection = async () => {
    if (!j?.body || !s.apiKeys.claude) return
    setReflecting(true)
    try {
      const text = await callAI('claude', `Provide a brief, insightful reflection on this journal entry in the style of a wise mentor. Be concise.\n\n${j.body}`, ORBIS_SYSTEM, s.apiKeys.claude)
      d({ type: 'UPD_JOURNAL', id: j.id, v: { reflection: text } })
    } catch {}
    setReflecting(false)
  }

  const today = new Date().toISOString().split('T')[0]
  return (
    <div style={{ display: 'flex', gap: 16, height: '100%' }}>
      <div style={{ width: 200, borderRight: '1px solid rgba(236,72,153,0.1)', paddingRight: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ color: '#ec4899', fontSize: 12, letterSpacing: 2, fontWeight: 700 }}>◉ JOURNAL</div>
        <button onClick={() => { if (!s.journals.find(jj => jj.date === today)) d({ type: 'ADD_JOURNAL', v: today }); setSelected(s.journals.find(jj => jj.date === today)?.id || Date.now()) }}
          style={{ background: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.3)', borderRadius: 4, color: '#ec4899', cursor: 'pointer', padding: '7px', fontSize: 11, letterSpacing: 1 }}>
          + TODAY
        </button>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[...s.journals].reverse().map(jj => (
            <div key={jj.id} onClick={() => setSelected(jj.id)}
              style={{ padding: '7px 10px', borderRadius: 4, cursor: 'pointer', border: `1px solid ${selected === jj.id ? 'rgba(236,72,153,0.4)' : 'transparent'}`, background: selected === jj.id ? 'rgba(236,72,153,0.08)' : 'transparent' }}>
              <div style={{ color: selected === jj.id ? '#ec4899' : '#94a3b8', fontSize: 12 }}>{jj.date}</div>
              <div style={{ display: 'flex', gap: 2, marginTop: 3 }}>
                {[1,2,3,4,5].map(n => <div key={n} style={{ width: 6, height: 6, borderRadius: '50%', background: n <= jj.mood ? '#ec4899' : '#1e293b' }} />)}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <div style={{ color: '#ec4899', fontSize: 11, letterSpacing: 2, marginBottom: 6 }}>30-DAY MOOD</div>
          <MoodChart journals={s.journals} />
        </div>
        {j ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: '#ec4899', fontSize: 13, fontWeight: 700 }}>{j.date}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => d({ type: 'UPD_JOURNAL', id: j.id, v: { mood: n } })}
                    style={{ width: 20, height: 20, borderRadius: '50%', border: 'none', background: n <= j.mood ? '#ec4899' : '#1e293b', cursor: 'pointer' }} />
                ))}
              </div>
              <button onClick={() => { d({ type: 'DEL_JOURNAL', id: j.id }); setSelected(null) }}
                style={{ marginLeft: 'auto', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 4, color: '#ef4444', cursor: 'pointer', padding: '3px 8px', fontSize: 10 }}>DEL</button>
            </div>
            <textarea value={j.body} onChange={e => d({ type: 'UPD_JOURNAL', id: j.id, v: { body: e.target.value } })}
              placeholder="Write your thoughts..."
              style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(236,72,153,0.1)', borderRadius: 6, color: '#e2e8f0', padding: '12px 14px', fontSize: 13, lineHeight: 1.8, resize: 'none', outline: 'none', fontFamily: "'Courier New', monospace" }} />
            {s.apiKeys.claude && (
              <button onClick={getReflection} disabled={reflecting || !j.body}
                style={{ alignSelf: 'flex-end', padding: '7px 16px', background: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.3)', borderRadius: 6, color: '#ec4899', cursor: reflecting ? 'not-allowed' : 'pointer', fontSize: 11, letterSpacing: 1 }}>
                {reflecting ? 'REFLECTING...' : '◈ ORBIS REFLECTION'}
              </button>
            )}
            {j.reflection && (
              <div style={{ background: 'rgba(236,72,153,0.06)', border: '1px solid rgba(236,72,153,0.2)', borderRadius: 6, padding: 12 }}>
                <div style={{ color: '#ec4899', fontSize: 10, letterSpacing: 2, marginBottom: 6 }}>ORBIS REFLECTION</div>
                <div style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.7 }}>{j.reflection}</div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e3a5f', fontSize: 13 }}>Select a journal entry or create today's entry.</div>
        )}
      </div>
    </div>
  )
}

// ─── Goals Module ─────────────────────────────────────────────────────────────
function GoalsModule() {
  const { s, d } = useOrbis()
  const [newGoal, setNewGoal] = useState('')
  const [sel, setSel] = useState(null)
  const [newMs, setNewMs] = useState('')
  const [roadmap, setRoadmap] = useState('')
  const [loadingRoad, setLoadingRoad] = useState(false)
  const goal = s.goals.find(g => g.id === sel)
  const STATUS_COLORS = { todo: '#64748b', 'in-progress': '#f59e0b', done: '#00ff88' }

  const getAIRoadmap = async () => {
    if (!goal || !s.apiKeys.claude) return
    setLoadingRoad(true)
    try {
      const text = await callAI('claude', `Create a concise strategic roadmap for this goal. Include 5-7 concrete action steps.\n\nGoal: ${goal.title}\n\nDescription: ${goal.description}`, ORBIS_SYSTEM, s.apiKeys.claude)
      setRoadmap(text)
    } catch {}
    setLoadingRoad(false)
  }

  return (
    <div style={{ display: 'flex', gap: 16, height: '100%' }}>
      <div style={{ width: 240, borderRight: '1px solid rgba(249,115,22,0.1)', paddingRight: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ color: '#f97316', fontSize: 12, letterSpacing: 2, fontWeight: 700 }}>◇ GOALS ({s.goals.length})</div>
        <input value={newGoal} onChange={e => setNewGoal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && newGoal.trim()) { d({ type: 'ADD_GOAL', v: newGoal.trim() }); setNewGoal('') } }}
          placeholder="New goal (Enter)..."
          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 4, color: '#e2e8f0', padding: '6px 8px', fontSize: 11, outline: 'none', fontFamily: "'Courier New', monospace" }} />
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {s.goals.map(g => (
            <div key={g.id} onClick={() => { setSel(g.id); setRoadmap('') }}
              style={{ padding: '10px', borderRadius: 6, cursor: 'pointer', border: `1px solid ${sel === g.id ? 'rgba(249,115,22,0.4)' : 'transparent'}`, background: sel === g.id ? 'rgba(249,115,22,0.08)' : 'transparent' }}>
              <div style={{ color: sel === g.id ? '#f97316' : '#94a3b8', fontSize: 12, fontWeight: 600 }}>{g.title}</div>
              <div style={{ height: 3, background: '#1e293b', borderRadius: 2, marginTop: 6 }}>
                <div style={{ height: '100%', borderRadius: 2, width: `${g.progress}%`, background: '#f97316' }} />
              </div>
              <div style={{ color: STATUS_COLORS[g.status], fontSize: 10, marginTop: 3 }}>{g.status.toUpperCase()} · {g.progress}%</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {goal ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#f97316', fontSize: 16, fontWeight: 700 }}>{goal.title}</span>
              <select value={goal.status} onChange={e => d({ type: 'UPD_GOAL', id: goal.id, v: { status: e.target.value } })}
                style={{ marginLeft: 'auto', background: '#0f172a', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 4, color: STATUS_COLORS[goal.status], padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}>
                {['todo', 'in-progress', 'done'].map(st => <option key={st} value={st}>{st}</option>)}
              </select>
              <button onClick={() => { d({ type: 'DEL_GOAL', id: goal.id }); setSel(null) }}
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 4, color: '#ef4444', cursor: 'pointer', padding: '3px 8px', fontSize: 10 }}>DEL</button>
            </div>
            <textarea value={goal.description} onChange={e => d({ type: 'UPD_GOAL', id: goal.id, v: { description: e.target.value } })}
              placeholder="Add description..."
              style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(249,115,22,0.1)', borderRadius: 6, color: '#e2e8f0', padding: '10px 14px', fontSize: 13, lineHeight: 1.7, resize: 'none', outline: 'none', minHeight: 70, fontFamily: "'Courier New', monospace" }} />
            <div>
              <div style={{ color: '#f97316', fontSize: 11, letterSpacing: 2, marginBottom: 8 }}>MILESTONES</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input value={newMs} onChange={e => setNewMs(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && newMs.trim()) { d({ type: 'ADD_MS', id: goal.id, v: newMs.trim() }); setNewMs('') } }}
                  placeholder="Add milestone (Enter)..."
                  style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 4, color: '#e2e8f0', padding: '6px 8px', fontSize: 11, outline: 'none', fontFamily: "'Courier New', monospace" }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {goal.milestones.map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: m.done ? 'rgba(0,255,136,0.05)' : 'rgba(0,0,0,0.2)', borderRadius: 4, border: `1px solid ${m.done ? 'rgba(0,255,136,0.2)' : 'rgba(249,115,22,0.08)'}` }}>
                    <input type="checkbox" checked={m.done} onChange={() => d({ type: 'TOGGLE_MS', id: goal.id, mid: m.id })} style={{ cursor: 'pointer', accentColor: '#f97316' }} />
                    <span style={{ flex: 1, color: m.done ? '#64748b' : '#cbd5e1', fontSize: 13, textDecoration: m.done ? 'line-through' : 'none' }}>{m.text}</span>
                    <button onClick={() => d({ type: 'DEL_MS', id: goal.id, mid: m.id })} style={{ background: 'none', border: 'none', color: '#334155', cursor: 'pointer', fontSize: 12 }}>✕</button>
                  </div>
                ))}
              </div>
              <div style={{ height: 3, background: '#1e293b', borderRadius: 2, marginTop: 10 }}>
                <div style={{ height: '100%', borderRadius: 2, width: `${goal.progress}%`, background: 'linear-gradient(90deg,#f97316,#f59e0b)', transition: 'width 0.5s' }} />
              </div>
            </div>
            {s.apiKeys.claude && (
              <button onClick={getAIRoadmap} disabled={loadingRoad}
                style={{ alignSelf: 'flex-start', padding: '7px 16px', background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 6, color: '#f97316', cursor: loadingRoad ? 'not-allowed' : 'pointer', fontSize: 11, letterSpacing: 1 }}>
                {loadingRoad ? 'GENERATING...' : '◈ AI ROADMAP'}
              </button>
            )}
            {roadmap && (
              <div style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 6, padding: 14 }}>
                <div style={{ color: '#f97316', fontSize: 10, letterSpacing: 2, marginBottom: 8 }}>ORBIS ROADMAP</div>
                <div style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{roadmap}</div>
              </div>
            )}
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e3a5f', fontSize: 13 }}>Select or create a goal to begin.</div>
        )}
      </div>
    </div>
  )
}

// ─── Agents Module ────────────────────────────────────────────────────────────
const DEF_AGENTS = [
  { id: 'orbis',    name: 'ORBIS',     icon: '⬡', c: '#00d4ff', tag: 'Executive second brain', sys: ORBIS_SYSTEM },
  { id: 'socrates', name: 'Socrates',  icon: '◎', c: '#7c3aed', tag: 'Dialectical inquiry', sys: 'You are Socrates. Guide through questioning, never state answers directly. Reveal hidden assumptions.' },
  { id: 'edison',   name: 'Edison',    icon: '◇', c: '#f59e0b', tag: 'Innovation architect', sys: 'You are Thomas Edison. Intensely practical. Focus on experimentation, iteration, and commercial viability.' },
  { id: 'cassandra',name: 'Cassandra', icon: '◉', c: '#ef4444', tag: 'Risk analyst', sys: 'You are Cassandra. Identify what will go wrong. Be specific, evidence-based, and unflinching about risks.' },
  { id: 'tesla',    name: 'Tesla',     icon: '⊕', c: '#a855f7', tag: 'Systems visionary', sys: 'You are Nikola Tesla. Think in systems, resonances, and interconnections. Challenge conventional paradigms.' },
]

function AgentsModule() {
  const { s, d } = useOrbis()
  const [selAgent, setSelAgent] = useState('orbis')
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamBuf, setStreamBuf] = useState('')
  const msgEndRef = useRef(null)
  const { listening, start: startVoice, supported: voiceSupported } = useVoice(t => setInput(p => p + t))

  const allAgents = [...DEF_AGENTS, ...s.customAgents.map(a => ({ ...a, c: a.color || '#64748b' }))]
  const agent = allAgents.find(a => a.id === selAgent)
  const msgs = s.agentMessages[selAgent] || []

  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, streamBuf])

  const send = async () => {
    if (!input.trim() || !s.apiKeys.claude || streaming) return
    const userMsg = input.trim(); setInput('')
    d({ type: 'AGENT_MSG', id: selAgent, v: { role: 'user', text: userMsg, ts: Date.now() } })
    setStreaming(true); setStreamBuf('')
    const { ctx } = ragSearch(s.notes, s.journals, userMsg)
    const fullPrompt = ctx + userMsg
    let full = ''
    try {
      for await (const chunk of streamClaude(fullPrompt, agent?.sys || ORBIS_SYSTEM, s.apiKeys.claude)) {
        full += chunk; setStreamBuf(full)
      }
      d({ type: 'AGENT_MSG', id: selAgent, v: { role: 'assistant', text: full, ts: Date.now() } })
    } catch (e) {
      d({ type: 'AGENT_MSG', id: selAgent, v: { role: 'error', text: e.message, ts: Date.now() } })
    }
    setStreamBuf(''); setStreaming(false)
  }

  return (
    <div style={{ display: 'flex', gap: 16, height: '100%' }}>
      <div style={{ width: 200, borderRight: '1px solid rgba(168,85,247,0.1)', paddingRight: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ color: '#a855f7', fontSize: 12, letterSpacing: 2, fontWeight: 700 }}>◑ AGENTS</div>
        {allAgents.map(a => (
          <button key={a.id} onClick={() => setSelAgent(a.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', borderRadius: 6, cursor: 'pointer', border: `1px solid ${selAgent === a.id ? a.c + '66' : 'transparent'}`, background: selAgent === a.id ? a.c + '12' : 'transparent', textAlign: 'left' }}>
            <span style={{ color: a.c, fontSize: 16 }}>{a.icon}</span>
            <div>
              <div style={{ color: selAgent === a.id ? a.c : '#94a3b8', fontSize: 12, fontWeight: 600 }}>{a.name}</div>
              <div style={{ color: '#334155', fontSize: 10 }}>{a.tag}</div>
            </div>
          </button>
        ))}
        {msgs.length > 0 && (
          <button onClick={() => d({ type: 'CLEAR_AGENT', id: selAgent })}
            style={{ marginTop: 'auto', padding: '6px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 4, color: '#ef4444', cursor: 'pointer', fontSize: 10 }}>
            CLEAR CHAT
          </button>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {agent && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: `${agent.c}0c`, border: `1px solid ${agent.c}22`, borderRadius: 6 }}>
            <span style={{ color: agent.c, fontSize: 22 }}>{agent.icon}</span>
            <div>
              <div style={{ color: agent.c, fontSize: 14, fontWeight: 700 }}>{agent.name}</div>
              <div style={{ color: '#475569', fontSize: 11 }}>{agent.tag}</div>
            </div>
            {!s.apiKeys.claude && <div style={{ marginLeft: 'auto', color: '#f59e0b', fontSize: 11 }}>⚠ Claude key required</div>}
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 4 }}>
          {msgs.length === 0 && !streaming && (
            <div style={{ textAlign: 'center', color: '#1e3a5f', fontSize: 13, marginTop: 60 }}>Begin your consultation with {agent?.name}.</div>
          )}
          {msgs.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: 10, background: m.role === 'user' ? `${agent?.c}22` : 'rgba(0,0,0,0.3)', border: `1px solid ${m.role === 'user' ? (agent?.c + '44') : 'rgba(255,255,255,0.06)'}`, color: m.role === 'error' ? '#ef4444' : '#e2e8f0', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {m.text}
              </div>
            </div>
          ))}
          {streaming && streamBuf && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', color: '#e2e8f0', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {streamBuf}<span style={{ color: agent?.c, animation: 'none' }}>█</span>
              </div>
            </div>
          )}
          <div ref={msgEndRef} />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <textarea value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder={`Message ${agent?.name}... (Enter to send, Shift+Enter for newline)`}
            style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: `1px solid ${agent?.c}33`, borderRadius: 6, color: '#e2e8f0', padding: '10px 14px', fontSize: 13, resize: 'none', outline: 'none', minHeight: 44, maxHeight: 120, fontFamily: "'Courier New', monospace" }} />
          {voiceSupported && (
            <button onClick={startVoice} style={{ padding: '8px 10px', background: listening ? `${agent?.c}22` : 'rgba(0,0,0,0.3)', border: `1px solid ${agent?.c}33`, borderRadius: 6, color: listening ? agent?.c : '#475569', cursor: 'pointer', fontSize: 16 }}>🎙</button>
          )}
          <button onClick={send} disabled={!input.trim() || !s.apiKeys.claude || streaming}
            style={{ padding: '0 16px', background: `${agent?.c}18`, border: `1px solid ${agent?.c}44`, borderRadius: 6, color: agent?.c, cursor: 'pointer', fontSize: 12, letterSpacing: 1 }}>
            {streaming ? '...' : 'SEND'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Synthesis History ────────────────────────────────────────────────────────
function SynthHistoryModule() {
  const { s } = useOrbis()
  const [sel, setSel] = useState(null)
  const item = s.synthHistory[sel]
  return (
    <div style={{ display: 'flex', gap: 16, height: '100%' }}>
      <div style={{ width: 260, borderRight: '1px solid rgba(6,182,212,0.1)', paddingRight: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ color: '#06b6d4', fontSize: 12, letterSpacing: 2, fontWeight: 700 }}>⊞ SYNTHESIS HISTORY ({s.synthHistory.length})</div>
        {s.synthHistory.length === 0 && <div style={{ color: '#334155', fontSize: 12 }}>No sessions yet. Run an Advisor query.</div>}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {s.synthHistory.map((h, i) => (
            <div key={i} onClick={() => setSel(i)}
              style={{ padding: '9px 10px', borderRadius: 6, cursor: 'pointer', border: `1px solid ${sel === i ? 'rgba(6,182,212,0.4)' : 'transparent'}`, background: sel === i ? 'rgba(6,182,212,0.08)' : 'transparent' }}>
              <div style={{ color: sel === i ? '#06b6d4' : '#94a3b8', fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.prompt.slice(0, 50)}{h.prompt.length > 50 ? '...' : ''}</div>
              <div style={{ color: '#334155', fontSize: 10, marginTop: 2 }}>{new Date(h.ts).toLocaleString('en-GB')} · {Object.keys(h.responses || {}).join(', ')}</div>
              {h.rag && <div style={{ color: '#00ff88', fontSize: 9, marginTop: 2 }}>RAG</div>}
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {item ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ color: '#06b6d4', fontSize: 14, fontWeight: 700, borderBottom: '1px solid rgba(6,182,212,0.15)', paddingBottom: 10 }}>{item.prompt}</div>
            <div style={{ color: '#334155', fontSize: 11 }}>{new Date(item.ts).toLocaleString('en-GB')}</div>
            {Object.entries(item.responses || {}).map(([model, text]) => (
              <div key={model} style={{ border: `1px solid ${MODEL_CFG[model]?.color}22`, borderRadius: 8, padding: 14, background: `${MODEL_CFG[model]?.color}08` }}>
                <div style={{ color: MODEL_CFG[model]?.color, fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>{MODEL_CFG[model]?.icon} {MODEL_CFG[model]?.name}</div>
                <div style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.7 }}>{text}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e3a5f', fontSize: 13 }}>Select a session to review.</div>
        )}
      </div>
    </div>
  )
}

// ─── Settings Module ──────────────────────────────────────────────────────────
function SettingsModule() {
  const { s, d, session, supabase } = useOrbis()
  const [keys, setKeys] = useState(s.apiKeys)
  const [saved, setSaved] = useState(false)
  const save = () => { d({ type: 'KEYS', v: keys }); setSaved(true); setTimeout(() => setSaved(false), 2000) }
  const logout = async () => { await supabase.auth.signOut(); window.location.href = '/login' }

  return (
    <div style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ color: '#ef4444', fontSize: 13, letterSpacing: 2, fontWeight: 700 }}>⚙ ORBIS CONFIGURATION</div>

      <div style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 6, padding: 12, fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
        Authenticated as <span style={{ color: '#00d4ff' }}>{session?.user?.email}</span>. Data is stored encrypted per-account in Supabase with Row Level Security.
      </div>

      {[
        { key: 'claude', label: 'Anthropic / Claude', placeholder: 'sk-ant-...', color: '#00d4ff' },
        { key: 'gpt',    label: 'OpenAI / GPT-4o',    placeholder: 'sk-...',     color: '#7c3aed' },
        { key: 'gemini', label: 'Google / Gemini',     placeholder: 'AIza...',    color: '#00ff88' },
      ].map(({ key, label, placeholder, color }) => (
        <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ color, fontSize: 11, letterSpacing: 2 }}>{label}</label>
          <input type="password" value={keys[key]} onChange={e => setKeys(p => ({ ...p, [key]: e.target.value }))}
            placeholder={placeholder}
            style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${color}33`, borderRadius: 6, color: '#e2e8f0', padding: '10px 14px', fontSize: 13, outline: 'none', fontFamily: "'Courier New', monospace" }} />
        </div>
      ))}

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={save} style={{ padding: '10px 24px', background: saved ? 'rgba(0,255,136,0.15)' : 'rgba(0,212,255,0.15)', border: `1px solid ${saved ? '#00ff8844' : '#00d4ff44'}`, borderRadius: 6, color: saved ? '#00ff88' : '#00d4ff', cursor: 'pointer', fontSize: 12, letterSpacing: 2 }}>
          {saved ? '✓ SAVED' : 'SAVE KEYS'}
        </button>
        <button onClick={logout} style={{ padding: '10px 24px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, color: '#ef4444', cursor: 'pointer', fontSize: 12, letterSpacing: 2 }}>
          SIGN OUT
        </button>
      </div>

      <div style={{ borderTop: '1px solid rgba(0,212,255,0.06)', paddingTop: 14, color: '#334155', fontSize: 11, lineHeight: 2 }}>
        <div style={{ color: '#00d4ff', marginBottom: 8, letterSpacing: 2 }}>SYSTEM STATUS</div>
        {[
          ['Supabase Auth',   '#00ff88', 'AUTHENTICATED'],
          ['RLS Vault',       '#00ff88', 'SECURE'],
          ['Notes',          '#f59e0b', `${s.notes.length} node(s)`],
          ['Journals',       '#ec4899', `${s.journals.length} entry/entries`],
          ['Goals',          '#f97316', `${s.goals.length} goal(s)`],
          ['Memories',       '#00d4ff', `${s.memories.length}/10`],
          ['Synth History',  '#7c3aed', `${s.synthHistory.length} session(s)`],
          ['Claude API',     s.apiKeys.claude ? '#00ff88' : '#ef4444', s.apiKeys.claude ? 'KEY SET' : 'NO KEY'],
          ['GPT API',        s.apiKeys.gpt    ? '#00ff88' : '#ef4444', s.apiKeys.gpt    ? 'KEY SET' : 'NO KEY'],
          ['Gemini API',     s.apiKeys.gemini ? '#00ff88' : '#ef4444', s.apiKeys.gemini ? 'KEY SET' : 'NO KEY'],
        ].map(([label, color, status]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{label}</span><span style={{ color }}>{status}</span>
          </div>
        ))}
      </div>

      {s.memories.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(0,212,255,0.06)', paddingTop: 14 }}>
          <div style={{ color: '#00d4ff', fontSize: 11, letterSpacing: 2, marginBottom: 10 }}>EXTRACTED MEMORIES ({s.memories.length}/10)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {s.memories.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, padding: '8px 10px', background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.1)', borderRadius: 5 }}>
                <span style={{ color: '#cbd5e1', fontSize: 12, flex: 1 }}>{m}</span>
                <button onClick={() => d({ type: 'DEL_MEMORY', i })} style={{ background: 'none', border: 'none', color: '#334155', cursor: 'pointer', fontSize: 12 }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Dynamic Imports ──────────────────────────────────────────────────────────
const OrbRoom3D = dynamic(() => import('../components/OrbRoom3D'), { ssr: false })

// ─── Main App ─────────────────────────────────────────────────────────────────
function OrbisApp() {
  const { s, d } = useOrbis()
  const [booting, setBooting] = useState(true)
  const [showPalette, setShowPalette] = useState(false)
  const onBootComplete = useCallback(() => setTimeout(() => setBooting(false), 100), [])

  useEffect(() => {
    const h = e => {
      d({ type: 'THEME', v: { mouseX: e.clientX / window.innerWidth, mouseY: e.clientY / window.innerHeight } })
    }
    window.addEventListener('mousemove', h, { passive: true })
    return () => window.removeEventListener('mousemove', h)
  }, [d])

  useEffect(() => {
    const h = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowPalette(v => !v) }
      if (e.key === 'Escape') setShowPalette(false)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const renderModule = () => {
    switch (s.activeModule) {
      case 'home':     return <HomeModule />
      case 'advisor':  return <AdvisorModule />
      case 'graph':    return <KnowledgeGraph />
      case 'notes':    return <NotesModule />
      case 'journal':  return <JournalModule />
      case 'goals':    return <GoalsModule />
      case 'agents':   return <AgentsModule />
      case 'history':  return <SynthHistoryModule />
      case 'orbs3d':   return <OrbRoom3D />
      case 'settings': return <SettingsModule />
      default:         return <HomeModule />
    }
  }

  const activeNav = NAVS.find(o => o.id === s.activeModule)

  return (
    <>
      {booting && <BootSequence onComplete={onBootComplete} />}
      {showPalette && <CommandPalette onClose={() => setShowPalette(false)} />}
      <Starfield />
      <NeuralParticles />
      <GlassOverlay mouseX={s.theme.mouseX} mouseY={s.theme.mouseY} />
      <Sidebar />
      <main style={{ position: 'relative', zIndex: 10, marginLeft: 70, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 46, borderBottom: '1px solid rgba(0,212,255,0.06)', display: 'flex', alignItems: 'center', paddingInline: 20, gap: 12, background: 'rgba(5,5,16,0.7)', backdropFilter: 'blur(8px)', flexShrink: 0 }}>
          <span style={{ background: 'linear-gradient(135deg,#00d4ff,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 900, letterSpacing: 4, fontSize: 13 }}>ORBIS</span>
          <span style={{ color: '#1e3a5f', fontSize: 10 }}>|</span>
          <span style={{ color: activeNav?.color || '#334155', fontSize: 11, letterSpacing: 2 }}>{activeNav?.label}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ color: '#334155', fontSize: 10, letterSpacing: 1, cursor: 'pointer' }} onClick={() => setShowPalette(true)}>⌘K</span>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 6px #00ff88' }} />
            <span style={{ color: '#334155', fontSize: 10, letterSpacing: 2 }}>ALL SYSTEMS NOMINAL</span>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 22 }}>
          {renderModule()}
        </div>
      </main>

      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; padding: 0 }
        body { background: #050510; font-family: 'Courier New', monospace; color: #e2e8f0; overflow: hidden }
        ::-webkit-scrollbar { width: 4px }
        ::-webkit-scrollbar-track { background: transparent }
        ::-webkit-scrollbar-thumb { background: rgba(0,212,255,0.2); border-radius: 2px }
        @keyframes float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
        @keyframes spin-slow { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes pulse-glow { 0%,100% { filter: brightness(1) } 50% { filter: brightness(1.3) drop-shadow(0 0 20px #00d4ff) } }
        @keyframes boot-fade { from { opacity: 0; transform: translateX(-8px) } to { opacity: 1; transform: translateX(0) } }
        input, textarea, button, select { font-family: 'Courier New', monospace }
      `}</style>
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Page() {
  return (
    <Provider>
      <Head>
        <title>ORBIS — Neural Intelligence Interface</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <OrbisApp />
    </Provider>
  )
}
