import { useState, useMemo, useEffect, useRef } from 'react'

function mdToHtml(text, notes) {
  if (!text) return ''
  const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  const inline = raw => {
    let s = esc(raw)
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    s = s.replace(/\*(.+?)\*/g, '<em>$1</em>')
    s = s.replace(/`(.+?)`/g, '<code style="background:#161b22;padding:1px 5px;border-radius:4px;font-family:monospace;font-size:0.9em">$1</code>')
    s = s.replace(/#(\w+)/g, '<span style="color:#2f81f7">#$1</span>')
    s = s.replace(/\[\[([^\]]+)\]\]/g, (_, t) => {
      const found = notes?.find(n => n.title.toLowerCase() === t.toLowerCase())
      return `<span data-wiki="${esc(t)}" style="color:${found ? '#a371f7' : '#484f58'};cursor:pointer;text-decoration:underline">${esc(t)}</span>`
    })
    return s
  }
  const lines = text.split('\n')
  let html = '', inList = false, inCode = false, codeLines = []
  for (const line of lines) {
    if (line.startsWith('```')) {
      if (inCode) { html += `<pre style="background:#161b22;border:1px solid #21262d;border-radius:8px;padding:12px;overflow-x:auto;margin:8px 0"><code style="font-family:monospace;font-size:13px;color:#e6edf3">${esc(codeLines.join('\n'))}</code></pre>`; codeLines = []; inCode = false }
      else inCode = true; continue
    }
    if (inCode) { codeLines.push(line); continue }
    if (inList && !line.startsWith('- ') && !line.startsWith('* ')) { html += '</ul>'; inList = false }
    if      (line.startsWith('# '))   html += `<h1 style="font-size:20px;font-weight:700;color:#e6edf3;margin:20px 0 6px">${inline(line.slice(2))}</h1>`
    else if (line.startsWith('## '))  html += `<h2 style="font-size:16px;font-weight:600;color:#e6edf3;margin:16px 0 4px">${inline(line.slice(3))}</h2>`
    else if (line.startsWith('### ')) html += `<h3 style="font-size:14px;font-weight:600;color:#8b949e;margin:12px 0 4px;text-transform:uppercase;letter-spacing:0.5px">${inline(line.slice(4))}</h3>`
    else if (line.startsWith('> '))   html += `<blockquote style="border-left:2px solid #30363d;padding:2px 0 2px 12px;color:#8b949e;font-style:italic;margin:6px 0">${inline(line.slice(2))}</blockquote>`
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) { html += '<ul style="list-style:none;margin:4px 0;display:flex;flex-direction:column;gap:2px">'; inList = true }
      html += `<li style="display:flex;gap:8px;color:#c9d1d9"><span style="color:#484f58;margin-top:9px;font-size:6px">●</span><span>${inline(line.slice(2))}</span></li>`
    }
    else if (line.trim() === '') html += '<div style="height:6px"></div>'
    else html += `<p style="color:#c9d1d9;line-height:1.75;margin:1px 0">${inline(line)}</p>`
  }
  if (inList) html += '</ul>'
  return html
}

export default function Notes({ state, dispatch }) {
  const [selected, setSelected] = useState(null)
  const [newTitle, setNewTitle] = useState('')
  const [view, setView]         = useState('split')
  const [search, setSearch]     = useState('')
  const [tagFilter, setTagFilter] = useState(null)
  const previewRef = useRef(null)

  const note = state.notes.find(n => n.id === selected)

  const allTags = useMemo(() => {
    const t = new Set(); state.notes.forEach(n => (n.tags||[]).forEach(tag => t.add(tag))); return [...t]
  }, [state.notes])

  const backlinks = useMemo(() => {
    if (!note) return []
    return state.notes.filter(n => n.id !== note.id && n.body?.includes(`[[${note.title}]]`))
  }, [note, state.notes])

  const filtered = useMemo(() => {
    let list = [...state.notes].sort((a, b) => b.updated - a.updated)
    if (search) list = list.filter(n => n.title.toLowerCase().includes(search.toLowerCase()) || n.body?.toLowerCase().includes(search.toLowerCase()))
    if (tagFilter) list = list.filter(n => (n.tags||[]).includes(tagFilter))
    return list
  }, [state.notes, search, tagFilter])

  useEffect(() => {
    const el = previewRef.current; if (!el) return
    const handler = e => {
      const wiki = e.target.getAttribute('data-wiki')
      if (wiki) { const t = state.notes.find(n => n.title.toLowerCase() === wiki.toLowerCase()); if (t) setSelected(t.id) }
    }
    el.addEventListener('click', handler)
    return () => el.removeEventListener('click', handler)
  }, [state.notes, view])

  const addNote = () => {
    if (!newTitle.trim()) return
    dispatch({ type: 'ADD_NOTE', v: newTitle.trim() })
    setNewTitle('')
  }

  const updateNote = (id, v) => dispatch({ type: 'UPD_NOTE', id, v })
  const deleteNote = (id) => { dispatch({ type: 'DEL_NOTE', id }); setSelected(null) }

  const exportNote = () => {
    if (!note) return
    const blob = new Blob([`# ${note.title}\n\n${note.body}`], { type: 'text/markdown' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `${note.title.replace(/[^a-z0-9]/gi,'-')}.md`; a.click()
  }

  const words = note?.body ? note.body.trim().split(/\s+/).filter(Boolean).length : 0

  return (
    <div className="fade-in" style={{ display: 'flex', height: '100%', gap: 0 }}>

      {/* File list */}
      <div style={{ width: 220, flexShrink: 0, borderRight: '1px solid #21262d', display: 'flex', flexDirection: 'column', paddingRight: 0 }}>
        <div style={{ padding: '0 12px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#8b949e' }}>Notes</span>
            <span style={{ fontSize: 11, color: '#484f58' }}>{state.notes.length}</span>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            style={{ background: '#000', border: '1px solid #21262d', borderRadius: 7, color: '#e6edf3', padding: '6px 9px', fontSize: 12, outline: 'none', width: '100%' }} />
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addNote()} placeholder="New note…"
            style={{ background: '#000', border: '1px solid #21262d', borderRadius: 7, color: '#e6edf3', padding: '6px 9px', fontSize: 12, outline: 'none', width: '100%' }} />
        </div>

        {allTags.length > 0 && (
          <div style={{ padding: '4px 12px 8px', display: 'flex', flexWrap: 'wrap', gap: 4, borderTop: '1px solid #21262d' }}>
            {allTags.map(t => (
              <button key={t} onClick={() => setTagFilter(tagFilter === t ? null : t)}
                style={{ padding: '2px 7px', borderRadius: 20, border: 'none', background: tagFilter === t ? 'rgba(47,129,247,0.15)' : '#161b22', color: tagFilter === t ? '#2f81f7' : '#8b949e', cursor: 'pointer', fontSize: 11 }}>
                #{t}
              </button>
            ))}
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
          {filtered.length === 0 && <div style={{ color: '#484f58', fontSize: 12, padding: '12px 4px' }}>No notes. Type above and press Enter.</div>}
          {filtered.map(n => (
            <button key={n.id} onClick={() => setSelected(n.id)}
              style={{ width: '100%', display: 'block', padding: '7px 9px', borderRadius: 7, border: 'none', background: selected === n.id ? '#161b22' : 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s', marginBottom: 1 }}
              onMouseEnter={e => { if (selected !== n.id) e.currentTarget.style.background = '#0d1117' }}
              onMouseLeave={e => { if (selected !== n.id) e.currentTarget.style.background = 'transparent' }}>
              <div style={{ fontSize: 13, color: selected === n.id ? '#e6edf3' : '#c9d1d9', fontWeight: selected === n.id ? 500 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
              {(n.tags||[]).length > 0 && <div style={{ fontSize: 10, color: '#484f58', marginTop: 1 }}>{n.tags.map(t => `#${t}`).join(' ')}</div>}
            </button>
          ))}
        </div>
      </div>

      {/* Editor area */}
      {note ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px 10px', flexShrink: 0, borderBottom: '1px solid #21262d', paddingTop: 0 }}>
            <input value={note.title} onChange={e => updateNote(note.id, { title: e.target.value })}
              style={{ flex: 1, background: 'transparent', border: 'none', fontSize: 15, fontWeight: 600, color: '#e6edf3', outline: 'none', padding: '8px 0' }} />
            <div style={{ display: 'flex', gap: 4 }}>
              {['edit','split','preview'].map(v => (
                <button key={v} onClick={() => setView(v)}
                  style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: view === v ? '#161b22' : 'transparent', color: view === v ? '#e6edf3' : '#484f58', cursor: 'pointer', fontSize: 12 }}>
                  {v}
                </button>
              ))}
            </div>
            <button onClick={exportNote} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #21262d', background: 'transparent', color: '#8b949e', cursor: 'pointer', fontSize: 12 }}>export</button>
            <button onClick={() => deleteNote(note.id)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: 'transparent', color: '#484f58', cursor: 'pointer', fontSize: 12 }}>delete</button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {(view === 'edit' || view === 'split') && (
              <textarea value={note.body || ''} onChange={e => updateNote(note.id, { body: e.target.value })}
                placeholder="Start writing… supports **bold**, *italic*, # headings, [[wikilinks]], #tags"
                style={{ flex: 1, background: 'transparent', border: 'none', borderRight: view === 'split' ? '1px solid #21262d' : 'none', color: '#c9d1d9', padding: '16px', fontSize: 13, lineHeight: 1.75, resize: 'none', outline: 'none', fontFamily: 'JetBrains Mono, monospace' }} />
            )}
            {(view === 'preview' || view === 'split') && (
              <div ref={previewRef}
                style={{ flex: 1, overflowY: 'auto', padding: '16px', fontSize: 13 }}
                dangerouslySetInnerHTML={{ __html: mdToHtml(note.body, state.notes) || '<p style="color:#484f58">Nothing to preview.</p>' }} />
            )}
          </div>

          {/* Status bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '6px 16px', borderTop: '1px solid #21262d', flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: '#484f58' }}>{words} words</span>
            {backlinks.length > 0 && <span style={{ fontSize: 11, color: '#484f58' }}>{backlinks.length} backlink{backlinks.length > 1 ? 's' : ''}</span>}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#484f58', fontSize: 13 }}>
          Select a note or create one above
        </div>
      )}

      {/* Backlinks panel */}
      {note && backlinks.length > 0 && (
        <div style={{ width: 180, flexShrink: 0, borderLeft: '1px solid #21262d', padding: '0 12px', overflowY: 'auto' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#484f58', textTransform: 'uppercase', letterSpacing: 0.8, padding: '12px 0 8px' }}>Backlinks</div>
          {backlinks.map(n => (
            <button key={n.id} onClick={() => setSelected(n.id)}
              style={{ display: 'block', width: '100%', padding: '5px 0', background: 'none', border: 'none', color: '#8b949e', fontSize: 12, cursor: 'pointer', textAlign: 'left' }}>
              {n.title}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
