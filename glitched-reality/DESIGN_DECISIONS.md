# DESIGN_DECISIONS.md
# GLITCHED REALITY — Why Things Are Built the Way They Are
# Read this when Claude questions an architectural choice or proposes an "improvement."
# These decisions are final. They are not open for discussion unless the game design changes.

---

## DATA & PERSISTENCE

### Why UpdateAsync, not SetAsync
SetAsync blindly overwrites whatever is in the DataStore.
If a player has two sessions open (rare but real — server crashes, client reconnects fast),
the last save wins and the earlier session's data is lost.
UpdateAsync reads the current stored value first, then applies the update atomically.
Never use SetAsync for player data. This is non-negotiable.

### Why 3-attempt retry with exponential backoff
DataStore calls fail in live Roblox servers — budget exhaustion, network blips, API rate limits.
A single pcall with no retry means data loss on the first transient failure.
Exponential backoff (2s, 4s, 8s) avoids hammering an already-stressed API.
Failing after 3 attempts is acceptable. Crashing the round loop on a DataStore hiccup is not.

### Why DataService is separate from EconomyService
DataService owns raw reads and writes with retry logic. It knows nothing about coins or XP.
EconomyService owns what to read, what to write, and all business logic (tier math, coin totals).
If Roblox changes the DataStore API, only DataService updates.
If the economy design changes (new currencies, new tiers), only EconomyService updates.
Neither needs to know the other's internals. That is the point.

---

## ARCHITECTURE

### Why the event bus (StateService:On) instead of direct service calls
If RoundSystem called TruthService directly: RoundSystem now depends on TruthService.
Later, adding GhostSystem requires going back into RoundSystem to add another direct call.
With the event bus: RoundSystem fires PhaseChanged. Any subscriber — TruthService, GhostSystem,
MetaService — reacts independently. RoundSystem never changes when new subscribers are added.
Event bus = open/closed principle. Direct calls = tight coupling that compounds with every new system.

### Why middleware is three separate modules (RateLimiter, ActionValidator, PermissionGuard)
Each has a different job and a different reason to change:
- RateLimiter changes if rate limit values or window sizes change
- ActionValidator changes if phase logic or action rules change
- PermissionGuard changes if role rules change

One "GatekeeperService" combining all three has three independent reasons to change — it is a god module.
Separate modules means each can be tested, audited, and updated independently.

### Why nothing requires Main.server.lua or ClientMain.client.lua
Main and ClientMain are boot files. They wire systems together and start the loop. That is all they do.
If any module required Main, you would have a circular dependency between a boot file and a service.
Boot files have no reusable logic. They are wiring scripts, not libraries. Nothing should need them.

### Why lazy require is a last resort for circular dependencies
When Lua loads Module A, it starts executing it. If Module A immediately requires Module B,
and Module B immediately requires Module A, Module A's return table does not exist yet — you get nil.
Lazy require (inside a function body) defers the require until after both modules are fully loaded.
It works, but it hides a design flaw. The real fix is always to remove the circular dependency.
Use lazy require only when the circular dependency cannot be cleanly resolved by extraction or events.

---

## GAME DESIGN

### Why kills are silent and ejections are announced
A kill (Glitched eliminating a player) produces no broadcast. The character disappears.
An ejection (vote result) produces a full reveal sequence with the player's role shown.

This asymmetry is intentional and load-bearing:
- Players cannot tell if someone left, disconnected, or was killed
- The uncertainty forces paranoia and conversation
- It creates asymmetric information between Glitched (who know) and Normals (who do not)

If kills were announced the same way as ejections, the game becomes mechanical and solved.
The uncertainty IS the game. Any change that removes it removes the core loop.

### Why the corruption bar lies at Collapse tier (90-100)
At Collapse, the corruption bar shows real value plus or minus random noise, clamped 0-100.
This is intentional design, not a bug.

When players cannot trust their own UI, they are forced to make decisions under genuine uncertainty.
The server always knows the real value. The client rendering is one more layer of deception.
Fixing this to always show truth removes the highest-tension mechanic at the most critical moment.

### Why ghost interference drains corruption instead of affecting votes
Giving ghosts vote manipulation would mean eliminated players control game outcomes.
A Normal player who was legitimately ejected could still swing the vote toward a bad result.
That breaks the social contract of the vote and feels unfair.
Corruption drain gives ghosts meaningful agency without touching vote integrity.

### Why client ability cooldown is optimistic
The client shows the cooldown immediately on keypress, before server confirmation.
If the server rejects the ability (lag, anti-exploit, wrong state), the client cooldown resets.

The alternative — waiting for server confirmation before showing the cooldown — makes every
ability feel laggy and unresponsive. On a 100ms connection, the button feels broken.
Server authority is preserved. UX is preserved. This is the right tradeoff.

### Why MIN_GLITCHED = 1, MAX_GLITCHED = 3
Below 1 Glitched: no deception game exists.
Above 3 Glitched in 12 players: Glitched win by raw numbers before corruption reaches its tension window.
The game is interesting when Normals can win through correct deduction, not just lucky early ejection.
1-3 Glitched across 4-12 players keeps the game solvable but not trivial. These are design constraints.

### Why kill range is server-validated via HumanoidRootPart, not client-reported position
A client can send any Vector3 it wants in a RemoteEvent argument.
If CombatService trusted the client's position data, any exploiter could kill from across the map.
The server already knows where every character is. Use the server-known HumanoidRootPart position.
Never use client-sent positions for authoritative range calculations.

---

## SECURITY

### Why shadow pool instead of immediate kick on first suspicious action
Immediately kicking on any suspicious action creates false positives.
A laggy player fires a remote twice in 0.4 seconds — that is not an exploiter, that is lag.
Shadow pool means:
- 4 flags: player is noted, actions may be silently rejected
- 8 flags: player is kicked with a vague, non-informative message

Critically: exploiters are never told they have been flagged. They continue playing,
unaware their actions are being rejected and their pattern is being logged.
Immediate kicks teach exploiters exactly where the threshold is. Silent pools do not.

### Why per-player reality packets instead of one broadcast state
If the server broadcast one shared game state to all clients, each client would need to
distort its own view — which means the client must know the real, undistorted truth first.
TruthService would be bypassable: any exploit script reads the real values before distortion runs.
Per-player packets mean each player receives only the version of reality they should see.
There is no real state on the client to bypass. The packet IS their reality.

### Why InvokeClient is forbidden
RemoteFunction:InvokeClient blocks the server thread while waiting for a client response.
If the client disconnects or never responds, the server thread hangs indefinitely.
This can freeze the entire round loop. It is not a theoretical risk; it happens in production.
Use FireClient + OnClientEvent with a server-side timeout if you need a response pattern.

---

## ROBLOX-SPECIFIC

### Why task.wait / task.spawn / task.delay, never wait / spawn / delay
wait(), spawn(), and delay() are deprecated in Roblox's modern task scheduler.
wait() has inconsistent timing — it can skip multiple frames under server load.
task.wait(n) is precise to the Heartbeat step and is the correct modern API.
This applies everywhere in the codebase without exception.

### Why WaitForChild on every remote access from a LocalScript
LocalScripts and Scripts run in parallel during game load. A LocalScript may execute before
the server has replicated a RemoteEvent into ReplicatedStorage.
WaitForChild("Name", timeout) waits up to timeout seconds and returns nil on expiry.
Naked indexing (Remotes.EventName) throws immediately if the child does not yet exist.
Always use WaitForChild on the client side for any instance that originates server-side.

### Why pcall on every DataStore call without exception
DataStore calls fail for reasons entirely outside your control:
budget exhaustion, server instability, Roblox API outages.
A naked DataStore call that errors unwinds the entire call stack and can terminate the round loop.
Every single DataStore call must be wrapped in pcall. Log failures. Provide a fallback.
This is not optional defensive programming. It is the minimum viable approach for live servers.
