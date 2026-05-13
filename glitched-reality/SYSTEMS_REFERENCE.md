# SYSTEMS_REFERENCE.md — GLITCHED REALITY
## Quick-Reference Card for All 23 Systems

Use this when: you need to know what a system owns, what it connects to,
or what API it exposes — without reading the full module.

---

## SERVER SYSTEMS

### StateService
**Owns:** All authoritative game state  
**Never touches:** RemoteEvents, client data, ProfileService  
**Used by:** Every server system (read), RoundService + RoleService + TruthService (write)  
**Key API:**
```lua
StateService:GetState(key: string): any
StateService:SetState(key: string, value: any): void
StateService:UpdateState(key: string, updater: (any) -> any): void
StateService:Subscribe(key: string, callback: (any) -> void): RBXScriptConnection
StateService:Reset(): void
```

---

### NetworkService
**Owns:** All RemoteEvent objects, all rate limiting, all input validation  
**Never touches:** Game state, role data, round logic  
**Used by:** All server systems (to listen), all client controllers (to fire)  
**Key API:**
```lua
NetworkService:GetRemote(name: string): RemoteEvent
NetworkService:OnServer(name: string, handler: (Player, ...any) -> void): void
NetworkService:FireClient(player: Player, name: string, ...any): void
NetworkService:FireAllClients(name: string, ...any): void
NetworkService:FireFilteredClients(filter: (Player) -> boolean, name: string, ...any): void
```
**Rate limits:** Defined in `NetworkConfig` — default 10 calls/second/player

---

### RoundService
**Owns:** Match lifecycle state machine (LOBBY → PREP → PHASE → VOTE → RESULT → END)  
**Never touches:** Role data, truth distortion, economy  
**Depends on:** StateService, RoleService, TruthService, VotingService, RevealService  
**Key API:**
```lua
RoundService:StartRound(): void
RoundService:EndRound(reason: string): void
RoundService:GetPhase(): string        -- returns current GamePhase enum value
RoundService:AdvancePhase(): void
```

---

### RoleService
**Owns:** Role assignment, role reveal logic, win condition evaluation  
**Never touches:** Corruption state, UI, vote collection  
**Depends on:** StateService, NetworkService  
**Key API:**
```lua
RoleService:AssignRoles(players: {Player}): void
RoleService:GetRole(player: Player): RoleDefinition   -- server only
RoleService:RevealRoleToPlayer(player: Player): void  -- fires filtered RemoteEvent
RoleService:CheckWinCondition(): WinResult | nil
RoleService:ConvertToGhost(player: Player): void
```

---

### TruthService
**Owns:** Per-player perceived reality generation (filtered/distorted state)  
**Never touches:** StateService writes, RemoteEvents, role assignment  
**Depends on:** StateService (read only)  
**Key API:**
```lua
TruthService:GetPerceivedState(player: Player): PerceivedState
TruthService:GetPerceivedPlayerList(player: Player): {PerceivedPlayer}
TruthService:GetPerceivedVoteCount(player: Player, target: Player): number
TruthService:ActivateArchivistWindow(player: Player): void
TruthService:InvalidateCache(): void   -- call at phase start
```
**Note:** Never modifies state. All output is a filtered copy.

---

### VotingService
**Owns:** Vote collection, validation, and resolution  
**Never touches:** Role assignment, corruption, economy  
**Depends on:** StateService, NetworkService, RoleService (read)  
**Key API:**
```lua
VotingService:OpenVoting(): void
VotingService:CloseVoting(): VoteResult
VotingService:CastVote(player: Player, targetId: number): boolean
VotingService:GetVoteCount(target: Player): number  -- server only, undistorted
```
**Validation:** Dead players, self-votes, duplicate votes all rejected server-side

---

### AbilityService
**Owns:** Ability activation, cooldown tracking, server-side ability effect application  
**Never touches:** UI cooldown display, role assignment, vote logic  
**Depends on:** StateService, NetworkService, RoleService (read)  
**Key API:**
```lua
AbilityService:UseAbility(player: Player, abilityId: string): boolean
AbilityService:GetCooldown(player: Player, abilityId: string): number
AbilityService:ResetAbilities(player: Player): void
AbilityService:IsOnCooldown(player: Player, abilityId: string): boolean
```

---

### GhostService
**Owns:** Ghost player registry, interference action validation, interference effect application  
**Never touches:** Living player logic, vote collection, economy  
**Depends on:** StateService, NetworkService, TruthService  
**Key API:**
```lua
GhostService:RegisterGhost(player: Player): void
GhostService:IsGhost(player: Player): boolean
GhostService:UseInterference(ghost: Player, targetId: number): boolean
GhostService:GetInterferenceUsed(ghost: Player): boolean
GhostService:ResetPhase(): void
```
**Constraint:** Each Ghost gets one interference action per phase

---

### RevealService
**Owns:** Cinematic reveal sequence orchestration (server-side timing + client firing)  
**Never touches:** State writes, vote logic, role assignment  
**Depends on:** StateService, NetworkService, RoleService (read)  
**Key API:**
```lua
RevealService:PlayRoleReveal(): void           -- fires per-player at round start
RevealService:PlayVoteCollapse(result: VoteResult): void
RevealService:PlayCorruptionSpike(level: number): void
RevealService:PlayGhostInterference(target: Player): void
RevealService:PlayRealityCollapse(): void      -- round end, Corrupted win
```

---

### EconomyService
**Owns:** XP and currency calculation, ProfileService writes, reward distribution  
**Never touches:** Game state, roles, round logic  
**Depends on:** StateService (read), NetworkService, ProfileService  
**Key API:**
```lua
EconomyService:AwardRound(player: Player, result: RoundResult): void
EconomyService:GetBalance(player: Player): EconomyData
EconomyService:LoadProfile(player: Player): void
EconomyService:SaveProfile(player: Player): void
```
**Idempotency:** AwardRound is a no-op if called twice for the same round ID

---

### AntiExploitService
**Owns:** Remote fire rate monitoring, impossible state detection, position validation  
**Never touches:** Game logic, role data, economy  
**Depends on:** NetworkService (intercepts), StateService (read)  
**Key API:**
```lua
AntiExploitService:RecordAction(player: Player, actionType: string): boolean
AntiExploitService:CheckPosition(player: Player, claimedPos: Vector3): boolean
AntiExploitService:FlagPlayer(player: Player, reason: string): void
AntiExploitService:KickPlayer(player: Player, reason: string): void
```
**Thresholds:** Defined in `GameConfig.AntiExploit`

---

## CLIENT SYSTEMS

### UIController
**Owns:** UI component mounting/unmounting per game phase  
**Never touches:** Game logic, server state  
**Listens to:** NetworkService remotes for phase change events  
**Key behavior:** Shows correct UI for each phase (lobby, prep, main, vote, result, spectator)

---

### CorruptionRenderer
**Owns:** Visual distortion effects scaled to current Corruption Level  
**Never touches:** Game logic, player names directly  
**Listens to:** Corruption level updates from NetworkService  
**Effects:** Name flicker, scan lines, chromatic aberration, geometry shimmer

---

### AbilityController
**Owns:** Ability input capture, cooldown UI, ability fire to NetworkService  
**Never touches:** Cooldown enforcement (server-side only), role logic  
**Key behavior:** Input captured → fired to NetworkService → server validates → response updates UI

---

### GhostController
**Owns:** Ghost interference input and UI  
**Never touches:** Living player UI, vote logic  
**Active only when:** `GhostService:IsGhost(localPlayer)` is true (confirmed by server)

---

### SpectatorController
**Owns:** Camera behavior and UI for eliminated players before Ghost conversion  
**Never touches:** Game logic, other players' state

---

### ScreenEffects
**Owns:** Camera shake, glitch VX, post-processing effect intensity  
**Never touches:** Game logic  
**Called by:** CorruptionRenderer, UIController (for reveal sequences)

---

## SHARED MODULES

| Module | Contains |
|---|---|
| `GameConfig` | All tunable numbers: player counts, timers, corruption thresholds, AntiExploit limits |
| `Enums` | String-enum constants: `GamePhase`, `RoleCategory`, `WinCondition`, `AbilityId` |
| `RoleDefinitions` | Role names, categories, ability IDs, description strings |
| `CorruptionConfig` | Per-tier distortion rules (name replacement %, vote drift, etc.) |
| `NetworkConfig` | RemoteEvent name constants, rate limit values per remote |
| `Signal` | GoodSignal-pattern bindable event — `Signal.new()`, `:Connect()`, `:Fire()`, `:Destroy()` |
| `Maid` | Connection/instance cleanup — `Maid.new()`, `:GiveTask()`, `:DoCleaning()` |
| `TableUtils` | `DeepCopy(t)`, `Merge(a, b)`, `Shuffle(t)`, `Contains(t, v)` |

---

## DEPENDENCY GRAPH

```
                    ┌─────────────┐
                    │ Shared Libs │
                    │ (no deps)   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ StateService│
                    │ (read/write)│
                    └──────┬──────┘
                           │
              ┌────────────▼────────────┐
              │      NetworkService     │
              │   (owns all remotes)    │
              └──┬──────┬──────┬───────┘
                 │      │      │
        ┌────────▼──┐ ┌─▼────┐ ┌▼──────────┐
        │RoundService│ │Role  │ │TruthService│
        └────────┬──┘ │Service│ └─────┬─────┘
                 │    └──┬───┘        │
        ┌────────▼──┐    │     ┌──────▼──────┐
        │VotingService   │     │ GhostService │
        └────────┬──┘    │     └─────────────┘
                 │       │
        ┌────────▼───────▼──┐
        │   RevealService   │
        └────────┬──────────┘
                 │
        ┌────────▼──────────┐
        │  Client Rendering │
        │  (no server calls)│
        └───────────────────┘
```

**Rules enforced by this graph:**
- Arrows point downward only (no circular dependencies)
- Client systems have no upward arrows (they only receive)
- StateService has no outgoing dependencies (it is a pure data store)
- NetworkService is the only path between server and client

---

## REMOTEVENT REFERENCE

All names defined in `NetworkConfig`. Full list:

| Remote Name | Direction | Owner | Rate Limit |
|---|---|---|---|
| `PhaseChanged` | Server → Client | NetworkService | broadcast |
| `RoleAssigned` | Server → Client (filtered) | RoleService | once per round |
| `PerceivedStateUpdate` | Server → Client (per-player) | TruthService | 1/phase |
| `CastVote` | Client → Server | VotingService | 1/vote window |
| `VoteResult` | Server → Client | RevealService | broadcast |
| `UseAbility` | Client → Server | AbilityService | per GameConfig cooldown |
| `AbilityCooldownSync` | Server → Client | AbilityService | on use |
| `GhostInterfere` | Client → Server | GhostService | 1/phase |
| `GhostEffect` | Server → Client (targeted) | GhostService | 1/phase |
| `CorruptionUpdate` | Server → Client | RoundService | broadcast |
| `RevealSequence` | Server → Client | RevealService | broadcast |
| `ArchivistSnapshot` | Server → Client (targeted) | TruthService | 1/round |
| `EconomyUpdate` | Server → Client | EconomyService | on award |

**Hard rule:** No script outside NetworkService creates or fires a RemoteEvent.
