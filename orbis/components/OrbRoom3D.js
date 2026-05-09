/**
 * 3D Orb Room — Three.js scene with floating module orbs, particle dust, mouse-reactive camera
 * Click any orb to navigate to that module
 */
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const ORB_DEFS = [
  { id: 'advisor', label: 'ADVISOR',  color: 0x7c3aed, position: [-3,  1.5, 0] },
  { id: 'graph',   label: 'GRAPH',    color: 0x00ff88, position: [ 3,  1.5, 0] },
  { id: 'notes',   label: 'NOTES',    color: 0xf59e0b, position: [-2, -1.5, 1] },
  { id: 'journal', label: 'JOURNAL',  color: 0xec4899, position: [ 2, -1.5, 1] },
  { id: 'goals',   label: 'GOALS',    color: 0xf97316, position: [ 0,  2.5, -1] },
  { id: 'agents',  label: 'AGENTS',   color: 0xa855f7, position: [ 0, -2.5, -1] },
]

export default function OrbRoom3D() {
  const mountRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // Scene
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x050510, 0.12)

    // Camera
    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 100)
    camera.position.set(0, 0, 8)

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setClearColor(0x050510, 1)
    mount.appendChild(renderer.domElement)

    // Ambient + point lights
    scene.add(new THREE.AmbientLight(0x111133, 2))
    const pointLight = new THREE.PointLight(0x00d4ff, 3, 20)
    pointLight.position.set(0, 0, 0)
    scene.add(pointLight)

    // Central orb (ORBIS core)
    const coreGeo = new THREE.SphereGeometry(0.7, 32, 32)
    const coreMat = new THREE.MeshPhongMaterial({
      color: 0x00d4ff, emissive: 0x003344,
      transparent: true, opacity: 0.85,
      wireframe: false
    })
    const coreOrb = new THREE.Mesh(coreGeo, coreMat)
    scene.add(coreOrb)

    // Wireframe ring around core
    const ringGeo = new THREE.TorusGeometry(1.1, 0.01, 8, 60)
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.3 })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = Math.PI / 2
    scene.add(ring)

    // Module orbs
    const orbMeshes = []
    const labelSprites = []

    ORB_DEFS.forEach(def => {
      const geo = new THREE.SphereGeometry(0.4, 24, 24)
      const mat = new THREE.MeshPhongMaterial({
        color: def.color, emissive: def.color,
        emissiveIntensity: 0.3,
        transparent: true, opacity: 0.9,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(...def.position)
      mesh.userData = { id: def.id, label: def.label, color: def.color, basePos: [...def.position] }
      scene.add(mesh)
      orbMeshes.push(mesh)

      // Glow halo
      const haloGeo = new THREE.SphereGeometry(0.55, 16, 16)
      const haloMat = new THREE.MeshBasicMaterial({
        color: def.color, transparent: true, opacity: 0.08, side: THREE.BackSide
      })
      const halo = new THREE.Mesh(haloGeo, haloMat)
      halo.position.set(...def.position)
      scene.add(halo)

      // Label (canvas texture)
      const canvas = document.createElement('canvas')
      canvas.width = 256; canvas.height = 64
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = `#${def.color.toString(16).padStart(6,'0')}`
      ctx.font = 'bold 28px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(def.label, 128, 42)
      const tex = new THREE.CanvasTexture(canvas)
      const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.85 })
      const sprite = new THREE.Sprite(spriteMat)
      sprite.scale.set(1.4, 0.35, 1)
      sprite.position.set(def.position[0], def.position[1] - 0.65, def.position[2])
      scene.add(sprite)
      labelSprites.push(sprite)
    })

    // Particle dust field
    const particleCount = 600
    const positions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 20
    }
    const particleGeo = new THREE.BufferGeometry()
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const particleMat = new THREE.PointsMaterial({ color: 0x00d4ff, size: 0.03, transparent: true, opacity: 0.4 })
    scene.add(new THREE.Points(particleGeo, particleMat))

    // Grid floor
    const gridHelper = new THREE.GridHelper(20, 30, 0x001a2e, 0x001a2e)
    gridHelper.position.y = -4
    scene.add(gridHelper)

    // Mouse tracking
    const mouse = { x: 0, y: 0 }
    const raycaster = new THREE.Raycaster()
    const mouseVec = new THREE.Vector2()
    let hoveredOrb = null

    const onMouseMove = (e) => {
      const rect = mount.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2
      mouse.y = -((e.clientY - rect.top) / rect.height - 0.5) * 2
      mouseVec.set(mouse.x, mouse.y)
    }

    const onClick = (e) => {
      const rect = mount.getBoundingClientRect()
      mouseVec.set(
        ((e.clientX - rect.left) / rect.width - 0.5) * 2,
        -((e.clientY - rect.top) / rect.height - 0.5) * 2
      )
      raycaster.setFromCamera(mouseVec, camera)
      const hits = raycaster.intersectObjects(orbMeshes)
      if (hits.length && window.__orbisDispatch) {
        window.__orbisDispatch({ type: 'SET_MODULE', payload: hits[0].object.userData.id })
      }
    }

    mount.addEventListener('mousemove', onMouseMove)
    mount.addEventListener('click', onClick)

    // Resize
    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', onResize)

    // Animation loop
    let frame
    const clock = new THREE.Clock()

    const animate = () => {
      frame = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()

      // Smooth camera rotation following mouse
      camera.position.x += (mouse.x * 2 - camera.position.x) * 0.02
      camera.position.y += (mouse.y * 1 - camera.position.y) * 0.02
      camera.lookAt(0, 0, 0)

      // Core orb pulse
      const pulse = Math.sin(t * 1.5) * 0.05 + 1
      coreOrb.scale.setScalar(pulse)
      ring.rotation.z = t * 0.3
      ring.rotation.y = t * 0.1

      // Float module orbs
      raycaster.setFromCamera(mouseVec, camera)
      const hits = raycaster.intersectObjects(orbMeshes)
      hoveredOrb = hits.length ? hits[0].object : null

      orbMeshes.forEach((orb, i) => {
        const bp = orb.userData.basePos
        orb.position.y = bp[1] + Math.sin(t * 0.8 + i * 1.2) * 0.15

        const isHovered = orb === hoveredOrb
        const targetScale = isHovered ? 1.25 : 1
        orb.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)
        orb.material.emissiveIntensity += (isHovered ? 0.6 : 0.3 - orb.material.emissiveIntensity) * 0.1

        // Sync label y
        labelSprites[i].position.y = orb.position.y - 0.65
      })

      // Point light drift
      pointLight.position.set(Math.sin(t * 0.5) * 2, Math.cos(t * 0.4) * 1, Math.sin(t * 0.3) * 2)

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(frame)
      mount.removeEventListener('mousemove', onMouseMove)
      mount.removeEventListener('click', onClick)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ color: '#06b6d4', fontSize: 13, letterSpacing: 2, fontWeight: 700 }}>
          ◎ 3D ORB ROOM
        </span>
        <span style={{ color: '#334155', fontSize: 11 }}>
          Mouse to look · Click an orb to navigate
        </span>
      </div>
      <div ref={mountRef} style={{
        flex: 1, borderRadius: 8, overflow: 'hidden',
        border: '1px solid rgba(6,182,212,0.15)', cursor: 'crosshair'
      }} />
    </div>
  )
}
