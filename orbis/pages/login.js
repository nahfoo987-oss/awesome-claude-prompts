import { useState } from 'react'
import { createClient } from '../lib/supabase'
import Head from 'next/head'

export default function Login() {
  const [mode, setMode]       = useState('login')
  const [email, setEmail]     = useState('')
  const [pass, setPass]       = useState('')
  const [show, setShow]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [msg, setMsg]         = useState('')
  const supabase = createClient()

  const submit = async () => {
    if (!email || !pass) return setError('Email and password required.')
    if (pass.length < 6) return setError('Password must be at least 6 characters.')
    setLoading(true); setError(''); setMsg('')
    try {
      if (mode === 'login') {
        const { error: e } = await supabase.auth.signInWithPassword({ email, password: pass })
        if (e) throw e
        window.location.href = '/'
      } else {
        const { error: e } = await supabase.auth.signUp({ email, password: pass })
        if (e) throw e
        const { error: e2 } = await supabase.auth.signInWithPassword({ email, password: pass })
        if (!e2) { window.location.href = '/'; return }
        setMsg('Account created. Check your email to confirm.')
        setMode('login')
      }
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  const inp = 'w-full bg-black border border-[#21262d] rounded-lg px-3 py-2.5 text-sm text-[#e6edf3] placeholder-[#484f58] outline-none focus:border-[#2f81f7] transition-colors'

  return (
    <>
      <Head><title>ORBIS — Sign in</title></Head>
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
        <div style={{ width: '100%', maxWidth: 360 }}>

          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 6, color: '#e6edf3', marginBottom: 6 }}>ORBIS</div>
            <div style={{ fontSize: 11, color: '#484f58', letterSpacing: 3, textTransform: 'uppercase' }}>Intelligence Interface</div>
          </div>

          <div style={{ background: '#0d1117', border: '1px solid #21262d', borderRadius: 12, padding: '24px' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, background: '#000', borderRadius: 8, padding: 4, marginBottom: 20 }}>
              {[['login','Sign in'],['signup','Create account']].map(([m, label]) => (
                <button key={m} onClick={() => { setMode(m); setError(''); setMsg('') }}
                  style={{ flex: 1, padding: '7px 0', borderRadius: 6, border: 'none', background: mode === m ? '#161b22' : 'transparent', color: mode === m ? '#e6edf3' : '#484f58', cursor: 'pointer', fontSize: 13, fontWeight: mode === m ? 500 : 400, transition: 'all 0.15s' }}>
                  {label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#8b949e', marginBottom: 6 }}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submit()} placeholder="you@example.com"
                  style={{ width: '100%', background: '#000', border: '1px solid #21262d', borderRadius: 8, padding: '9px 12px', fontSize: 14, color: '#e6edf3', outline: 'none' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#8b949e', marginBottom: 6 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={show ? 'text' : 'password'} value={pass} onChange={e => setPass(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submit()} placeholder="Min. 6 characters"
                    style={{ width: '100%', background: '#000', border: '1px solid #21262d', borderRadius: 8, padding: '9px 44px 9px 12px', fontSize: 14, color: '#e6edf3', outline: 'none' }} />
                  <button onClick={() => setShow(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#484f58', cursor: 'pointer', fontSize: 12 }}>
                    {show ? 'hide' : 'show'}
                  </button>
                </div>
              </div>

              {error && <div style={{ color: '#f85149', fontSize: 12, background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.2)', borderRadius: 8, padding: '9px 12px' }}>{error}</div>}
              {msg   && <div style={{ color: '#3fb950', fontSize: 12, background: 'rgba(63,185,80,0.1)', border: '1px solid rgba(63,185,80,0.2)', borderRadius: 8, padding: '9px 12px' }}>{msg}</div>}

              <button onClick={submit} disabled={loading}
                style={{ width: '100%', padding: '10px', background: loading ? '#21262d' : '#2f81f7', border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}>
                {loading ? 'Connecting…' : mode === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
