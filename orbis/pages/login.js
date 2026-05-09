import { useState } from 'react'
import { createClient } from '../lib/supabase'

export default function Login() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const supabase = createClient()

  const submit = async () => {
    if (!email || !password) return
    setLoading(true); setError(''); setMsg('')
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        window.location.href = '/'
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMsg('Account created. Check your email to confirm, then log in.')
        setMode('login')
      }
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  const inp = {
    background: 'rgba(0,0,0,.4)', border: '1px solid rgba(0,212,255,.2)', borderRadius: 6,
    color: '#e2e8f0', padding: '11px 14px', fontSize: 14, outline: 'none', width: '100%',
    fontFamily: "'Courier New', monospace",
  }
  const btn = (c = '#00d4ff') => ({
    width: '100%', padding: '12px', background: `${c}18`, border: `1px solid ${c}55`,
    borderRadius: 6, color: c, cursor: 'pointer', fontSize: 13, letterSpacing: 2,
    fontFamily: "'Courier New', monospace", transition: 'all .2s',
  })

  return (
    <div style={{ height: '100vh', background: '#050510', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Courier New', monospace" }}>
      {/* neural grid bg */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(0,212,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,.03) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', width: 400, background: 'rgba(5,5,22,.95)', border: '1px solid rgba(0,212,255,.2)', borderRadius: 16, padding: '44px 36px', boxShadow: '0 0 80px rgba(0,212,255,.08)' }}>
        {/* logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: 14, background: 'linear-gradient(135deg,#00d4ff,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ORBIS</div>
          <div style={{ color: '#334155', fontSize: 10, letterSpacing: 6, marginTop: 4 }}>NEURAL INTELLIGENCE INTERFACE</div>
        </div>

        {/* tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 24, border: '1px solid rgba(0,212,255,.15)', borderRadius: 6, overflow: 'hidden' }}>
          {['login', 'signup'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); setMsg('') }} style={{ flex: 1, padding: '9px', background: mode === m ? 'rgba(0,212,255,.12)' : 'transparent', border: 'none', color: mode === m ? '#00d4ff' : '#475569', cursor: 'pointer', fontSize: 11, letterSpacing: 2, fontFamily: "'Courier New', monospace" }}>
              {m.toUpperCase()}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" style={inp} onKeyDown={e => e.key === 'Enter' && submit()} />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" style={inp} onKeyDown={e => e.key === 'Enter' && submit()} />

          {error && <div style={{ color: '#ef4444', fontSize: 12, padding: '8px 12px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 5 }}>⚠ {error}</div>}
          {msg   && <div style={{ color: '#00ff88', fontSize: 12, padding: '8px 12px', background: 'rgba(0,255,136,.06)', border: '1px solid rgba(0,255,136,.2)', borderRadius: 5 }}>✓ {msg}</div>}

          <button onClick={submit} disabled={loading} style={btn()}>
            {loading ? 'CONNECTING...' : mode === 'login' ? 'ENTER ORBIS' : 'CREATE ACCOUNT'}
          </button>
        </div>

        <div style={{ marginTop: 24, color: '#1e3a5f', fontSize: 10, textAlign: 'center', lineHeight: 1.8 }}>
          Your data is encrypted and stored securely in Supabase.<br />
          API keys are stored per-account and never shared.
        </div>
      </div>
    </div>
  )
}
