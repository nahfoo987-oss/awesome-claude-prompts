import { useState, useRef, useEffect, useCallback } from 'react'

const ORBIS_SYSTEM = `You are ORBIS — an elite British executive intelligence and second brain. Concise, precise, authoritative. Use British English.`

const AGENTS = [
  { id: 'orbis',    name: 'ORBIS',     tag: 'Executive advisor',     sys: ORBIS_SYSTEM },
  { id: 'socrates', name: 'Socrates',  tag: 'Dialectical inquiry',   sys: 'You are Socrates. Guide through questioning. Never state answers directly. Reveal hidden assumptions.' },
  { id: 'edison',   name: 'Edison',    tag: 'Innovation architect',  sys: 'You are Thomas Edison. Practical, iterative. Focus on experimentation and commercial viability.' },
  { id: 'cassandra',name: 'Cassandra', tag: 'Risk analyst',          sys: 'You are Cassandra. Identify what will go wrong. Be specific, evidence-based, unflinching.' },
  { id: 'tesla',    name: 'Tesla',     tag: 'Systems visionary',     sys: 'You are Nikola Tesla. Think in systems and interconnections. Challenge conventional paradigms.' },
]

async function* streamClaude(prompt, system, apiKey) {
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, system, apiKey }),
  })
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'API error') }
  const reader = res.body.getReader(); const dec = new TextDecoder()
  while (true) {
    const { done, value } = await reader.read(); if (done) break
    for (const line of dec.decode(value).split('\n')) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6); if (data === '[DONE]') return
      try { const p = JSON.parse(data); if (p.type === 'content_block_delta' && p.delta?.text) yield p.delta.text } catch {}
    }
  }
}

export default function Agents({ state, dispatch, speak }) {
  const [selAgent, setSelAgent] = useState('orbis')
  const [input, setInput]       = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamBuf, setStreamBuf] = useState('')
  const endRef = useRef(null)

  const agent = AGENTS.find(a => a.id === selAgent)
  const msgs  = state.agentMessages?.[selAgent] || []

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, streamBuf])

  const send = async () => {
    if (!input.trim() || !state.apiKeys?.claude || streaming) return
    const text = input.trim(); setInput('')
    dispatch({ type: 'AGENT_MSG', id: selAgent, v: { role: 'user', text, ts: Date.now() } })
    setStreaming(true); setStreamBuf('')
    let full = ''
    try {
      for await (const chunk of streamClaude(text, agent?.sys || ORBIS_SYSTEM, state.apiKeys.claude)) {
        full += chunk; setStreamBuf(full)
      }
      dispatch({ type: 'AGENT_MSG', id: selAgent, v: { role: 'assistant', text: full, ts: Date.now() } })
      if (speak) speak(full)
    } catch (e) {
      dispatch({ type: 'AGENT_MSG', id: selAgent, v: { role: 'error', text: e.message, ts: Date.now() } })
    }
    setStreamBuf(''); setStreaming(false)
  }

  return (
    <div className="fade-in" style={{ display: 'flex', height: '100%', gap: 0 }}>

      {/* Agent list */}
      <div style={{ width: 200, flexShrink: 0, borderRight: '1px solid #21262d', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#8b949e', marginBottom: 8 }}>Agents</div>
        {AGENTS.map(a => (
          <button key={a.id} onClick={() => setSelAgent(a.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 7, border: 'none', background: selAgent === a.id ? '#161b22' : 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s' }}
            onMouseEnter={e => { if (selAgent !== a.id) e.currentTarget.style.background = '#0d1117' }}
            onMouseLeave={e => { if (selAgent !== a.id) e.currentTarget.style.background = 'transparent' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: selAgent === a.id ? '#2f81f7' : '#30363d', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, color: selAgent === a.id ? '#e6edf3' : '#c9d1d9', fontWeight: selAgent === a.id ? 500 : 400 }}>{a.name}</div>
              <div style={{ fontSize: 11, color: '#484f58' }}>{a.tag}</div>
            </div>
          </button>
        ))}
        {msgs.length > 0 && (
          <button onClick={() => dispatch({ type: 'CLEAR_AGENT', id: selAgent })}
            style={{ marginTop: 'auto', padding: '6px 10px', background: 'transparent', border: '1px solid #21262d', borderRadius: 7, color: '#484f58', cursor: 'pointer', fontSize: 12 }}>
            Clear chat
          </button>
        )}
      </div>

      {/* Chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0, paddingLeft: 20, overflow: 'hidden' }}>
        {/* Agent header */}
        {agent && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottom: '1px solid #21262d', marginBottom: 12, flexShrink: 0 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2f81f7' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3' }}>{agent.name}</span>
            <span style={{ fontSize: 12, color: '#484f58' }}>— {agent.tag}</span>
            {!state.apiKeys?.claude && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#d29922' }}>Claude key required in Settings</span>}
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 4 }}>
          {msgs.length === 0 && !streaming && (
            <div style={{ color: '#484f58', fontSize: 13, textAlign: 'center', marginTop: 48 }}>
              Begin your consultation with {agent?.name}.
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '80%', padding: '10px 14px', borderRadius: 10, fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap',
                background: m.role === 'user' ? '#1c2333' : '#0d1117',
                border: `1px solid ${m.role === 'user' ? '#30363d' : '#21262d'}`,
                color: m.role === 'error' ? '#f85149' : '#c9d1d9',
              }}>
                {m.text}
              </div>
            </div>
          ))}
          {streaming && streamBuf && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: 10, background: '#0d1117', border: '1px solid #21262d', color: '#c9d1d9', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {streamBuf}<span style={{ color: '#2f81f7', animation: 'none' }}>▌</span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid #21262d', flexShrink: 0 }}>
          <textarea value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder={`Message ${agent?.name}… (Enter to send)`}
            rows={1}
            style={{ flex: 1, background: '#0d1117', border: '1px solid #21262d', borderRadius: 8, color: '#e6edf3', padding: '9px 12px', fontSize: 13, resize: 'none', outline: 'none', lineHeight: 1.5, minHeight: 40, maxHeight: 120, transition: 'border-color 0.15s' }}
            onFocus={e => e.target.style.borderColor = '#30363d'}
            onBlur={e => e.target.style.borderColor = '#21262d'} />
          <button onClick={send} disabled={!input.trim() || !state.apiKeys?.claude || streaming}
            style={{ padding: '0 18px', background: '#2f81f7', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', opacity: (!input.trim() || !state.apiKeys?.claude) ? 0.5 : 1, transition: 'opacity 0.15s', flexShrink: 0 }}>
            {streaming ? '…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}
