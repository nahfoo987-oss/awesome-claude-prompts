# SPRINT_PLAN.md — GLITCHED REALITY
## 7-Day Production Build Plan

This is a studio-style execution roadmap. Each day has a clear goal, exact Claude commands
to run, deliverables to ship, and a done condition. Do not move to the next day until
the current day's done condition is met.

Use this alongside CLAUDE_WORKFLOW.md for the exact prompts.

---

## PRE-SPRINT CHECKLIST

Before Day 1, confirm:

- [ ] Roblox Studio installed and project place file created
- [ ] Rojo or file-sync tool configured (recommended: Rojo with VS Code)
- [ ] Git repo initialized for version control
- [ ] CLAUDE_RULES.md, CLAUDE_WORKFLOW.md, GAME_BUILD_PROMPT.md in repo
- [ ] ProfileService and GoodSignal installed as packages
- [ ] `.luaurc` configured for strict type checking

---

## DAY 1 — ARCHITECTURE + SHARED FOUNDATION

**Goal:** Full architecture approved. Shared modules built and tested.

**Morning — Architecture (2–3 hours)**

1. Paste SECTION A from `GAME_BUILD_PROMPT.md`
2. Review the output:
   - Does the folder hierarchy match the system list?
   - Is the dependency graph acyclic? (no circular dependencies)
   - Does data flow start at Client Input and end at Client Rendering Only?
3. Request corrections on anything wrong before proceeding
4. Paste SECTION B from `GAME_BUILD_PROMPT.md` (skeleton phase)

**Afternoon — Shared Modules (3–4 hours)**

Run these in order using `/implement` from `CLAUDE_WORKFLOW.md`:

```
/implement GameConfig
/implement Enums
/implement Signal
/implement Maid
/implement TableUtils
/implement RoleDefinitions
/implement CorruptionConfig
/implement NetworkConfig
```

For each: implement → paste into Studio → verify no errors in Output

**Done condition:**
- [ ] All shared modules load without errors
- [ ] `require(GameConfig).MinPlayers` returns a number
- [ ] `Signal.new()` creates a working signal
- [ ] `Maid.new()` creates a working maid

---

## DAY 2 — STATE + NETWORK LAYER

**Goal:** StateService and NetworkService fully working. These two systems unblock everything else.

**StateService (3–4 hours)**

```
/design StateService
/skeleton StateService
/implement StateService
/audit StateService
/patch StateService
```

Key things to verify:
- `StateService:GetState(key)` returns correct value
- `StateService:SetState(key, value)` fires change events
- No module other than StateService writes to the state table
- State resets cleanly between rounds (test by calling reset twice)

**NetworkService (2–3 hours)**

```
/design NetworkService
/skeleton NetworkService
/implement NetworkService
/audit NetworkService
/patch NetworkService
```

Key things to verify:
- All RemoteEvent objects created and named from NetworkConfig
- Rate limiter correctly blocks a simulated spam call
- Input validation rejects nil, wrong types, and out-of-range values
- No other server script can fire a RemoteEvent directly

**Done condition:**
- [ ] StateService passes `/stress StateService`
- [ ] NetworkService rate limiter blocks >10 calls/second from one player
- [ ] Both modules load with zero Output errors

---

## DAY 3 — ROUND LOOP + ROLES

**Goal:** A complete round can start, run one phase, and end. Roles are assigned and win conditions are checked.

**RoundService (3–4 hours)**

```
/design RoundService
/skeleton RoundService
/implement RoundService
/audit RoundService
/patch RoundService
```

Test manually:
- Start a local server with 2 players (Studio Play mode)
- Trigger `RoundService:StartRound()` from the console
- Confirm the round advances through: LOBBY → PREP → MAIN PHASE → RESULT → END
- Confirm the round resets cleanly

**RoleService (2–3 hours)**

```
/design RoleService
/skeleton RoleService
/implement RoleService
/audit RoleService
/patch RoleService
```

Test manually:
- With 6 players, verify role distribution matches `GameConfig` ratios
- Verify no player receives another player's role via RemoteEvent
- Verify `RoleService:CheckWinCondition()` returns correct result for each win state

**Done condition:**
- [ ] Full round loop runs without errors
- [ ] Roles assigned correctly for 6 and 12 player counts
- [ ] Win conditions detected correctly for all three outcomes
- [ ] No role data transmitted to wrong clients (verify with a spy RemoteEvent listener)

---

## DAY 4 — TRUTH DISTORTION ENGINE

**Goal:** TruthService fully working across all corruption tiers. This is the core mechanic.

**TruthService (full day — 5–6 hours)**

```
/design TruthService
/skeleton TruthService
/implement TruthService
/audit TruthService
/patch TruthService
/stress TruthService
```

This system is the hardest to get right. Spend the extra time.

Test for each corruption tier (0–25, 26–50, 51–75, 76–99, 100):

| Tier | Test |
|---|---|
| 0–25 | Player names match real names exactly |
| 26–50 | 20% of names are replaced, vote counts differ by ≤1 |
| 51–75 | Name replacements are consistent within a phase, reset next phase |
| 76–99 | Names fully reshuffled — same fake name never maps to two real players |
| 100 | All distortion removed, true names and roles shown |

Archivist test:
- Trigger Archivist ability
- Confirm undistorted snapshot arrives via RemoteEvent
- Confirm snapshot is not re-sent after 8 seconds
- Confirm server does NOT broadcast this to other players

**Done condition:**
- [ ] All 5 corruption tiers produce correct output (verified via console prints)
- [ ] Archivist snapshot has correct 8-second expiry
- [ ] TruthService never modifies StateService (read-only verified)
- [ ] `/audit TruthService` returns no Critical or High severity findings

---

## DAY 5 — VOTING + GHOST SYSTEMS

**Goal:** Voting resolves correctly. Ghosts can interfere. Both are exploit-resistant.

**VotingService (2–3 hours)**

```
/design VotingService
/skeleton VotingService
/implement VotingService
/audit VotingService
/patch VotingService
```

Test:
- Player votes for a target → vote registered server-side
- Player tries to vote twice → second vote rejected
- Player tries to vote for themselves → rejected
- Dead player tries to vote → rejected
- Vote resolves correctly on timer expiry AND on all-votes-in

**GhostService (2–3 hours)**

```
/design GhostService
/skeleton GhostService
/implement GhostService
/audit GhostService
/patch GhostService
```

Test:
- Only Phantom role converts to Ghost on death
- Ghost interference action fires → affected player receives distorted data
- Living player tries to call Ghost action → rejected
- Ghost tries to interfere twice in one phase → second action rejected

**Done condition:**
- [ ] Vote manipulation attempts (double vote, self vote, dead vote) all rejected
- [ ] Ghost interference correctly distorts one player's perceived state
- [ ] GhostService `/stress` test shows no state corruption under simultaneous calls

---

## DAY 6 — REVEAL SEQUENCES + CLIENT SYSTEMS

**Goal:** All five cinematic reveal sequences working. Core client systems render game state correctly.

**RevealService (2 hours)**

```
/design RevealService
/implement RevealService
```

Build all five sequences:
- ROLE REVEAL — per-player, fires at round start
- VOTE COLLAPSE — broadcast, timed increments
- CORRUPTION SPIKE — broadcast on threshold cross
- GHOST INTERFERENCE — targeted, fires to affected player only
- REALITY COLLAPSE — broadcast, 8-second full sequence

**Client Systems (3–4 hours)**

Implement in this order (each depends on the previous):

```
/implement UIController
/implement CorruptionRenderer
/implement AbilityController
/implement GhostController
/implement SpectatorController
/implement ScreenEffects
```

For each client system: implement → test in Studio Play → verify no errors and correct visual output

**Done condition:**
- [ ] Role reveal animation plays for each player at round start
- [ ] Vote collapse sequence shows votes one-by-one with correct timing
- [ ] Corruption spike visual escalates correctly at each tier boundary
- [ ] Ghost interference causes visible glitch effect on targeted player's screen
- [ ] Reality collapse sequence plays on Corrupted team win

---

## DAY 7 — ECONOMY + ANTI-EXPLOIT + FINAL AUDIT

**Goal:** Progression system works. Anti-exploit blocks all known attack vectors. Full system audit passed.

**EconomyService (2 hours)**

```
/design EconomyService
/implement EconomyService
/audit EconomyService
```

Test:
- XP and currency awarded correctly at round end
- EconomyService called twice for same round → second call rejected (idempotency check)
- ProfileService saves data correctly on server close

**AntiExploitService (2 hours)**

```
/design AntiExploitService
/implement AntiExploitService
```

Stress test manually:
- Simulate remote spam → player kicked after threshold
- Simulate position teleport → flagged or kicked
- Simulate impossible state transition → rejected silently

**Full System Audit (2 hours)**

Run `/audit` on every system that handles RemoteEvents:
```
/audit NetworkService
/audit VotingService
/audit AbilityService
/audit GhostService
/audit TruthService
```

For any Critical or High finding: patch before shipping.

**Polish pass (1 hour)**

Run `/polish` on:
```
/polish RoundService
/polish RevealService
/polish TruthService
```

Focus: timing feels right, tension curve is correct, clip moments are present.

**Done condition:**
- [ ] EconomyService cannot double-reward a round
- [ ] AntiExploitService kicks a simulated spammer within 5 seconds
- [ ] Zero Critical security findings across all audited systems
- [ ] All five reveal sequences play correctly in a full 6-player test round
- [ ] Game runs stable for 3 consecutive rounds without errors

---

## POST-SPRINT CHECKLIST

- [ ] All systems pass their `/stress` test
- [ ] Full round tested with 6 players minimum
- [ ] All five viral sequences recorded as reference clips
- [ ] ProfileService verified saving data across server restarts
- [ ] Place file published to Roblox (private, for testing)
- [ ] Git repo has a clean commit history per system

---

## TIME ESTIMATES

| Day | Focus | Estimated Hours |
|---|---|---|
| 1 | Architecture + Shared | 5–7 |
| 2 | StateService + NetworkService | 5–7 |
| 3 | RoundService + RoleService | 5–7 |
| 4 | TruthService | 5–6 |
| 5 | VotingService + GhostService | 4–6 |
| 6 | RevealService + Client systems | 5–6 |
| 7 | Economy + AntiExploit + Audit | 5–6 |
| **Total** | | **34–45 hours** |

Realistic pace: 5–6 hours of focused work per day.
This is a production sprint, not a marathon session.
Rest between days. Review each day's work before starting the next.

---

## IF YOU GET STUCK

**Claude gave bad architecture:** Re-run `/design` with the specific contradiction listed explicitly.

**System is too large:** It needs to be split. Run `/design` again and ask Claude to identify the split point.

**Audit found Critical issues:** Do not proceed to the next system. Patch first.

**Two systems have overlapping logic:** One of them is wrong. Refer to CLAUDE_RULES.md Section 2 (Single Responsibility). One system must give up the logic.

**Client is doing server work:** Revert it. The client is a rendering layer. Move the logic to the server and send the result via RemoteEvent.
