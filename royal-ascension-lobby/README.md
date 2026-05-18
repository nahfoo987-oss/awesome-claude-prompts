# Crown Chaos: Royal Ascension Lobby

This folder is now the source of truth for Crown Chaos progress inside the `awesome-claude-prompts` repo.

## Current Build

- Rojo project: `default.project.json`
- Master spec: `AAA_Design_Bible/ROYAL_ASCENSION_MASTER.docx`
- Main lobby builder: `src/server/08_WorkspaceSetup.server.lua`
- Founder wall/system: `src/server/09_FounderSystem.server.lua`
- Social/economy systems: `src/server/10_*` through `src/server/19_*`
- Client lobby/social UI: `src/client`
- Design bibles and prompts: `AAA_Design_Bible`
- Blender/reference previews: `artifacts`

## Visual Direction

The Royal Ascension Lobby is a clean supernatural royal fortress suspended over an abyss. It should feel premium, readable, and expensive:

- black onyx composite
- polished white marble
- gunmetal structure
- royal gold trim
- controlled violet corruption glow
- no muddy rust/dirt/moss pass
- no simulator clutter

The lobby uses a small persistent core plus atomic side districts so the crown/throne moment always stays present while shop, guild, ranked, training, and battle pass areas can stream as separate districts.

## Locked Coordinate System

- World center: `(0, 50, 0)`
- `+Z`: north
- `-Z`: south
- `+X`: east
- `-X`: west
- `Y`: up
- Master V3 footprint: `96 x 96` studs
- Main floor bounds: `X/Z = -48..48`
- Intended lobby ceiling read: about `28` studs over the floor, with taller crown/tower silhouettes only as controlled hero shapes

## Implemented Districts

- `RAL_Core_Persistent`: 96×96 fortress floor, gold rim, central crown hub, controlled beam/ring VFX, emote circle, abyss debris
- `RAL_NorthThrone_Atomic`: throne, Shop Cathedral entrance, compact Hall of Founders, reward wheel
- `RAL_EastCommerce_Atomic`: ranked portal, leaderboard wall, match-history wall
- `RAL_WestWar_Atomic`: Guild Hall entrance, war table, duel circle, seasonal event wall
- `RAL_SouthGate_Atomic`: spawn dais and training gate
- `RAL_SoutheastTraining_Atomic`: reserved training district model
- `RAL_SouthwestProgression_Atomic`: reserved progression/battle-pass district model

## Preview Files

- Blender source: `artifacts/lobby_previews/master_v3/RoyalAscension_Lobby_MasterV3.blend`
- Roblox/GLB reference: `artifacts/lobby_previews/master_v3/RoyalAscension_Lobby_MasterV3.glb`
- Preview renders: `artifacts/lobby_previews/master_v3/RoyalAscension_Lobby_MasterV3_Hero.png`, `RoyalAscension_Lobby_MasterV3_Overview.png`, `RoyalAscension_Lobby_MasterV3_Districts.png`

## AI Reference Models

- `artifacts/lobby_previews/ai_reference/LobbyStructure_AIRef_v1.fbx` — AI-generated lobby structure reference (FBX 7500, 29MB, raw). Original 240k faces — do not import directly into Studio.
- `artifacts/lobby_previews/ai_reference/LobbyStructure_AIRef_v1_clean.glb` — Decimated + scaled reference (GLB, 252KB, **use this one**). 12k faces, centered at origin, floor at Y=0, footprint X=84 × Z=100 studs (fits the 96×96 locked coordinate system). Import into Blender as shape reference for pillar kit, arch spans, wall segments, corner towers, and gate frames. Retopologize clean geo on top, apply V3 palette materials, snap pivots to grid, then export per-piece for Studio.

## Build Command

```bash
rojo build default.project.json --output build.rbxlx
```

Run that from this folder.
