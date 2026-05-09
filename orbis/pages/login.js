import { useState, useEffect, useRef } from 'react'
import { createClient } from '../lib/supabase'

function ParticlesBg() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    let particles = [], raf
    const resize = () => {
      canvas.width = window.innerWidth; canvas.height = window.innerHeight
      particles = Array.from({ length: 80 }, () => ({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
      }))
    }
    resize(); window.addEventListener('resize', resize)
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.strokeStyle = 'rgba(0,212,255,0.025)'; ctx.lineWidth = 1
      for (let x = 0; x < canvas.width; x += 60) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke() }
      for (let y = 0; y < canvas.height; y += 60) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke() }
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(0,212,255,0.4)'; ctx.fill()
      })
      for (let i = 0; i < particles.length; i++) for (let j = i+1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y
        const d = Math.hypot(dx, dy)
        if (d < 100) { ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y); ctx.strokeStyle = `rgba(0,212,255,${(1-d/100)*0.1})`; ctx.stroke() }
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
}

export default function Login() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [time, setTime] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-GB', { hour12: false }))
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [])

  const submit = async () => {
    if (!email || !password) { setError('Email and password are required.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true); setError(''); setMsg('')
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        window.location.href = '/'
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        // Auto sign-in immediately (works when email confirmation is disabled)
        const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password })
        if (!loginErr) { window.location.href = '/'; return }
        setMsg('Account created. Check your email to confirm, then sign in.')
        setMode('login')
      }
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  const inp = {
    width: '100%', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(0,212,255,0.15)',
    borderRadius: 8, color: '#e2e8f0', padding: '13px 16px', fontSize: 14, outline: 'none',
    fontFamily: "'Courier New', monospace", transition: 'border-color 0.2s',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050510', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Courier New', monospace", position: 'relative' }}>
      <ParticlesBg />

      <div style={{ position: 'fixed', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,255,0.05), rgba(124,58,237,0.04) 50%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 420, padding: '0 20px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 72, fontWeight: 900, letterSpacing: 20, background: 'linear-gradient(135deg,#00d4ff,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>ORBIS</div>
          <div style={{ color: '#1e3a5f', fontSize: 10, letterSpacing: 8, marginTop: 6 }}>NEURAL INTELLIGENCE INTERFACE</div>
          <div style={{ color: '#00d4ff', fontSize: 18, fontWeight: 300, marginTop: 10, opacity: 0.5 }}>{time}</div>
        </div>

        {/* Card */}
        <div style={{ background: 'rgba(5,5,22,0.92)', border: '1px solid rgba(0,212,255,0.12)', borderRadius: 16, padding: '36px 32px', backdropFilter: 'blur(20px)', boxShadow: '0 0 80px rgba(0,212,255,0.06), 0 40px 80px rgba(0,0,0,0.5)' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 4, marginBottom: 28 }}>
            {[['login','SIGN IN'],['signup','SIGN UP']].map(([m, label]) => (
              <button key={m} onClick={() => { setMode(m); setError(''); setMsg('') }}
                style={{ flex: 1, padding: '9px', background: mode === m ? 'rgba(0,212,255,0.12)' : 'transparent', border: mode === m ? '1px solid rgba(0,212,255,0.25)' : '1px solid transparent', borderRadius: 6, color: mode === m ? '#00d4ff' : '#475569', cursor: 'pointer', fontSize: 11, letterSpacing: 3, fontFamily: "'Courier New', monospace", transition: 'all 0.2s' }}>
                {label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ color: '#334155', fontSize: 10, letterSpacing: 2, display: 'block', marginBottom: 6 }}>EMAIL ADDRESS</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()} placeholder="you@domain.com"
                onFocus={e => e.target.style.borderColor = 'rgba(0,212,255,0.4)'}
                onBlur={e => e.target.style.borderColor = 'rgba(0,212,255,0.15)'}
                style={inp} />
            </div>

            <div>
              <label style={{ color: '#334155', fontSize: 10, letterSpacing: 2, display: 'block', marginBottom: 6 }}>PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submit()} placeholder="Min. 6 characters"
                  onFocus={e => e.target.style.borderColor = 'rgba(0,212,255,0.4)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(0,212,255,0.15)'}
                  style={{ ...inp, paddingRight: 44 }} />
                <button onClick={() => setShowPass(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 14 }}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ color: '#ef4444', fontSize: 12, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, lineHeight: 1.5 }}>
                ⚠ {error}
              </div>
            )}
            {msg && (
              <div style={{ color: '#00ff88', fontSize: 12, padding: '10px 14px', background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: 8, lineHeight: 1.5 }}>
                ✓ {msg}
              </div>
            )}

            <button onClick={submit} disabled={loading}
              style={{ width: '100%', padding: '14px', marginTop: 4, background: loading ? 'rgba(0,212,255,0.05)' : 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.3)', borderRadius: 8, color: loading ? '#475569' : '#00d4ff', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 12, letterSpacing: 4, fontFamily: "'Courier New', monospace", transition: 'all 0.2s', fontWeight: 700 }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = 'rgba(0,212,255,0.2)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(0,212,255,0.15)' } }}
              onMouseLeave={e => { e.currentTarget.style.background = loading ? 'rgba(0,212,255,0.05)' : 'rgba(0,212,255,0.12)'; e.currentTarget.style.boxShadow = 'none' }}>
              {loading ? 'CONNECTING...' : mode === 'login' ? 'ENTER ORBIS' : 'CREATE ACCOUNT'}
            </button>
          </div>
        </div>

        {/* Status bar */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 24 }}>
          {[['NEURAL NET', '#00ff88'], ['SUPABASE RLS', '#00ff88'], ['E2E SECURE', '#00ff88']].map(([l, c]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#1e3a5f', fontSize: 10, letterSpacing: 1 }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: c, boxShadow: `0 0 4px ${c}` }} />
              {l}
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; padding: 0 }
        body { background: #050510; overflow: hidden }
        input::placeholder { color: #1e3a5f }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px #050510 inset !important; -webkit-text-fill-color: #e2e8f0 !important }
      `}</style>
    </div>
  )
}
