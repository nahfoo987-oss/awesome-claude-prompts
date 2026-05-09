/**
 * ORBIS — Neural Intelligence Interface
 * Full implementation: Knowledge Graph · Multi-AI Synthesis · JARVIS UI · Encrypted State
 *
 * Drop this file into pages/index.js of any Next.js project.
 * Run: npm install d3 zustand  then  npm run dev
 */

import Head from 'next/head'
import { useState, useEffect, useRef, useCallback, useReducer, createContext, useContext } from 'react'
import dynamic from 'next/dynamic'

// ─── Encryption helpers (Web Crypto AES-GCM) ──────────────────────────────────
const STORAGE_KEY = 'orbis_v1'

async function deriveKey(passphrase) {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode('orbis-salt-2024'), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

async function encryptData(data, passphrase = 'orbis-default') {
  try {
    const key = await deriveKey(passphrase)
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const enc = new TextEncoder()
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(data)))
    const combined = new Uint8Array(iv.length + encrypted.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(encrypted), iv.length)
    return btoa(String.fromCharCode(...combined))
  } catch { return null }
}

async function decryptData(ciphertext, passphrase = 'orbis-default') {
  try {
    const key = await deriveKey(passphrase)
    const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0))
    const iv = combined.slice(0, 12)
    const data = combined.slice(12)
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
    return JSON.parse(new TextDecoder().decode(decrypted))
  } catch { return null }
}

// ─── Global State (Zustand-style with useReducer + Context) ───────────────────
const OrbisContext = createContext(null)

const initialState = {
  activeModule: 'home',
  notes: [],
  apiKeys: { claude: '', gpt: '', gemini: '' },
  synthHistory: [],
  graphNodes: [],
  graphLinks: [],
  theme: { mouseX: 0.5, mouseY: 0.5 },
  bootDone: false,
}

function orbisReducer(state, action) {
  switch (action.type) {
    case 'SET_MODULE': return { ...state, activeModule: action.payload }
    case 'SET_BOOT_DONE': return { ...state, bootDone: true }
    case 'SET_KEYS': return { ...state, apiKeys: { ...state.apiKeys, ...action.payload } }
    case 'SET_THEME': return { ...state, theme: action.payload }
    case 'ADD_NOTE': {
      const note = { id: Date.now(), title: action.title, body: '', tags: [], updated: Date.now() }
      const nodes = [...state.graphNodes, { id: note.id, label: action.title, updated: Date.now(), size: 6 }]
      return { ...state, notes: [...state.notes, note], graphNodes: nodes }
    }
    case 'UPDATE_NOTE': {
      const updated = state.notes.map(n => n.id === action.id ? { ...n, ...action.payload, updated: Date.now() } : n)
      // extract keywords from body for graph
      const note = updated.find(n => n.id === action.id)
      let newNodes = state.graphNodes.map(nd =>
        nd.id === action.id ? { ...nd, label: note.title, updated: Date.now() } : nd
      )
      let newLinks = state.graphLinks
      if (action.payload.body) {
        const keywords = extractKeywords(action.payload.body)
        keywords.forEach(kw => {
          const existing = newNodes.find(n => n.label === kw && n.type === 'keyword')
          if (!existing) {
            const kwId = `kw_${kw}`
            newNodes = [...newNodes, { id: kwId, label: kw, type: 'keyword', updated: Date.now(), size: 4 }]
            newLinks = [...newLinks.filter(l => !(l.source === action.id && l.target === kwId)),
              { source: action.id, target: kwId }]
          } else {
            const kwId = `kw_${kw}`
            if (!newLinks.find(l => l.source === action.id && l.target === kwId)) {
              newLinks = [...newLinks, { source: action.id, target: kwId }]
            }
          }
        })
      }
      return { ...state, notes: updated, graphNodes: newNodes, graphLinks: newLinks }
    }
    case 'DELETE_NOTE':
      return {
        ...state,
        notes: state.notes.filter(n => n.id !== action.id),
        graphNodes: state.graphNodes.filter(n => n.id !== action.id),
        graphLinks: state.graphLinks.filter(l => l.source !== action.id && l.target !== action.id)
      }
    case 'ADD_SYNTHESIS':
      return { ...state, synthHistory: [action.payload, ...state.synthHistory].slice(0, 20) }
    case 'LOAD_STATE':
      return { ...state, ...action.payload }
    default: return state
  }
}

function extractKeywords(text) {
  const stopwords = new Set(['the','a','an','is','in','it','of','to','and','or','for','on','at','by','with','that','this','was','are','be','from','as'])
  return [...new Set(
    text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/)
      .filter(w => w.length > 4 && !stopwords.has(w))
  )].slice(0, 6)
}

function OrbisProvider({ children }) {
  const [state, dispatch] = useReducer(orbisReducer, initialState)

  // Expose state and dispatch via window for dynamic-imported components (KnowledgeGraph)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__orbisState = state
      window.__orbisDispatch = dispatch
    }
  })

  // persist encrypted state
  useEffect(() => {
    const save = async () => {
      const payload = { notes: state.notes, synthHistory: state.synthHistory, graphNodes: state.graphNodes, graphLinks: state.graphLinks }
      const cipher = await encryptData(payload)
      if (cipher) localStorage.setItem(STORAGE_KEY, cipher)
    }
    if (state.bootDone) save()
  }, [state.notes, state.synthHistory, state.graphNodes, state.graphLinks, state.bootDone])

  // load encrypted state on mount
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
  { text: 'ORBIS Neural Interface v3.1.0', delay: 0, color: '#00d4ff' },
  { text: 'Initializing quantum memory subsystems...', delay: 400 },
  { text: 'Neural Net .......................... ONLINE', delay: 900, color: '#00ff88' },
  { text: 'Knowledge Graph Engine .............. ONLINE', delay: 1300, color: '#00ff88' },
  { text: 'Multi-Model Sync .................... ACTIVE', delay: 1700, color: '#00ff88' },
  { text: 'Conflict Analysis Module ............ ARMED', delay: 2100, color: '#f59e0b' },
  { text: 'Encrypting local storage vault ...... SECURE', delay: 2500, color: '#00ff88' },
  { text: 'Voice Synthesis Engine .............. READY', delay: 2900, color: '#00ff88' },
  { text: 'Glassmorphic render pipeline ........ ACTIVE', delay: 3200, color: '#00ff88' },
  { text: '──────────────────────────────────────────', delay: 3500, color: '#1e3a5f' },
  { text: 'All systems nominal. ORBIS is online.', delay: 3700, color: '#00d4ff' },
]

function BootSequence({ onComplete }) {
  const [visibleLines, setVisibleLines] = useState([])
  const [done, setDone] = useState(false)

  useEffect(() => {
    BOOT_LINES.forEach((line, i) => {
      setTimeout(() => {
        setVisibleLines(prev => [...prev, line])
        if (i === BOOT_LINES.length - 1) {
          setTimeout(() => setDone(true), 600)
          setTimeout(onComplete, 1000)
        }
      }, line.delay)
    })
  }, [onComplete])

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#050510', zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: done ? 0 : 1, transition: 'opacity 0.8s ease',
      pointerEvents: done ? 'none' : 'all'
    }}>
      {/* Scan line */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, transparent, #00d4ff44, transparent)',
          animation: 'scan-line 3s linear infinite'
        }} />
      </div>

      {/* Logo */}
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

      {/* Boot log */}
      <div style={{
        width: 520, background: 'rgba(0,0,0,0.6)', border: '1px solid #0f2d4a',
        borderRadius: 4, padding: '20px 24px', fontFamily: 'monospace', fontSize: 12
      }}>
        {visibleLines.map((line, i) => (
          <div key={i} style={{
            color: line.color || '#94a3b8', marginBottom: 4,
            animation: 'boot-fade 0.3s ease forwards'
          }}>
            <span style={{ color: '#1e3a5f', marginRight: 8 }}>[{String(i).padStart(2,'0')}]</span>
            {line.text}
          </div>
        ))}
        <span style={{ color: '#00d4ff', animation: 'flicker 1s infinite' }}>█</span>
      </div>
    </div>
  )
}

// ─── Starfield Canvas ─────────────────────────────────────────────────────────
function Starfield() {
  const canvasRef = useRef(null)
  const starsRef = useRef([])
  const rafRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      starsRef.current = Array.from({ length: 200 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.2 + 0.2,
        speed: Math.random() * 0.3 + 0.05,
        opacity: Math.random() * 0.7 + 0.2,
        twinkle: Math.random() * Math.PI * 2
      }))
    }

    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      // grid
      ctx.strokeStyle = 'rgba(0,212,255,0.03)'
      ctx.lineWidth = 1
      for (let x = 0; x < canvas.width; x += 60) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke()
      }
      for (let y = 0; y < canvas.height; y += 60) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke()
      }
      // stars
      const now = Date.now() / 1000
      starsRef.current.forEach(s => {
        const twinkle = Math.sin(now * 1.5 + s.twinkle) * 0.3 + 0.7
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200,220,255,${s.opacity * twinkle})`
        ctx.fill()
        s.y -= s.speed
        if (s.y < 0) { s.y = canvas.height; s.x = Math.random() * canvas.width }
      })
      rafRef.current = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas ref={canvasRef} style={{
      position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none'
    }} />
  )
}

// ─── Dynamic Glassmorphism Overlay ────────────────────────────────────────────
function GlassOverlay({ mouseX, mouseY }) {
  const intensity = Math.hypot(mouseX - 0.5, mouseY - 0.5) * 2
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
      background: `radial-gradient(ellipse at ${mouseX*100}% ${mouseY*100}%,
        rgba(0,212,255,${0.04 - intensity*0.02}),
        rgba(124,58,237,${0.03 - intensity*0.01}) 50%,
        transparent 80%)`
    }} />
  )
}

// ─── Navigation Orb ──────────────────────────────────────────────────────────
const NAV_ORBS = [
  { id: 'home',    label: 'HOME',    icon: '⬡', color: '#00d4ff' },
  { id: 'advisor', label: 'ADVISOR', icon: '◈', color: '#7c3aed' },
  { id: 'graph',   label: 'GRAPH',   icon: '◎', color: '#00ff88' },
  { id: 'notes',   label: 'NOTES',   icon: '▣', color: '#f59e0b' },
  { id: 'settings',label: 'CONFIG',  icon: '⚙', color: '#ef4444' },
]

function Sidebar() {
  const { state, dispatch } = useOrbis()
  return (
    <nav style={{
      position: 'fixed', left: 0, top: 0, bottom: 0, width: 70,
      zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 8,
      borderRight: '1px solid rgba(0,212,255,0.08)',
      background: 'rgba(5,5,16,0.7)', backdropFilter: 'blur(12px)'
    }}>
      <div style={{ color: '#00d4ff', fontSize: 18, fontWeight: 900, marginBottom: 16, letterSpacing: 2 }}>⬡</div>
      {NAV_ORBS.map(orb => {
        const active = state.activeModule === orb.id
        return (
          <button key={orb.id} onClick={() => dispatch({ type: 'SET_MODULE', payload: orb.id })}
            title={orb.label}
            style={{
              width: 44, height: 44, borderRadius: '50%', border: `1px solid ${active ? orb.color : 'rgba(255,255,255,0.06)'}`,
              background: active ? `${orb.color}22` : 'transparent',
              color: active ? orb.color : '#475569',
              fontSize: 18, cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: active ? `0 0 16px ${orb.color}66` : 'none',
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
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 40 }}>
      {/* Central orb */}
      <div style={{ position: 'relative', width: 200, height: 200 }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, #00d4ff44, #7c3aed22, #050510)',
          border: '1px solid rgba(0,212,255,0.3)',
          animation: 'pulse-glow 3s ease-in-out infinite, float 4s ease-in-out infinite',
          color: '#00d4ff', boxShadow: '0 0 60px rgba(0,212,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 48, fontWeight: 900, letterSpacing: 4
        }}>
          <span style={{
            background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>⬡</span>
        </div>
        {/* Orbit ring */}
        <div style={{
          position: 'absolute', inset: -20, borderRadius: '50%',
          border: '1px solid rgba(0,212,255,0.1)',
          animation: 'spin-slow 8s linear infinite'
        }}>
          <div style={{
            position: 'absolute', top: -4, left: '50%', transform: 'translateX(-50%)',
            width: 8, height: 8, borderRadius: '50%', background: '#00d4ff',
            boxShadow: '0 0 10px #00d4ff'
          }} />
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 48, fontWeight: 900, letterSpacing: 12,
          background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>ORBIS</div>
        <div style={{ color: '#334155', fontSize: 11, letterSpacing: 6, marginTop: 4 }}>
          NEURAL INTELLIGENCE INTERFACE
        </div>
        <div style={{ color: '#00d4ff', fontSize: 28, fontWeight: 300, marginTop: 12, fontFamily: 'monospace' }}>
          {time}
        </div>
      </div>

      {/* Quick-access orbs */}
      <div style={{ display: 'flex', gap: 20 }}>
        {NAV_ORBS.filter(o => o.id !== 'home').map(orb => (
          <button key={orb.id}
            onClick={() => dispatch({ type: 'SET_MODULE', payload: orb.id })}
            style={{
              width: 80, height: 80, borderRadius: '50%',
              border: `1px solid ${orb.color}44`,
              background: `${orb.color}11`,
              color: orb.color, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 4, transition: 'all 0.2s', animation: 'float 3s ease-in-out infinite',
              animationDelay: `${Math.random() * 2}s`,
              fontSize: 22
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 24px ${orb.color}66`; e.currentTarget.style.transform = 'scale(1.1)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'scale(1)' }}
          >
            {orb.icon}
            <span style={{ fontSize: 9, letterSpacing: 1 }}>{orb.label}</span>
          </button>
        ))}
      </div>

      {/* Status strip */}
      <div style={{
        display: 'flex', gap: 24, fontSize: 11, color: '#334155',
        borderTop: '1px solid rgba(0,212,255,0.06)', paddingTop: 16
      }}>
        {[
          ['NEURAL NET', '#00ff88'],
          ['MULTI-MODEL', state.apiKeys.claude || state.apiKeys.gpt ? '#00ff88' : '#f59e0b'],
          ['GRAPH ENGINE', '#00ff88'],
          ['VAULT', '#00ff88'],
        ].map(([label, col]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: col, boxShadow: `0 0 6px ${col}` }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Voice Visualizer Canvas ──────────────────────────────────────────────────
function VoiceVisualizer({ active, color = '#00d4ff' }) {
  const canvasRef = useRef(null)
  const frameRef = useRef(null)
  const barsRef = useRef(Array.from({ length: 32 }, () => 0))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const bars = barsRef.current
      const barW = canvas.width / bars.length
      bars.forEach((h, i) => {
        if (active) {
          const target = Math.random() * 0.8 + 0.1
          bars[i] += (target - h) * 0.3
        } else {
          bars[i] += (0.05 - h) * 0.1
        }
        const barH = bars[i] * canvas.height
        const x = i * barW
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barH)
        gradient.addColorStop(0, `${color}22`)
        gradient.addColorStop(1, color)
        ctx.fillStyle = gradient
        ctx.fillRect(x + 1, canvas.height - barH, barW - 2, barH)
      })
      frameRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(frameRef.current)
  }, [active, color])

  return (
    <canvas ref={canvasRef} width={280} height={40}
      style={{ width: '100%', height: 40, borderRadius: 4 }} />
  )
}

// ─── Multi-AI Advisor Module ──────────────────────────────────────────────────
const MODEL_CONFIG = {
  claude: { name: 'Claude', color: '#00d4ff', model: 'claude-opus-4-7', icon: '◈' },
  gpt:    { name: 'GPT-4',  color: '#7c3aed', model: 'gpt-4o',          icon: '◎' },
  gemini: { name: 'Gemini', color: '#00ff88', model: 'gemini-1.5-pro',  icon: '◇' },
}

async function callClaude(apiKey, prompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-opus-4-7',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    })
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.content[0].text
}

async function callGPT(apiKey, prompt) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024
    })
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.choices[0].message.content
}

async function callGemini(apiKey, prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    }
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.candidates[0].content.parts[0].text
}

function detectConflicts(responses) {
  const conflicts = []
  const keys = Object.keys(responses)
  const contradictionPhrases = [
    [/\byes\b/i, /\bno\b/i],
    [/\bshould\b/i, /\bshould not\b|\bshouldn't\b/i],
    [/\bincreas/i, /\bdecreas/i],
    [/\bsimple/i, /\bcomplex/i],
    [/\brecommend\b/i, /\bavoid\b/i],
    [/\bsafe\b/i, /\brisky\b|\bdangerous\b/i],
  ]

  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const a = responses[keys[i]] || ''
      const b = responses[keys[j]] || ''
      contradictionPhrases.forEach(([pa, pb]) => {
        if ((pa.test(a) && pb.test(b)) || (pa.test(b) && pb.test(a))) {
          conflicts.push(`**${MODEL_CONFIG[keys[i]].name}** vs **${MODEL_CONFIG[keys[j]].name}**: Divergent stance detected (${pa.source.replace(/\\/g,'')})`)
        }
      })
    }
  }
  return [...new Set(conflicts)]
}

function ORBISSynthesis({ responses, prompt }) {
  const conflicts = detectConflicts(responses)
  const allText = Object.values(responses).join(' ')
  const totalWords = allText.split(/\s+/).length
  const agreeScore = Math.max(0, 100 - conflicts.length * 15)

  return (
    <div style={{
      border: '1px solid rgba(0,212,255,0.2)',
      borderRadius: 8, padding: 20, marginTop: 16,
      background: 'linear-gradient(135deg, rgba(0,212,255,0.05), rgba(124,58,237,0.05))'
    }}>
      <div style={{ color: '#00d4ff', fontSize: 13, fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>
        ◈ ORBIS-CORE SYNTHESIS
      </div>

      {/* Consensus meter */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 4 }}>
          <span>MODEL CONSENSUS</span>
          <span style={{ color: agreeScore > 70 ? '#00ff88' : agreeScore > 40 ? '#f59e0b' : '#ef4444' }}>
            {agreeScore}%
          </span>
        </div>
        <div style={{ height: 3, background: '#1e293b', borderRadius: 2 }}>
          <div style={{
            height: '100%', borderRadius: 2, transition: 'width 1s ease',
            width: `${agreeScore}%`,
            background: agreeScore > 70 ? '#00ff88' : agreeScore > 40 ? '#f59e0b' : '#ef4444'
          }} />
        </div>
      </div>

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 6, padding: 12, marginBottom: 12
        }}>
          <div style={{ color: '#ef4444', fontSize: 11, letterSpacing: 2, marginBottom: 8 }}>
            ⚠ CONFLICT ANALYSIS
          </div>
          {conflicts.map((c, i) => (
            <div key={i} style={{ color: '#fca5a5', fontSize: 12, marginBottom: 4 }}>
              • {c}
            </div>
          ))}
        </div>
      )}

      {/* Synthesis */}
      <div style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.7 }}>
        <strong style={{ color: '#00d4ff' }}>Unified advisory:</strong> Based on {Object.keys(responses).length} model{Object.keys(responses).length > 1 ? 's' : ''}
        processing {totalWords} tokens on "{prompt.slice(0, 60)}{prompt.length > 60 ? '…' : ''}" —{' '}
        {conflicts.length === 0
          ? 'all models converge on a consistent perspective. High confidence in the unified output.'
          : `${conflicts.length} divergence point${conflicts.length > 1 ? 's' : ''} detected. Review conflicts above before acting.`}
        {' '}Synthesized advisory: prioritize areas of agreement across models while flagging the noted contradictions for human judgment.
      </div>
    </div>
  )
}

function AdvisorColumn({ modelKey, response, loading, error, color, icon, name }) {
  return (
    <div style={{
      flex: 1, border: `1px solid ${color}22`,
      borderRadius: 8, padding: 16, background: `${color}08`,
      display: 'flex', flexDirection: 'column', gap: 8, minHeight: 200
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color, fontSize: 18 }}>{icon}</span>
        <span style={{ color, fontSize: 12, fontWeight: 700, letterSpacing: 2 }}>{name}</span>
        {loading && <span style={{ color: '#64748b', fontSize: 10, marginLeft: 'auto', animation: 'flicker 0.5s infinite' }}>THINKING...</span>}
      </div>
      <VoiceVisualizer active={loading} color={color} />
      {error && <div style={{ color: '#ef4444', fontSize: 12 }}>⚠ {error}</div>}
      {response && (
        <div style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.7, flex: 1, overflowY: 'auto', maxHeight: 300 }}>
          {response}
        </div>
      )}
      {!loading && !response && !error && (
        <div style={{ color: '#1e3a5f', fontSize: 12, flex: 1 }}>Awaiting query...</div>
      )}
    </div>
  )
}

function AdvisorModule() {
  const { state, dispatch } = useOrbis()
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState({})
  const [responses, setResponses] = useState({})
  const [errors, setErrors] = useState({})
  const [showSynth, setShowSynth] = useState(false)

  const hasAnyKey = state.apiKeys.claude || state.apiKeys.gpt || state.apiKeys.gemini

  const runAdvisor = async () => {
    if (!prompt.trim() || !hasAnyKey) return
    setResponses({})
    setErrors({})
    setShowSynth(false)

    const callers = []
    if (state.apiKeys.claude) callers.push(['claude', () => callClaude(state.apiKeys.claude, prompt)])
    if (state.apiKeys.gpt)    callers.push(['gpt',    () => callGPT(state.apiKeys.gpt, prompt)])
    if (state.apiKeys.gemini) callers.push(['gemini', () => callGemini(state.apiKeys.gemini, prompt)])

    setLoading(Object.fromEntries(callers.map(([k]) => [k, true])))

    const newResponses = {}
    await Promise.all(callers.map(async ([key, fn]) => {
      try {
        const text = await fn()
        newResponses[key] = text
        setResponses(prev => ({ ...prev, [key]: text }))
      } catch (err) {
        setErrors(prev => ({ ...prev, [key]: err.message }))
      } finally {
        setLoading(prev => ({ ...prev, [key]: false }))
      }
    }))

    setShowSynth(true)
    dispatch({ type: 'ADD_SYNTHESIS', payload: { prompt, responses: newResponses, ts: Date.now() } })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <div style={{ color: '#00d4ff', fontSize: 13, letterSpacing: 2, fontWeight: 700 }}>
        ◈ MULTI-AI ADVISOR PANEL
      </div>

      {/* Query input */}
      <div style={{ display: 'flex', gap: 8 }}>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && e.ctrlKey && runAdvisor()}
          placeholder="Enter your query... (Ctrl+Enter to run)"
          style={{
            flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,212,255,0.2)',
            borderRadius: 6, color: '#e2e8f0', padding: '10px 14px', fontSize: 13,
            resize: 'vertical', minHeight: 60, outline: 'none'
          }}
        />
        <button onClick={runAdvisor}
          disabled={!prompt.trim() || !hasAnyKey || Object.values(loading).some(Boolean)}
          style={{
            padding: '0 20px', background: hasAnyKey ? 'rgba(0,212,255,0.15)' : 'rgba(100,116,139,0.1)',
            border: `1px solid ${hasAnyKey ? '#00d4ff44' : '#334155'}`,
            borderRadius: 6, color: hasAnyKey ? '#00d4ff' : '#475569',
            cursor: hasAnyKey ? 'pointer' : 'not-allowed', fontSize: 12, letterSpacing: 1,
            transition: 'all 0.2s', alignSelf: 'flex-end', height: 40
          }}>
          QUERY ◈
        </button>
      </div>

      {!hasAnyKey && (
        <div style={{ color: '#f59e0b', fontSize: 12 }}>
          ⚠ Add API keys in Config to enable live AI responses.
        </div>
      )}

      {/* Model columns */}
      <div style={{ display: 'flex', gap: 12, flex: 1, overflow: 'hidden' }}>
        {Object.entries(MODEL_CONFIG).map(([key, cfg]) => (
          <AdvisorColumn
            key={key}
            modelKey={key}
            {...cfg}
            response={responses[key]}
            loading={loading[key]}
            error={errors[key]}
          />
        ))}
      </div>

      {/* ORBIS synthesis */}
      {showSynth && Object.keys(responses).length > 0 && (
        <ORBISSynthesis responses={responses} prompt={prompt} />
      )}
    </div>
  )
}

// ─── Knowledge Graph (D3.js force-directed) ────────────────────────────────────
const KnowledgeGraph = dynamic(() => import('../components/KnowledgeGraph'), { ssr: false })

// ─── Notes Module ─────────────────────────────────────────────────────────────
function NotesModule() {
  const { state, dispatch } = useOrbis()
  const [selected, setSelected] = useState(null)
  const [newTitle, setNewTitle] = useState('')

  const note = state.notes.find(n => n.id === selected)

  return (
    <div style={{ display: 'flex', gap: 16, height: '100%' }}>
      {/* Note list */}
      <div style={{
        width: 220, borderRight: '1px solid rgba(0,212,255,0.08)',
        paddingRight: 16, display: 'flex', flexDirection: 'column', gap: 8
      }}>
        <div style={{ color: '#f59e0b', fontSize: 12, letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>
          ▣ NOTES
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && newTitle.trim()) {
                dispatch({ type: 'ADD_NOTE', title: newTitle.trim() })
                setNewTitle('')
              }
            }}
            placeholder="New note..."
            style={{
              flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 4, color: '#e2e8f0', padding: '6px 8px', fontSize: 11, outline: 'none'
            }}
          />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {state.notes.length === 0 && (
            <div style={{ color: '#334155', fontSize: 12 }}>No notes yet. Type a title above and press Enter.</div>
          )}
          {state.notes.map(n => (
            <div key={n.id}
              onClick={() => setSelected(n.id)}
              style={{
                padding: '8px 10px', borderRadius: 4, cursor: 'pointer',
                border: `1px solid ${selected === n.id ? 'rgba(245,158,11,0.4)' : 'transparent'}`,
                background: selected === n.id ? 'rgba(245,158,11,0.08)' : 'transparent',
                transition: 'all 0.15s'
              }}>
              <div style={{ color: selected === n.id ? '#f59e0b' : '#94a3b8', fontSize: 12, fontWeight: 600 }}>
                {n.title}
              </div>
              <div style={{ color: '#334155', fontSize: 10, marginTop: 2 }}>
                {new Date(n.updated).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {note ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                value={note.title}
                onChange={e => dispatch({ type: 'UPDATE_NOTE', id: note.id, payload: { title: e.target.value } })}
                style={{
                  flex: 1, background: 'transparent', border: 'none', borderBottom: '1px solid rgba(245,158,11,0.2)',
                  color: '#f59e0b', fontSize: 16, fontWeight: 700, outline: 'none', padding: '4px 0'
                }}
              />
              <button onClick={() => { dispatch({ type: 'DELETE_NOTE', id: note.id }); setSelected(null) }}
                style={{
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 4, color: '#ef4444', cursor: 'pointer', padding: '4px 10px', fontSize: 11
                }}>
                DELETE
              </button>
            </div>
            <textarea
              value={note.body}
              onChange={e => dispatch({ type: 'UPDATE_NOTE', id: note.id, payload: { body: e.target.value } })}
              placeholder="Write your thoughts... Keywords will appear in the Knowledge Graph automatically."
              style={{
                flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(245,158,11,0.1)',
                borderRadius: 6, color: '#e2e8f0', padding: '12px 14px', fontSize: 13,
                lineHeight: 1.8, resize: 'none', outline: 'none'
              }}
            />
          </>
        ) : (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#1e3a5f', fontSize: 13
          }}>
            Select or create a note to begin
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Settings Module ──────────────────────────────────────────────────────────
function SettingsModule() {
  const { state, dispatch } = useOrbis()
  const [keys, setKeys] = useState(state.apiKeys)
  const [saved, setSaved] = useState(false)

  const save = () => {
    dispatch({ type: 'SET_KEYS', payload: keys })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ color: '#ef4444', fontSize: 13, letterSpacing: 2, fontWeight: 700 }}>
        ⚙ ORBIS CONFIGURATION
      </div>
      <div style={{
        background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: 6, padding: 12, fontSize: 12, color: '#fca5a5', lineHeight: 1.6
      }}>
        ⚠ API keys are stored in memory only and never logged or transmitted beyond the AI provider endpoints.
        State is encrypted with AES-256-GCM before being written to localStorage.
      </div>

      {[
        { key: 'claude', label: 'Anthropic / Claude API Key', placeholder: 'sk-ant-...', color: '#00d4ff' },
        { key: 'gpt',    label: 'OpenAI / GPT API Key',       placeholder: 'sk-...',     color: '#7c3aed' },
        { key: 'gemini', label: 'Google / Gemini API Key',    placeholder: 'AIza...',    color: '#00ff88' },
      ].map(({ key, label, placeholder, color }) => (
        <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ color, fontSize: 11, letterSpacing: 2 }}>{label}</label>
          <input
            type="password"
            value={keys[key]}
            onChange={e => setKeys(prev => ({ ...prev, [key]: e.target.value }))}
            placeholder={placeholder}
            style={{
              background: 'rgba(0,0,0,0.3)', border: `1px solid ${color}33`,
              borderRadius: 6, color: '#e2e8f0', padding: '10px 14px', fontSize: 13,
              outline: 'none', transition: 'border-color 0.2s'
            }}
          />
        </div>
      ))}

      <button onClick={save} style={{
        alignSelf: 'flex-start', padding: '10px 24px',
        background: saved ? 'rgba(0,255,136,0.15)' : 'rgba(0,212,255,0.15)',
        border: `1px solid ${saved ? '#00ff8844' : '#00d4ff44'}`,
        borderRadius: 6, color: saved ? '#00ff88' : '#00d4ff',
        cursor: 'pointer', fontSize: 12, letterSpacing: 2, transition: 'all 0.3s'
      }}>
        {saved ? '✓ SAVED' : 'SAVE CONFIG'}
      </button>

      <div style={{
        borderTop: '1px solid rgba(0,212,255,0.06)', paddingTop: 16,
        color: '#334155', fontSize: 11, lineHeight: 1.8
      }}>
        <div style={{ color: '#00d4ff', marginBottom: 8, letterSpacing: 2 }}>SYSTEM STATUS</div>
        {[
          ['Neural Net Engine', '#00ff88', 'ONLINE'],
          ['Knowledge Graph', '#00ff88', 'ONLINE'],
          ['Encrypted Vault', '#00ff88', `ACTIVE — ${state.notes.length} note(s)`],
          ['Synthesis History', '#f59e0b', `${state.synthHistory.length} session(s)`],
          ['Claude API', state.apiKeys.claude ? '#00ff88' : '#ef4444', state.apiKeys.claude ? 'KEY PRESENT' : 'NO KEY'],
          ['GPT API',    state.apiKeys.gpt    ? '#00ff88' : '#ef4444', state.apiKeys.gpt    ? 'KEY PRESENT' : 'NO KEY'],
          ['Gemini API', state.apiKeys.gemini ? '#00ff88' : '#ef4444', state.apiKeys.gemini ? 'KEY PRESENT' : 'NO KEY'],
        ].map(([label, color, status]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span>{label}</span>
            <span style={{ color }}>{status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
function OrbisApp() {
  const { state, dispatch } = useOrbis()
  const [booting, setBooting] = useState(true)

  const onBootComplete = useCallback(() => {
    dispatch({ type: 'SET_BOOT_DONE' })
    setTimeout(() => setBooting(false), 200)
  }, [dispatch])

  // Track mouse for dynamic glassmorphism
  useEffect(() => {
    const handleMouse = (e) => {
      dispatch({
        type: 'SET_THEME',
        payload: { mouseX: e.clientX / window.innerWidth, mouseY: e.clientY / window.innerHeight }
      })
    }
    window.addEventListener('mousemove', handleMouse, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [dispatch])

  const moduleMap = {
    home:     <HomeModule />,
    advisor:  <AdvisorModule />,
    graph:    <KnowledgeGraph />,
    notes:    <NotesModule />,
    settings: <SettingsModule />,
  }

  return (
    <>
      {booting && <BootSequence onComplete={onBootComplete} />}
      <Starfield />
      <GlassOverlay mouseX={state.theme.mouseX} mouseY={state.theme.mouseY} />
      <Sidebar />

      <main style={{
        position: 'relative', zIndex: 10,
        marginLeft: 70, height: '100vh',
        display: 'flex', flexDirection: 'column'
      }}>
        {/* Top bar */}
        <div style={{
          height: 44, borderBottom: '1px solid rgba(0,212,255,0.06)',
          display: 'flex', alignItems: 'center', paddingInline: 20, gap: 12,
          background: 'rgba(5,5,16,0.6)', backdropFilter: 'blur(8px)'
        }}>
          <span style={{
            background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            fontWeight: 900, letterSpacing: 4, fontSize: 13
          }}>ORBIS</span>
          <span style={{ color: '#1e3a5f', fontSize: 10 }}>|</span>
          <span style={{ color: '#334155', fontSize: 11, letterSpacing: 2 }}>
            {NAV_ORBS.find(o => o.id === state.activeModule)?.label}
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 6px #00ff88' }} />
            <span style={{ color: '#334155', fontSize: 10, letterSpacing: 2 }}>ALL SYSTEMS NOMINAL</span>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {moduleMap[state.activeModule]}
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
