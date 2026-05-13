# GLITCHED REALITY — Prompt Collection
## Everything Claude needs to build this game correctly, every session.

---

## WHAT THIS IS

Five files that turn Claude into a production-grade Roblox systems engineer for GLITCHED REALITY. Paste them in the right order and Claude will design, build, audit, and ship every system without going off-track.

---

## THE FILES

| File | Purpose | When to use |
|------|---------|-------------|
| `CLAUDE_RULES.md` | The 10 laws + architecture layers + naming conventions + what to never do | Paste at start of every session |
| `CLAUDE_WORKFLOW.md` | 7 phase commands (/design, /build, /wire, /truthcheck, /exploit, /moment, /stress) | Reference during building |
| `GAME_BUILD_PROMPT.md` | Full game brief (4 sections: game design, GameConfig values, TruthService spec, error fixes) | Paste Section 1 to start, others as needed |
| `SPRINT_PLAN.md` | 7-day execution plan — exact tasks, Claude commands, and done conditions per day | Track progress, paste current day's goal |
| `SYSTEMS_REFERENCE.md` | All 23 systems — OWNS/NEVER TOUCHES/DEPENDS ON/API/Events for each | Keep open while building |

---

## QUICKSTART — 4 STEPS

### Step 1 — Open a fresh Claude session and paste this:

```
[Paste CLAUDE_RULES.md in full]
```

Wait for Claude to confirm it has read and understood the rules.

### Step 2 — Paste the game brief:

```
[Paste GAME_BUILD_PROMPT.md Section 1 in full]
```

Tell Claude which day of the sprint you're on and what today's goal is (from SPRINT_PLAN.md).

### Step 3 — Start the first task:

```
/design [SystemName]
```

Do not let Claude write code before it produces and you approve the design card.

### Step 4 — End every session:

Paste the END OF SESSION command from CLAUDE_WORKFLOW.md. Save the summary. Paste it at the start of the next session.

---

## SYSTEM BUILD ORDER

Follow this order. Do not build a system before its dependencies exist.

```
Day 1: GameConfig → StateService → Main skeleton → ClientMain skeleton
Day 2: RoleService → RoundSystem → AntiExploitService (core) → UIController (phase only)
Day 3: CorruptionSystem → TruthService → CorruptionRenderer → ScreenEffects
Day 4: VotingSystem → RevealSystem → Voting UI → Reveal UI
Day 5: GhostSystem → AbilityService → AbilityController → SpectatorController
Day 6: EconomyService → end-of-round flow → ShopGui → BattlePassGui → HUD polish
Day 7: AntiExploitService (position) → full security audit → stress test → MetaService → ship
```

---

## GAME SUMMARY

**GLITCHED REALITY** — Roblox multiplayer deception game.

- Players are secretly assigned roles: **Normal** (75%) or **Glitched** (25%)
- **Normals**: identify and eject Glitched before corruption hits 100
- **Glitched**: hide, raise corruption, survive until Glitched ≥ Normals
- **Corruption** (0–100) distorts what players see — TruthService sends each player a different version of reality
- At 90+ corruption, the corruption bar itself starts lying
- Eliminated players become ghosts with full truth vision and limited interference abilities
- Every reveal is designed to be a streamable, clippable moment

**23 systems. 7 days. Ship condition: zero errors, full round loop, ghost mode, economy saving.**

---

## IF CLAUDE GOES OFF-TRACK

Paste the RESET command from CLAUDE_WORKFLOW.md. It re-establishes the persona, the architecture, and the current task without losing progress.

---

## CONTACT BETWEEN SESSIONS

At the end of every session, Claude will produce a summary:
- Files created/modified
- RemoteEvents needed in Studio
- GUI elements needed in Studio
- Next session's first task

Save this. It's your handoff document.
