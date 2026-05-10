const NAV = [
  { id: 'home',     label: 'Home',     icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'advisor',  label: 'Advisor',  icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  { id: 'notes',    label: 'Notes',    icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', group: 'Knowledge' },
  { id: 'journal',  label: 'Journal',  icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', group: 'Knowledge' },
  { id: 'goals',    label: 'Goals',    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', group: 'Knowledge' },
  { id: 'agents',   label: 'Agents',   icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-1', group: 'AI' },
  { id: 'history',  label: 'History',  icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', group: 'AI' },
  { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', bottom: true },
]

function Icon({ path }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  )
}

export default function Sidebar({ active, onNav, user, onLogout, voiceMuted, onVoiceToggle }) {
  const mainNav  = NAV.filter(n => !n.group && !n.bottom)
  const knowledgeNav = NAV.filter(n => n.group === 'Knowledge')
  const aiNav    = NAV.filter(n => n.group === 'AI')
  const bottomNav = NAV.filter(n => n.bottom)

  const NavBtn = ({ item }) => {
    const isActive = active === item.id
    return (
      <button onClick={() => onNav(item.id)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 9,
          padding: '7px 10px', borderRadius: 6, border: 'none',
          background: isActive ? '#161b22' : 'transparent',
          color: isActive ? '#e6edf3' : '#8b949e',
          cursor: 'pointer', fontSize: 13, fontWeight: isActive ? 500 : 400,
          textAlign: 'left', transition: 'background 0.1s, color 0.1s',
        }}
        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#0d1117'; e.currentTarget.style.color = '#c9d1d9' } }}
        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8b949e' } }}>
        <Icon path={item.icon} />
        {item.label}
      </button>
    )
  }

  const GroupLabel = ({ label }) => (
    <div style={{ fontSize: 11, fontWeight: 600, color: '#484f58', letterSpacing: 0.8, padding: '12px 10px 4px', textTransform: 'uppercase' }}>{label}</div>
  )

  return (
    <nav style={{
      position: 'fixed', left: 0, top: 0, bottom: 0, width: 216,
      background: '#0d1117', borderRight: '1px solid #21262d',
      display: 'flex', flexDirection: 'column', zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{ padding: '16px 14px 14px', borderBottom: '1px solid #21262d' }}>
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 4, color: '#e6edf3' }}>ORBIS</div>
        <div style={{ fontSize: 10, color: '#484f58', marginTop: 2 }}>Intelligence Interface</div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
        {mainNav.map(item => <NavBtn key={item.id} item={item} />)}
        <GroupLabel label="Knowledge" />
        {knowledgeNav.map(item => <NavBtn key={item.id} item={item} />)}
        <GroupLabel label="AI" />
        {aiNav.map(item => <NavBtn key={item.id} item={item} />)}
      </div>

      {/* Bottom */}
      <div style={{ padding: '8px', borderTop: '1px solid #21262d' }}>
        {bottomNav.map(item => <NavBtn key={item.id} item={item} />)}

        {/* Voice toggle */}
        <button onClick={onVoiceToggle}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 6, border: 'none', background: 'transparent', color: voiceMuted ? '#484f58' : '#8b949e', cursor: 'pointer', fontSize: 13, marginTop: 2, textAlign: 'left' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            {voiceMuted
              ? <><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></>
              : <><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></>
            }
          </svg>
          {voiceMuted ? 'Voice off' : 'Voice on'}
        </button>

        {/* User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', marginTop: 4, borderRadius: 6, background: '#000' }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#21262d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#8b949e', fontWeight: 600, flexShrink: 0 }}>
            {user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ flex: 1, minWidth: 0, fontSize: 12, color: '#8b949e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email}
          </div>
          <button onClick={onLogout} title="Sign out"
            style={{ background: 'none', border: 'none', color: '#484f58', cursor: 'pointer', fontSize: 18, lineHeight: 1, flexShrink: 0 }}>
            ↪
          </button>
        </div>
      </div>
    </nav>
  )
}
