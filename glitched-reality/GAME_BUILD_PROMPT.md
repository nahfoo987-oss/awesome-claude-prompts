# GAME_BUILD_PROMPT.md — GLITCHED REALITY
## The Full Claude Code Game Build Prompt

Paste Section A as your opening message. Sections B–D are follow-up prompts
used after architecture is approved. Read the corrections at the bottom before using.

---

## SECTION A — OPENING PROMPT (paste this first)

```
You are building a production-grade Roblox multiplayer game called GLITCHED REALITY.

Read this entire prompt before outputting anything.

---

ROLE

You are a senior Roblox systems architect, gameplay engineer, and security auditor.
You do not write scripts. You design systems, then implement them cleanly.
You follow a strict phase order: design → skeleton → implement → audit → polish.
You do not skip phases.

---

GAME CONCEPT

GLITCHED REALITY is a 6–16 player social deception game.

The core loop:
  - Players are assigned hidden roles at round start
  - A shared "Corruption Level" starts at 0 and rises each round phase
  - As Corruption rises, the information players receive becomes less reliable
  - Players vote to eliminate suspects each phase
  - Dead players become Ghosts who can distort living players' perception
  - The round ends when a win condition is met or Corruption reaches maximum

Win conditions:
  - Survivors win if they eliminate all corrupted roles before max Corruption
  - Corrupted roles win if they survive until max Corruption OR outnumber Survivors
  - Ghosts win a secondary objective by causing specific misidentifications

Role categories (exact counts configurable in GameConfig):
  - Survivors (majority): receive increasingly corrupted information
  - Infiltrators (minority, corrupted): know each other, receive clean information
  - Archivist (1, neutral): has brief windows of true information
  - Phantom (1, optional): becomes Ghost on death with special interference powers

Corruption Level effects (0–100 scale, defined in GameConfig):
  - 0–25:   all player names visible, roles hidden, mild visual noise
  - 26–50:  some names replaced with fake names, vote counts shown ±1
  - 51–75:  role hints shown but 30% are false, map geometry flickers
  - 76–99:  all player names randomized each phase, 50% of vote UI is fabricated
  - 100:    full reality collapse — Infiltrators revealed, Corrupted team wins

---

TECHNICAL REQUIREMENTS

Platform: Roblox (Luau, not Lua 5.1 syntax — use type annotations where useful)

Server environment: Script in ServerScriptService
Client environment: LocalScript in StarterPlayerScripts or StarterGui
Shared modules: ModuleScript in ReplicatedStorage/Shared

Data persistence: Use ProfileService (or equivalent) for player progression
Signal library: Use a lightweight Signal implementation (GoodSignal pattern)
Maid pattern: Use a Maid/Janitor for connection cleanup in all services

Architecture constraints:
  - Server is the only authority on all game state
  - Clients are rendering and input layers only
  - All game state lives in StateService — no service stores authoritative state locally
  - Systems communicate via an internal EventBus, not direct require() calls
  - RemoteEvents are owned by a single NetworkService — no other script fires remotes directly
  - All RemoteEvents are rate-limited and validated server-side before any state change

---

FULL SYSTEM LIST

SERVER (ServerScriptService/Server/)
  StateService        — single source of truth, all game state read/write
  RoundService        — match lifecycle (lobby → prep → phase → vote → result → end)
  RoleService         — role assignment, role reveal logic, win condition checking
  TruthService        — corruption engine: filters/distorts data per player per phase
  VotingService       — vote collection, validation, result resolution
  AbilityService      — server-validation of all player abilities and cooldowns
  GhostService        — Ghost player registration, interference action validation
  RevealService       — orchestrates end-of-phase and end-of-round reveal sequences
  EconomyService      — XP, currency, reward distribution, ProfileService integration
  NetworkService      — owns ALL RemoteEvents, handles rate limiting and input validation
  AntiExploitService  — monitors anomalous remote patterns, kicks on violation threshold

CLIENT (StarterPlayerScripts/Client/ and StarterGui/)
  UIController        — mounts/unmounts UI components based on game phase
  CorruptionRenderer  — applies visual distortion effects scaled to Corruption Level
  AbilityController   — handles ability input, shows cooldown UI, fires NetworkService
  GhostController     — input and UI for Ghost interference actions
  SpectatorController — camera and UI for eliminated players before Ghost phase
  ScreenEffects       — camera shake, glitch FX, chromatic aberration, scan lines

SHARED (ReplicatedStorage/Shared/)
  GameConfig          — all tunable constants (player counts, timers, corruption thresholds)
  RoleDefinitions     — role names, categories, abilities, win conditions
  CorruptionConfig    — corruption level thresholds and their effect definitions
  NetworkConfig       — RemoteEvent names, rate limit values
  Signal              — lightweight bindable signal implementation
  Maid                — connection/instance cleanup utility
  TableUtils          — deep copy, merge, shuffle utilities
  Enums               — shared string-enum constants (GamePhase, RoleCategory, etc.)

---

ROUND FLOW (implement exactly this)

  LOBBY
    - Players join, character loads, UI shows waiting screen
    - Server waits for minimum player count (GameConfig.MinPlayers)
    - Countdown begins when minimum reached

  PREP PHASE (15 seconds)
    - RoleService assigns roles — server only, never replicated raw
    - TruthService initializes corruption state for this round
    - Each client receives ONLY their own role via filtered RemoteEvent
    - UI shows role card reveal animation

  MAIN PHASE (repeating, N rounds defined by GameConfig)
    Each phase cycle:
      1. TruthService generates the "perceived reality" for each player
         (filtered names, filtered vote history, filtered player count)
      2. Server pushes filtered state to each player individually — NOT a broadcast
      3. Players use abilities (validated by AbilityService server-side)
      4. Ghosts may activate interference (validated by GhostService server-side)
      5. VotingService opens vote window (GameConfig.VoteWindowSeconds)
      6. Votes collected, validated, resolved server-side
      7. Eliminated player notified, converted to Ghost if Phantom role
      8. RevealService triggers post-vote reveal sequence
      9. RoleService checks win conditions
      10. If no win: Corruption Level increases, next phase begins

  RESULT PHASE
    - RevealService orchestrates full reality reconstruction sequence
    - True player identities, roles, and vote history revealed in sequence
    - Win condition displayed with cinematic sequence
    - EconomyService distributes rewards

  END
    - Stats saved via EconomyService/ProfileService
    - Players returned to lobby after delay

---

TRUTH DISTORTION RULES (TruthService must implement these exactly)

TruthService never modifies server state.
It generates a per-player "perceived state" object that is a filtered copy.

Distortion rules by Corruption Level:

  0–25:
    - Player names: true
    - Vote counts: true
    - Player count: true
    - Role hints: none shown

  26–50:
    - Player names: 20% replaced with names from FakeNamePool
    - Vote counts: actual ±1 (randomly added or subtracted)
    - Player count: true
    - Role hints: none shown

  51–75:
    - Player names: 40% replaced, replacements are consistent per phase (same fake name each time)
    - Vote counts: actual ±2
    - Player count: true ±1
    - Role hints: shown for 50% of players, but 30% of shown hints are false

  76–99:
    - Player names: fully randomized from FakeNamePool, reshuffled each phase
    - Vote counts: fabricated (random within plausible range)
    - Player count: shown as actual ±3
    - Role hints: shown for all players, 50% are false

  100:
    - Full reveal — all distortion removed, true state shown
    - This only occurs at round end (Corrupted team win)

Archivist exception:
    - Once per round, Archivist receives an undistorted snapshot for 8 seconds
    - This is a RemoteEvent with a server-signed payload and expiry timestamp
    - Client must discard snapshot after expiry — server does not re-send

---

SECURITY MODEL

Assume:
  - Every client is running a script executor
  - Every RemoteEvent will be called with arbitrary arguments
  - Players will attempt to fire remotes at maximum speed
  - Players will attempt to send server-format data as client arguments

Therefore NetworkService must enforce:
  - Input type validation on every argument of every RemoteEvent
  - Per-player rate limit tracked server-side (not client-side)
  - All player-provided IDs checked against server-known valid IDs
  - All positions sanitized (magnitude check from character root)
  - Action validation: can this player legally perform this action right now?
  - Duplicate action detection: was this action already processed this phase?

AntiExploitService tracks:
  - Remote fire rate per player (kick at 3x expected rate sustained for 5s)
  - Impossible state transitions (e.g. voting while dead)
  - Position teleportation (magnitude delta > threshold per heartbeat)

---

VIRAL MOMENT SYSTEM

Every major phase transition must support a "reveal sequence."
RevealService orchestrates these — it sends timed RemoteEvents to clients
that drive cinematic UI sequences without any client-side logic.

Required sequences (implement all):

  ROLE REVEAL (round start)
    Server fires per-player RemoteEvent with role data + animation cue
    Client UIController plays role card flip sequence
    Designed for: "what role did I get??" reaction clips

  VOTE COLLAPSE (post-vote)
    Server fires broadcast with vote breakdown in timed increments
    Each vote revealed one by one with 0.4s delay between
    Final reveal shows eliminated player's true role
    Designed for: betrayal reveal clips

  CORRUPTION SPIKE (on corruption level threshold crossed)
    Server fires broadcast with new corruption level + severity tier
    CorruptionRenderer escalates visual distortion on client
    UI glitch effect plays — names flicker, vote counts distort visibly
    Designed for: "the game is breaking" reaction clips

  GHOST INTERFERENCE (on successful ghost action)
    Server fires targeted RemoteEvent to affected players only
    CorruptionRenderer applies localized effect (specific player name glitches)
    Affected player sees false information for the remainder of the phase
    Designed for: "I was lied to by a ghost" clips

  REALITY COLLAPSE (round end, Corrupted win)
    Server fires broadcast in sequence: distortion max → names reveal → roles reveal
    Full cinematic sequence, 8-second duration
    Designed for: highlight reel ending

---

OUTPUT INSTRUCTIONS

Phase 1 — output ONLY this, then stop and wait:
  1. Full Roblox Studio folder/script hierarchy (text tree format)
  2. Dependency graph showing which services connect to which
  3. Data flow from Client Input → NetworkService → StateService → Client Render
  4. Any errors, contradictions, or missing definitions you found in this prompt

Do NOT write any Lua code in Phase 1.
After I confirm the architecture, I will ask for Phase 2 (skeleton modules).
After I confirm the skeletons, I will ask for individual system implementations.

Start Phase 1 now.
```

---

## SECTION B — PHASE 2 PROMPT (use after architecture approved)

```
Architecture approved.

Begin Phase 2: generate skeleton modules for all systems.

Rules:
- One code block per module
- Include the full file path as a comment on line 1
- Declare all public functions with signatures and empty bodies
- Declare all private functions with signatures and empty bodies
- Add a single-line comment in each body marking what logic goes there
- Include all require() statements for approved dependencies
- Declare all RemoteEvent names as local constants (no magic strings)
- Every RemoteEvent handler must include: -- TODO: rate limit check, -- TODO: input validation

Do not implement any logic yet.
Output all server modules first, then client, then shared.
```

---

## SECTION C — SINGLE SYSTEM IMPLEMENTATION PROMPT

Replace `[SYSTEM]` with the target system name.

```
Implement [SYSTEM] in full, production-ready Luau.

Before writing code, state:
  OWNS: what data/logic this module is responsible for
  DOES NOT TOUCH: what it explicitly avoids
  DEPENDS ON: what it requires (must match approved dependency graph)

Implementation rules:
  - Server authority: no client input determines outcomes
  - StateService is the only place replicated state is read or written
  - NetworkService is the only place RemoteEvents are fired
  - Every RemoteEvent handler validates: type, rate limit, player authorization, action legality
  - No nil cases unhandled
  - No magic numbers — all constants from GameConfig, NetworkConfig, or CorruptionConfig
  - No function does more than one job
  - Type annotations on all public function signatures (Luau syntax)

After the implementation:
  1. List 5 ways this system can be exploited or broken in a live server
  2. State which of those are already handled in the code
  3. State which require a follow-up patch
```

---

## SECTION D — AUDIT PROMPT

Replace `[SYSTEM]` with the target system name.

```
Audit [SYSTEM] for security and correctness.

Check each vector:
  1. RemoteEvent spam: can a client fire faster than rate limit allows and cause state corruption?
  2. Argument injection: what happens if every argument is nil, a negative number, or a 10,000-char string?
  3. State pollution: can this system write to StateService in a way that corrupts other systems?
  4. Race condition: what breaks if two players trigger the same action in the same server heartbeat?
  5. Desync exploit: does the client ever act on server-authoritative data before server confirms?
  6. Privilege escalation: can a Survivor client trigger Infiltrator-only logic?
  7. Ghost boundary: can a Ghost player invoke living-player actions?
  8. Reward exploit: can EconomyService be triggered multiple times for one event?

For each finding:
  SEVERITY: Critical / High / Medium / Low
  VECTOR: exact trigger
  IMPACT: what breaks or is gained
  FIX: targeted code change (show before/after)

End with a PATCH CHECKLIST and an overall SECURITY SCORE (1–10).
```

---

## ERRORS FIXED FROM ORIGINAL PROMPT

The following issues were corrected in this version:

**1. No game mechanics were defined.**
The original prompt listed systems to build but never defined what the game actually does.
This version defines: player counts, role categories, the corruption scale (0–100),
win conditions, and the full round flow. Without this, Claude generates generic
deception-game code, not GLITCHED REALITY code.

**2. TruthService had no rules.**
"Corruption-based misinformation" is not a spec. This version defines exact distortion
behavior per corruption tier so TruthService produces consistent, testable output.

**3. NetworkService was missing.**
The original listed RemoteEvents as a concern but had no single owner for them.
Scattering RemoteEvent.OnServerEvent handlers across every service makes auditing
impossible. This version centralizes all remote ownership in NetworkService.

**4. No Roblox-specific library guidance.**
Luau is not Lua 5.1. The original gave no guidance on ProfileService, Signal,
or Maid patterns — the standard production toolkit for Roblox games. Without these,
Claude generates code with memory leaks and no data persistence.

**5. "Viral moment" was a vague requirement.**
The original said "create a clip-worthy moment" with no spec. This version defines
five named sequences (Role Reveal, Vote Collapse, Corruption Spike, Ghost Interference,
Reality Collapse) with timing, trigger conditions, and target audience for each.

**6. Phase 1 had no stopping condition.**
The original ended Phase 1 with "asking what system should be implemented first" —
meaning Claude would immediately start writing code. This version explicitly requires
Claude to output architecture, stop, and wait for approval before any code is generated.

**7. Ghost system had no mechanics.**
Ghosts were mentioned but never defined. This version specifies Ghost eligibility
(Phantom role only), the interference action model, and how GhostService validates
those actions server-side.

**8. Archivist ability was undefined.**
The "brief window of true information" was mentioned in TruthService but never spec'd.
This version defines it: once-per-round, 8-second undistorted snapshot, server-signed,
client-side expiry enforced.

---

## QUICK USAGE GUIDE

```
Step 1:  Paste SECTION A → get architecture diagram → review it
Step 2:  Paste SECTION B → get skeleton modules → review them
Step 3:  Paste SECTION C with system name → get implementation → review it
Step 4:  Paste SECTION D with system name → get audit → apply patches
Step 5:  Use /polish and /stress from CLAUDE_WORKFLOW.md to finish the system
```

Build order recommendation:
```
1. Shared modules (GameConfig, Enums, Signal, Maid, TableUtils)
2. StateService
3. NetworkService
4. RoundService
5. RoleService
6. TruthService
7. VotingService
8. RevealService
9. GhostService
10. AbilityService
11. EconomyService
12. AntiExploitService
13. Client systems (UIController first, then renderers)
```

Always build Shared → StateService → NetworkService before anything else.
Every other system depends on at least one of these three.
```
