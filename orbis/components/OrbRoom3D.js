/**
 * OrbRoom3D — Obsidian-style 3D knowledge graph
 * All user data (notes, journals, goals, memories) rendered as a living force graph
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const TYPE_META = {
  note:    { color: 0xe8a020, css: '#e8a020', label: 'Note',    radius: 0.5 },
  journal: { color: 0xd946a8, css: '#d946a8', label: 'Journal', radius: 0.45 },
  goal:    { color: 0xf97316, css: '#f97316', label: 'Goal',    radius: 0.5 },
  memory:  { color: 0x38bdf8, css: '#38bdf8', label: 'Memory',  radius: 0.4 },
  keyword: { color: 0x4b5563, css: '#4b5563', label: 'Keyword', radius: 0.2 },
}

function buildGraph(state) {
  const nodes = []
  const links = []
  const ids = new Set()

  const add = (id, label, type, meta = {}) => {
    if (ids.has(id)) return
    ids.add(id)
    const phi = Math.acos(2 * Math.random() - 1)
    const theta = Math.random() * Math.PI * 2
    const r = 6 + Math.random() * 6
    nodes.push({
      id, label: label?.slice(0, 22) || id, type, meta,
      x: r * Math.sin(phi) * Math.cos(theta),
      y: r * Math.sin(phi) * Math.sin(theta),
      z: r * Math.cos(phi),
      vx: 0, vy: 0, vz: 0,
    })
  }

  state.notes?.forEach(n => add(`note_${n.id}`, n.title, 'note', n))
  state.journals?.forEach(j => add(`journal_${j.id}`, j.date, 'journal', j))
  state.goals?.forEach(g => add(`goal_${g.id}`, g.title, 'goal', g))
  state.memories?.forEach((m, i) => add(`mem_${i}`, m.slice(0, 28), 'memory', { text: m }))
  state.graphNodes?.filter(n => n.type === 'keyword').forEach(n => add(n.id, n.label, 'keyword'))

  state.graphLinks?.forEach(l => {
    const src = `note_${typeof l.source === 'object' ? l.source.id : l.source}`
    const tgt = typeof l.target === 'object' ? l.target.id : l.target
    if (ids.has(src) && ids.has(tgt)) links.push({ source: src, target: tgt })
  })

  // Connect journals to notes by keyword overlap
  state.journals?.forEach(j => {
    state.notes?.forEach(n => {
      if (n.body && j.body) {
        const nw = new Set(n.body.toLowerCase().split(/\W+/).filter(w => w.length > 5))
        const jw = j.body.toLowerCase().split(/\W+/).filter(w => w.length > 5)
        if (jw.some(w => nw.has(w))) {
          links.push({ source: `journal_${j.id}`, target: `note_${n.id}` })
        }
      }
    })
  })

  return { nodes, links }
}

function tick(nodes, links, nodeMap) {
  const repK = 18, spring = 7, springK = 0.025

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j]
      const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.01
      const f = repK / (d * d)
      const fx = (dx / d) * f, fy = (dy / d) * f, fz = (dz / d) * f
      a.vx -= fx; a.vy -= fy; a.vz -= fz
      b.vx += fx; b.vy += fy; b.vz += fz
    }
  }

  links.forEach(({ source, target }) => {
    const s = nodeMap.get(source), t = nodeMap.get(target)
    if (!s || !t) return
    const dx = t.x - s.x, dy = t.y - s.y, dz = t.z - s.z
    const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.01
    const f = (d - spring) * springK
    s.vx += (dx / d) * f; s.vy += (dy / d) * f; s.vz += (dz / d) * f
    t.vx -= (dx / d) * f; t.vy -= (dy / d) * f; t.vz -= (dz / d) * f
  })

  nodes.forEach(n => {
    n.vx += -n.x * 0.006; n.vy += -n.y * 0.006; n.vz += -n.z * 0.006
    n.vx *= 0.82; n.vy *= 0.82; n.vz *= 0.82
    n.x += n.vx; n.y += n.vy; n.z += n.vz
  })
}

function makeLabel(text, color) {
  const canvas = document.createElement('canvas')
  canvas.width = 512; canvas.height = 80
  const ctx = canvas.getContext('2d')
  ctx.font = '500 22px Inter, system-ui, sans-serif'
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 256, 40)
  const tex = new THREE.CanvasTexture(canvas)
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })
  const sprite = new THREE.Sprite(mat)
  sprite.scale.set(3.2, 0.5, 1)
  return sprite
}

export default function OrbRoom3D() {
  const mountRef = useRef(null)
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState(null)
  const [stats, setStats] = useState({ nodes: 0, links: 0 })

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const state = window.__orbisState || {}
    let { nodes, links } = buildGraph(state)

    if (filter) {
      const keep = new Set(nodes.filter(n => n.type === filter).map(n => n.id))
      nodes = nodes.filter(n => keep.has(n.id) || n.type === 'keyword')
      links = links.filter(l => keep.has(l.source) || keep.has(l.target))
    }

    setStats({ nodes: nodes.length, links: links.length })

    const nodeMap = new Map(nodes.map(n => [n.id, n]))

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x080812)
    scene.fog = new THREE.FogExp2(0x080812, 0.028)

    const W = mount.clientWidth, H = mount.clientHeight
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 200)
    camera.position.set(0, 0, 26)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    mount.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.minDistance = 4
    controls.maxDistance = 80
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.4

    // Lighting
    scene.add(new THREE.AmbientLight(0x1a1a40, 6))
    const pLight = new THREE.PointLight(0x4040ff, 2, 40)
    pLight.position.set(0, 10, 0)
    scene.add(pLight)

    // Stars
    const starGeo = new THREE.BufferGeometry()
    const starPos = new Float32Array(2000 * 3)
    for (let i = 0; i < starPos.length; i++) starPos[i] = (Math.random() - 0.5) * 160
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.08, transparent: true, opacity: 0.3 })))

    // Build meshes
    const meshes = []
    const labels = []
    const halos = []

    nodes.forEach(n => {
      const meta = TYPE_META[n.type] || TYPE_META.keyword
      const geo = new THREE.SphereGeometry(meta.radius, 20, 20)
      const mat = new THREE.MeshStandardMaterial({
        color: meta.color,
        emissive: meta.color,
        emissiveIntensity: 0.4,
        roughness: 0.2,
        metalness: 0.5,
        transparent: true,
        opacity: n.type === 'keyword' ? 0.5 : 0.92,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(n.x, n.y, n.z)
      mesh.userData = n
      scene.add(mesh)
      meshes.push(mesh)

      // Outer glow halo
      if (n.type !== 'keyword') {
        const halo = new THREE.Mesh(
          new THREE.SphereGeometry(meta.radius * 2.2, 16, 16),
          new THREE.MeshBasicMaterial({ color: meta.color, transparent: true, opacity: 0.06, side: THREE.BackSide, depthWrite: false })
        )
        halo.position.copy(mesh.position)
        scene.add(halo)
        halos.push({ mesh, halo })
      }

      // Label
      if (n.type !== 'keyword') {
        const sprite = makeLabel(n.label, meta.css)
        sprite.position.set(n.x, n.y - meta.radius - 0.7, n.z)
        scene.add(sprite)
        labels.push({ sprite, node: n, offset: meta.radius + 0.7 })
      }
    })

    // Link lines
    const linkLines = []
    links.forEach(l => {
      const s = nodeMap.get(l.source), t = nodeMap.get(l.target)
      if (!s || !t) return
      const geo = new THREE.BufferGeometry()
      const pos = new Float32Array(6)
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      const mat = new THREE.LineBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.35, depthWrite: false })
      const line = new THREE.Line(geo, mat)
      scene.add(line)
      linkLines.push({ line, geo, s, t })
    })

    // Raycasting
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()
    let hoveredMesh = null

    const onMouseMove = e => {
      const rect = mount.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(mouse, camera)
      const hits = raycaster.intersectObjects(meshes)
      hoveredMesh = hits.length ? hits[0].object : null
      mount.style.cursor = hoveredMesh ? 'pointer' : 'grab'
    }

    const onClick = e => {
      raycaster.setFromCamera(mouse, camera)
      const hits = raycaster.intersectObjects(meshes)
      if (hits.length) {
        const node = hits[0].object.userData
        setSelected(node)
        controls.autoRotate = false
      } else {
        setSelected(null)
        controls.autoRotate = true
      }
    }

    mount.addEventListener('mousemove', onMouseMove)
    mount.addEventListener('click', onClick)

    // Animation
    let raf, frame = 0
    const animate = () => {
      raf = requestAnimationFrame(animate)
      frame++

      // Run force sim for first 300 frames then slow
      if (frame < 300) tick(nodes, links, nodeMap)
      else if (frame < 600 && frame % 3 === 0) tick(nodes, links, nodeMap)

      // Sync mesh positions
      meshes.forEach((mesh, i) => {
        const n = nodes[i]
        if (!n) return
        mesh.position.lerp(new THREE.Vector3(n.x, n.y, n.z), 0.12)

        const isHovered = mesh === hoveredMesh
        const isSelected = selected && mesh.userData.id === selected.id
        const targetEmissive = isHovered || isSelected ? 1.2 : 0.4
        mesh.material.emissiveIntensity += (targetEmissive - mesh.material.emissiveIntensity) * 0.1
      })

      // Sync halos
      halos.forEach(({ mesh, halo }) => { halo.position.copy(mesh.position) })

      // Sync labels
      labels.forEach(({ sprite, node: n, offset }) => {
        const mesh = meshes.find(m => m.userData.id === n.id)
        if (mesh) sprite.position.set(mesh.position.x, mesh.position.y - offset, mesh.position.z)
      })

      // Sync link lines
      linkLines.forEach(({ geo, s, t }) => {
        const sm = meshes.find(m => m.userData.id === s.id)
        const tm = meshes.find(m => m.userData.id === t.id)
        if (!sm || !tm) return
        const pos = geo.attributes.position.array
        pos[0] = sm.position.x; pos[1] = sm.position.y; pos[2] = sm.position.z
        pos[3] = tm.position.x; pos[4] = tm.position.y; pos[5] = tm.position.z
        geo.attributes.position.needsUpdate = true
      })

      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      mount.removeEventListener('mousemove', onMouseMove)
      mount.removeEventListener('click', onClick)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [filter])

  const goTo = useCallback((node) => {
    if (!window.__orbisDispatch) return
    const map = { note: 'notes', journal: 'journal', goal: 'goals', memory: 'settings' }
    window.__orbisDispatch({ type: 'MOD', v: map[node.type] || 'home' })
  }, [])

  return (
    <div style={{ display: 'flex', height: '100%', gap: 0, position: 'relative' }}>
      <div ref={mountRef} style={{ flex: 1, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', cursor: 'grab' }} />

      {/* Sidebar panel */}
      <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 16, paddingLeft: 16 }}>
        {/* Stats */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, letterSpacing: 1, marginBottom: 12 }}>GRAPH</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: '#64748b', fontSize: 12 }}>Nodes</span>
            <span style={{ color: '#f8fafc', fontSize: 12, fontWeight: 600 }}>{stats.nodes}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b', fontSize: 12 }}>Connections</span>
            <span style={{ color: '#f8fafc', fontSize: 12, fontWeight: 600 }}>{stats.links}</span>
          </div>
        </div>

        {/* Filter */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, letterSpacing: 1, marginBottom: 12 }}>FILTER</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[null, 'note', 'journal', 'goal', 'memory'].map(f => (
              <button key={f || 'all'} onClick={() => setFilter(f === filter ? null : f)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 6, border: 'none', background: filter === f ? 'rgba(255,255,255,0.08)' : 'transparent', cursor: 'pointer', textAlign: 'left' }}>
                {f && <div style={{ width: 8, height: 8, borderRadius: '50%', background: TYPE_META[f].css, flexShrink: 0 }} />}
                <span style={{ color: filter === f ? '#f8fafc' : '#64748b', fontSize: 12 }}>
                  {f ? TYPE_META[f].label + 's' : 'All nodes'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected node */}
        {selected && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${TYPE_META[selected.type]?.css}33`, borderRadius: 10, padding: '14px 16px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: TYPE_META[selected.type]?.css }} />
              <span style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, letterSpacing: 1 }}>{selected.type?.toUpperCase()}</span>
            </div>
            <div style={{ color: '#f8fafc', fontSize: 13, fontWeight: 600, marginBottom: 8, lineHeight: 1.4 }}>{selected.label}</div>
            {selected.type === 'journal' && selected.meta?.mood && (
              <div style={{ color: '#64748b', fontSize: 12, marginBottom: 8 }}>Mood: {selected.meta.mood}/5</div>
            )}
            {selected.type === 'goal' && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
                  <div style={{ height: '100%', borderRadius: 2, width: `${selected.meta?.progress || 0}%`, background: TYPE_META.goal.css }} />
                </div>
                <div style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>{selected.meta?.progress || 0}% complete</div>
              </div>
            )}
            {selected.type === 'memory' && (
              <div style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.6 }}>{selected.meta?.text}</div>
            )}
            <button onClick={() => goTo(selected)}
              style={{ marginTop: 10, width: '100%', padding: '8px', background: `${TYPE_META[selected.type]?.css}18`, border: `1px solid ${TYPE_META[selected.type]?.css}33`, borderRadius: 6, color: TYPE_META[selected.type]?.css, cursor: 'pointer', fontSize: 11, fontWeight: 600, letterSpacing: 0.5 }}>
              Open →
            </button>
            <button onClick={() => setSelected(null)}
              style={{ marginTop: 6, width: '100%', padding: '7px', background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, color: '#475569', cursor: 'pointer', fontSize: 11 }}>
              Dismiss
            </button>
          </div>
        )}

        {/* Help */}
        {!selected && (
          <div style={{ marginTop: 'auto', color: '#334155', fontSize: 11, lineHeight: 1.8 }}>
            <div>Drag to orbit</div>
            <div>Scroll to zoom</div>
            <div>Click node to inspect</div>
          </div>
        )}
      </div>
    </div>
  )
}
