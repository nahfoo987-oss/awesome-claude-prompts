# CLAUDE_WORKFLOW.md
# GLITCHED REALITY — 7 Phase Build Commands
# Use these exact commands to drive Claude through each build phase.
# Paste the command, let Claude complete it fully before moving on.

---

## HOW TO USE THIS

1. Start every session by pasting **SESSION START** below
2. Use phase commands in order — don't skip phases
3. Each phase ends with a stated deliverable — don't move on until it's complete
4. If Claude goes off-track, paste the **RESET** command

---

## SESSION START
> Paste this at the beginning of every new Claude session.

```
You are building GLITCHED REALITY, a Roblox multiplayer deception game.

Read and internalize CLAUDE_RULES.md before doing anything else.
Read SYSTEMS_REFERENCE.md to understand the full architecture.

The game has these phases: Lobby → Countdown → InProgress → Voting → Reveal → Lobby

Core mechanic: TruthService distorts what each player sees based on corruption level (0–100).
Corruption rises over time, Glitched players accelerate it, Normal players try to identify and eject Glitched before corruption hits 100.

Current build status: [PASTE CURRENT DAY FROM SPRINT_PLAN.md]

What we're doing today: [PASTE TODAY'S GOAL FROM SPRINT_PLAN.md]

Do not write any code yet. Confirm you understand the architecture and today's goal.
```

---

## PHASE 1 — /design
> Use this when starting any new system.

```
/design [SystemName]

Before writing any code, produce the full system design card:

## System: [SystemName]

### Responsibility
[One sentence. What does this system own?]

### What it NEVER touches
[What is explicitly out of scope?]

### Dependencies
- Requires: [list]
- Fires events to: [list]
- Listens for events from: [list]

### Public API
[Every method signature with parameter types and return types]

### RemoteEvents used
[Name | Direction | Rate limit]

### Failure mode
[What breaks if this crashes mid-round? What's the recovery?]

### Security surface
[What can an exploiter attempt through this system?]

Wait for my approval before writing any code.
```

---

## PHASE 2 — /build
> Use this after approving the design.

```
/build [SystemName]

Build the complete, production-ready implementation of [SystemName].

Requirements:
- Follow the approved design card exactly
- Every method has a header comment
- Section dividers: -- ── SECTION NAME ─────────────────────
- pcall on all DataStore, network, and external calls
- Rate limit check is FIRST LINE of every OnServerEvent handler
- Fallback/default values for all state
- No TODOs, no placeholders, no "add later" comments
- Under 400 lines — if approaching limit, flag it and split

Output the complete file. Nothing omitted.
```

---

## PHASE 3 — /wire
> Use this after building a system, to connect it to the rest.

```
/wire [SystemName]

Show me every connection point for [SystemName]:

1. What needs to be added to Main.server.lua (require + initialize call)
2. What needs to be added to ClientMain.client.lua (if client-side)
3. What RemoteEvents need to be created in Studio (name + type + location)
4. What other systems need to call into this one (and where in their code)
5. What this system calls that must already exist before it initializes

Show the exact code snippets to add/modify in each file.
Do not rewrite entire files — show surgical inserts only.
```

---

## PHASE 4 — /truthcheck
> Use this specifically for TruthService — the most critical system.

```
/truthcheck

TruthService is the core identity of this game. Walk me through:

1. The full reality packet structure for each corruption level:
   - Clean (0–24): what the client sees
   - Fractured (25–59): what changes
   - Critical (60–89): what lies are injected
   - Collapse (90–100): full distortion rules

2. Role overrides:
   - What does a Glitched player always see?
   - What does an eliminated (ghost) player always see?
   - What does a Normal player see at each level?

3. How fake positions are generated and injected

4. The push cadence: when does TruthService send reality packets?
   - On corruption change
   - On elimination
   - On periodic sync
   - On phase change

5. What the client does with the reality packet (CorruptionRenderer + UIStateManager)

Show the complete data flow diagram, then the complete code for any piece I flag.
```

---

## PHASE 5 — /exploit
> Use this to audit any system for security issues.

```
/exploit [SystemName]

Audit [SystemName] as if you are an exploiter with full client access.

For each attack vector:
1. What can the exploiter do?
2. What's the impact if it works?
3. Is our current code protected against it?
4. If not, show the exact fix.

Attack categories to check:
- Remote spam (rate limit bypass)
- Argument injection (wrong types, nil, out-of-range values)
- Role spoofing (claiming wrong role)
- State manipulation (acting while eliminated, in wrong phase)
- Position cheating (teleportation, speed)
- Timing attacks (firing before valid window)
- Replay attacks (reusing old valid requests)

Show the fixed code for every vulnerability found.
```

---

## PHASE 6 — /moment
> Use this to design or audit viral/streamable moments.

```
/moment [MomentName]

Design the full "freeze → reveal → shock" sequence for [MomentName].

[MomentName options: Ejection, CorruptionCollapse, GlitchedWin, NormalWin, GhostInterference]

For each beat:

FREEZE:
- What triggers the freeze?
- What stops on screen? What stops in audio?
- How long does it last?
- What UI element draws the eye?

REVEAL:
- What is shown, and in what order?
- What animation plays?
- What sound plays?
- What does the guilty/innocent player's screen show specifically?

SHOCK:
- What is the final state after reveal?
- What does the winner see vs the loser?
- What text, color, and sound defines this outcome?
- Is this clipworthy? Would a streamer get a reaction shot here?

Then: show the complete client-side code for this sequence
(RevealController, ScreenEffects calls, audio triggers).
```

---

## PHASE 7 — /stress
> Use this before shipping any system.

```
/stress [SystemName]

Stress test [SystemName] against these scenarios:

1. MINIMUM: 4 players, 1 Glitched, round runs to time limit
2. MAXIMUM: 12 players, 3 Glitched, corruption hits 100 before voting
3. DISCONNECT: 1 player leaves mid-round (including the Glitched player)
4. DATASTORE DOWN: DataStore unavailable when round ends
5. CRASH: [SystemName] throws an error mid-round — what happens to the round loop?
6. RACE CONDITION: Two players vote for the same target simultaneously
7. LATE JOIN: Player joins during InProgress phase

For each scenario:
- What currently happens (good or bad)?
- What should happen?
- If different: show the exact code fix.
```

---

## RESET COMMAND
> If Claude goes off-track, paste this.

```
STOP. Reset.

You are a Roblox senior systems engineer building GLITCHED REALITY.
You follow CLAUDE_RULES.md without exception.
The architecture is in SYSTEMS_REFERENCE.md.

What were we building? [state the system]
What phase were we in? [state the phase]

Resume from that point. Do not rewrite anything already built.
Show me only what's missing or broken.
```

---

## END OF SESSION
> Paste this before ending any session.

```
End of session summary:

1. List every file that was created or modified this session (filename + one-line description)
2. List every RemoteEvent that needs to be created in Studio
3. List every Lighting effect that needs to exist
4. List every GUI element referenced in code that needs to exist in Studio
5. What is the exact next step for the next session?
6. Is anything broken or incomplete that must be resolved before moving forward?

Save this summary. I will paste it at the start of the next session.
```
