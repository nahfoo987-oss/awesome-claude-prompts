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
      const note = notes.find(n => n.id === a.id)
      let nodes = s.graphNodes.map(nd => nd.id === a.id ? { ...nd, label: note?.title, updated: Date.now() } : nd)
      // Remove old links from this note then rebuild
      let links = s.graphLinks.filter(l => {
        const src = typeof l.source === 'object' ? l.source.id : l.source
        return src !== a.id
      })
      if (a.v.body) {
        // Keywords → graph
        extractKeywords(a.v.body).forEach(kw => {
          const kwId = `kw_${kw}`
          if (!nodes.find(n => n.id === kwId)) nodes = [...nodes, { id: kwId, label: kw, type: 'keyword', size: 4, updated: Date.now() }]
          links = [...links, { source: a.id, target: kwId }]
        })
        // [[wikilinks]] → note-to-note links
        const wlRe = /\[\[([^\]]+)\]\]/g; let m
        while ((m = wlRe.exec(a.v.body)) !== null) {
          const target = notes.find(n => n.title.toLowerCase() === m[1].toLowerCase())
          if (target && !links.find(l => (typeof l.source === 'object' ? l.source.id : l.source) === a.id && (typeof l.target === 'object' ? l.target.id : l.target) === target.id))
            links = [...links, { source: a.id, target: target.id }]
        }
        // #tags → update note tags array
        const tags = [...new Set((a.v.body.match(/#(\w+)/g) || []).map(t => t.slice(1)))]
        if (tags.length) notes.find(n => n.id === a.id).tags = tags
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
      <div style={{ width: 560, background: 'var(--bg-1)', border: '1px solid var(--border-md)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} onKeyDown={onKey}
            placeholder="Search modules, notes, commands..."
            style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-1)', fontSize: 14, outline: 'none', fontFamily: 'var(--font-ui)' }} />
          <kbd style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, padding: '2px 6px', fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--font-ui)' }}>ESC</kbd>
        </div>
        <div style={{ maxHeight: 340, overflowY: 'auto' }}>
          {items.map((item, i) => (
            <div key={i} onClick={() => run(item)} onMouseEnter={() => setSel(i)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 18px', cursor: 'pointer', background: sel === i ? 'rgba(255,255,255,0.04)' : 'transparent', borderLeft: sel === i ? '2px solid var(--accent)' : '2px solid transparent' }}>
              <span style={{ color: 'var(--text-1)', fontSize: 13 }}>{item.label}</span>
              {item.sub && <span style={{ color: 'var(--text-4)', fontSize: 11, marginLeft: 'auto' }}>{item.sub}</span>}
            </div>
          ))}
          {!items.length && <div style={{ padding: '20px 18px', color: 'var(--text-4)', fontSize: 13 }}>No results for "{q}"</div>}
        </div>
      </div>
    </div>
  )
}

// ─── ElevenLabs Speak Hook ────────────────────────────────────────────────────
const SpeakCtx = createContext({ speak: () => {}, muted: false, setMuted: () => {} })
const useSpeak = () => useContext(SpeakCtx)

function SpeakProvider({ children }) {
  const [muted, setMuted] = useState(false)
  const audioRef = useRef(null)

  const speak = useCallback(async (text) => {
    if (muted || !text) return
    try {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
      const res = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.slice(0, 800) }),
      })
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      audio.play()
      audio.onended = () => URL.revokeObjectURL(url)
    } catch {}
  }, [muted])

  return <SpeakCtx.Provider value={{ speak, muted, setMuted }}>{children}</SpeakCtx.Provider>
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
const NAV_GROUPS = [
  {
    items: [
      { id: 'home',    label: 'Home',      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
      { id: 'advisor', label: 'Advisor',   icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
    ]
  },
  {
    label: 'Knowledge',
    items: [
      { id: 'graph',   label: 'Graph',     icon: 'M7 20l4-16m2 16l4-16M6 9h14M4 15h14' },
      { id: 'notes',   label: 'Notes',     icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
      { id: 'journal', label: 'Journal',   icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
      { id: 'goals',   label: 'Goals',     icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
    ]
  },
  {
    label: 'AI',
    items: [
      { id: 'agents',  label: 'Agents',    icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-1' },
      { id: 'history', label: 'History',   icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    ]
  },
  {
    label: 'Space',
    items: [
      { id: 'orbs3d',  label: '3D Graph',  icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    ]
  },
]

function NavIcon({ path }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  )
}

function Sidebar() {
  const { s, d, session, supabase } = useOrbis()
  const { muted, setMuted } = useSpeak()

  const logout = async () => { await supabase.auth.signOut(); window.location.href = '/login' }
  const initials = session?.user?.email?.[0]?.toUpperCase() || '?'

  return (
    <nav style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 200, zIndex: 100, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', background: 'rgba(8,8,18,0.92)', backdropFilter: 'blur(16px)', padding: '12px 0' }}>
      {/* Logo */}
      <div style={{ padding: '8px 16px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: 3, background: 'linear-gradient(135deg,#4f8ef7,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ORBIS</div>
        <div style={{ color: 'var(--text-4)', fontSize: 10, letterSpacing: 1, marginTop: 2 }}>Neural Intelligence</div>
      </div>

      {/* Nav groups */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} style={{ marginBottom: 4 }}>
            {group.label && (
              <div style={{ color: 'var(--text-4)', fontSize: 10, fontWeight: 600, letterSpacing: 1.5, padding: '10px 8px 4px', textTransform: 'uppercase' }}>{group.label}</div>
            )}
            {group.items.map(item => {
              const active = s.activeModule === item.id
              return (
                <button key={item.id} onClick={() => d({ type: 'MOD', v: item.id })}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 7, border: 'none', background: active ? 'rgba(79,142,247,0.12)' : 'transparent', color: active ? '#4f8ef7' : 'var(--text-3)', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left', fontSize: 13, fontWeight: active ? 500 : 400, fontFamily: 'var(--font-ui)' }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-2)' } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)' } }}>
                  <NavIcon path={item.icon} />
                  {item.label}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* Bottom section */}
      <div style={{ padding: '8px', borderTop: '1px solid var(--border)' }}>
        <button onClick={() => d({ type: 'MOD', v: 'settings' })}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 7, border: 'none', background: s.activeModule === 'settings' ? 'rgba(79,142,247,0.12)' : 'transparent', color: s.activeModule === 'settings' ? '#4f8ef7' : 'var(--text-3)', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 13, textAlign: 'left' }}>
          <NavIcon path="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          Settings
        </button>

        {/* Account */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', marginTop: 4, borderRadius: 7, background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#4f8ef7,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 700, flexShrink: 0 }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: 'var(--text-2)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session?.user?.email}</div>
          </div>
          <button onClick={logout} title="Sign out" style={{ background: 'none', border: 'none', color: 'var(--text-4)', cursor: 'pointer', padding: 2, fontSize: 14, display: 'flex' }}>↪</button>
        </div>

        {/* Voice toggle */}
        <button onClick={() => setMuted(v => !v)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', marginTop: 4, borderRadius: 7, border: 'none', background: 'transparent', color: muted ? 'var(--text-4)' : '#4f8ef7', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 12 }}>
          <span>{muted ? '🔇' : '🔊'}</span>
          <span>{muted ? 'Voice off' : 'Voice on'}</span>
        </button>
      </div>
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
  const [date, setDate] = useState('')
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-GB', { hour12: false }))
      setDate(now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }))
    }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [])

  const stats = [
    { label: 'Notes', value: s.notes.length, color: '#e8a020', mod: 'notes', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
    { label: 'Journals', value: s.journals.length, color: '#d946a8', mod: 'journal', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { label: 'Goals', value: s.goals.length, color: '#f97316', mod: 'goals', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
    { label: 'Memories', value: s.memories.length, color: '#38bdf8', mod: 'settings', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
  ]

  const quickActions = [
    { label: 'Ask ORBIS', desc: 'Multi-model AI advisor', mod: 'advisor', color: '#7c3aed' },
    { label: 'New Note', desc: 'Add to knowledge base', mod: 'notes', color: '#e8a020' },
    { label: 'Open Graph', desc: 'Explore 3D knowledge', mod: 'orbs3d', color: '#38bdf8' },
    { label: 'Today\'s Journal', desc: 'Reflect on your day', mod: 'journal', color: '#d946a8' },
  ]

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28, animation: 'fade-in 0.4s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: 'var(--text-3)', fontSize: 13, marginBottom: 4 }}>{date}</div>
          <div style={{ fontSize: 30, fontWeight: 700, color: 'var(--text-1)', letterSpacing: -0.5 }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}.
          </div>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 300, color: 'var(--text-3)', letterSpacing: 2 }}>{time}</div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {stats.map(stat => (
          <button key={stat.label} onClick={() => d({ type: 'MOD', v: stat.mod })}
            style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = `${stat.color}44`; e.currentTarget.style.background = `${stat.color}08` }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-1)' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${stat.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={stat.color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d={stat.icon} />
              </svg>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2, fontVariantNumeric: 'tabular-nums' }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>{stat.label}</div>
          </button>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Quick Actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {quickActions.map(a => (
            <button key={a.label} onClick={() => d({ type: 'MOD', v: a.mod })}
              style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${a.color}44`; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.color, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 2 }}>{a.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{a.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent notes */}
      {s.notes.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Recent Notes</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[...s.notes].sort((a, b) => b.updated - a.updated).slice(0, 4).map(n => (
              <button key={n.id} onClick={() => d({ type: 'MOD', v: 'notes' })}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>{n.title}</span>
                <span style={{ fontSize: 11, color: 'var(--text-4)' }}>{new Date(n.updated).toLocaleDateString('en-GB')}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* System status */}
      <div style={{ display: 'flex', gap: 20, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
        {[
          { label: 'Supabase', ok: true },
          { label: 'Claude', ok: !!s.apiKeys.claude },
          { label: 'GPT', ok: !!s.apiKeys.gpt },
          { label: 'Gemini', ok: !!s.apiKeys.gemini },
          { label: `Graph: ${s.graphNodes.length} nodes`, ok: true },
        ].map(x => (
          <div key={x.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-4)' }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: x.ok ? '#22c55e' : '#475569' }} />
            {x.label}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Multi-AI Advisor ─────────────────────────────────────────────────────────
const MODEL_CFG = {
  claude: { name: 'Claude Opus 4',  color: '#4f8ef7', icon: '' },
  gpt:    { name: 'GPT-4o',         color: '#7c3aed', icon: '' },
  gemini: { name: 'Gemini 1.5 Pro', color: '#22c55e', icon: '' },
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
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>Advisor</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && e.ctrlKey && run()}
          placeholder="Ask anything… (Ctrl+Enter to submit)"
          style={{ flex: 1, background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-1)', padding: '10px 14px', fontSize: 13, resize: 'vertical', minHeight: 60, outline: 'none', fontFamily: 'var(--font-ui)' }} />
        {voiceSupported && (
          <button onClick={startVoice} style={{ padding: '8px 12px', background: listening ? 'rgba(0,255,136,0.2)' : 'rgba(0,0,0,0.3)', border: `1px solid ${listening ? '#00ff88' : 'rgba(124,58,237,0.2)'}`, borderRadius: 6, color: listening ? '#00ff88' : '#7c3aed', cursor: 'pointer', fontSize: 16, height: 40 }}>
            🎙
          </button>
        )}
        <button onClick={run} disabled={!prompt.trim() || !hasKey || Object.values(loading).some(Boolean)}
          style={{ padding: '0 18px', background: hasKey ? 'rgba(79,142,247,0.1)' : 'rgba(100,116,139,0.05)', border: `1px solid ${hasKey ? 'rgba(79,142,247,0.3)' : 'var(--border)'}`, borderRadius: 8, color: hasKey ? 'var(--accent)' : 'var(--text-4)', cursor: hasKey ? 'pointer' : 'not-allowed', fontSize: 13, height: 40, fontFamily: 'var(--font-ui)' }}>
          Query
        </button>
      </div>
      {!hasKey && <div style={{ color: '#f59e0b', fontSize: 12 }}>⚠ Add API keys in Config to enable live responses.</div>}
      {ragCtx && <div style={{ color: '#22c55e', fontSize: 11 }}>{ragCtx} source(s) from your knowledge base added to context.</div>}

      <div style={{ display: 'flex', gap: 12, flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {Object.entries(MODEL_CFG).map(([key, cfg]) => (
          <div key={key} style={{ flex: 1, border: `1px solid ${cfg.color}22`, borderRadius: 8, padding: 14, background: `${cfg.color}08`, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: cfg.color }}>{cfg.name}</span>
              {loading[key] && <span style={{ color: 'var(--text-4)', fontSize: 11, marginLeft: 'auto' }}>Thinking…</span>}
            </div>
            <VoiceVisualizer active={!!loading[key]} color={cfg.color} />
            {errors[key] && <div style={{ color: '#ef4444', fontSize: 12 }}>⚠ {errors[key]}</div>}
            {responses[key] && <div style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.7, flex: 1, overflowY: 'auto' }}>{responses[key]}</div>}
            {!loading[key] && !responses[key] && !errors[key] && <div style={{ color: 'var(--text-4)', fontSize: 12 }}>Awaiting query</div>}
          </div>
        ))}
      </div>

      {showSynth && Object.keys(responses).length > 0 && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 16, background: 'var(--bg-1)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 10 }}>Consensus</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-4)', marginBottom: 4 }}>
            <span>Agreement</span>
            <span style={{ color: agreeScore > 70 ? '#22c55e' : agreeScore > 40 ? '#f59e0b' : '#ef4444' }}>{agreeScore}%</span>
          </div>
          <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, marginBottom: 12 }}>
            <div style={{ height: '100%', borderRadius: 2, width: `${agreeScore}%`, background: agreeScore > 70 ? '#22c55e' : agreeScore > 40 ? '#f59e0b' : '#ef4444', transition: 'width 1s ease' }} />
          </div>
          {conflicts.length > 0 && (
            <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 6, padding: 10, marginBottom: 10 }}>
              <div style={{ color: '#ef4444', fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Conflicts detected</div>
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

// ─── Markdown Renderer ────────────────────────────────────────────────────────
function mdToHtml(text, notes) {
  if (!text) return ''
  const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  const inline = raw => {
    let s = esc(raw)
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text-1);font-weight:600">$1</strong>')
    s = s.replace(/\*(.+?)\*/g, '<em style="color:var(--text-2)">$1</em>')
    s = s.replace(/`(.+?)`/g, '<code style="background:rgba(255,255,255,0.07);padding:1px 6px;border-radius:4px;font-family:var(--font-mono);font-size:0.88em;color:#e2e8f0">$1</code>')
    s = s.replace(/#(\w+)/g, '<span style="color:#4f8ef7;font-size:0.9em">#$1</span>')
    s = s.replace(/\[\[([^\]]+)\]\]/g, (_, title) => {
      const found = notes?.find(n => n.title.toLowerCase() === title.toLowerCase())
      const color = found ? '#7c3aed' : '#475569'
      return `<span data-wiki="${esc(title)}" style="color:${color};cursor:pointer;text-decoration:underline;text-underline-offset:3px;text-decoration-color:${color}44">${esc(title)}</span>`
    })
    return s
  }
  const lines = text.split('\n')
  let html = '', inList = false, inCode = false, codeLines = []
  for (const line of lines) {
    if (line.startsWith('```')) {
      if (inCode) {
        html += `<pre style="background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:8px;padding:14px 16px;overflow-x:auto;margin:10px 0"><code style="font-family:var(--font-mono);font-size:13px;line-height:1.6;color:#e2e8f0">${esc(codeLines.join('\n'))}</code></pre>`
        codeLines = []; inCode = false
      } else { inCode = true }
      continue
    }
    if (inCode) { codeLines.push(line); continue }
    if (inList && !line.startsWith('- ') && !line.startsWith('* ')) { html += '</ul>'; inList = false }
    if (line.startsWith('# '))        html += `<h1 style="font-size:22px;font-weight:700;color:var(--text-1);margin:24px 0 8px;letter-spacing:-0.4px;line-height:1.2">${inline(line.slice(2))}</h1>`
    else if (line.startsWith('## ')) html += `<h2 style="font-size:17px;font-weight:600;color:var(--text-1);margin:18px 0 6px;letter-spacing:-0.2px">${inline(line.slice(3))}</h2>`
    else if (line.startsWith('### '))html += `<h3 style="font-size:14px;font-weight:600;color:var(--text-2);margin:14px 0 4px;text-transform:uppercase;letter-spacing:0.5px">${inline(line.slice(4))}</h3>`
    else if (line.startsWith('> ')) html += `<blockquote style="border-left:2px solid var(--border-md);margin:8px 0;padding:3px 0 3px 14px;color:var(--text-3);font-style:italic">${inline(line.slice(2))}</blockquote>`
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) { html += '<ul style="list-style:none;margin:6px 0;padding:0;display:flex;flex-direction:column;gap:3px">'; inList = true }
      html += `<li style="display:flex;gap:10px;align-items:flex-start;color:var(--text-2);line-height:1.6"><span style="color:var(--text-4);margin-top:8px;width:4px;height:4px;border-radius:50%;background:var(--text-4);flex-shrink:0;display:block"></span><span>${inline(line.slice(2))}</span></li>`
    }
    else if (line.trim() === '') html += '<div style="height:6px"></div>'
    else html += `<p style="color:var(--text-2);line-height:1.75;margin:2px 0">${inline(line)}</p>`
  }
  if (inList) html += '</ul>'
  return html
}

// ─── Notes Module ─────────────────────────────────────────────────────────────
function NotesModule() {
  const { s, d } = useOrbis()
  const [selected, setSelected] = useState(null)
  const [newTitle, setNewTitle] = useState('')
  const [view, setView] = useState('split') // edit | preview | split
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState(null)
  const previewRef = useRef(null)
  const note = s.notes.find(n => n.id === selected)

  // All tags across all notes
  const allTags = useMemo(() => {
    const tags = new Set()
    s.notes.forEach(n => (n.tags || []).forEach(t => tags.add(t)))
    return [...tags]
  }, [s.notes])

  // Backlinks: notes that link to current note via [[title]]
  const backlinks = useMemo(() => {
    if (!note) return []
    return s.notes.filter(n => n.id !== note.id && n.body?.includes(`[[${note.title}]]`))
  }, [note, s.notes])

  // Filtered note list
  const filtered = useMemo(() => {
    let list = [...s.notes].sort((a, b) => b.updated - a.updated)
    if (search) list = list.filter(n => n.title.toLowerCase().includes(search.toLowerCase()) || n.body?.toLowerCase().includes(search.toLowerCase()))
    if (tagFilter) list = list.filter(n => (n.tags || []).includes(tagFilter))
    return list
  }, [s.notes, search, tagFilter])

  // Handle wikilink clicks in preview
  useEffect(() => {
    const el = previewRef.current
    if (!el) return
    const handler = e => {
      const wiki = e.target.getAttribute('data-wiki')
      if (wiki) {
        const target = s.notes.find(n => n.title.toLowerCase() === wiki.toLowerCase())
        if (target) setSelected(target.id)
      }
    }
    el.addEventListener('click', handler)
    return () => el.removeEventListener('click', handler)
  }, [s.notes, view])

  const exportNote = () => {
    if (!note) return
    const blob = new Blob([`# ${note.title}\n\n${note.body}`], { type: 'text/markdown' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `${note.title.replace(/[^a-z0-9]/gi, '-')}.md`; a.click()
  }

  const wordCount = note?.body ? note.body.trim().split(/\s+/).filter(Boolean).length : 0

  const sidebarStyle = { width: 220, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', paddingRight: 0 }
  const btnStyle = active => ({ padding: '4px 10px', borderRadius: 5, border: 'none', background: active ? 'rgba(255,255,255,0.08)' : 'transparent', color: active ? 'var(--text-1)' : 'var(--text-3)', cursor: 'pointer', fontSize: 12, fontWeight: active ? 500 : 400, fontFamily: 'var(--font-ui)' })

  return (
    <div style={{ display: 'flex', height: '100%', gap: 0 }}>
      {/* Left: file list */}
      <div style={sidebarStyle}>
        <div style={{ padding: '0 12px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', letterSpacing: 0.5 }}>Notes</span>
            <span style={{ fontSize: 11, color: 'var(--text-4)' }}>{s.notes.length}</span>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-2)', padding: '6px 10px', fontSize: 12, outline: 'none', width: '100%' }} />
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && newTitle.trim()) { d({ type: 'ADD_NOTE', v: newTitle.trim() }); setNewTitle('') } }}
            placeholder="New note..."
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-2)', padding: '6px 10px', fontSize: 12, outline: 'none', width: '100%' }} />
        </div>

        {/* Tags */}
        {allTags.length > 0 && (
          <div style={{ padding: '6px 12px', display: 'flex', flexWrap: 'wrap', gap: 4, borderTop: '1px solid var(--border)' }}>
            {allTags.map(t => (
              <button key={t} onClick={() => setTagFilter(tagFilter === t ? null : t)}
                style={{ padding: '2px 8px', borderRadius: 20, border: 'none', background: tagFilter === t ? '#4f8ef722' : 'rgba(255,255,255,0.04)', color: tagFilter === t ? '#4f8ef7' : 'var(--text-3)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-ui)' }}>
                #{t}
              </button>
            ))}
          </div>
        )}

        {/* File list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
          {filtered.length === 0 && <div style={{ color: 'var(--text-4)', fontSize: 12, padding: '12px 4px' }}>No notes yet. Type a title above and press Enter.</div>}
          {filtered.map(n => (
            <button key={n.id} onClick={() => setSelected(n.id)}
              style={{ width: '100%', display: 'block', padding: '8px 10px', borderRadius: 7, border: 'none', background: selected === n.id ? 'rgba(255,255,255,0.06)' : 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s' }}
              onMouseEnter={e => { if (selected !== n.id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
              onMouseLeave={e => { if (selected !== n.id) e.currentTarget.style.background = 'transparent' }}>
              <div style={{ fontSize: 13, fontWeight: selected === n.id ? 500 : 400, color: selected === n.id ? 'var(--text-1)' : 'var(--text-2)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-4)', display: 'flex', gap: 6 }}>
                <span>{new Date(n.updated).toLocaleDateString('en-GB')}</span>
                {(n.tags || []).slice(0, 2).map(t => <span key={t} style={{ color: '#4f8ef755' }}>#{t}</span>)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main editor area */}
      {note ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <input value={note.title} onChange={e => d({ type: 'UPD_NOTE', id: note.id, v: { title: e.target.value } })}
              style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-1)', fontSize: 15, fontWeight: 600, outline: 'none', letterSpacing: -0.2 }} />
            <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: 2 }}>
              {['edit','split','preview'].map(v => (
                <button key={v} onClick={() => setView(v)} style={btnStyle(view === v)}>{v.charAt(0).toUpperCase() + v.slice(1)}</button>
              ))}
            </div>
            <button onClick={exportNote} style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-3)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-ui)' }}>Export .md</button>
            <button onClick={() => { d({ type: 'DEL_NOTE', id: note.id }); setSelected(null) }}
              style={{ padding: '4px 10px', borderRadius: 5, border: 'none', background: 'transparent', color: 'var(--text-4)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-ui)' }}>Delete</button>
          </div>

          {/* Editor + Preview */}
          <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
            {(view === 'edit' || view === 'split') && (
              <textarea value={note.body} onChange={e => d({ type: 'UPD_NOTE', id: note.id, v: { body: e.target.value } })}
                placeholder={'# Start writing...\n\nUse [[Note Title]] to link notes.\nUse #tag to add tags.\nUse **bold**, *italic*, `code`.\n\nAll keywords are auto-linked in the knowledge graph.'}
                style={{ flex: 1, background: 'transparent', border: 'none', borderRight: view === 'split' ? '1px solid var(--border)' : 'none', color: 'var(--text-2)', padding: '20px 24px', fontSize: 14, lineHeight: 1.8, resize: 'none', outline: 'none', fontFamily: 'var(--font-mono)', minWidth: 0 }} />
            )}
            {(view === 'preview' || view === 'split') && (
              <div ref={previewRef}
                dangerouslySetInnerHTML={{ __html: mdToHtml(note.body, s.notes) || '<p style="color:var(--text-4);font-size:13px">Nothing to preview yet.</p>' }}
                style={{ flex: 1, padding: '20px 28px', overflowY: 'auto', minWidth: 0 }} />
            )}
          </div>

          {/* Status bar */}
          <div style={{ height: 28, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', paddingInline: 16, gap: 16, flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: 'var(--text-4)' }}>{wordCount} words</span>
            {backlinks.length > 0 && <span style={{ fontSize: 11, color: 'var(--text-4)' }}>{backlinks.length} backlink{backlinks.length > 1 ? 's' : ''}</span>}
            {(note.tags || []).map(t => <span key={t} style={{ fontSize: 11, color: '#4f8ef766' }}>#{t}</span>)}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text-4)' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          <span style={{ fontSize: 13 }}>Select a note or create one</span>
        </div>
      )}

      {/* Right: backlinks panel */}
      {note && backlinks.length > 0 && (
        <div style={{ width: 200, borderLeft: '1px solid var(--border)', padding: '16px 14px', flexShrink: 0, overflowY: 'auto' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Backlinks</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {backlinks.map(n => (
              <button key={n.id} onClick={() => setSelected(n.id)}
                style={{ width: '100%', textAlign: 'left', padding: '7px 10px', borderRadius: 6, border: 'none', background: 'rgba(255,255,255,0.03)', color: 'var(--text-2)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-ui)' }}>
                {n.title}
              </button>
            ))}
          </div>
        </div>
      )}
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
      <div style={{ width: 200, borderRight: '1px solid var(--border)', paddingRight: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Journal</div>
        <button onClick={() => { if (!s.journals.find(jj => jj.date === today)) d({ type: 'ADD_JOURNAL', v: today }); setSelected(s.journals.find(jj => jj.date === today)?.id || Date.now()) }}
          style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-2)', cursor: 'pointer', padding: '7px 10px', fontSize: 12, fontFamily: 'var(--font-ui)' }}>
          + New entry
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
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: 0.3, marginBottom: 6 }}>30-day mood</div>
          <MoodChart journals={s.journals} />
        </div>
        {j ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: 'var(--text-1)', fontSize: 13, fontWeight: 600 }}>{j.date}</span>
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
              style={{ flex: 1, background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-1)', padding: '12px 14px', fontSize: 13, lineHeight: 1.8, resize: 'none', outline: 'none', fontFamily: 'var(--font-ui)' }} />
            {s.apiKeys.claude && (
              <button onClick={getReflection} disabled={reflecting || !j.body}
                style={{ alignSelf: 'flex-end', padding: '7px 16px', background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-2)', cursor: reflecting ? 'not-allowed' : 'pointer', fontSize: 12, fontFamily: 'var(--font-ui)' }}>
                {reflecting ? 'Reflecting…' : 'Get reflection'}
              </button>
            )}
            {j.reflection && (
              <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 6 }}>Reflection</div>
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
  const STATUS_COLORS = { todo: '#64748b', 'in-progress': '#f59e0b', done: '#22c55e' }

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
      <div style={{ width: 240, borderRight: '1px solid var(--border)', paddingRight: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Goals · {s.goals.length}</div>
        <input value={newGoal} onChange={e => setNewGoal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && newGoal.trim()) { d({ type: 'ADD_GOAL', v: newGoal.trim() }); setNewGoal('') } }}
          placeholder="New goal (Enter)..."
          style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-1)', padding: '6px 8px', fontSize: 12, outline: 'none', fontFamily: 'var(--font-ui)' }} />
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {s.goals.map(g => (
            <div key={g.id} onClick={() => { setSel(g.id); setRoadmap('') }}
              style={{ padding: '10px', borderRadius: 6, cursor: 'pointer', border: `1px solid ${sel === g.id ? 'var(--border-md)' : 'transparent'}`, background: sel === g.id ? 'rgba(255,255,255,0.04)' : 'transparent' }}>
              <div style={{ color: 'var(--text-1)', fontSize: 13, fontWeight: 500 }}>{g.title}</div>
              <div style={{ height: 2, background: 'var(--border)', borderRadius: 2, marginTop: 6 }}>
                <div style={{ height: '100%', borderRadius: 2, width: `${g.progress}%`, background: 'var(--accent)' }} />
              </div>
              <div style={{ color: 'var(--text-4)', fontSize: 11, marginTop: 3 }}>{g.status} · {g.progress}%</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {goal ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--text-1)', fontSize: 16, fontWeight: 600 }}>{goal.title}</span>
              <select value={goal.status} onChange={e => d({ type: 'UPD_GOAL', id: goal.id, v: { status: e.target.value } })}
                style={{ marginLeft: 'auto', background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-2)', padding: '4px 8px', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
                {['todo', 'in-progress', 'done'].map(st => <option key={st} value={st}>{st}</option>)}
              </select>
              <button onClick={() => { d({ type: 'DEL_GOAL', id: goal.id }); setSel(null) }}
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 4, color: '#ef4444', cursor: 'pointer', padding: '3px 8px', fontSize: 10 }}>DEL</button>
            </div>
            <textarea value={goal.description} onChange={e => d({ type: 'UPD_GOAL', id: goal.id, v: { description: e.target.value } })}
              placeholder="Add description..."
              style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-1)', padding: '10px 14px', fontSize: 13, lineHeight: 1.7, resize: 'none', outline: 'none', minHeight: 70, fontFamily: 'var(--font-ui)' }} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 8 }}>Milestones</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input value={newMs} onChange={e => setNewMs(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && newMs.trim()) { d({ type: 'ADD_MS', id: goal.id, v: newMs.trim() }); setNewMs('') } }}
                  placeholder="Add milestone (Enter)..."
                  style={{ flex: 1, background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-1)', padding: '6px 8px', fontSize: 12, outline: 'none', fontFamily: 'var(--font-ui)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {goal.milestones.map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'transparent', borderRadius: 6, border: '1px solid var(--border)' }}>
                    <input type="checkbox" checked={m.done} onChange={() => d({ type: 'TOGGLE_MS', id: goal.id, mid: m.id })} style={{ cursor: 'pointer', accentColor: 'var(--accent)' }} />
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
                style={{ alignSelf: 'flex-start', padding: '7px 16px', background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-2)', cursor: loadingRoad ? 'not-allowed' : 'pointer', fontSize: 12, fontFamily: 'var(--font-ui)' }}>
                {loadingRoad ? 'Generating…' : 'Generate roadmap'}
              </button>
            )}
            {roadmap && (
              <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 8 }}>Roadmap</div>
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
  { id: 'orbis',    name: 'ORBIS',     c: '#4f8ef7', tag: 'Executive second brain', sys: ORBIS_SYSTEM },
  { id: 'socrates', name: 'Socrates',  c: '#7c3aed', tag: 'Dialectical inquiry', sys: 'You are Socrates. Guide through questioning, never state answers directly. Reveal hidden assumptions.' },
  { id: 'edison',   name: 'Edison',    c: '#f59e0b', tag: 'Innovation architect', sys: 'You are Thomas Edison. Intensely practical. Focus on experimentation, iteration, and commercial viability.' },
  { id: 'cassandra',name: 'Cassandra', c: '#ef4444', tag: 'Risk analyst', sys: 'You are Cassandra. Identify what will go wrong. Be specific, evidence-based, and unflinching about risks.' },
  { id: 'tesla',    name: 'Tesla',     c: '#a855f7', tag: 'Systems visionary', sys: 'You are Nikola Tesla. Think in systems, resonances, and interconnections. Challenge conventional paradigms.' },
]

function AgentsModule() {
  const { s, d } = useOrbis()
  const { speak } = useSpeak()
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
      speak(full)
    } catch (e) {
      d({ type: 'AGENT_MSG', id: selAgent, v: { role: 'error', text: e.message, ts: Date.now() } })
    }
    setStreamBuf(''); setStreaming(false)
  }

  return (
    <div style={{ display: 'flex', gap: 16, height: '100%' }}>
      <div style={{ width: 200, borderRight: '1px solid var(--border)', paddingRight: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>Agents</div>
        {allAgents.map(a => (
          <button key={a.id} onClick={() => setSelAgent(a.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', border: `1px solid ${selAgent === a.id ? 'var(--border-md)' : 'transparent'}`, background: selAgent === a.id ? 'rgba(255,255,255,0.05)' : 'transparent', textAlign: 'left' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.c, flexShrink: 0 }} />
            <div>
              <div style={{ color: selAgent === a.id ? 'var(--text-1)' : 'var(--text-2)', fontSize: 13, fontWeight: selAgent === a.id ? 500 : 400 }}>{a.name}</div>
              <div style={{ color: 'var(--text-4)', fontSize: 11 }}>{a.tag}</div>
            </div>
          </button>
        ))}
        {msgs.length > 0 && (
          <button onClick={() => d({ type: 'CLEAR_AGENT', id: selAgent })}
            style={{ marginTop: 'auto', padding: '6px 10px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-3)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-ui)' }}>
            Clear chat
          </button>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {agent && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: agent.c, flexShrink: 0 }} />
            <div>
              <div style={{ color: 'var(--text-1)', fontSize: 14, fontWeight: 600 }}>{agent.name}</div>
              <div style={{ color: 'var(--text-3)', fontSize: 11 }}>{agent.tag}</div>
            </div>
            {!s.apiKeys.claude && <div style={{ marginLeft: 'auto', color: '#f59e0b', fontSize: 11 }}>Claude key required</div>}
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
            placeholder={`Message ${agent?.name}… (Enter to send, Shift+Enter for newline)`}
            style={{ flex: 1, background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-1)', padding: '10px 14px', fontSize: 13, resize: 'none', outline: 'none', minHeight: 44, maxHeight: 120, fontFamily: 'var(--font-ui)' }} />
          {voiceSupported && (
            <button onClick={startVoice} style={{ padding: '8px 10px', background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 8, color: listening ? agent?.c : 'var(--text-3)', cursor: 'pointer', fontSize: 16 }}>🎙</button>
          )}
          <button onClick={send} disabled={!input.trim() || !s.apiKeys.claude || streaming}
            style={{ padding: '0 16px', background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.3)', borderRadius: 8, color: 'var(--accent)', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-ui)' }}>
            {streaming ? '…' : 'Send'}
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
      <div style={{ width: 260, borderRight: '1px solid var(--border)', paddingRight: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>History · {s.synthHistory.length}</div>
        {s.synthHistory.length === 0 && <div style={{ color: 'var(--text-4)', fontSize: 12 }}>No sessions yet. Run an Advisor query.</div>}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {s.synthHistory.map((h, i) => (
            <div key={i} onClick={() => setSel(i)}
              style={{ padding: '9px 10px', borderRadius: 6, cursor: 'pointer', border: `1px solid ${sel === i ? 'var(--border-md)' : 'transparent'}`, background: sel === i ? 'rgba(255,255,255,0.04)' : 'transparent' }}>
              <div style={{ color: 'var(--text-1)', fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.prompt.slice(0, 50)}{h.prompt.length > 50 ? '…' : ''}</div>
              <div style={{ color: 'var(--text-4)', fontSize: 10, marginTop: 2 }}>{new Date(h.ts).toLocaleString('en-GB')} · {Object.keys(h.responses || {}).join(', ')}</div>
              {h.rag && <div style={{ color: '#22c55e', fontSize: 9, marginTop: 2 }}>RAG</div>}
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {item ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ color: 'var(--text-1)', fontSize: 14, fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>{item.prompt}</div>
            <div style={{ color: 'var(--text-4)', fontSize: 11 }}>{new Date(item.ts).toLocaleString('en-GB')}</div>
            {Object.entries(item.responses || {}).map(([model, text]) => (
              <div key={model} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 14, background: 'var(--bg-1)' }}>
                <div style={{ color: MODEL_CFG[model]?.color, fontSize: 11, fontWeight: 600, marginBottom: 10 }}>{MODEL_CFG[model]?.name}</div>
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
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>Settings</div>

      <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>
        Signed in as <span style={{ color: 'var(--text-1)' }}>{session?.user?.email}</span>. Data is stored per-account in Supabase with Row Level Security.
      </div>

      {[
        { key: 'claude', label: 'Anthropic / Claude', placeholder: 'sk-ant-...' },
        { key: 'gpt',    label: 'OpenAI / GPT-4o',    placeholder: 'sk-...' },
        { key: 'gemini', label: 'Google / Gemini',     placeholder: 'AIza...' },
      ].map(({ key, label, placeholder }) => (
        <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ color: 'var(--text-3)', fontSize: 11, fontWeight: 500 }}>{label}</label>
          <input type="password" value={keys[key]} onChange={e => setKeys(p => ({ ...p, [key]: e.target.value }))}
            placeholder={placeholder}
            style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-1)', padding: '10px 14px', fontSize: 13, outline: 'none', fontFamily: 'var(--font-ui)' }} />
        </div>
      ))}

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={save} style={{ padding: '9px 20px', background: saved ? 'rgba(34,197,94,0.1)' : 'rgba(79,142,247,0.1)', border: `1px solid ${saved ? 'rgba(34,197,94,0.3)' : 'rgba(79,142,247,0.3)'}`, borderRadius: 6, color: saved ? '#22c55e' : 'var(--accent)', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-ui)' }}>
          {saved ? 'Saved' : 'Save keys'}
        </button>
        <button onClick={logout} style={{ padding: '9px 20px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-3)', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-ui)' }}>
          Sign out
        </button>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, color: 'var(--text-4)', fontSize: 11, lineHeight: 2 }}>
        <div style={{ color: 'var(--text-3)', fontWeight: 600, marginBottom: 8 }}>System status</div>
        {[
          ['Supabase Auth',   '#22c55e', 'Authenticated'],
          ['RLS Vault',       '#22c55e', 'Secure'],
          ['Notes',          'var(--text-3)', `${s.notes.length}`],
          ['Journals',       'var(--text-3)', `${s.journals.length}`],
          ['Goals',          'var(--text-3)', `${s.goals.length}`],
          ['Memories',       'var(--text-3)', `${s.memories.length}/10`],
          ['Synth History',  'var(--text-3)', `${s.synthHistory.length}`],
          ['Claude API',     s.apiKeys.claude ? '#22c55e' : '#ef4444', s.apiKeys.claude ? 'Set' : 'Not set'],
          ['GPT API',        s.apiKeys.gpt    ? '#22c55e' : 'var(--text-4)', s.apiKeys.gpt    ? 'Set' : 'Not set'],
          ['Gemini API',     s.apiKeys.gemini ? '#22c55e' : 'var(--text-4)', s.apiKeys.gemini ? 'Set' : 'Not set'],
        ].map(([label, color, status]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{label}</span><span style={{ color }}>{status}</span>
          </div>
        ))}
      </div>

      {s.memories.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 10 }}>Memories ({s.memories.length}/10)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {s.memories.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, padding: '8px 10px', background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 6 }}>
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
  const { muted, setMuted } = useSpeak()
  const [showPalette, setShowPalette] = useState(false)

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

  const allNavItems = NAV_GROUPS.flatMap(g => g.items).concat([{ id: 'settings', label: 'Settings' }])
  const activeNav = allNavItems.find(o => o.id === s.activeModule)

  return (
    <>
      {showPalette && <CommandPalette onClose={() => setShowPalette(false)} />}
      <Sidebar />
      <main style={{ position: 'relative', zIndex: 10, marginLeft: 200, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <div style={{ height: 48, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', paddingInline: 24, gap: 8, background: 'rgba(8,8,18,0.8)', backdropFilter: 'blur(12px)', flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>{activeNav?.label}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setShowPalette(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-3)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-ui)' }}>
              <span>Search</span>
              <kbd style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 3, padding: '1px 5px', fontSize: 10, fontFamily: 'var(--font-mono)' }}>⌘K</kbd>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
              <span style={{ fontSize: 11, color: 'var(--text-4)' }}>Connected</span>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 28 }}>
          {renderModule()}
        </div>
      </main>
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Page() {
  return (
    <Provider>
      <SpeakProvider>
        <Head>
          <title>ORBIS — Neural Intelligence Interface</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <OrbisApp />
      </SpeakProvider>
    </Provider>
  )
}
