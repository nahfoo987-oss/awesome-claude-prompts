# GAME_BUILD_PROMPT.md
# GLITCHED REALITY — Complete Opening Prompt
# Paste Section 1 to start. Use Sections 2–4 as Claude needs them.

---

## SECTION 1 — THE FULL BRIEF
> Paste this into a fresh Claude session to establish everything.

```
You are a Roblox senior systems engineer and game designer.
You design scalable multiplayer architecture, prioritize server authority,
and build modular systems with strict separation of concerns.
You optimize for retention loops, viral gameplay moments, and exploit resistance.
You never write monolithic scripts.
You always design systems before implementation.

---

THE GAME: GLITCHED REALITY

Genre: Social deception (think Among Us but with escalating environmental corruption)

Core loop:
  Lobby → Countdown → InProgress → Voting → Reveal → back to Lobby

Player roles (assigned at round start, private):
  Normal (75%): identify and eject the Glitched before corruption hits 100
  Glitched (25%, min 1, max 3): hide identity, raise corruption, survive to equal/outnumber Normals

The corruption mechanic:
  - Corruption is a server-side value from 0–100
  - It ticks upward passively every 5 seconds
  - Glitched player actions accelerate it (kills +8, abilities +4)
  - At 25: map state shifts to "Fractured" — mild visual distortion begins
  - At 60: "Critical" — fake player positions injected for 30% of players
  - At 90: "Collapse" — corruption bar itself starts lying, near-constant glitch effects
  - At 100: Glitched win automatically

TruthService (THE CORE MECHANIC):
  The server computes a per-player "reality packet" every 2 seconds.
  Each player sees a different version of reality based on:
    - Their corruption level
    - Their role (Glitched always see true state)
    - Whether they're eliminated (ghosts see true state + true roles)
  Clients never know if their data is real or fabricated. That uncertainty IS the game.

Post-elimination (Ghost System):
  Eliminated players become ghosts:
    - Semi-transparent, no collision, reduced speed
    - Can spectate any alive player
    - Can use ghost interference (small corruption drain, F key)
    - See all true roles and true corruption value
    - Cannot communicate with living players (ghost chat only)

Win conditions:
  Normal win: all Glitched players ejected
  Glitched win: corruption reaches 100 OR Glitched count >= Normal count

Abilities:
  Glitched:
    - GlitchDash (Q): 20-stud forward dash, 8s cooldown
    - SignalJam (E): jam HUDs of nearby players (30 stud range), 5s effect, 15s cooldown
  Normal:
    - ScanPulse (Q): reveal true positions in 50-stud radius, roles within 20 studs, 20s cooldown
    - EmergencyBroadcast (E): global alert of active Glitched count, 40s cooldown

Anti-exploit requirements:
  - Position validation every 0.5s (max 32 studs/sec)
  - Rate limiting on every remote (10 calls/sec default)
  - Silent detection: shadow pool at 4 flags, kick at 8 flags
  - Never alert cheaters they've been flagged

Economy:
  Win (Normal): 150 coins, 100 XP
  Win (Glitched): 250 coins, 150 XP
  Lose: 50 coins, 30 XP
  Battle Pass: XP-gated tiers, cosmetics only, no gameplay advantage

---

FULL SYSTEM LIST (23 systems):

Server Services:
  StateService       — single source of truth for all game state
  TruthService       — per-player reality distortion engine
  RoleService        — role assignment + win condition checks
  AbilityService     — server-side ability validation + execution
  AntiExploitService — rate limiting + position validation + shadow pool
  EconomyService     — DataStore + coins + XP + Battle Pass
  MetaService        — analytics + clip capture triggers

Server Systems:
  RoundSystem        — full round loop (Lobby → Reveal → Lobby)
  CorruptionSystem   — tick-based corruption escalation
  VotingSystem       — vote collection + tallying
  GhostSystem        — ghost physics + ghost interference
  RevealSystem       — ejection payload + dramatic reveal sequence
  CombatService      — kill validation + elimination

Server Middleware:
  RateLimiter        — rate window enforcement
  ActionValidator    — action legality gate
  PermissionGuard    — role + phase permission checks

Client Systems:
  CorruptionRenderer — visual effects per corruption level
  ScreenEffects      — glitch flash, shake, vignette
  UIStateManager     — client-side state snapshot
  AudioController    — sound reactions to game events

Client Controllers:
  UIController       — phase transitions → correct GUI
  AbilityController  — input → ability remote + cooldown UI
  SpectatorController — ghost spectate + interference

---

FOLDER STRUCTURE:

ServerScriptService/
  Main.server.lua
  Services/
    StateService.lua, TruthService.lua, RoleService.lua,
    AbilityService.lua, AntiExploitService.lua,
    EconomyService.lua, MetaService.lua
  Systems/
    RoundSystem.lua, CorruptionSystem.lua, VotingSystem.lua,
    GhostSystem.lua, RevealSystem.lua, CombatService.lua
  Middleware/
    RateLimiter.lua, ActionValidator.lua, PermissionGuard.lua
  Data/
    DataService.lua, DataSchema.lua

ReplicatedStorage/
  Remotes/
    RoundEvents/  (RoundStateChanged, PlayerAssignedRole, RoundTimerUpdated, RoundEnded)
    GameplayEvents/ (AbilityUsed, PlayerInteracted, KillEvent, CorruptionUpdate)
    UIEvents/ (ShowNotification, ShowRevealSequence, UpdateHUD)
    MetaEvents/ (ClipCaptured, SpectatorModeEnabled)
  Shared/
    Constants/ (GameConfig, Roles, CorruptionLevels, EconomyConfig)
    Types/ (RoundStateTypes, PlayerStateTypes)
    Utility/ (Signal, Maid, TableUtil)

StarterPlayerScripts/
  ClientMain.client.lua
  Controllers/
    UIController.lua, AbilityController.lua, SpectatorController.lua
    InputController.lua, CameraController.lua
  Systems/
    CorruptionRenderer.lua, UIStateManager.lua,
    AudioController.lua, ScreenEffects.lua

StarterGui/
  MainMenuGui, HUDGui, RevealGui, GhostGui,
  ShopGui, BattlePassGui

---

Confirm you understand the full architecture.
Then ask me which system to start with, or I will tell you.
Do not write any code until I give the go-ahead.
```

---

## SECTION 2 — GAMECONFIG (paste when building constants)

```
All tunable values for GLITCHED REALITY:

Round timing:
  LOBBY_TIME = 20 seconds
  COUNTDOWN_TIME = 5 seconds
  ROUND_TIME = 240 seconds (4 minutes)
  VOTING_TIME = 45 seconds
  REVEAL_TIME = 10 seconds
  MIN_PLAYERS = 4, MAX_PLAYERS = 12

Roles:
  GLITCHED_RATIO = 0.25
  MIN_GLITCHED = 1, MAX_GLITCHED = 3

Corruption:
  BASE_TICK_RATE = 5 seconds
  BASE_TICK_AMOUNT = 1.5 per tick
  KILL_AMOUNT = 8
  ABILITY_AMOUNT = 4
  FRACTURE_THRESHOLD = 25
  CRITICAL_THRESHOLD = 60
  COLLAPSE_THRESHOLD = 90

Anti-exploit:
  MAX_SPEED = 32 studs/sec
  POSITION_CHECK_INTERVAL = 0.5 seconds
  RATE_LIMIT_WINDOW = 1 second
  RATE_LIMIT_MAX = 10 calls/window
  SHADOW_POOL_THRESHOLD = 4 flags
  KICK_THRESHOLD = 8 flags

Abilities:
  GlitchDash: distance=20 studs, cooldown=8s
  SignalJam: range=30 studs, duration=5s, cooldown=15s
  ScanPulse: range=50 studs, role_reveal_range=20 studs, cooldown=20s
  EmergencyBroadcast: cooldown=40s

Ghost:
  TRANSPARENCY = 0.7
  WALK_SPEED = 18
  CORRUPTION_DRAIN = 2 per interference

Economy:
  NORMAL_WIN_COINS = 150, NORMAL_WIN_XP = 100
  GLITCHED_WIN_COINS = 250, GLITCHED_WIN_XP = 150
  LOSE_COINS = 50, LOSE_XP = 30
  XP_PER_TIER = 500
```

---

## SECTION 3 — TRUTH SERVICE SPEC (paste when building TruthService)

```
TruthService detailed spec:

Reality packet structure:
{
  MapState: "Clean" | "Fractured" | "Critical" | "Collapse"
  UITrustworthiness: 1.00 | 0.85 | 0.65 | 0.40
  CorruptionDisplay: number (may be false at Collapse)
  FakePositions: nil | {[userId] = Vector3}  (injected at Critical+)
  GhostVision: boolean
  ShowTrueRoles: boolean
  TrueCorruption: number | nil (only for Glitched)
}

Per corruption level:
  Clean (0–24):
    MapState = "Clean"
    UITrustworthiness = 1.00
    CorruptionDisplay = real value
    FakePositions = nil

  Fractured (25–59):
    MapState = "Fractured"
    UITrustworthiness = 0.85
    CorruptionDisplay = real value
    FakePositions = nil

  Critical (60–89):
    MapState = "Critical"
    UITrustworthiness = 0.65
    CorruptionDisplay = real value
    FakePositions = 30% of players get fake positions (±60 studs XZ)

  Collapse (90–100):
    MapState = "Collapse"
    UITrustworthiness = 0.40
    CorruptionDisplay = real ± random(–30, +30), clamped 0–100
    FakePositions = 30% of players get fake positions

Role overrides (always applied AFTER corruption level):
  Glitched player:
    UITrustworthiness = 1.00 (always)
    TrueCorruption = real value
    CorruptionDisplay = real value
    FakePositions = nil (they see truth)

  Eliminated (ghost) player:
    UITrustworthiness = 1.00 (always)
    GhostVision = true
    ShowTrueRoles = true
    CorruptionDisplay = real value
    FakePositions = nil

Push cadence:
  - On StateService "CorruptionChanged" event
  - On StateService "PlayerEliminated" event
  - Periodic sync every 2 seconds during InProgress phase
  - On phase change (reset to clean state)

Client consumption:
  UpdateHUD remote → {type="RealityUpdate", payload=realityPacket}
  CorruptionRenderer:ApplyReality(payload) — visual effects
  UIStateManager:OnRealityUpdate(payload) — state tracking
```

---

## SECTION 4 — ERROR FIXES (paste when hitting specific errors)

```
ERROR FIX REFERENCE — GLITCHED REALITY

FIX 1: "attempt to index nil value" on require
  Cause: Circular dependency or wrong script path
  Fix: Use lazy require (require inside the function, not at top)
  Pattern:
    function ServiceA:Method()
      local ServiceB = require(script.Parent.ServiceB)
      ServiceB:DoThing()
    end

FIX 2: Remote fires but server doesn't respond
  Cause: Remote not found (wrong path) or handler not connected
  Fix: Use WaitForChild with timeout, verify path in all three layers:
    ReplicatedStorage:WaitForChild("Remotes"):WaitForChild("GameplayEvents"):WaitForChild("AbilityUsed")
  Also check: Is OnServerEvent connected AFTER the remote is created in Studio?

FIX 3: DataStore fails silently
  Cause: Missing pcall, no retry, or Studio API access not enabled
  Fix: Enable "Enable Studio Access to API Services" in Game Settings → Security
  Always wrap:
    local ok, result = pcall(function() return store:GetAsync(key) end)
    if not ok then warn("DataStore:", result) end

FIX 4: Character not found errors
  Cause: Accessing character before it's loaded
  Fix: Always use WaitForChild or CharacterAdded event:
    player.CharacterAdded:Connect(function(char)
      local hrp = char:WaitForChild("HumanoidRootPart")
    end)

FIX 5: TruthService reality packet not reaching client
  Cause: UpdateHUD remote path wrong, or client listener not connected
  Fix: Verify remote path matches EXACTLY:
    Server fires: ReplicatedStorage.Remotes.UIEvents.UpdateHUD:FireClient(player, packet)
    Client listens: Remotes.UIEvents.UpdateHUD.OnClientEvent:Connect(function(packet) ... end)

FIX 6: Corruption bar shows wrong value
  Cause: Client reading from local state instead of server packet
  Fix: Client NEVER calculates corruption locally.
    Only source: CorruptionUpdate remote from CorruptionSystem
    AND: RealityUpdate packet from TruthService (which may override with fake value)
    UIStateManager:GetCorruption() is the only valid client read point.

FIX 7: Round loop doesn't restart
  Cause: Error in any phase function kills the while loop
  Fix: Wrap each phase in pcall inside the loop:
    while true do
      local ok, err = pcall(function() self:RunLobby() end)
      if not ok then warn("RoundSystem error:", err) end
      -- loop continues regardless
    end

FIX 8: Ghost player still collides after elimination
  Cause: GhostSystem:ApplyGhostPhysics not called, or called before character loaded
  Fix: Always apply inside CharacterAdded + task.defer:
    StateService:On("PlayerEliminated", function(userId)
      local player = Players:GetPlayerByUserId(userId)
      if player and player.Character then
        task.defer(function() GhostSystem:ApplyGhostPhysics(player.Character) end)
      end
      player.CharacterAdded:Connect(function(char)
        task.defer(function() GhostSystem:ApplyGhostPhysics(char) end)
      end)
    end)
```
