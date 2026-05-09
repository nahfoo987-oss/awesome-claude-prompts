/**
 * Neural Knowledge Graph — D3.js force-directed graph
 * Nodes glow based on recency · Click focuses a note · Depth-of-field blur on defocus
 */

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

// State is accessed via window bridge set by OrbisProvider in pages/index.js
function useGraph() {
  if (typeof window === 'undefined') return { nodes: [], links: [], focusId: null, onFocus: () => {} }
  // Access via window.orbisState set by the provider
  const s = window.__orbisState
  return {
    nodes: s?.graphNodes || [],
    links: s?.graphLinks || [],
    focusId: window.__orbisFocusId || null,
    onFocus: window.__orbisSetFocus || (() => {}),
    dispatch: window.__orbisDispatch || (() => {}),
  }
}

const NODE_COLORS = {
  note: '#f59e0b',
  keyword: '#00d4ff',
  synthesis: '#7c3aed',
}

function getRecencyGlow(updated) {
  const age = Date.now() - updated
  const maxAge = 1000 * 60 * 60 * 24 // 1 day
  const freshness = Math.max(0, 1 - age / maxAge)
  return freshness
}

export default function KnowledgeGraph() {
  const svgRef = useRef(null)
  const simRef = useRef(null)
  const [focusId, setFocusId] = useState(null)
  const [nodes, setNodes] = useState([])
  const [links, setLinks] = useState([])
  const [tooltip, setTooltip] = useState(null)

  // Poll window state (set by the provider bridge below)
  useEffect(() => {
    const poll = () => {
      const s = window.__orbisState
      if (s) {
        setNodes(s.graphNodes || [])
        setLinks(s.graphLinks || [])
      }
    }
    poll()
    const id = setInterval(poll, 800)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const svg = d3.select(svgRef.current)
    if (!svgRef.current) return

    const width = svgRef.current.clientWidth || 700
    const height = svgRef.current.clientHeight || 500

    svg.selectAll('*').remove()

    const defs = svg.append('defs')

    // Glow filter
    const filter = defs.append('filter').attr('id', 'glow')
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur')
    const feMerge = filter.append('feMerge')
    feMerge.append('feMergeNode').attr('in', 'coloredBlur')
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic')

    // Blur filter for defocus
    const blurFilter = defs.append('filter').attr('id', 'defocus')
    blurFilter.append('feGaussianBlur').attr('stdDeviation', '3')

    const g = svg.append('g')

    // Zoom
    const zoom = d3.zoom()
      .scaleExtent([0.3, 3])
      .on('zoom', e => g.attr('transform', e.transform))
    svg.call(zoom)

    if (nodes.length === 0) {
      svg.append('text')
        .attr('x', width / 2).attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#1e3a5f')
        .attr('font-family', 'monospace')
        .attr('font-size', 13)
        .text('No nodes yet — create notes to build your knowledge graph')
      return
    }

    // Defensive: resolve link source/target to actual node objects by id
    const nodeById = new Map(nodes.map(n => [n.id, { ...n, x: width/2 + (Math.random()-0.5)*200, y: height/2 + (Math.random()-0.5)*200 }]))
    const safeLinks = links
      .map(l => ({
        source: nodeById.get(typeof l.source === 'object' ? l.source.id : l.source),
        target: nodeById.get(typeof l.target === 'object' ? l.target.id : l.target),
      }))
      .filter(l => l.source && l.target)

    const safeNodes = [...nodeById.values()]

    const sim = d3.forceSimulation(safeNodes)
      .force('link', d3.forceLink(safeLinks).id(d => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide(20))
    simRef.current = sim

    // Links
    const link = g.append('g').selectAll('line')
      .data(safeLinks)
      .join('line')
      .attr('stroke', 'rgba(0,212,255,0.15)')
      .attr('stroke-width', 1)

    // Nodes
    const node = g.append('g').selectAll('g')
      .data(safeNodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(
        d3.drag()
          .on('start', (event, d) => { if (!event.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
          .on('drag',  (event, d) => { d.fx = event.x; d.fy = event.y })
          .on('end',   (event, d) => { if (!event.active) sim.alphaTarget(0); d.fx = null; d.fy = null })
      )
      .on('click', (event, d) => {
        setFocusId(prev => prev === d.id ? null : d.id)
        if (window.__orbisDispatch) {
          window.__orbisDispatch({ type: 'SET_MODULE', payload: 'notes' })
        }
      })
      .on('mouseover', (event, d) => {
        setTooltip({ x: event.offsetX, y: event.offsetY, label: d.label, type: d.type || 'note', updated: d.updated })
      })
      .on('mouseleave', () => setTooltip(null))

    node.append('circle')
      .attr('r', d => (d.size || 6) + (d.type !== 'keyword' ? 4 : 0))
      .attr('fill', d => `${NODE_COLORS[d.type] || NODE_COLORS.note}22`)
      .attr('stroke', d => NODE_COLORS[d.type] || NODE_COLORS.note)
      .attr('stroke-width', 1.5)
      .attr('filter', 'url(#glow)')

    // Glow pulse rings based on recency
    node.each(function(d) {
      const freshness = d.updated ? getRecencyGlow(d.updated) : 0
      if (freshness > 0.3) {
        d3.select(this).append('circle')
          .attr('r', (d.size || 6) + 10 + freshness * 8)
          .attr('fill', 'none')
          .attr('stroke', NODE_COLORS[d.type] || NODE_COLORS.note)
          .attr('stroke-width', 0.5)
          .attr('opacity', freshness * 0.4)
          .attr('filter', 'url(#glow)')
      }
    })

    node.append('text')
      .text(d => d.label?.slice(0, 20))
      .attr('fill', d => NODE_COLORS[d.type] || NODE_COLORS.note)
      .attr('font-size', d => d.type === 'keyword' ? 9 : 11)
      .attr('font-family', 'monospace')
      .attr('text-anchor', 'middle')
      .attr('dy', d => (d.size || 6) + 14)
      .attr('opacity', 0.8)

    sim.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)

      node.attr('transform', d => `translate(${d.x},${d.y})`)

      // Depth-of-field: blur non-focused nodes when a node is focused
      if (focusId) {
        node.attr('filter', d => d.id === focusId ? 'url(#glow)' : 'url(#defocus)')
        node.attr('opacity', d => d.id === focusId ? 1 : 0.25)
        link.attr('opacity', d =>
          (d.source.id === focusId || d.target.id === focusId) ? 0.6 : 0.05
        )
      } else {
        node.attr('filter', 'url(#glow)')
        node.attr('opacity', 1)
        link.attr('opacity', 1)
      }
    })

    return () => sim.stop()
  }, [nodes, links, focusId])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ color: '#00ff88', fontSize: 13, letterSpacing: 2, fontWeight: 700 }}>
          ◎ NEURAL KNOWLEDGE GRAPH
        </span>
        <span style={{ color: '#334155', fontSize: 11 }}>
          {nodes.length} nodes · {links.length} connections
        </span>
        {focusId && (
          <button onClick={() => setFocusId(null)} style={{
            marginLeft: 'auto', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)',
            borderRadius: 4, color: '#00ff88', cursor: 'pointer', padding: '3px 10px', fontSize: 11
          }}>
            CLEAR FOCUS
          </button>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#64748b' }}>
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
            {type.toUpperCase()}
          </div>
        ))}
        <div style={{ marginLeft: 'auto', color: '#1e3a5f' }}>
          Drag to arrange · Scroll to zoom · Click to focus
        </div>
      </div>

      {/* SVG canvas */}
      <div style={{ flex: 1, position: 'relative', border: '1px solid rgba(0,255,136,0.1)', borderRadius: 8, overflow: 'hidden' }}>
        <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />

        {/* Tooltip */}
        {tooltip && (
          <div style={{
            position: 'absolute', left: tooltip.x + 12, top: tooltip.y - 10,
            background: 'rgba(5,5,16,0.95)', border: '1px solid rgba(0,255,136,0.3)',
            borderRadius: 4, padding: '6px 10px', fontSize: 11, pointerEvents: 'none',
            color: '#e2e8f0', whiteSpace: 'nowrap'
          }}>
            <div style={{ color: NODE_COLORS[tooltip.type] || NODE_COLORS.note, fontWeight: 700 }}>{tooltip.label}</div>
            <div style={{ color: '#64748b', marginTop: 2 }}>
              {tooltip.type} · {tooltip.updated ? new Date(tooltip.updated).toLocaleString() : 'unknown'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
