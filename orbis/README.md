# ORBIS — Neural Intelligence Interface

A cinematic, JARVIS-style multi-AI advisory interface built with Next.js.

## Features

| Module | Description |
|---|---|
| **Neural Knowledge Graph** | D3.js force-directed graph. Nodes glow based on recency. Clicking a node applies cinematic depth-of-field blur to the rest. Keywords are auto-extracted from notes. |
| **Multi-AI Advisor** | Query Claude, GPT-4, and Gemini simultaneously. ORBIS-Core post-processes results for contradiction detection and consensus scoring. |
| **Voice Visualizer** | Canvas API frequency bar animation that reacts to AI "thinking" state. |
| **Dynamic Glassmorphism** | `backdrop-filter: blur` intensity shifts based on mouse position. |
| **Boot Sequence** | JARVIS-style diagnostic startup: "Neural Net... ONLINE", "Multi-Model Sync... ACTIVE". |
| **Encrypted State** | AES-256-GCM (Web Crypto API) encrypts notes and history in localStorage. No backend needed. |
| **Notes Editor** | Multi-note management. Keywords auto-propagate into the knowledge graph. |

## Quick Start (Replit / local)

```bash
# 1. Create a new Next.js project
npx create-next-app@latest orbis --no-typescript --no-tailwind --no-eslint --no-app --no-src-dir

# 2. Copy all files from this folder into the project root

# 3. Install extra dependencies
cd orbis
npm install d3 zustand

# 4. Run
npm run dev
```

Then open http://localhost:3000.

## API Keys

Enter keys in the **Config** panel (lock icon in sidebar). Keys are stored in memory only and never logged.

- **Claude**: Get from https://console.anthropic.com
- **GPT-4**: Get from https://platform.openai.com
- **Gemini**: Get from https://aistudio.google.com

The advisor works with any subset of keys — leave unused ones blank.

## Architecture

```
pages/
  _app.js          Global CSS import
  index.js         Full application:
                     OrbisProvider (Zustand-style useReducer + Context)
                     BootSequence, Starfield, GlassOverlay
                     Sidebar, HomeModule
                     AdvisorModule + ORBISSynthesis (conflict detection)
                     NotesModule, SettingsModule
                     AES-GCM encrypt/decrypt helpers
components/
  KnowledgeGraph.js  D3.js force simulation, glow filters, depth-of-field
styles/
  globals.css        CSS variables, keyframe animations
```

## Conflict Detection

After all model responses arrive, `detectConflicts()` scans for divergent stances using regex pairs (yes/no, increase/decrease, safe/risky, etc.) and surfaces them in a red **Conflict Analysis** panel above the unified synthesis. A consensus percentage meter tracks overall model agreement.
