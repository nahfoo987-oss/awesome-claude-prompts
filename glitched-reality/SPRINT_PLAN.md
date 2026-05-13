# SPRINT_PLAN.md
# GLITCHED REALITY — 7-Day Build Plan
# Each day has exact Claude commands, what to build, and how to know it's done.
# Do not move to the next day until every checkbox is checked.

---

## HOW TO USE THIS

1. Start each day by pasting SESSION START from CLAUDE_WORKFLOW.md
2. Add: "Current build status: Day X" and "Today's goal: [paste this day's goal]"
3. Work through each task using the phase commands from CLAUDE_WORKFLOW.md
4. End each day by pasting END OF SESSION command
5. Save the session summary — paste it at the start of the next session

---

## DAY 1 — Foundation & Shared Libraries
**Goal:** Server boots. Client connects. All shared constants exist. No gameplay yet.

### Tasks

**Task 1.1 — Folder structure**
Create every folder in Studio exactly as specified in GAME_BUILD_PROMPT.md Section 1.
Do NOT create any scripts yet — just folders.

Done when:
- [ ] ServerScriptService has: Services/, Systems/, Middleware/, Data/
- [ ] ReplicatedStorage has: Remotes/RoundEvents/, Remotes/GameplayEvents/, Remotes/UIEvents/, Remotes/MetaEvents/, Shared/Constants/, Shared/Types/, Shared/Utility/
- [ ] StarterPlayerScripts has: Controllers/, Systems/
- [ ] StarterGui has: MainMenuGui, HUDGui, RevealGui, GhostGui, ShopGui, BattlePassGui

**Task 1.2 — Create all RemoteEvents in Studio**
Every remote in the REMOTEEVENTS table in CLAUDE_RULES.md must be created as a RemoteEvent instance inside the correct Remotes subfolder.

Done when:
- [ ] All 13 RemoteEvents exist in correct locations in Studio

**Task 1.3 — GameConfig**
```
/design GameConfig
Then: /build GameConfig
```
This is a ModuleScript in ReplicatedStorage/Shared/Constants/.
Contains ALL values from GAME_BUILD_PROMPT.md Section 2.

Done when:
- [ ] GameConfig.lua exists with all values
- [ ] No magic numbers anywhere else in the codebase

**Task 1.4 — StateService**
```
/design StateService
Then: /build StateService
Then: /exploit StateService
```

Done when:
- [ ] StateService.lua complete with all methods from SYSTEMS_REFERENCE.md
- [ ] Internal _state is never accessible from outside
- [ ] Event bus (StateService:On) working
- [ ] All getters and setters implemented
- [ ] ResetRound() clears all state correctly

**Task 1.5 — Main.server.lua skeleton**
Build Main.server.lua with all requires and initialize calls in correct boot order.
No systems are built yet — comment out what doesn't exist.

Done when:
- [ ] Main.server.lua has correct require order (Services before Systems)
- [ ] PlayerAdded and PlayerRemoving connected
- [ ] Print statements confirm server boot completes without errors

**Task 1.6 — ClientMain skeleton**
Build ClientMain.client.lua with all system/controller requires.
Comment out anything not yet built.

Done when:
- [ ] ClientMain runs without errors
- [ ] Remote listeners connected (even if handlers are empty)
- [ ] Print confirms client boots successfully

---

## DAY 2 — Role Assignment & Round Loop
**Goal:** Rounds start. Roles are assigned privately. Timer runs. Lobby works.

### Tasks

**Task 2.1 — RoleService**
```
/design RoleService
Then: /build RoleService
Then: /exploit RoleService
```

Done when:
- [ ] Fisher-Yates shuffle implemented correctly
- [ ] Glitched count respects ratio + min/max from GameConfig
- [ ] Each player receives only their own role (not others')
- [ ] Glitched players receive their teammates list
- [ ] CheckWinConditions() returns "Glitched", "Normal", or nil correctly

**Task 2.2 — RoundSystem**
```
/design RoundSystem
Then: /build RoundSystem
Then: /stress RoundSystem
```

Done when:
- [ ] Full phase loop: Lobby → Countdown → InProgress → Voting → Reveal → Lobby
- [ ] Each phase broadcasts via RemoteEvent
- [ ] Timer decrements and broadcasts every second
- [ ] Win condition checked every tick during InProgress
- [ ] Early exit if corruption hits 100 or win condition met
- [ ] Cleanup runs between rounds (StateService:ResetRound called)

**Task 2.3 — AntiExploitService (core)**
```
/design AntiExploitService
Then: /build AntiExploitService
```
Build CheckRate() and Flag() and the three suspicion tiers.
Position validation comes on Day 7.

Done when:
- [ ] CheckRate(player, remoteName) works and returns bool
- [ ] Flag() increments suspicion silently
- [ ] Shadow pool flag set at threshold 4
- [ ] Kick fires at threshold 8 with vague message

**Task 2.4 — UIController (phase routing only)**
```
/build UIController
```
Build only the phase routing (OnPhaseChanged → show correct GUI).
No voting UI, no reveal UI yet.

Done when:
- [ ] Lobby → MainMenuGui
- [ ] Countdown → MainMenuGui (status text changes)
- [ ] InProgress → HUDGui
- [ ] Phase changes broadcast and client reacts correctly

**Test Day 2:**
- Start a round with 4 players in Studio
- Confirm roles are assigned (check output logs)
- Confirm timer counts down
- Confirm phase changes fire and client receives them
- Confirm round resets and restarts

---

## DAY 3 — Corruption & TruthService (The Core)
**Goal:** Corruption rises. Reality distorts. Each player sees something different.
This is the hardest day. Do not rush it.

### Tasks

**Task 3.1 — CorruptionSystem**
```
/design CorruptionSystem
Then: /build CorruptionSystem
Then: /stress CorruptionSystem
```

Done when:
- [ ] Tick fires every BASE_TICK_RATE seconds during InProgress only
- [ ] Tick amount scales with active Glitched count
- [ ] OnKill() and OnAbilityUsed() add correct amounts
- [ ] Stops at 100, fires win condition
- [ ] BroadcastCorruption() fires CorruptionUpdate to all clients
- [ ] Reset() clears to 0

**Task 3.2 — TruthService**
```
/truthcheck
Then: /design TruthService
Then: /build TruthService
Then: /exploit TruthService
```
This is the most important system in the game. Spend the most time here.

Done when:
- [ ] GetPlayerReality() returns correct packet for all 4 corruption levels
- [ ] Glitched override: always sees truth
- [ ] Ghost override: sees true roles + true corruption + no fake positions
- [ ] FakePositions generated for 30% of players at Critical+
- [ ] CorruptionDisplay lies at Collapse (±30 random, clamped)
- [ ] PushRealityToAll() fires UpdateHUD to every player
- [ ] Periodic sync runs every 2 seconds during InProgress
- [ ] Reacts to CorruptionChanged and PlayerEliminated events

**Task 3.3 — CorruptionRenderer (client)**
```
/build CorruptionRenderer
```

Done when:
- [ ] ApplyReality(packet) switches visual effects by MapState
- [ ] Clean: no effects
- [ ] Fractured: slight blur, occasional glitch flash
- [ ] Critical: stronger blur, color shift, more frequent glitch
- [ ] Collapse: heavy blur, aggressive glitch, vignette
- [ ] Corruption bar updates from packet (may show fake value)
- [ ] Ghost vision: all effects cleared immediately

**Task 3.4 — ScreenEffects (client)**
```
/build ScreenEffects
```

Done when:
- [ ] PlayGlitch(duration) creates convincing screen distortion
- [ ] Flash(color, duration) works
- [ ] Shake(intensity, duration) works
- [ ] PlayRevealEffect(wasGlitched) calls both

**Test Day 3:**
```
/stress TruthService
```
- Manually set corruption to 25, 60, 90 in Studio
- Verify each player's visual state matches their expected reality
- Verify Glitched player sees clean state regardless
- Verify ghost player sees all true roles

---

## DAY 4 — Voting & Reveal (The Emotional Peak)
**Goal:** Players vote. Someone gets ejected. The reveal lands.

### Tasks

**Task 4.1 — VotingSystem**
```
/design VotingSystem
Then: /build VotingSystem
Then: /exploit VotingSystem
```

Done when:
- [ ] OpenVoting() clears old votes, counts eligible voters, sends player list to clients
- [ ] ReceiveVote() validates: phase, not eliminated, not self-vote, one vote per player
- [ ] Rate limit applied to every vote received
- [ ] AllVotesIn() returns true when all eligible players have voted
- [ ] CloseVoting() stops accepting new votes
- [ ] Vote counts broadcast to all clients in real time

**Task 4.2 — RevealSystem**
```
/design RevealSystem
Then: /build RevealSystem
Then: /moment Ejection
```

Done when:
- [ ] BuildRevealData() builds correct payload (ejected player, role, vote count, winner)
- [ ] HasConsensus check: needs majority (ceil(players/2))
- [ ] If no consensus: "Nobody" reveal (no ejection)
- [ ] Fires ShowRevealSequence to all clients
- [ ] ApplyResult() eliminates the ejected player
- [ ] Winner detection triggers correct win state

**Task 4.3 — Voting UI (client)**
Build voting buttons in HUDGui that appear during Voting phase.
Each button shows player name + vote count.
One vote per player — button disabled after voting.

Done when:
- [ ] Voting panel appears when phase = Voting
- [ ] Player buttons built dynamically from server's player list
- [ ] Clicking a button fires PlayerInteracted remote with vote data
- [ ] Vote counts update in real time as UpdateHUD packets arrive
- [ ] Own button is not shown (can't vote for yourself)
- [ ] All buttons disabled after voting

**Task 4.4 — Reveal UI (client)**
Build the reveal sequence in RevealGui.

Done when:
- [ ] Freeze beat: screen goes dark, sound stops
- [ ] Reveal beat: ejected player name and role flash with animation
- [ ] Shock beat: "GLITCHED WINS" or "NORMALS WIN" or "Round continues"
- [ ] ScreenEffects:PlayRevealEffect(wasGlitched) fires at correct moment

**Test Day 4:**
```
/stress VotingSystem
```
- Run a full round to voting phase
- Vote for a Glitched player — confirm correct reveal
- Vote for a Normal player — confirm incorrect reveal (with different reaction)
- Let timer expire without all votes — confirm partial vote result

---

## DAY 5 — Ghost System & Abilities
**Goal:** Death means something. Abilities change the game.

### Tasks

**Task 5.1 — GhostSystem**
```
/design GhostSystem
Then: /build GhostSystem
Then: /stress GhostSystem
```

Done when:
- [ ] PlayerEliminated event triggers ConvertToGhost immediately
- [ ] ApplyGhostPhysics: transparency 0.7, no collision, speed 18
- [ ] Ghost tools removed
- [ ] SpectatorModeEnabled fires to ghost player
- [ ] CharacterAdded re-applies ghost physics if player is eliminated
- [ ] OnGhostInterference() drains 2 corruption server-side

**Task 5.2 — AbilityService**
```
/design AbilityService
Then: /build AbilityService
Then: /exploit AbilityService
```

Done when:
- [ ] HandleRequest validates: phase, elimination, role match, rate limit, cooldown
- [ ] GlitchDash: moves character 20 studs forward (server-side)
- [ ] SignalJam: fires ShowNotification to players within 30 studs
- [ ] ScanPulse: returns true positions (roles within 20 studs, otherwise "?")
- [ ] EmergencyBroadcast: counts alive Glitched, fires to all clients
- [ ] Each Glitched ability triggers CorruptionSystem:OnAbilityUsed()
- [ ] Cooldowns tracked server-side

**Task 5.3 — AbilityController (client)**
```
/build AbilityController
```

Done when:
- [ ] Q fires first ability for current role, E fires second
- [ ] Optimistic cooldown UI updates immediately on fire
- [ ] Cannot fire while on cooldown (visual flash only — server enforces)
- [ ] Cooldown bars update correctly in HUDGui

**Task 5.4 — SpectatorController (client)**
```
/build SpectatorController
```

Done when:
- [ ] Activates on SpectatorModeEnabled remote
- [ ] Left/Right arrows cycle through alive players
- [ ] F key fires ghost interference remote
- [ ] GhostGui shows who is being spectated
- [ ] GhostGui shows true corruption value

**Test Day 5:**
- Get eliminated and confirm ghost physics apply immediately
- Spectate other players, cycle through them
- Use ghost interference, confirm corruption drops on server
- Use GlitchDash as Glitched, confirm position changes server-side
- Use SignalJam, confirm targeted players receive glitch effect
- Use ScanPulse, confirm position + role data returns correctly

---

## DAY 6 — Economy & UI Polish
**Goal:** Progression works. Shop exists. UI feels finished.

### Tasks

**Task 6.1 — EconomyService**
```
/design EconomyService
Then: /build EconomyService
Then: /stress EconomyService
```

Done when:
- [ ] Load with schema merge + 3-attempt retry
- [ ] Save with UpdateAsync (not SetAsync)
- [ ] Auto-save every 60 seconds
- [ ] Save on PlayerRemoving (critical)
- [ ] AddCoins, SpendCoins, GetData all work
- [ ] RecordRoundResult: updates wins, XP, tier correctly
- [ ] XP per tier = 500, tiers uncapped

**Task 6.2 — End-of-round economy flow**
Wire EconomyService to RoundSystem:

Done when:
- [ ] RoundSystem calls EconomyService:RecordRoundResult for all players at end of Reveal phase
- [ ] Coins added to each player based on outcome + role
- [ ] XP added, tier calculated
- [ ] Results shown in a post-round UI screen (basic: coins earned, XP earned, new tier if changed)

**Task 6.3 — ShopGui (basic)**
Build a working shop with at least 3 placeholder items.

Done when:
- [ ] Shop opens/closes with a button
- [ ] Shows player's current coin balance (from EconomyService)
- [ ] Items show name, cost, preview
- [ ] Purchase deducts coins server-side (SpendCoins + validation)
- [ ] Can't buy if insufficient coins (UI disables button)
- [ ] Owned items show "Owned" instead of price

**Task 6.4 — BattlePassGui (basic)**
Build a working battle pass tier display.

Done when:
- [ ] Shows current tier and XP progress bar
- [ ] Shows next 3 upcoming rewards (placeholder icons OK)
- [ ] XP progress accurate from EconomyService data

**Task 6.5 — HUD polish**
Ensure HUD has all required elements wired and styled:

Done when:
- [ ] Timer displays correctly (MM:SS format)
- [ ] Corruption bar animates smoothly (tween on update)
- [ ] Ability slots show cooldown fill + number
- [ ] Player count shown (alive / total)
- [ ] Role display shown (YOUR ROLE: NORMAL / GLITCHED)

---

## DAY 7 — Anti-Exploit, Hardening & Full Audit
**Goal:** The game is secure, stable, and ready for real players.

### Tasks

**Task 7.1 — AntiExploitService (complete)**
```
/exploit AntiExploitService
```
Add position validation to the existing AntiExploitService.

Done when:
- [ ] Position sampled every 0.5 seconds per player
- [ ] Speed calculation: distance / time elapsed
- [ ] Speed > 32 studs/sec → Flag(player, "speed_hack", speed)
- [ ] Rate limiting confirmed working on all 13 remotes
- [ ] Shadow pool confirmed working (flag threshold 4)
- [ ] Kick confirmed working (flag threshold 8)

**Task 7.2 — Full security audit**
For each of these systems, run /exploit:
```
/exploit RoundSystem
/exploit VotingSystem
/exploit AbilityService
/exploit TruthService
```

Done when:
- [ ] Every RemoteEvent handler has rate limit as first line
- [ ] Every handler validates phase, elimination status, and role
- [ ] All argument types validated before use
- [ ] No server logic can be triggered from wrong phase
- [ ] No ability can fire with wrong role

**Task 7.3 — Stress test full round**
```
/stress RoundSystem
```

Done when:
- [ ] 4-player round completes correctly start to finish
- [ ] 12-player round completes correctly
- [ ] Player disconnect mid-round handled gracefully
- [ ] DataStore unavailable: game continues with in-memory data, no crash
- [ ] Round loop restarts after error without server restart
- [ ] Late joiner handled (joins during InProgress, goes to lobby for next round)

**Task 7.4 — MetaService**
```
/build MetaService
```

Done when:
- [ ] All key events logged (phase changes, eliminations, corruption milestones)
- [ ] GlitchedCaught triggers clip capture remote
- [ ] Session log doesn't grow unbounded (capped at 500 entries)

**Task 7.5 — Final checklist**

- [ ] No script over 400 lines (split any that are)
- [ ] No TODOs or placeholder comments in any script
- [ ] All 13 RemoteEvents exist in Studio
- [ ] BlurEffect and ColorCorrectionEffect in Lighting
- [ ] All GUI elements referenced in code exist in Studio
- [ ] Server boots cleanly with 0 errors in output
- [ ] Client boots cleanly with 0 errors in output
- [ ] Full round (Lobby → Reveal → Lobby) completes without errors
- [ ] Ghost mode works end to end
- [ ] Economy saves and loads correctly
- [ ] Anti-exploit flags speed hackers silently

**SHIP CONDITION:**
All 39 checkboxes above checked. Zero errors on server boot. Zero errors on client boot. Full round completes.

---

## CARRY-FORWARD NOTES
> Fill this in at the end of each day. Paste into the next session's start.

**End of Day ___:**
- Systems built: 
- Systems wired: 
- Known issues: 
- Blockers for next day: 
- Next session starts with: 
