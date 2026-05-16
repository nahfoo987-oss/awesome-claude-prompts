# SYSTEMS_REFERENCE.md
# GLITCHED REALITY — Complete Systems Reference
# Keep this open while building. Every system, every method, every dependency.

---

## READING THIS DOCUMENT

Each system card shows:
- **OWNS** — what data/behavior this system is solely responsible for
- **NEVER TOUCHES** — explicit out-of-scope (prevents scope creep)
- **DEPENDS ON** — what must exist before this initializes
- **API** — every public method with signatures
- **Events fired / Events received**

Arrows in the dependency graph flow downward only. No upward arrows. No cycles.

---

## DEPENDENCY GRAPH

```
GameConfig (no deps)
     │
     ▼
StateService (no deps)
     │
     ├──────────────────────────┐
     ▼                          ▼
EconomyService            AntiExploitService
     │                          │
     ▼                          ▼
RoleService              AbilityService ──────┐
     │                          │              │
     ▼                          ▼              ▼
TruthService          CorruptionSystem   CombatService
     │                          │
     └──────────┬───────────────┘
                ▼
           RoundSystem
                │
     ┌──────────┼──────────────┐
     ▼          ▼              ▼
VotingSystem GhostSystem  RevealSystem
                               │
                               ▼
                          MetaService

CLIENT (reads server state, never writes):
     ▼
UIStateManager ← CorruptionRenderer ← ScreenEffects ← AudioController
     │
     ▼
UIController ← AbilityController ← SpectatorController
```

---

## SERVER SERVICES

---

### StateService
**OWNS:** Phase, Corruption, Roles, Elimination status, Votes, Timer, Round number

**NEVER TOUCHES:** Character instances, GUI, DataStore, RemoteEvents

**DEPENDS ON:** Nothing (initialize first)

**API:**
```lua
StateService:Initialize()
StateService:OnPlayerAdded(player: Player)
StateService:OnPlayerRemoving(player: Player)

-- Phase
StateService:GetPhase() → string
StateService:SetPhase(phase: string)
  -- fires "PhaseChanged" event with (newPhase, oldPhase)

-- Round
StateService:GetRound() → number
StateService:IncrementRound() → number

-- Corruption
StateService:GetCorruption() → number
StateService:SetCorruption(value: number)  -- clamps 0–100
  -- fires "CorruptionChanged" event with (newValue)
StateService:AddCorruption(amount: number)

-- Roles
StateService:GetRole(userId: number) → "Normal" | "Glitched"
StateService:SetRole(userId: number, role: string)
  -- fires "RoleAssigned" event with (userId, role)
StateService:GetAllRoles() → {[userId]: string}
StateService:IsGlitched(userId: number) → boolean

-- Elimination
StateService:IsEliminated(userId: number) → boolean
StateService:EliminatePlayer(userId: number)
  -- fires "PlayerEliminated" event with (userId)
StateService:GetAliveCount() → number

-- Votes
StateService:AddVote(targetUserId: number)
  -- fires "VoteAdded" event with (targetUserId, newCount)
StateService:GetVotes() → {[userId]: number}
StateService:GetTopVoted() → (userId: number, count: number)
StateService:ClearVotes()

-- Timer
StateService:GetTimeLeft() → number
StateService:SetTimeLeft(seconds: number)
  -- fires "TimerUpdated" event with (seconds)

-- Reset
StateService:ResetRound()
  -- resets: Corruption, Roles, Eliminated, Votes, TimeLeft
  -- fires "RoundReset"

-- Event bus
StateService:On(event: string, fn: function)

-- Debug
StateService:Snapshot() → table
```

**Events fired:**
- `PhaseChanged(newPhase, oldPhase)`
- `CorruptionChanged(value)`
- `RoleAssigned(userId, role)`
- `PlayerEliminated(userId)`
- `VoteAdded(targetUserId, count)`
- `TimerUpdated(seconds)`
- `RoundReset()`

---

### TruthService
**OWNS:** Per-player reality packets, fake position generation, reality push cadence

**NEVER TOUCHES:** Lighting, GUI, direct visual effects (client does that)

**DEPENDS ON:** StateService

**API:**
```lua
TruthService:Initialize()
TruthService:GetPlayerReality(player: Player) → RealityPacket
TruthService:PushRealityToPlayer(player: Player)
TruthService:PushRealityToAll()
TruthService:GenerateFakePositions(chance: number) → {[userId]: Vector3}
TruthService:CanSeeRole(viewer: Player, target: Player) → boolean
```

**RealityPacket structure:**
```lua
{
  MapState: "Clean" | "Fractured" | "Critical" | "Collapse",
  UITrustworthiness: number,  -- 1.00 | 0.85 | 0.65 | 0.40
  CorruptionDisplay: number,  -- may be false value at Collapse
  FakePositions: nil | {[userId]: Vector3},
  GhostVision: boolean,
  ShowTrueRoles: boolean,
  TrueCorruption: number | nil,  -- only for Glitched
}
```

**Listens for:** `CorruptionChanged`, `PlayerEliminated`

**Fires remote:** `UpdateHUD` → `{type="RealityUpdate", payload=RealityPacket}`

---

### RoleService
**OWNS:** Role assignment algorithm, Glitched team reveal, win condition logic

**NEVER TOUCHES:** Corruption, voting, elimination (those belong to other systems)

**DEPENDS ON:** StateService

**API:**
```lua
RoleService:Initialize()
RoleService:AssignRoles(players: {Player}) → glitchedCount: number
RoleService:NotifyPlayersOfRole(pool: {Player}, glitchedCount: number)
RoleService:RevealGlitchedToGlitched(pool: {Player}, glitchedCount: number)
RoleService:GetDistribution() → (glitched: number, normal: number)
RoleService:GetGlitchedPlayers() → {Player}
RoleService:CheckWinConditions() → "Glitched" | "Normal" | nil
```

**Fires remote:** `PlayerAssignedRole` → `{role, isGlitched, teammates?, totalGlitched}`

---

### AbilityService
**OWNS:** Ability validation, execution, server-side cooldown tracking

**NEVER TOUCHES:** Corruption math (delegates to CorruptionSystem), client cooldown display

**DEPENDS ON:** StateService, AntiExploitService, CorruptionSystem (lazy)

**API:**
```lua
AbilityService:Initialize()
AbilityService:HandleRequest(player: Player, data: {ability: string})
AbilityService:DoGlitchDash(player: Player, data: table)
AbilityService:DoSignalJam(player: Player, data: table)
AbilityService:DoScanPulse(player: Player, data: table)
AbilityService:DoEmergencyBroadcast(player: Player, data: table)
```

**Listens for remote:** `AbilityUsed` (C→S)

**Fires remotes:** `ShowNotification` (for SignalJam, ScanResult, EmergencyBroadcast)

---

### AntiExploitService
**OWNS:** Suspicion scores, shadow pool membership, rate limit windows, position validation

**NEVER TOUCHES:** Game logic, roles, corruption (it gates, it doesn't act)

**DEPENDS ON:** Nothing

**API:**
```lua
AntiExploitService:Initialize()
AntiExploitService:OnPlayerAdded(player: Player)
AntiExploitService:CheckRate(player: Player, remoteName: string) → boolean
AntiExploitService:ValidateAbilityUse(player: Player, ability: string, cooldowns: table) → (ok: boolean, reason: string?)
AntiExploitService:Flag(player: Player, reason: string, detail: any)
AntiExploitService:BeginPositionMonitor(player: Player)
AntiExploitService:IsInShadowPool(player: Player) → boolean
AntiExploitService:GetSuspicion(player: Player) → number
```

---

### EconomyService
**OWNS:** Player data persistence, coins, XP, Battle Pass tiers, creator codes

**NEVER TOUCHES:** Gameplay decisions, role logic, corruption

**DEPENDS ON:** DataStoreService (external)

**API:**
```lua
EconomyService:Initialize()
EconomyService:OnPlayerAdded(player: Player)
EconomyService:OnPlayerRemoving(player: Player)
EconomyService:Load(player: Player) → DataTable
EconomyService:Save(player: Player)
EconomyService:GetData(player: Player) → DataTable
EconomyService:AddCoins(player: Player, amount: number)
EconomyService:SpendCoins(player: Player, amount: number) → boolean
EconomyService:RecordRoundResult(player: Player, won: boolean, asGlitched: boolean)
EconomyService:SetCreatorCode(player: Player, code: string)
```

**DataSchema:**
```lua
{
  Coins = 0, PremiumCoins = 0,
  TotalRounds = 0, Wins = 0, GlitchedWins = 0,
  BattlePassXP = 0, BattlePassTier = 0,
  OwnedItems = {}, EquippedItems = {},
  CreatorCode = nil,
  FirstJoin = 0, LastJoin = 0,
  _version = 1,
}
```

---

### MetaService
**OWNS:** Session event log, clip moment detection and triggering

**NEVER TOUCHES:** Gameplay state directly (reads via events only)

**DEPENDS ON:** StateService

**API:**
```lua
MetaService:Initialize()
MetaService:Log(eventName: string, data: table?)
MetaService:FlagClipMoment(player: Player, reason: string)
MetaService:GetSessionLog() → {table}
MetaService:GetEventCount(eventName: string) → number
```

**Listens for:** `PhaseChanged`, `PlayerEliminated`, `CorruptionChanged`

**Fires remote:** `ClipCaptured` (S→C)

---

## SERVER MIDDLEWARE

Middleware sits between NetworkService and Services/Systems. Every C→S remote passes through middleware before any game logic runs. Middleware NEVER modifies state — it only gates.

Order of execution for every inbound remote:
```
RateLimiter:Check → ActionValidator → PermissionGuard → [actual handler]
```
If any layer returns false, the handler does not run.

---

### RateLimiter
**OWNS:** Per-player, per-remote call-count windows

**NEVER TOUCHES:** Game logic, kick decisions (flags AntiExploitService, doesn't kick directly)

**DEPENDS ON:** GameConfig (for limits), AntiExploitService (lazy, for flagging)

**API:**
```lua
RateLimiter:Initialize()
RateLimiter:Check(player: Player, remoteName: string) → boolean
  -- Returns false and flags player if over limit. Returns true if under limit.
RateLimiter:Reset(player: Player)
  -- Called on PlayerRemoving
RateLimiter:OnPlayerRemoving(player: Player)
```

**Rate window:** 1 second rolling window. Limit per remote defined in NetworkConfig.

---

### ActionValidator
**OWNS:** Action legality checks — is this action legal in the current game phase?

**NEVER TOUCHES:** Role checks (PermissionGuard), rate limiting (RateLimiter), state mutation

**DEPENDS ON:** StateService

**API:**
```lua
ActionValidator:Initialize()
ActionValidator:CanVote(player: Player) → (ok: boolean, reason: string?)
ActionValidator:CanUseAbility(player: Player) → (ok: boolean, reason: string?)
ActionValidator:CanKill(player: Player) → (ok: boolean, reason: string?)
ActionValidator:CanUseGhostInterference(player: Player) → (ok: boolean, reason: string?)
ActionValidator:IsInPhase(requiredPhases: {string}) → boolean
ActionValidator:IsAlive(player: Player) → boolean
```

**Phase rules:**
- Vote: only during Voting phase, only if alive
- Ability: only during InProgress phase, only if alive
- Kill: only during InProgress phase, only if alive
- GhostInterference: only during InProgress phase, only if eliminated

---

### PermissionGuard
**OWNS:** Role-based access checks — does this player's role allow this action?

**NEVER TOUCHES:** Phase checks (ActionValidator), rate limiting (RateLimiter), state mutation

**DEPENDS ON:** StateService

**API:**
```lua
PermissionGuard:Initialize()
PermissionGuard:IsGlitched(player: Player) → boolean
PermissionGuard:IsNormal(player: Player) → boolean
PermissionGuard:IsGhost(player: Player) → boolean
PermissionGuard:RequireRole(player: Player, requiredRole: string) → boolean
PermissionGuard:RequireAlive(player: Player) → boolean
PermissionGuard:CanUseGlitchedAbility(player: Player) → boolean
PermissionGuard:CanUseNormalAbility(player: Player) → boolean
PermissionGuard:CanKill(player: Player) → boolean
  -- True only if Glitched + alive
```

---

## SERVER SYSTEMS

---

### RoundSystem
**OWNS:** Round lifecycle, phase transitions, timer, boot sequence

**NEVER TOUCHES:** State directly (uses StateService), role assignment (uses RoleService)

**DEPENDS ON:** StateService, RoleService, CorruptionSystem, VotingSystem, RevealSystem

**API:**
```lua
RoundSystem:Initialize()
RoundSystem:StartRoundLoop()  -- blocking, runs forever
RoundSystem:RunLobby()
RoundSystem:RunCountdown()
RoundSystem:RunInProgress()
RoundSystem:RunVoting()
RoundSystem:RunReveal()
RoundSystem:Cleanup()
RoundSystem:BroadcastPhase(phase: string, data: table)
RoundSystem:BroadcastTimer(seconds: number)
```

**Phase durations (from GameConfig):**
- Lobby: 20s
- Countdown: 5s
- InProgress: 240s
- Voting: 45s
- Reveal: 10s

---

### CorruptionSystem
**OWNS:** Corruption tick loop, event-driven spikes, corruption broadcast

**NEVER TOUCHES:** StateService directly for anything other than corruption value

**DEPENDS ON:** StateService

**API:**
```lua
CorruptionSystem:Initialize()
CorruptionSystem:StartTick()
CorruptionSystem:StopTick()
CorruptionSystem:Reset()
CorruptionSystem:OnKill(killerPlayer: Player)
CorruptionSystem:OnAbilityUsed(player: Player)
CorruptionSystem:CountActiveGlitched() → number
CorruptionSystem:GetCorruptionLabel() → "Clean" | "Fractured" | "Critical" | "Collapse"
CorruptionSystem:BroadcastCorruption()
```

**Fires remote:** `CorruptionUpdate` → `{value, label}`

---

### VotingSystem
**OWNS:** Vote collection, vote validation, "all votes in" detection

**NEVER TOUCHES:** Ejection, reveal sequence (those belong to RevealSystem)

**DEPENDS ON:** StateService, AntiExploitService

**API:**
```lua
VotingSystem:Initialize()
VotingSystem:OpenVoting()
VotingSystem:CloseVoting()
VotingSystem:ReceiveVote(voter: Player, targetUserId: number)
VotingSystem:AllVotesIn() → boolean
VotingSystem:Reset()
VotingSystem:OnPlayerRemoving(player: Player)
VotingSystem:BuildVotingPlayerList() → {table}
```

**Listens for remote:** `PlayerInteracted` with `{action="vote", targetId}`

**Fires remote:** `UpdateHUD` → `{type="VoteUpdate", votes}`

---

### GhostSystem
**OWNS:** Ghost physics application, ghost-to-spectator transition, ghost interference

**NEVER TOUCHES:** Corruption math (delegates), voting, reveal

**DEPENDS ON:** StateService

**API:**
```lua
GhostSystem:Initialize()
GhostSystem:OnCharacterAdded(player: Player, character: Model)
GhostSystem:ConvertToGhost(player: Player)
GhostSystem:ApplyGhostPhysics(character: Model)
GhostSystem:RestorePlayer(player: Player)
GhostSystem:OnGhostInterference(player: Player)
```

**Listens for:** `PlayerEliminated`

**Fires remote:** `SpectatorModeEnabled` → `{isGhost, canOrient}`

---

### RevealSystem
**OWNS:** Reveal payload construction, ejection application, win state broadcast

**NEVER TOUCHES:** Vote tallying (reads from StateService after VotingSystem is done)

**DEPENDS ON:** StateService, RoleService

**API:**
```lua
RevealSystem:Initialize()
RevealSystem:RunReveal(topId: number?, topCount: number?)
RevealSystem:BuildRevealData(topId: number?, topCount: number?) → RevealData
RevealSystem:PlayRevealSequence(data: RevealData)
RevealSystem:ApplyResult(data: RevealData)
```

**RevealData structure:**
```lua
{
  hasConsensus: boolean,
  ejectedId: number?,
  ejectedName: string,
  ejectedRole: string,
  wasGlitched: boolean,
  voteCount: number,
  winner: "Glitched" | "Normal" | nil,
  roleList: {table},  -- all players, their roles, elimination status
}
```

**Fires remote:** `ShowRevealSequence` → RevealData

---

### CombatService
**OWNS:** Kill attempt validation, proximity check, kill execution, kill cooldown tracking

**NEVER TOUCHES:** Corruption math (CorruptionSystem:OnKill), elimination state (StateService:EliminatePlayer), ghost conversion (GhostSystem:ConvertToGhost) — delegates all three

**DEPENDS ON:** StateService, AntiExploitService, CorruptionSystem (lazy), GhostSystem (lazy)

**API:**
```lua
CombatService:Initialize()
CombatService:HandleKillRequest(attacker: Player, data: {targetId: number})
CombatService:ValidateKill(attacker: Player, target: Player) → (ok: boolean, reason: string?)
  -- Checks: attacker is Glitched, alive, InProgress, target is Normal, alive, not same player, within range, cooldown elapsed
CombatService:ExecuteKill(attacker: Player, target: Player)
  -- Calls: StateService:EliminatePlayer, CorruptionSystem:OnKill, GhostSystem:ConvertToGhost
CombatService:IsOnCooldown(player: Player) → boolean
CombatService:GetCooldownRemaining(player: Player) → number
CombatService:ResetCooldowns()
  -- Called by RoundSystem:Cleanup between rounds
```

**Kill range:** 5 studs, validated via `(attacker HRP position - target HRP position).Magnitude`

**Kill is silent:** No RemoteEvent broadcast on kill. Target's client learns they died via SpectatorModeEnabled. Other players see the character disappear on natural Roblox replication.

**Listens for remote:** `KillEvent` (C→S, 5/sec)

**Cooldown:** 15 seconds, server-tracked in a private table

---

## CLIENT SYSTEMS

---

### UIStateManager
**OWNS:** Client-side snapshot of current game state, ShouldDistortUI logic

**NEVER TOUCHES:** Any rendering, any input handling

**DEPENDS ON:** Nothing (updated by ClientMain router)

**API:**
```lua
UIStateManager:Initialize()
UIStateManager:OnRealityUpdate(reality: RealityPacket)
UIStateManager:GetPhase() → string
UIStateManager:GetRole() → string
UIStateManager:IsEliminated() → boolean
UIStateManager:GetTrustScore() → number
UIStateManager:GetMapLevel() → string
UIStateManager:GetCorruption() → number
UIStateManager:SetPhase(phase: string)
UIStateManager:SetRole(role: string)
UIStateManager:ShouldDistortUI(element: string) → boolean
```

---

### CorruptionRenderer
**OWNS:** Visual effect application based on reality packet, corruption bar update

**NEVER TOUCHES:** Game state (reads only from reality packets)

**DEPENDS ON:** ScreenEffects

**API:**
```lua
CorruptionRenderer:Initialize()
CorruptionRenderer:ApplyReality(reality: RealityPacket)
CorruptionRenderer:TransitionToLevel(level: string)
CorruptionRenderer:UpdateCorruptionBar(value: number, label: string)
CorruptionRenderer:ApplyClean()
CorruptionRenderer:ApplyFractured()
CorruptionRenderer:ApplyCritical()
CorruptionRenderer:ApplyCollapse()
CorruptionRenderer:ClearAllEffects()
```

**Listens for remote:** `CorruptionUpdate` (for bar updates)

---

### ScreenEffects
**OWNS:** Glitch flash, screen shake, color flash — all cosmetic screen effects

**NEVER TOUCHES:** Game state, HUD logic

**API:**
```lua
ScreenEffects:Initialize()
ScreenEffects:PlayGlitch(duration: number)
ScreenEffects:Flash(color: Color3, duration: number)
ScreenEffects:Shake(intensity: number, duration: number)
ScreenEffects:PlayEliminationEffect()
ScreenEffects:PlayRevealEffect(wasGlitched: boolean)
```

---

### UIController
**OWNS:** Phase → GUI routing, timer display, vote UI population, reveal UI, notifications

**NEVER TOUCHES:** Game logic, server communication (receives, doesn't initiate)

**DEPENDS ON:** UIStateManager, ScreenEffects

**API:**
```lua
UIController:Initialize()
UIController:OnPhaseChanged(phase: string, data: table)
UIController:OnRoleAssigned(data: table)
UIController:OnTimerUpdate(seconds: number)
UIController:OpenVotingPanel()
UIController:OnVoteUpdate(votes: table)
UIController:OnReveal(data: RevealData)
UIController:OnNotification(data: table)
UIController:ShowOnly(gui: ScreenGui)
UIController:ShowBanner(message: string, duration: number)
UIController:BuildVotingButtons(playerList: table)
```

---

### AbilityController
**OWNS:** Ability keybinds, optimistic cooldown UI, firing ability remotes

**NEVER TOUCHES:** Ability execution (server does that), actual cooldown enforcement

**DEPENDS ON:** UIStateManager

**API:**
```lua
AbilityController:Initialize()
AbilityController:OnRoleAssigned(role: string)
AbilityController:HandleInput(input: InputObject)
AbilityController:IsOnCooldown(name: string) → boolean
AbilityController:GetCooldownRemaining(name: string) → number
AbilityController:UpdateCooldownUI()
AbilityController:BuildAbilityUI()
AbilityController:FlashCooldown(name: string)
```

---

### SpectatorController
**OWNS:** Ghost spectate target cycling, ghost interference input, GhostGui population

**NEVER TOUCHES:** Ghost physics (server/GhostSystem handles that)

**DEPENDS ON:** UIStateManager

**API:**
```lua
SpectatorController:Initialize()
SpectatorController:Enable(data: table)
SpectatorController:Disable()
SpectatorController:SpectateTarget(player: Player)
SpectatorController:CycleTarget(direction: number)
SpectatorController:RefreshTargets()
SpectatorController:UseGhostInterference()
```

---

### AudioController
**OWNS:** All sound playback — ambient music, event stings, ability sounds, phase transitions

**NEVER TOUCHES:** Visual effects (CorruptionRenderer/ScreenEffects), game state

**DEPENDS ON:** Nothing (reacts to RemoteEvents and local UIStateManager)

**API:**
```lua
AudioController:Initialize()
AudioController:OnPhaseChanged(phase: string)
  -- Routes to correct ambient/music for the phase
AudioController:OnRealityUpdate(reality: RealityPacket)
  -- Escalates ambient based on MapState
AudioController:OnCorruptionUpdate(value: number, label: string)
  -- Fades between ambient layers
AudioController:OnReveal(data: RevealData)
  -- FREEZE: stops all audio. REVEAL: plays sting. SHOCK: plays result fanfare.
AudioController:OnLocalElimination()
  -- Plays elimination sound, starts ghost ambience
AudioController:PlayAbilitySound(abilityId: string)
AudioController:SetAmbientLevel(level: string)
  -- "Clean" | "Fractured" | "Critical" | "Collapse"
AudioController:StopAll()
```

**Sound event map:**
```
PhaseChanged → Lobby: lobby_music | InProgress: ingame_ambient | Voting: vote_tension | Reveal: silence
CorruptionUpdate → escalates ambient layer (Clean → Fractured → Critical → Collapse)
ShowRevealSequence → silence (300ms) → reveal_sting → result_fanfare
PlayerEliminated (local) → elimination_sound → ghost_ambient begins
AbilityUsed → GlitchDash: whoosh | SignalJam: interference_buzz | ScanPulse: ping_sweep | EmergencyBroadcast: alert_chime
```

**Listens for remotes:** `RoundStateChanged`, `ShowRevealSequence`, `CorruptionUpdate`, `UpdateHUD`

---

## REMOTEEVENTS — COMPLETE REFERENCE

| Remote | Path | Direction | Rate Limit | Validated By |
|--------|------|-----------|------------|--------------|
| RoundStateChanged | Remotes/RoundEvents/ | S→C | N/A | N/A |
| PlayerAssignedRole | Remotes/RoundEvents/ | S→C | N/A | N/A |
| RoundTimerUpdated | Remotes/RoundEvents/ | S→C | N/A | N/A |
| RoundEnded | Remotes/RoundEvents/ | S→C | N/A | N/A |
| AbilityUsed | Remotes/GameplayEvents/ | C→S | 10/sec | AbilityService |
| PlayerInteracted | Remotes/GameplayEvents/ | C→S | 10/sec | VotingSystem + GhostSystem |
| KillEvent | Remotes/GameplayEvents/ | C→S | 5/sec | CombatService |
| CorruptionUpdate | Remotes/GameplayEvents/ | S→C | N/A | N/A |
| ShowNotification | Remotes/UIEvents/ | S→C | N/A | N/A |
| ShowRevealSequence | Remotes/UIEvents/ | S→C | N/A | N/A |
| UpdateHUD | Remotes/UIEvents/ | S→C | N/A | N/A |
| ClipCaptured | Remotes/MetaEvents/ | S→C | N/A | N/A |
| SpectatorModeEnabled | Remotes/MetaEvents/ | S→C | N/A | N/A |

---

## STUDIO SETUP CHECKLIST

**Lighting (add these effects as children of Lighting):**
- [ ] BlurEffect — Size = 0
- [ ] ColorCorrectionEffect — all defaults

**GUI elements that code references:**

HUDGui needs:
- [ ] TimerFrame/TimerLabel
- [ ] CorruptionBar/Fill + CorruptionBar/Label
- [ ] AbilityUI/Slot1 and Slot2, each with CooldownFill + CooldownLabel
- [ ] VotingPanel (with player buttons added dynamically)
- [ ] RoleOverlay/RoleLabel + RoleOverlay/TeammateFrame
- [ ] BannerLabel
- [ ] GlitchOverlay
- [ ] FlashFrame
- [ ] Vignette

RevealGui needs:
- [ ] RevealFrame/EjectedName
- [ ] RevealFrame/EjectedRole
- [ ] RevealFrame/ResultLabel

GhostGui needs:
- [ ] TargetLabel

MainMenuGui needs:
- [ ] StatusLabel

**Audio (add SoundService children or workspace sounds):**
- [ ] lobby_music (Sound)
- [ ] ingame_ambient (Sound)
- [ ] vote_tension (Sound)
- [ ] reveal_sting (Sound)
- [ ] result_fanfare_normal (Sound)
- [ ] result_fanfare_glitched (Sound)
- [ ] elimination_sound (Sound)
- [ ] ghost_ambient (Sound)
- [ ] ability_whoosh (Sound) — GlitchDash
- [ ] ability_jam (Sound) — SignalJam
- [ ] ability_ping (Sound) — ScanPulse
- [ ] ability_broadcast (Sound) — EmergencyBroadcast
