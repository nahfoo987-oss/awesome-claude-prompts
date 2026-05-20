# Founder System - First 100 Players

The Founder System is reserved only for the first 100 players who ever join Crown Chaos. These rewards should never return through the shop, battle pass, events, codes, bundles, or seasonal reruns.

## Founder Identity

Core emotion:

- These players were here before everyone else.
- Founder cosmetics feel historic, respected, and clean.
- The visuals should be iconic through shape and rarity, not particle spam.

Founder entitlement:

- Founder number: `#001` through `#100`
- Founder title: `OG CHALLENGER`
- Founder badge cosmetic: `badge_founder_first100`
- Founder nameplate cosmetic: `nameplate_founder`
- Founder kill feed icon: `kill_icon_founder`
- Founder join effect: `join_founder_ascension`

## Founder Skin - OG Challenger

Silhouette:

- Arena veteran armor with broad shoulders, clean chest plate, and a short torn scarf.
- Readable from far away through a strong cape/scarf shape and gold shoulder trim.

Materials:

- Aged dark steel
- Worn royal gold trim
- Dusty arena cloth
- Hairline purple corruption cracks

Animation direction:

- Idle pose: calm, grounded, one shoulder slightly forward.
- Movement: confident veteran stride, no exaggerated bounce.
- Victory: slowly raises sword, crown light catches armor.
- Defeat: kneels briefly, then fades into gold ash.

Crown-wearing appearance:

- Founder crown should sit slightly above the head with a subtle unstable float.
- Purple cracks brighten only when holding the real crown.

## Founder Sword - First Blood

Core shape:

- Classic Roblox-inspired straight sword silhouette.
- Longer than normal, but not oversized.
- Broad clean blade with one broken corruption fracture running near the tip.

Materials:

- Dark steel blade
- Faded gold crossguard
- Small purple fracture glow
- Leather-wrapped grip

Effects:

- Swing: thin gold arc with a delayed purple fracture line.
- Impact: small spark burst, stone chip particles, low metallic hit.
- Inspect: blade rotates once, fracture pulse travels from hilt to tip.
- Crown resonance: sword edge glows brighter while the owner holds the crown.

## Founder Crown - The Original Crown

Core shape:

- Ancient royal crown with uneven points.
- Clean iconic silhouette, no oversized clutter.
- Three small floating fragments orbit slowly.

Stages:

- Normal: warm gold glow and faint dust.
- Crown holder: purple cracks awaken.
- Late aura stages: fragments pull outward and the glow becomes unstable.
- Crown stolen: brief gold flash, then purple snap.
- Crown dropped: fragments fall slightly, then re-form.

Sound direction:

- Quiet gold shimmer
- Low royal hum
- Subtle crystal fracture during corruption stages

## Founder Lobby Statue Wall

Implemented as `FounderLobbyStatueWall`.

Design:

- 100 numbered plaques
- Gold-lit wall near the royal side of the arena
- Guardian statues flanking the founder plaques
- Plaques activate when a founder joins the server

The wall should eventually become a premium lobby centerpiece with persistent founder names loaded from the global founder registry.

## Implementation Notes

Current code support:

- Global DataStore counter reserves the first 100 founder slots.
- Founder cosmetics are granted permanently in player data.
- Founder number is exposed through player attributes.
- Founder nameplate and join effect are applied on character spawn.
- Founder shop rows appear as Founder-exclusive items.
- Founder wall plaques update for founders currently in the server.

Future production pass:

- Replace placeholder parts with custom meshes for the skin, sword, and crown.
- Add the real Roblox badge id to `FOUNDER_BADGE_ID`.
- Add founder-specific kill feed rendering once the kill feed has attacker/victim event data.
- Persistently populate all 100 Hall of Founders plaques from the global registry.
