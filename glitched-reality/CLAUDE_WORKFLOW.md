# CLAUDE_WORKFLOW.md — GLITCHED REALITY

Exact command prompts for each development phase. Paste these directly into Claude Code.
Every command enforces the rules in CLAUDE_RULES.md.

---

## HOW TO USE

Each command below is a complete prompt. Replace `[SYSTEM_NAME]` with the actual system
(e.g. `RoundService`, `TruthService`, `RoleService`).

Commands must be run **in order** per feature. Do not skip phases.

---

## PHASE 1 — `/design [SYSTEM_NAME]`

```
You are operating in ARCHITECT MODE.

Design the [SYSTEM_NAME] system for Glitched Reality.

Output the following in order — no code yet:

1. FOLDER PLACEMENT
   Where this script lives in Roblox Studio's hierarchy.

2. SYSTEM RESPONSIBILITY
   - What this system OWNS
   - What it NEVER touches
   - What it DEPENDS ON (if anything)

3. API SURFACE
   List every public function as a Lua-style signature with a one-line description.
   Example:
     RoundService:StartRound(config: RoundConfig): void
     RoundService:EndRound(reason: string): RoundResult

4. DATA FLOW DIAGRAM
   Show exactly how data moves through this system using a text diagram.
   Start from Client Input and end at Client Rendering.

5. DEPENDENCY GRAPH
   Show relationships to other services.
   Example:
     StateService → [SYSTEM_NAME] → ClientReplication
                         ↓
                    EventBus

6. FAILURE CASES
   List exactly 5 ways this system can break in a live server with:
   - exploiters
   - high latency
   - desync
   - duplicate remote events
   - client-side manipulation

Do not write any implementation code. Architecture approval comes first.
```

---

## PHASE 2 — `/skeleton [SYSTEM_NAME]`

```
You are operating in ENGINEER MODE.

The architecture for [SYSTEM_NAME] has been approved.

Generate the SKELETON only — no implementation logic yet.

Output:
- The full module file with correct folder placement comment at the top
- All public functions declared but with empty bodies
- All private functions declared but with empty bodies
- Require statements for approved dependencies only
- RemoteEvent declarations if needed (server-side only)
- Inline comments marking WHERE logic will go (not what the logic is)

Rules:
- No god modules. If this exceeds ~150 lines as a skeleton, split it.
- No client-trusted inputs anywhere in the signatures.
- Every RemoteEvent handler must have a placeholder rate-limit check.
- StateService must be the only place replicated state is read or written.
```

---

## PHASE 3 — `/implement [SYSTEM_NAME]`

```
You are operating in ENGINEER MODE.

Implement the full logic for [SYSTEM_NAME] based on the approved skeleton.

Rules:
- Server is the only authority. Clients are rendering layers only.
- All state reads/writes go through StateService.
- No system calls another system directly — use the event bus.
- Every RemoteEvent must validate: player identity, rate limit, input sanity.
- No nil cases left unhandled.
- No magic numbers — use named constants.
- Functions must do one thing.

For each function, before writing it, state in one comment line:
  -- OWNS: what this function is responsible for
  -- DOES NOT: what it explicitly avoids

Output the complete, production-ready module.
```

---

## PHASE 4 — `/audit [SYSTEM_NAME]`

```
You are operating in SECURITY AUDITOR MODE.

Audit [SYSTEM_NAME] for every class of vulnerability below.

For each finding, output:
  SEVERITY: Critical / High / Medium / Low
  VECTOR: how an exploiter triggers this
  IMPACT: what breaks or is gained
  FIX: exact code change required

Audit checklist:
1. RemoteEvent abuse — can clients spam, fake, or replay events?
2. Client-trusted data — does any server logic use unvalidated client input?
3. State pollution — can a client corrupt StateService?
4. Race conditions — what breaks under simultaneous calls?
5. Latency abuse — what can a high-ping player do that others cannot?
6. Desync exploit — can client visual state diverge from server truth in an exploitable way?
7. Role leakage — can a client learn information they should not have?
8. Nil/edge crashes — what inputs cause unhandled errors?

After the audit, output a PATCH SUMMARY listing every required fix.
Do not rewrite the module — list targeted changes only.
```

---

## PHASE 5 — `/patch [SYSTEM_NAME]`

```
You are operating in ENGINEER MODE.

Apply all patches from the security audit of [SYSTEM_NAME].

For each patch:
- Quote the original code
- Show the replacement code
- State which audit finding it resolves

After patching, confirm:
- No new nil cases introduced
- No new unprotected remotes introduced
- StateService is still the only state authority
- No cross-system direct calls added
```

---

## PHASE 6 — `/polish [SYSTEM_NAME]`

```
You are operating in GAME DESIGNER MODE + VIRAL DIRECTOR MODE.

Review [SYSTEM_NAME] for player experience and clip-worthiness.

Answer each question:

CLARITY
- Does the player understand what just happened within 2 seconds?
- Is there any moment of confusion that feels unfair vs. intentionally designed?

TENSION
- Does this system create a rising tension arc?
- Where is the peak emotional moment?

DECEPTION MECHANICS
- How does this system mislead players in a way that feels designed, not broken?
- Is the misinformation layer coherent with increasing corruption level?

CLIP MOMENT
- What is the single most streamable moment this system produces?
- If there is none, what change would create one?

TIMING + FEEDBACK
- Are transitions, reveals, and state changes properly telegraphed?
- What sound, visual, or UI feedback is missing?

Output:
1. A list of specific improvements (code or design changes)
2. One "viral moment" addition if none currently exists
3. Pacing recommendation (too fast / correct / too slow)
```

---

## PHASE 7 — `/stress [SYSTEM_NAME]`

```
You are operating in SECURITY AUDITOR MODE + ARCHITECT MODE.

Simulate the following scenarios against [SYSTEM_NAME] and report what breaks:

SCENARIO 1 — 20 players spam the primary RemoteEvent simultaneously
SCENARIO 2 — A player has 800ms ping throughout an entire round
SCENARIO 3 — A player disconnects at the exact moment a state transition fires
SCENARIO 4 — Two players trigger the same action within the same server heartbeat
SCENARIO 5 — A client sends a RemoteEvent with every field set to nil
SCENARIO 6 — StateService returns nil for a key this system depends on
SCENARIO 7 — A player exploits client-side to fire a protected remote 100 times per second

For each scenario:
  RESULT: what breaks (crash / wrong state / exploit / silent failure)
  ROOT CAUSE: why it breaks
  FIX: targeted code change

After all scenarios, output a STABILITY SCORE from 1–10 with justification.
```

---

## QUICK REFERENCE — ROLE MODES

| Mode | What Claude focuses on |
|---|---|
| ARCHITECT MODE | Structure, dependencies, data flow — no code |
| ENGINEER MODE | Clean implementation, one function per job |
| SECURITY AUDITOR MODE | Exploits, edge cases, remote abuse |
| GAME DESIGNER MODE | Fun, tension, clarity, fairness |
| VIRAL DIRECTOR MODE | Clip moments, reveals, emotional peaks |

---

## STANDARD SYSTEM BUILD ORDER

```
/design      → get architecture approved
/skeleton    → scaffold the module
/implement   → fill in logic
/audit       → find vulnerabilities
/patch       → apply fixes
/polish      → improve feel + clip moments
/stress      → confirm stability under load
```

Never skip `/audit` before shipping a system that handles RemoteEvents.

---

## DEPENDENCY GRAPH TEMPLATE

Paste this into any `/design` request to enforce consistent output:

```
StateService
     ↓
[SYSTEM_NAME]
     ↓          ↓
EventBus    [Other Service]
     ↓
ClientReplication
     ↓
Client Rendering Only
```

---

## FAILURE MODE PROMPT (ADD TO ANY REQUEST)

```
Before finalizing, list 5 ways this breaks in a live Roblox server
with exploiters, lag spikes, desync, duplicate events, and client manipulation.
Then patch each one.
```

---

## OWNERSHIP VERIFICATION PROMPT (ADD TO ANY DESIGN)

```
For this system, explicitly state:
- OWNS: what data/logic belongs to it
- NEVER TOUCHES: what it must not access
- ALLOWED CALLERS: which systems can interact with it and how
If you cannot answer all three, the design is not ready.
```
