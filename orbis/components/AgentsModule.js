/**
 * Named AI Agents — Custom personalities, persistent chat history, live API calls
 */
import { useState, useRef, useEffect } from 'react'

const DEFAULT_AGENTS = [
  {
    id: 'socrates',
    name: 'Socrates',
    icon: '🏛️',
    color: '#00d4ff',
    tagline: 'Question everything',
    systemPrompt: 'You are Socrates. Never give direct answers. Use only Socratic questioning to guide the user toward their own insight. Ask one focused question at a time. Be curious, gentle, and relentless.',
  },
  {
    id: 'edison',
    name: 'Edison',
    icon: '💡',
    color: '#f59e0b',
    tagline: 'Build it today',
    systemPrompt: 'You are Thomas Edison, the practical inventor. Focus only on what can be built RIGHT NOW with available resources. No theory. Give concrete next steps, required materials, and estimated effort. Be blunt and action-oriented.',
  },
  {
    id: 'cassandra',
    name: 'Cassandra',
    icon: '⚠️',
    color: '#ef4444',
    tagline: 'Devil\'s advocate',
    systemPrompt: 'You are Cassandra, the prophet who sees disaster. Your job is to surface every risk, flaw, worst-case scenario, and hidden assumption in any plan. Be thorough, specific, and unsentimental. Never soften your analysis.',
  },
  {
    id: 'tesla',
    name: 'Tesla',
    icon: '⚡',
    color: '#a855f7',
    tagline: 'Think 50 years ahead',
    systemPrompt: 'You are Nikola Tesla. Think in systems, frequencies, and futures 50 years ahead. Ignore conventional constraints and business concerns. Describe grand visions with technical precision. Get excited. Make connections others miss.',
  },
]

async function callAgentAPI(apiKey, systemPrompt, messages) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-opus-4-7',
      max_tokens: 800,
      system: systemPrompt,
      messages: messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content }))
    })
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.content[0].text
}

function AgentCard({ agent, active, onClick, msgCount }) {
  return (
    <div onClick={onClick} style={{
      padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
      border: `1px solid ${active ? agent.color : agent.color + '22'}`,
      background: active ? `${agent.color}12` : 'transparent',
      transition: 'all 0.2s',
      boxShadow: active ? `0 0 16px ${agent.color}33` : 'none'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 20 }}>{agent.icon}</span>
        <div>
          <div style={{ color: active ? agent.color : '#94a3b8', fontSize: 13, fontWeight: 700 }}>{agent.name}</div>
          <div style={{ color: '#475569', fontSize: 10 }}>{agent.tagline}</div>
        </div>
        {msgCount > 0 && (
          <div style={{
            marginLeft: 'auto', background: `${agent.color}22`, color: agent.color,
            fontSize: 9, borderRadius: 10, padding: '2px 6px', fontWeight: 700
          }}>
            {msgCount}
          </div>
        )}
      </div>
    </div>
  )
}

function ChatBubble({ msg, agentColor }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{
      display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 12
    }}>
      <div style={{
        maxWidth: '75%', padding: '10px 14px', borderRadius: isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
        background: isUser ? 'rgba(100,116,139,0.15)' : `${agentColor}12`,
        border: `1px solid ${isUser ? 'rgba(100,116,139,0.2)' : agentColor + '33'}`,
        color: '#e2e8f0', fontSize: 13, lineHeight: 1.7
      }}>
        {msg.content}
      </div>
    </div>
  )
}

export default function AgentsModule({ state, dispatch }) {
  const [activeAgentId, setActiveAgentId] = useState('socrates')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [newAgent, setNewAgent] = useState({ name: '', icon: '🤖', color: '#00d4ff', tagline: '', systemPrompt: '' })
  const chatEndRef = useRef(null)

  const allAgents = [...DEFAULT_AGENTS, ...(state.customAgents || [])]
  const agent = allAgents.find(a => a.id === activeAgentId) || allAgents[0]
  const messages = (state.agentMessages || {})[activeAgentId] || []

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages.length])

  const send = async () => {
    if (!input.trim() || !state.apiKeys.claude || loading) return
    const userMsg = { role: 'user', content: input.trim(), ts: Date.now() }
    dispatch({ type: 'ADD_AGENT_MESSAGE', agentId: activeAgentId, message: userMsg })
    setInput('')
    setLoading(true)
    try {
      const history = [...messages, userMsg]
      const reply = await callAgentAPI(state.apiKeys.claude, agent.systemPrompt, history)
      dispatch({ type: 'ADD_AGENT_MESSAGE', agentId: activeAgentId, message: { role: 'assistant', content: reply, ts: Date.now() } })
    } catch (e) {
      dispatch({ type: 'ADD_AGENT_MESSAGE', agentId: activeAgentId, message: { role: 'assistant', content: `⚠ Error: ${e.message}`, ts: Date.now() } })
    }
    setLoading(false)
  }

  const createAgent = () => {
    if (!newAgent.name.trim() || !newAgent.systemPrompt.trim()) return
    dispatch({ type: 'ADD_CUSTOM_AGENT', agent: { ...newAgent, id: `custom_${Date.now()}` } })
    setNewAgent({ name: '', icon: '🤖', color: '#00d4ff', tagline: '', systemPrompt: '' })
    setShowNew(false)
  }

  return (
    <div style={{ display: 'flex', gap: 16, height: '100%' }}>
      {/* Agent list */}
      <div style={{ width: 200, display: 'flex', flexDirection: 'column', gap: 6, borderRight: '1px solid rgba(168,85,247,0.1)', paddingRight: 16 }}>
        <div style={{ color: '#a855f7', fontSize: 12, letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>◈ AGENTS</div>
        {allAgents.map(a => (
          <AgentCard key={a.id} agent={a} active={activeAgentId === a.id}
            onClick={() => setActiveAgentId(a.id)}
            msgCount={(state.agentMessages || {})[a.id]?.length || 0}
          />
        ))}

        <button onClick={() => setShowNew(s => !s)} style={{
          marginTop: 4, padding: '8px', background: 'rgba(168,85,247,0.08)',
          border: '1px solid rgba(168,85,247,0.2)', borderRadius: 6,
          color: '#a855f7', cursor: 'pointer', fontSize: 11, letterSpacing: 1
        }}>
          {showNew ? 'CANCEL' : '+ CUSTOM AGENT'}
        </button>

        {showNew && (
          <div style={{
            background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)',
            borderRadius: 8, padding: 10, display: 'flex', flexDirection: 'column', gap: 6
          }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={newAgent.icon} onChange={e => setNewAgent(p => ({ ...p, icon: e.target.value }))}
                style={{ width: 36, background: 'rgba(0,0,0,0.3)', border: '1px solid #1e293b', borderRadius: 4, color: '#e2e8f0', padding: '4px', fontSize: 16, outline: 'none', textAlign: 'center' }}
              />
              <input value={newAgent.name} onChange={e => setNewAgent(p => ({ ...p, name: e.target.value }))}
                placeholder="Name" style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid #1e293b', borderRadius: 4, color: '#e2e8f0', padding: '4px 7px', fontSize: 11, outline: 'none' }}
              />
            </div>
            <input value={newAgent.tagline} onChange={e => setNewAgent(p => ({ ...p, tagline: e.target.value }))}
              placeholder="Tagline" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #1e293b', borderRadius: 4, color: '#94a3b8', padding: '4px 7px', fontSize: 10, outline: 'none' }}
            />
            <textarea value={newAgent.systemPrompt} onChange={e => setNewAgent(p => ({ ...p, systemPrompt: e.target.value }))}
              placeholder="System prompt (personality instructions)..."
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #1e293b', borderRadius: 4, color: '#94a3b8', padding: '6px 7px', fontSize: 10, outline: 'none', resize: 'vertical', minHeight: 60 }}
            />
            <button onClick={createAgent} style={{
              background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)',
              borderRadius: 4, color: '#a855f7', cursor: 'pointer', padding: '5px', fontSize: 10
            }}>
              CREATE
            </button>
          </div>
        )}
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Agent header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '0 0 12px 0',
          borderBottom: `1px solid ${agent.color}22`, marginBottom: 12
        }}>
          <span style={{ fontSize: 28 }}>{agent.icon}</span>
          <div>
            <div style={{ color: agent.color, fontSize: 16, fontWeight: 700 }}>{agent.name}</div>
            <div style={{ color: '#475569', fontSize: 11 }}>{agent.tagline}</div>
          </div>
          {messages.length > 0 && (
            <button onClick={() => dispatch({ type: 'CLEAR_AGENT_MESSAGES', agentId: activeAgentId })}
              style={{
                marginLeft: 'auto', background: 'rgba(100,116,139,0.1)', border: '1px solid #1e293b',
                borderRadius: 4, color: '#475569', cursor: 'pointer', padding: '4px 10px', fontSize: 10
              }}>
              CLEAR
            </button>
          )}
        </div>

        {/* System prompt preview */}
        {messages.length === 0 && (
          <div style={{
            background: `${agent.color}08`, border: `1px solid ${agent.color}1a`,
            borderRadius: 8, padding: 12, marginBottom: 12, color: '#475569',
            fontSize: 11, lineHeight: 1.6, fontStyle: 'italic'
          }}>
            "{agent.systemPrompt}"
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
          {messages.map((msg, i) => (
            <ChatBubble key={i} msg={msg} agentColor={agent.color} />
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: 4, padding: '8px 14px' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: '50%', background: agent.color,
                  animation: `float 0.8s ease-in-out infinite`,
                  animationDelay: `${i * 0.15}s`, opacity: 0.7
                }} />
              ))}
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        {!state.apiKeys.claude && (
          <div style={{ color: '#f59e0b', fontSize: 12, marginBottom: 8 }}>
            ⚠ Add Claude API key in Config to chat with agents.
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, paddingTop: 8, borderTop: `1px solid ${agent.color}18` }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder={`Message ${agent.name}... (Enter to send)`}
            disabled={!state.apiKeys.claude || loading}
            style={{
              flex: 1, background: 'rgba(0,0,0,0.3)', border: `1px solid ${agent.color}33`,
              borderRadius: 6, color: '#e2e8f0', padding: '8px 12px', fontSize: 13,
              resize: 'none', outline: 'none', minHeight: 44, maxHeight: 120
            }}
          />
          <button onClick={send} disabled={!input.trim() || !state.apiKeys.claude || loading}
            style={{
              padding: '0 16px', background: `${agent.color}18`,
              border: `1px solid ${agent.color}44`,
              borderRadius: 6, color: agent.color,
              cursor: input.trim() && state.apiKeys.claude ? 'pointer' : 'not-allowed',
              fontSize: 18, alignSelf: 'flex-end', height: 44
            }}>
            ▶
          </button>
        </div>
      </div>
    </div>
  )
}
