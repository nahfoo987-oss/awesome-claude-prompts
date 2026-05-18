# Royal Ascension Production Blueprint

## Production Intent

Build an ultra-premium Roblox lobby called **The Royal Ascension**: a floating corrupted royal fortress above an endless abyss. It must communicate status, danger, prestige, scale, and social flexing the moment a player joins.

The lobby should feel like a royal tournament waiting area, sacred corrupted palace, arena for legends, and cinematic social hub. It should not look like a bright simulator lobby or a small Roblox room.

## Core Rules

- `AAA_Design_Bible/ROYAL_ASCENSION_MASTER.docx` is the current single source of truth.
- Master V3 replaces the older oversized draft: compact 96 x 96 footprint, controlled 28-stud lobby read, one dominant crown focal point, and no messy overbuilt arena clutter.
- Keep the coordinate-locked layout in `src/server/08_WorkspaceSetup.server.lua`.
- Use simple, gap-proof collision for movement and separate non-colliding visual architecture.
- Final hero architecture should become Blender-authored MeshParts with UVs and SurfaceAppearance packages.
- Keep the material library small and reusable.
- Preserve streaming districts: persistent core, atomic side wings.
- Keep the center crown visible from spawn, shop, guild, and south gate approaches.

## Current Merge Decisions

- The GitHub branch's lobby/social systems are preserved as the base.
- The uploaded master document is copied into this project folder as both `.docx` and extracted `.txt`.
- The lobby builder has been rebuilt around the compact Master V3 layout:
  - 96 x 96 fortress floor
  - controlled gold rim and dark anti-reflective surface
  - central crown hub and clean crown beam
  - north Shop Cathedral entrance
  - compact Hall of Founders wall
  - east ranked, leaderboard, and match-history surfaces
  - west Guild Hall, event wall, and duel circle
  - south spawn dais and training gate
  - upright reward wheel
  - controlled neon only on route/portal/hub groups
- Remote setup is idempotent, so scripts do not duplicate remotes if Studio reloads them.
- Founder nameplate and badge signaling are fixed.
- Crown drop now fires a bindable for future effects.
- Shop UI now listens to the shared `OpenShop` remote instead of creating a client-only duplicate.
- Reward wheel, throne sit, founder wall, leaderboard, match history, and trophy fallback coordinates now follow the compact lobby rather than the old giant coordinate draft.

## Visual Palette

- Onyx: `#0F1016`
- Marble: `#D8D9DE`
- Gunmetal: `#121317`
- Royal Gold: `#C7A65A`
- Violet Energy: `#7D2BFF`
- Crimson Event Light: `#7A1B1B`
- Moonlight: `#AAB6FF`

Avoid rust, dirt, moss, concrete noise, random clutter, and overloaded particles in the lobby. Those belong in the main arena, not this premium social space.

## Next Asset Pass

The current Roblox script uses placeholder Parts/MeshParts for many structures. The next Blender pass should replace these with modular MeshParts:

- pillar kit
- arch span kit
- bridge rail kit
- throne kit
- crown kit
- shop display kit
- guild table kit
- ranked portal kit
- arena gate kit
- founder wall kit

Keep pivots snap-friendly, use beveled hard-surface forms, and build with trim sheets so the final Studio import does not become texture-heavy.
