import { useState } from 'react'

export default function Settings({ state, dispatch, session, supabase }) {
  const [keys, setKeys] = useState({
    claude: state.apiKeys?.claude || '',
    gpt:    state.apiKeys?.gpt    || '',
    gemini: state.apiKeys?.gemini || '',
  })
  const [saved, setSaved] = useState(false)
  const [show, setShow]   = useState({})

  const save = () => {
    dispatch({ type: 'KEYS', v: keys })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const apiFields = [
    { key: 'claude', label: 'Anthropic / Claude', placeholder: 'sk-ant-api03-…' },
    { key: 'gpt',    label: 'OpenAI / GPT-4o',    placeholder: 'sk-…' },
    { key: 'gemini', label: 'Google / Gemini',     placeholder: 'AIza…' },
  ]

  const inp = { background: '#000', border: '1px solid #21262d', borderRadius: 8, color: '#e6edf3', padding: '9px 44px 9px 12px', fontSize: 13, outline: 'none', width: '100%', transition: 'border-color 0.15s' }

  return (
    <div className="fade-in" style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3' }}>Settings</div>

      {/* Account */}
      <div style={{ background: '#0d1117', border: '1px solid #21262d', borderRadius: 10, padding: '14px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#484f58', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Account</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: '#8b949e' }}>{session?.user?.email}</span>
          <button onClick={logout} style={{ padding: '6px 14px', background: 'transparent', border: '1px solid #21262d', borderRadius: 7, color: '#8b949e', cursor: 'pointer', fontSize: 13, transition: 'border-color 0.15s' }}>
            Sign out
          </button>
        </div>
      </div>

      {/* API Keys */}
      <div style={{ background: '#0d1117', border: '1px solid #21262d', borderRadius: 10, padding: '14px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#484f58', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>API Keys</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {apiFields.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#8b949e', marginBottom: 6 }}>{label}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={show[key] ? 'text' : 'password'}
                  value={keys[key]} onChange={e => setKeys(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  style={inp}
                  onFocus={e => e.target.style.borderColor = '#30363d'}
                  onBlur={e => e.target.style.borderColor = '#21262d'}
                />
                <button onClick={() => setShow(p => ({ ...p, [key]: !p[key] }))}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#484f58', cursor: 'pointer', fontSize: 12 }}>
                  {show[key] ? 'hide' : 'show'}
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: (state.apiKeys?.[key] || keys[key]) ? '#3fb950' : '#30363d' }} />
                <span style={{ fontSize: 11, color: '#484f58' }}>{(state.apiKeys?.[key] || keys[key]) ? 'Key saved' : 'Not set'}</span>
              </div>
            </div>
          ))}
        </div>
        <button onClick={save}
          style={{ marginTop: 16, padding: '8px 20px', background: saved ? 'rgba(63,185,80,0.1)' : '#2f81f7', border: saved ? '1px solid rgba(63,185,80,0.3)' : 'none', borderRadius: 8, color: saved ? '#3fb950' : '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.2s' }}>
          {saved ? 'Saved' : 'Save keys'}
        </button>
      </div>

      {/* System status */}
      <div style={{ background: '#0d1117', border: '1px solid #21262d', borderRadius: 10, padding: '14px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#484f58', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Status</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: 'Supabase Auth',    ok: true,                         val: 'Connected' },
            { label: 'Notes',            ok: true,                         val: `${state.notes?.length || 0}` },
            { label: 'Journals',         ok: true,                         val: `${state.journals?.length || 0}` },
            { label: 'Goals',            ok: true,                         val: `${state.goals?.length || 0}` },
            { label: 'Claude API',       ok: !!state.apiKeys?.claude,      val: state.apiKeys?.claude ? 'Set' : 'Not set' },
            { label: 'GPT API',          ok: !!state.apiKeys?.gpt,         val: state.apiKeys?.gpt    ? 'Set' : 'Not set' },
            { label: 'Gemini API',       ok: !!state.apiKeys?.gemini,      val: state.apiKeys?.gemini ? 'Set' : 'Not set' },
          ].map(x => (
            <div key={x.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#8b949e' }}>{x.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: x.ok ? '#3fb950' : '#30363d' }} />
                <span style={{ fontSize: 12, color: '#484f58' }}>{x.val}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Memories */}
      {state.memories?.length > 0 && (
        <div style={{ background: '#0d1117', border: '1px solid #21262d', borderRadius: 10, padding: '14px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#484f58', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Memories ({state.memories.length}/10)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {state.memories.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, padding: '8px 10px', background: '#000', border: '1px solid #21262d', borderRadius: 7 }}>
                <span style={{ flex: 1, fontSize: 13, color: '#c9d1d9' }}>{m}</span>
                <button onClick={() => dispatch({ type: 'DEL_MEMORY', i })} style={{ background: 'none', border: 'none', color: '#484f58', cursor: 'pointer', fontSize: 16 }}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
