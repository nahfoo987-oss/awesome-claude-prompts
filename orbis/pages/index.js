/**
 * ORBIS — Neural Intelligence Interface  v4.0
 * Full stack: Knowledge Graph · Multi-AI Synthesis · Journal · Goals · Named Agents · 3D Orb Room
 *
 * Drop into pages/index.js of a Next.js project.
 * npm install d3 three zustand  →  npm run dev
 */

import Head from 'next/head'
import { useState, useEffect, useRef, useCallback, useReducer, createContext, useContext } from 'react'
import dynamic from 'next/dynamic'

// ─── AES-256-GCM Encrypted localStorage ──────────────────────────────────────
const STORAGE_KEY = 'orbis_v2'

async function deriveKey(pw = 'orbis-default') {
  const enc = new TextEncoder()
  const km = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode('orbis-salt-2024'), iterations: 100000, hash: 'SHA-256' },
    km, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
  )
}
async function encryptData(data) {
  try {
    const key = await deriveKey()
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const enc = new TextEncoder()
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(data)))
    const combined = new Uint8Array(iv.length + ct.byteLength)
    combined.set(iv); combined.set(new Uint8Array(ct), iv.length)
    return btoa(String.fromCharCode(...combined))
  } catch { return null }
}
async function decryptData(cipher) {
  try {
    const key = await deriveKey()
    const combined = Uint8Array.from(atob(cipher), c => c.charCodeAt(0))
    const iv = combined.slice(0, 12)
    const data = combined.slice(12)
    const dec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
    return JSON.parse(new TextDecoder().decode(dec))
  } catch { return null }
}

// ─── State ────────────────────────────────────────────────────────────────────
const OrbisContext = createContext(null)

const initialState = {
  activeModule: 'home',
  notes: [],
  journals: [],
  goals: [],
  customAgents: [],
  agentMessages: {},
  apiKeys: { claude: '', gpt: '', gemini: '' },
  synthHistory: [],
  graphNodes: [],
  graphLinks: [],
  theme: { mouseX: 0.5, mouseY: 0.5 },
  bootDone: false,
}

function extractKeywords(text) {
  const stop = new Set(['the','a','an','is','in','it','of','to','and','or','for','on','at','by','with','that','this','was','are','be','from','as'])
  return [...new Set(
    text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/)
      .filter(w => w.length > 4 && !stop.has(w))
  )].slice(0, 6)
}

function orbisReducer(state, action) {
  switch (action.type) {
    case 'SET_MODULE':   return { ...state, activeModule: action.payload }
    case 'SET_BOOT_DONE': return { ...state, bootDone: true }
    case 'SET_KEYS':     return { ...state, apiKeys: { ...state.apiKeys, ...action.payload } }
    case 'SET_THEME':    return { ...state, theme: action.payload }
    case 'LOAD_STATE':   return { ...state, ...action.payload }

    // ── Notes ──
    case 'ADD_NOTE': {
      const note = { id: Date.now(), title: action.title, body: '', tags: [], updated: Date.now() }
      const nodes = [...state.graphNodes, { id: note.id, label: action.title, updated: Date.now(), size: 6 }]
      return { ...state, notes: [...state.notes, note], graphNodes: nodes }
    }
    case 'UPDATE_NOTE': {
      const updated = state.notes.map(n => n.id === action.id ? { ...n, ...action.payload, updated: Date.now() } : n)
      const note = updated.find(n => n.id === action.id)
      let newNodes = state.graphNodes.map(nd => nd.id === action.id ? { ...nd, label: note.title, updated: Date.now() } : nd)
      let newLinks = state.graphLinks
      if (action.payload.body) {
        extractKeywords(action.payload.body).forEach(kw => {
          const kwId = `kw_${kw}`
          if (!newNodes.find(n => n.id === kwId))
            newNodes = [...newNodes, { id: kwId, label: kw, type: 'keyword', updated: Date.now(), size: 4 }]
          if (!newLinks.find(l => l.source === action.id && l.target === kwId))
            newLinks = [...newLinks, { source: action.id, target: kwId }]
        })
      }
      return { ...state, notes: updated, graphNodes: newNodes, graphLinks: newLinks }
    }
    case 'DELETE_NOTE':
      return {
        ...state,
        notes: state.notes.filter(n => n.id !== action.id),
        graphNodes: state.graphNodes.filter(n => n.id !== action.id),
        graphLinks: state.graphLinks.filter(l => l.source !== action.id && l.target !== action.id),
      }

    // ── Journal ──
    case 'ADD_JOURNAL': {
      const j = { id: Date.now(), date: action.date, body: '', mood: 3, reflection: '' }
      return { ...state, journals: [...state.journals, j] }
    }
    case 'UPDATE_JOURNAL':
      return { ...state, journals: state.journals.map(j => j.id === action.id ? { ...j, ...action.payload } : j) }
    case 'DELETE_JOURNAL':
      return { ...state, journals: state.journals.filter(j => j.id !== action.id) }

    // ── Goals ──
    case 'ADD_GOAL': {
      const g = { id: Date.now(), title: action.title, description: action.description || '', status: 'todo', progress: 0, milestones: [], created: Date.now() }
      return { ...state, goals: [...state.goals, g] }
    }
    case 'UPDATE_GOAL':
      return { ...state, goals: state.goals.map(g => g.id === action.id ? { ...g, ...action.payload } : g) }
    case 'DELETE_GOAL':
      return { ...state, goals: state.goals.filter(g => g.id !== action.id) }
    case 'ADD_MILESTONE':
      return {
        ...state,
        goals: state.goals.map(g => g.id === action.goalId
          ? { ...g, milestones: [...g.milestones, { id: Date.now(), text: action.text, done: false }] }
          : g)
      }
    case 'TOGGLE_MILESTONE': {
      const goals = state.goals.map(g => {
        if (g.id !== action.goalId) return g
        const milestones = g.milestones.map(m => m.id === action.milestoneId ? { ...m, done: !m.done } : m)
        const progress = milestones.length ? Math.round(milestones.filter(m => m.done).length / milestones.length * 100) : 0
        return { ...g, milestones, progress }
      })
      return { ...state, goals }
    }
    case 'DELETE_MILESTONE':
      return {
        ...state,
        goals: state.goals.map(g => g.id === action.goalId
          ? { ...g, milestones: g.milestones.filter(m => m.id !== action.milestoneId) }
          : g)
      }

    // ── Agents ──
    case 'ADD_CUSTOM_AGENT':
      return { ...state, customAgents: [...state.customAgents, action.agent] }
    case 'ADD_AGENT_MESSAGE': {
      const prev = state.agentMessages[action.agentId] || []
      return { ...state, agentMessages: { ...state.agentMessages, [action.agentId]: [...prev, action.message] } }
    }
    case 'CLEAR_AGENT_MESSAGES': {
      const msgs = { ...state.agentMessages }
      delete msgs[action.agentId]
      return { ...state, agentMessages: msgs }
    }

    // ── Synthesis ──
    case 'ADD_SYNTHESIS':
      return { ...state, synthHistory: [action.payload, ...state.synthHistory].slice(0, 20) }

    default: return state
  }
}

function OrbisProvider({ children }) {
  const [state, dispatch] = useReducer(orbisReducer, initialState)

  // Window bridge for dynamic-imported components
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__orbisState = state
      window.__orbisDispatch = dispatch
    }
  })

  // Persist to encrypted localStorage
  useEffect(() => {
    if (!state.bootDone) return
    const save = async () => {
      const payload = {
        notes: state.notes, journals: state.journals, goals: state.goals,
        customAgents: state.customAgents, agentMessages: state.agentMessages,
        synthHistory: state.synthHistory, graphNodes: state.graphNodes, graphLinks: state.graphLinks,
      }
      const cipher = await encryptData(payload)
      if (cipher) localStorage.setItem(STORAGE_KEY, cipher)
    }
    save()
  }, [state.notes, state.journals, state.goals, state.customAgents, state.agentMessages,
      state.synthHistory, state.graphNodes, state.graphLinks, state.bootDone])

  // Load on mount
  useEffect(() => {
    const load = async () => {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const data = await decryptData(raw)
        if (data) dispatch({ type: 'LOAD_STATE', payload: data })
      }
    }
    load()
  }, [])

  return <OrbisContext.Provider value={{ state, dispatch }}>{children}</OrbisContext.Provider>
}

const useOrbis = () => useContext(OrbisContext)

// ─── Boot Sequence ────────────────────────────────────────────────────────────
const BOOT_LINES = [
  { text: 'ORBIS Neural Interface v4.0.0', delay: 0, color: '#00d4ff' },
  { text: 'Initializing quantum memory subsystems...', delay: 350 },
  { text: 'Neural Net .......................... ONLINE', delay: 750,  color: '#00ff88' },
  { text: 'Knowledge Graph Engine .............. ONLINE', delay: 1050, color: '#00ff88' },
  { text: 'Multi-Model Sync .................... ACTIVE', delay: 1300, color: '#00ff88' },
  { text: 'Conflict Analysis Module ............ ARMED',  delay: 1550, color: '#f59e0b' },
  { text: 'Journal & Reflection Engine ......... ONLINE', delay: 1800, color: '#00ff88' },
  { text: 'Goals & Roadmap Tracker ............. ONLINE', delay: 2050, color: '#00ff88' },
  { text: 'Named AI Agent Framework ............ ONLINE', delay: 2300, color: '#00ff88' },
  { text: '3D Orb Room (Three.js) .............. ONLINE', delay: 2550, color: '#00ff88' },
  { text: 'Encrypting local storage vault ...... SECURE', delay: 2800, color: '#00ff88' },
  { text: 'Voice Synthesis Engine .............. READY',  delay: 3050, color: '#00ff88' },
  { text: '──────────────────────────────────────────────', delay: 3250, color: '#1e3a5f' },
  { text: 'All systems nominal. ORBIS is online.', delay: 3450, color: '#00d4ff' },
]

function BootSequence({ onComplete }) {
  const [lines, setLines] = useState([])
  const [done, setDone] = useState(false)
  useEffect(() => {
    BOOT_LINES.forEach((line, i) => {
      setTimeout(() => {
        setLines(prev => [...prev, line])
        if (i === BOOT_LINES.length - 1) {
          setTimeout(() => setDone(true), 500)
          setTimeout(onComplete, 900)
        }
      }, line.delay)
    })
  }, [onComplete])
  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#050510', zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: done ? 0 : 1, transition: 'opacity 0.8s ease', pointerEvents: done ? 'none' : 'all'
    }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, transparent, #00d4ff44, transparent)',
          animation: 'scan-line 3s linear infinite'
        }} />
      </div>
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <div style={{
          fontSize: 64, fontWeight: 900, letterSpacing: 16,
          background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          animation: 'pulse-glow 2s ease-in-out infinite'
        }}>ORBIS</div>
        <div style={{ color: '#334155', fontSize: 12, letterSpacing: 8, marginTop: 4 }}>
          NEURAL INTELLIGENCE INTERFACE
        </div>
      </div>
      <div style={{
        width: 540, background: 'rgba(0,0,0,0.6)', border: '1px solid #0f2d4a',
        borderRadius: 4, padding: '20px 24px', fontFamily: 'monospace', fontSize: 12
      }}>
        {lines.map((line, i) => (
          <div key={i} style={{ color: line.color || '#94a3b8', marginBottom: 3, animation: 'boot-fade 0.3s ease' }}>
            <span style={{ color: '#1e3a5f', marginRight: 8 }}>[{String(i).padStart(2,'0')}]</span>
            {line.text}
          </div>
        ))}
        <span style={{ color: '#00d4ff', animation: 'flicker 1s infinite' }}>█</span>
      </div>
    </div>
  )
}

// ─── Starfield ────────────────────────────────────────────────────────────────
function Starfield() {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let stars = []
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      stars = Array.from({ length: 200 }, () => ({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        r: Math.random() * 1.2 + 0.2, speed: Math.random() * 0.3 + 0.05,
        opacity: Math.random() * 0.7 + 0.2, twinkle: Math.random() * Math.PI * 2,
      }))
    }
    resize()
    window.addEventListener('resize', resize)
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.strokeStyle = 'rgba(0,212,255,0.03)'; ctx.lineWidth = 1
      for (let x = 0; x < canvas.width; x += 60) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke() }
      for (let y = 0; y < canvas.height; y += 60) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke() }
      const now = Date.now() / 1000
      stars.forEach(s => {
        const tw = Math.sin(now * 1.5 + s.twinkle) * 0.3 + 0.7
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200,220,255,${s.opacity * tw})`; ctx.fill()
        s.y -= s.speed
        if (s.y < 0) { s.y = canvas.height; s.x = Math.random() * canvas.width }
      })
      rafRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
}

// ─── Glass Overlay ────────────────────────────────────────────────────────────
function GlassOverlay({ mouseX, mouseY }) {
  const i = Math.hypot(mouseX - 0.5, mouseY - 0.5) * 2
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
      background: `radial-gradient(ellipse at ${mouseX*100}% ${mouseY*100}%,
        rgba(0,212,255,${0.04 - i*0.02}),
        rgba(124,58,237,${0.03 - i*0.01}) 50%,
        transparent 80%)`
    }} />
  )
}

// ─── Navigation ───────────────────────────────────────────────────────────────
const NAV_ORBS = [
  { id: 'home',    label: 'HOME',    icon: '⬡', color: '#00d4ff' },
  { id: 'advisor', label: 'ADVISOR', icon: '◈', color: '#7c3aed' },
  { id: 'graph',   label: 'GRAPH',   icon: '◎', color: '#00ff88' },
  { id: 'notes',   label: 'NOTES',   icon: '▣', color: '#f59e0b' },
  { id: 'journal', label: 'JOURNAL', icon: '◉', color: '#ec4899' },
  { id: 'goals',   label: 'GOALS',   icon: '◇', color: '#f97316' },
  { id: 'agents',  label: 'AGENTS',  icon: '◑', color: '#a855f7' },
  { id: 'orbs3d',  label: '3D ROOM', icon: '⊕', color: '#06b6d4' },
  { id: 'settings',label: 'CONFIG',  icon: '⚙', color: '#ef4444' },
]

function Sidebar() {
  const { state, dispatch } = useOrbis()
  return (
    <nav style={{
      position: 'fixed', left: 0, top: 0, bottom: 0, width: 70, zIndex: 100,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
      borderRight: '1px solid rgba(0,212,255,0.08)',
      background: 'rgba(5,5,16,0.7)', backdropFilter: 'blur(12px)'
    }}>
      <div style={{ color: '#00d4ff', fontSize: 18, fontWeight: 900, marginBottom: 12, letterSpacing: 2 }}>⬡</div>
      {NAV_ORBS.map(orb => {
        const active = state.activeModule === orb.id
        return (
          <button key={orb.id} onClick={() => dispatch({ type: 'SET_MODULE', payload: orb.id })}
            title={orb.label}
            style={{
              width: 42, height: 42, borderRadius: '50%',
              border: `1px solid ${active ? orb.color : 'rgba(255,255,255,0.06)'}`,
              background: active ? `${orb.color}22` : 'transparent',
              color: active ? orb.color : '#475569', fontSize: 17, cursor: 'pointer',
              transition: 'all 0.2s', boxShadow: active ? `0 0 16px ${orb.color}66` : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
            {orb.icon}
          </button>
        )
      })}
    </nav>
  )
}

// ─── Home Module ─────────────────────────────────────────────────────────────
function HomeModule() {
  const { state, dispatch } = useOrbis()
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-US', { hour12: false }))
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [])

  const statPills = [
    ['NEURAL NET', '#00ff88'],
    ['MULTI-MODEL', state.apiKeys.claude || state.apiKeys.gpt ? '#00ff88' : '#f59e0b'],
    ['GRAPH', '#00ff88'],
    ['JOURNAL', '#ec4899'],
    ['GOALS', '#f97316'],
    ['AGENTS', '#a855f7'],
    ['VAULT', '#00ff88'],
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 36 }}>
      <div style={{ position: 'relative', width: 180, height: 180 }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, #00d4ff44, #7c3aed22, #050510)',
          border: '1px solid rgba(0,212,255,0.3)',
          animation: 'pulse-glow 3s ease-in-out infinite, float 4s ease-in-out infinite',
          boxShadow: '0 0 60px rgba(0,212,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44
        }}>
          <span style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>⬡</span>
        </div>
        <div style={{ position: 'absolute', inset: -20, borderRadius: '50%', border: '1px solid rgba(0,212,255,0.1)', animation: 'spin-slow 8s linear infinite' }}>
          <div style={{ position: 'absolute', top: -4, left: '50%', transform: 'translateX(-50%)', width: 8, height: 8, borderRadius: '50%', background: '#00d4ff', boxShadow: '0 0 10px #00d4ff' }} />
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 44, fontWeight: 900, letterSpacing: 12,
          background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>ORBIS</div>
        <div style={{ color: '#334155', fontSize: 10, letterSpacing: 6, marginTop: 4 }}>NEURAL INTELLIGENCE INTERFACE</div>
        <div style={{ color: '#00d4ff', fontSize: 26, fontWeight: 300, marginTop: 10, fontFamily: 'monospace' }}>{time}</div>
      </div>

      {/* Quick nav orbs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', maxWidth: 480 }}>
        {NAV_ORBS.filter(o => o.id !== 'home').map(orb => (
          <button key={orb.id} onClick={() => dispatch({ type: 'SET_MODULE', payload: orb.id })}
            style={{
              width: 70, height: 70, borderRadius: '50%',
              border: `1px solid ${orb.color}44`, background: `${orb.color}11`,
              color: orb.color, cursor: 'pointer', fontSize: 20,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 3, transition: 'all 0.2s', animation: 'float 3s ease-in-out infinite'
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 24px ${orb.color}66`; e.currentTarget.style.transform = 'scale(1.12)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'scale(1)' }}>
            {orb.icon}
            <span style={{ fontSize: 8, letterSpacing: 1 }}>{orb.label}</span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', fontSize: 10, color: '#334155', borderTop: '1px solid rgba(0,212,255,0.06)', paddingTop: 14 }}>
        {statPills.map(([label, col]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: col, boxShadow: `0 0 5px ${col}` }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Voice Visualizer ─────────────────────────────────────────────────────────
function VoiceVisualizer({ active, color = '#00d4ff' }) {
  const canvasRef = useRef(null)
  const frameRef = useRef(null)
  const bars = useRef(Array.from({ length: 32 }, () => 0))
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
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
      frameRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(frameRef.current)
  }, [active, color])
  return <canvas ref={canvasRef} width={280} height={40} style={{ width: '100%', height: 40, borderRadius: 4 }} />
}

// ─── API callers ──────────────────────────────────────────────────────────────
async function callClaude(apiKey, prompt, system) {
  const body = { model: 'claude-opus-4-7', max_tokens: 1024, messages: [{ role: 'user', content: prompt }] }
  if (system) body.system = system
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify(body)
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.content[0].text
}

async function callGPT(apiKey, prompt) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: prompt }], max_tokens: 1024 })
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.choices[0].message.content
}

async function callGemini(apiKey, prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.candidates[0].content.parts[0].text
}

// ─── Multi-AI Advisor ─────────────────────────────────────────────────────────
const MODEL_CFG = {
  claude: { name: 'Claude', color: '#00d4ff', icon: '◈' },
  gpt:    { name: 'GPT-4',  color: '#7c3aed', icon: '◎' },
  gemini: { name: 'Gemini', color: '#00ff88', icon: '◇' },
}

function detectConflicts(responses) {
  const pairs = [
    [/\byes\b/i, /\bno\b/i], [/\bshould\b/i, /\bshouldn't\b|\bshould not\b/i],
    [/\bincreas/i, /\bdecreas/i], [/\bsimple/i, /\bcomplex/i],
    [/\brecommend\b/i, /\bavoid\b/i], [/\bsafe\b/i, /\brisky\b|\bdangerous\b/i],
  ]
  const conflicts = []
  const keys = Object.keys(responses)
  for (let i = 0; i < keys.length; i++) for (let j = i+1; j < keys.length; j++) {
    const a = responses[keys[i]] || ''; const b = responses[keys[j]] || ''
    pairs.forEach(([pa, pb]) => {
      if ((pa.test(a) && pb.test(b)) || (pa.test(b) && pb.test(a)))
        conflicts.push(`**${MODEL_CFG[keys[i]].name}** vs **${MODEL_CFG[keys[j]].name}**: Divergent (${pa.source.replace(/\\/g,'')})`)
    })
  }
  return [...new Set(conflicts)]
}

function AdvisorModule() {
  const { state, dispatch } = useOrbis()
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState({})
  const [responses, setResponses] = useState({})
  const [errors, setErrors] = useState({})
  const [showSynth, setShowSynth] = useState(false)
  const hasKey = state.apiKeys.claude || state.apiKeys.gpt || state.apiKeys.gemini

  const run = async () => {
    if (!prompt.trim() || !hasKey) return
    setResponses({}); setErrors({}); setShowSynth(false)
    const callers = []
    if (state.apiKeys.claude) callers.push(['claude', () => callClaude(state.apiKeys.claude, prompt)])
    if (state.apiKeys.gpt)    callers.push(['gpt',    () => callGPT(state.apiKeys.gpt, prompt)])
    if (state.apiKeys.gemini) callers.push(['gemini', () => callGemini(state.apiKeys.gemini, prompt)])
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
    dispatch({ type: 'ADD_SYNTHESIS', payload: { prompt, responses: newResp, ts: Date.now() } })
  }

  const conflicts = showSynth ? detectConflicts(responses) : []
  const agreeScore = Math.max(0, 100 - conflicts.length * 15)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
      <div style={{ color: '#7c3aed', fontSize: 13, letterSpacing: 2, fontWeight: 700 }}>◈ MULTI-AI ADVISOR</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && e.ctrlKey && run()}
          placeholder="Enter query... (Ctrl+Enter)"
          style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 6, color: '#e2e8f0', padding: '10px 14px', fontSize: 13, resize: 'vertical', minHeight: 60, outline: 'none' }}
        />
        <button onClick={run} disabled={!prompt.trim() || !hasKey || Object.values(loading).some(Boolean)}
          style={{ padding: '0 18px', background: hasKey ? 'rgba(124,58,237,0.15)' : 'rgba(100,116,139,0.1)', border: `1px solid ${hasKey ? '#7c3aed44' : '#334155'}`, borderRadius: 6, color: hasKey ? '#7c3aed' : '#475569', cursor: hasKey ? 'pointer' : 'not-allowed', fontSize: 12, alignSelf: 'flex-end', height: 40 }}>
          QUERY ◈
        </button>
      </div>
      {!hasKey && <div style={{ color: '#f59e0b', fontSize: 12 }}>⚠ Add API keys in Config to enable live responses.</div>}

      <div style={{ display: 'flex', gap: 12, flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {Object.entries(MODEL_CFG).map(([key, cfg]) => (
          <div key={key} style={{ flex: 1, border: `1px solid ${cfg.color}22`, borderRadius: 8, padding: 14, background: `${cfg.color}08`, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: cfg.color, fontSize: 16 }}>{cfg.icon}</span>
              <span style={{ color: cfg.color, fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>{cfg.name}</span>
              {loading[key] && <span style={{ color: '#64748b', fontSize: 10, marginLeft: 'auto', animation: 'flicker 0.5s infinite' }}>THINKING...</span>}
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
          <div style={{ color: '#7c3aed', fontSize: 12, letterSpacing: 2, marginBottom: 10, fontWeight: 700 }}>◈ ORBIS-CORE SYNTHESIS</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 4 }}>
            <span>MODEL CONSENSUS</span>
            <span style={{ color: agreeScore > 70 ? '#00ff88' : agreeScore > 40 ? '#f59e0b' : '#ef4444' }}>{agreeScore}%</span>
          </div>
          <div style={{ height: 3, background: '#1e293b', borderRadius: 2, marginBottom: 12 }}>
            <div style={{ height: '100%', borderRadius: 2, width: `${agreeScore}%`, background: agreeScore > 70 ? '#00ff88' : agreeScore > 40 ? '#f59e0b' : '#ef4444', transition: 'width 1s ease' }} />
          </div>
          {conflicts.length > 0 && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: 10, marginBottom: 10 }}>
              <div style={{ color: '#ef4444', fontSize: 11, letterSpacing: 2, marginBottom: 6 }}>⚠ CONFLICT ANALYSIS</div>
              {conflicts.map((c, i) => <div key={i} style={{ color: '#fca5a5', fontSize: 12, marginBottom: 3 }}>• {c}</div>)}
            </div>
          )}
          <div style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.7 }}>
            <strong style={{ color: '#7c3aed' }}>Unified advisory:</strong>{' '}
            {conflicts.length === 0
              ? 'All models converge. High confidence in unified output.'
              : `${conflicts.length} divergence(s) detected. Review conflicts before acting.`}
            {' '}Prioritize areas of agreement; flag contradictions for human judgment.
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
  const { state, dispatch } = useOrbis()
  const [selected, setSelected] = useState(null)
  const [newTitle, setNewTitle] = useState('')
  const note = state.notes.find(n => n.id === selected)
  return (
    <div style={{ display: 'flex', gap: 16, height: '100%' }}>
      <div style={{ width: 200, borderRight: '1px solid rgba(245,158,11,0.1)', paddingRight: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ color: '#f59e0b', fontSize: 12, letterSpacing: 2, fontWeight: 700 }}>▣ NOTES</div>
        <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && newTitle.trim()) { dispatch({ type: 'ADD_NOTE', title: newTitle.trim() }); setNewTitle('') } }}
          placeholder="New note (Enter)..."
          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 4, color: '#e2e8f0', padding: '6px 8px', fontSize: 11, outline: 'none' }}
        />
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {state.notes.length === 0 && <div style={{ color: '#334155', fontSize: 11 }}>Type a title above and press Enter.</div>}
          {state.notes.map(n => (
            <div key={n.id} onClick={() => setSelected(n.id)} style={{
              padding: '8px 10px', borderRadius: 4, cursor: 'pointer',
              border: `1px solid ${selected === n.id ? 'rgba(245,158,11,0.4)' : 'transparent'}`,
              background: selected === n.id ? 'rgba(245,158,11,0.08)' : 'transparent'
            }}>
              <div style={{ color: selected === n.id ? '#f59e0b' : '#94a3b8', fontSize: 12, fontWeight: 600 }}>{n.title}</div>
              <div style={{ color: '#334155', fontSize: 10, marginTop: 2 }}>{new Date(n.updated).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {note ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input value={note.title} onChange={e => dispatch({ type: 'UPDATE_NOTE', id: note.id, payload: { title: e.target.value } })}
                style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b', fontSize: 16, fontWeight: 700, outline: 'none', padding: '4px 0' }}
              />
              <button onClick={() => { dispatch({ type: 'DELETE_NOTE', id: note.id }); setSelected(null) }}
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 4, color: '#ef4444', cursor: 'pointer', padding: '4px 10px', fontSize: 11 }}>
                DELETE
              </button>
            </div>
            <textarea value={note.body} onChange={e => dispatch({ type: 'UPDATE_NOTE', id: note.id, payload: { body: e.target.value } })}
              placeholder="Write your thoughts... Keywords auto-appear in the Knowledge Graph."
              style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(245,158,11,0.1)', borderRadius: 6, color: '#e2e8f0', padding: '12px 14px', fontSize: 13, lineHeight: 1.8, resize: 'none', outline: 'none' }}
            />
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e3a5f', fontSize: 13 }}>
            Select or create a note to begin
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Dynamically imported modules ─────────────────────────────────────────────
const JournalModule = dynamic(() => import('../components/JournalModule'), { ssr: false })
const GoalsModule   = dynamic(() => import('../components/GoalsModule'),   { ssr: false })
const AgentsModule  = dynamic(() => import('../components/AgentsModule'),  { ssr: false })
const OrbRoom3D     = dynamic(() => import('../components/OrbRoom3D'),     { ssr: false })

// ─── Settings ─────────────────────────────────────────────────────────────────
function SettingsModule() {
  const { state, dispatch } = useOrbis()
  const [keys, setKeys] = useState(state.apiKeys)
  const [saved, setSaved] = useState(false)
  const save = () => { dispatch({ type: 'SET_KEYS', payload: keys }); setSaved(true); setTimeout(() => setSaved(false), 2000) }
  return (
    <div style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ color: '#ef4444', fontSize: 13, letterSpacing: 2, fontWeight: 700 }}>⚙ ORBIS CONFIGURATION</div>
      <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: 12, fontSize: 12, color: '#fca5a5', lineHeight: 1.6 }}>
        ⚠ API keys live in memory only. State is AES-256-GCM encrypted before touching localStorage.
      </div>
      {[
        { key: 'claude', label: 'Anthropic / Claude', placeholder: 'sk-ant-...', color: '#00d4ff' },
        { key: 'gpt',    label: 'OpenAI / GPT-4',     placeholder: 'sk-...',     color: '#7c3aed' },
        { key: 'gemini', label: 'Google / Gemini',     placeholder: 'AIza...',    color: '#00ff88' },
      ].map(({ key, label, placeholder, color }) => (
        <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ color, fontSize: 11, letterSpacing: 2 }}>{label}</label>
          <input type="password" value={keys[key]} onChange={e => setKeys(p => ({ ...p, [key]: e.target.value }))}
            placeholder={placeholder}
            style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${color}33`, borderRadius: 6, color: '#e2e8f0', padding: '10px 14px', fontSize: 13, outline: 'none' }}
          />
        </div>
      ))}
      <button onClick={save} style={{ alignSelf: 'flex-start', padding: '10px 24px', background: saved ? 'rgba(0,255,136,0.15)' : 'rgba(0,212,255,0.15)', border: `1px solid ${saved ? '#00ff8844' : '#00d4ff44'}`, borderRadius: 6, color: saved ? '#00ff88' : '#00d4ff', cursor: 'pointer', fontSize: 12, letterSpacing: 2 }}>
        {saved ? '✓ SAVED' : 'SAVE CONFIG'}
      </button>
      <div style={{ borderTop: '1px solid rgba(0,212,255,0.06)', paddingTop: 14, color: '#334155', fontSize: 11, lineHeight: 1.9 }}>
        <div style={{ color: '#00d4ff', marginBottom: 8, letterSpacing: 2 }}>SYSTEM STATUS</div>
        {[
          ['Neural Net',       '#00ff88', 'ONLINE'],
          ['Knowledge Graph',  '#00ff88', 'ONLINE'],
          ['3D Orb Room',      '#06b6d4', 'ONLINE'],
          ['Encrypted Vault',  '#00ff88', `ACTIVE — ${state.notes.length} note(s), ${state.journals?.length || 0} journal(s)`],
          ['Goals',            '#f97316', `${state.goals?.length || 0} goal(s)`],
          ['Agent Sessions',   '#a855f7', `${Object.values(state.agentMessages || {}).flat().length} message(s)`],
          ['Synthesis History','#f59e0b', `${state.synthHistory.length} session(s)`],
          ['Claude API',  state.apiKeys.claude  ? '#00ff88' : '#ef4444', state.apiKeys.claude  ? 'KEY PRESENT' : 'NO KEY'],
          ['GPT API',     state.apiKeys.gpt     ? '#00ff88' : '#ef4444', state.apiKeys.gpt     ? 'KEY PRESENT' : 'NO KEY'],
          ['Gemini API',  state.apiKeys.gemini  ? '#00ff88' : '#ef4444', state.apiKeys.gemini  ? 'KEY PRESENT' : 'NO KEY'],
        ].map(([label, color, status]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span>{label}</span><span style={{ color }}>{status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
function OrbisApp() {
  const { state, dispatch } = useOrbis()
  const [booting, setBooting] = useState(true)
  const onBootComplete = useCallback(() => {
    dispatch({ type: 'SET_BOOT_DONE' })
    setTimeout(() => setBooting(false), 200)
  }, [dispatch])

  useEffect(() => {
    const h = (e) => dispatch({ type: 'SET_THEME', payload: { mouseX: e.clientX / window.innerWidth, mouseY: e.clientY / window.innerHeight } })
    window.addEventListener('mousemove', h, { passive: true })
    return () => window.removeEventListener('mousemove', h)
  }, [dispatch])

  const renderModule = () => {
    switch (state.activeModule) {
      case 'home':     return <HomeModule />
      case 'advisor':  return <AdvisorModule />
      case 'graph':    return <KnowledgeGraph />
      case 'notes':    return <NotesModule />
      case 'journal':  return <JournalModule state={state} dispatch={dispatch} />
      case 'goals':    return <GoalsModule   state={state} dispatch={dispatch} />
      case 'agents':   return <AgentsModule  state={state} dispatch={dispatch} />
      case 'orbs3d':   return <OrbRoom3D />
      case 'settings': return <SettingsModule />
      default:         return <HomeModule />
    }
  }

  const activeNav = NAV_ORBS.find(o => o.id === state.activeModule)

  return (
    <>
      {booting && <BootSequence onComplete={onBootComplete} />}
      <Starfield />
      <GlassOverlay mouseX={state.theme.mouseX} mouseY={state.theme.mouseY} />
      <Sidebar />
      <main style={{ position: 'relative', zIndex: 10, marginLeft: 70, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 44, borderBottom: '1px solid rgba(0,212,255,0.06)', display: 'flex', alignItems: 'center', paddingInline: 20, gap: 12, background: 'rgba(5,5,16,0.6)', backdropFilter: 'blur(8px)', flexShrink: 0 }}>
          <span style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 900, letterSpacing: 4, fontSize: 13 }}>ORBIS</span>
          <span style={{ color: '#1e3a5f', fontSize: 10 }}>|</span>
          <span style={{ color: activeNav?.color || '#334155', fontSize: 11, letterSpacing: 2 }}>{activeNav?.label}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 6px #00ff88' }} />
            <span style={{ color: '#334155', fontSize: 10, letterSpacing: 2 }}>ALL SYSTEMS NOMINAL</span>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 22 }}>
          {renderModule()}
        </div>
      </main>
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Page() {
  return (
    <OrbisProvider>
      <Head>
        <title>ORBIS — Neural Intelligence Interface</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <OrbisApp />
    </OrbisProvider>
  )
}
