-- CrownService | ServerScriptService
-- Crown lifecycle: spawn, pickup, drop, bounce, corruption stages,
-- speed penalties, hide detection, round loop, coin rewards.
-- FIXED: coin persistence via AddCoins bindable, shield integration,
--        fight-back system (Royal Slam + Rage), totalWins/totalSteals tracking,
--        timer drift fixed, stageNames corrected.

local Players           = game:GetService("Players")
local RunService        = game:GetService("RunService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService      = game:GetService("TweenService")

-------------------------------------------------
-- WAIT FOR REMOTES
-------------------------------------------------
local Remotes = ReplicatedStorage:WaitForChild("Remotes")
local RE = {
    CrownPickup            = Remotes:WaitForChild("CrownPickup"),
    CrownDrop              = Remotes:WaitForChild("CrownDrop"),
    StageChanged           = Remotes:WaitForChild("StageChanged"),
    CrowdEvent             = Remotes:WaitForChild("CrowdEvent"),
    UpdateTimer            = Remotes:WaitForChild("UpdateTimer"),
    RoundEnd               = Remotes:WaitForChild("RoundEnd"),
    CoinReward             = Remotes:WaitForChild("CoinReward"),
    CorruptionStageChanged = Remotes:WaitForChild("CorruptionStageChanged"),
    RoyalSlam              = Remotes:WaitForChild("RoyalSlam"),  -- new: holder fight-back
}

local Bindables = {
    StageChanged = ReplicatedStorage:WaitForChild("StageChangedBindable"),
    CrownPickup  = ReplicatedStorage:WaitForChild("CrownPickupBindable"),
    RoundEnd     = ReplicatedStorage:WaitForChild("RoundEndBindable"),
    CoinShower   = ReplicatedStorage:WaitForChild("CoinShowerBindable"),
    Final30      = ReplicatedStorage:WaitForChild("Final30"),
}

-- FIX: use WaitForChild so this works regardless of DataService load order
local AddCoins = ReplicatedStorage:WaitForChild("AddCoins", 15)

local function awardCoins(player, amount, reason)
    if not AddCoins then
        -- Fallback: at least show the popup even if DataService isn't ready
        RE.CoinReward:FireClient(player, amount, reason)
        return
    end
    -- This calls DataService.addCoins which persists AND fires CoinReward to client
    pcall(function() AddCoins:Invoke(player, amount) end)
end

-------------------------------------------------
-- CONFIG
-------------------------------------------------
local CONFIG = {
    ROUND_LENGTH          = 180,
    CROWN_SPAWN_DELAY     = 5,
    BOUNCE_FREE_TIME      = 2.5,
    DROP_DAMAGE_WINDOW    = 2,
    DROP_DAMAGE_THRESH    = 0.30,
    HIDE_BOO_TIME         = 15,
    HIDE_HAZARD_TIME      = 25,
    PROXIMITY_PICKUP_DIST = 5,

    -- Royal Slam: holder's active fight-back ability (cooldown-gated)
    SLAM_COOLDOWN         = 12,   -- seconds between slams
    SLAM_RADIUS           = 18,   -- stud radius
    SLAM_FORCE            = 70,   -- launch force
    SLAM_DAMAGE           = 15,   -- damage to nearby attackers

    -- Rage power-up multipliers (applied when RagePotion attribute is set)
    RAGE_SLAM_RADIUS_MULT = 1.5,
    RAGE_SLAM_FORCE_MULT  = 1.3,

    STAGES = {
        { time = 0,   speedMult = 1.08, glowRange = 20,  announcement = nil },
        { time = 20,  speedMult = 1.00, glowRange = 30,  announcement = "👑 {name} is rising..." },
        { time = 45,  speedMult = 0.85, glowRange = 50,  announcement = "⚠️ {name} has held the crown for 45 seconds. TAKE IT FROM THEM." },
        { time = 75,  speedMult = 0.65, glowRange = 80,  announcement = "👹 {name} IS BECOMING THE TYRANT. STOP THEM." },
        { time = 120, speedMult = 0.50, glowRange = 120, announcement = "🔥 THE TYRANT WALKS. THEY WIN INSTANTLY IF THEY SURVIVE." },
    },

    STAGE_COLORS = {
        Color3.fromRGB(255, 215, 0),
        Color3.fromRGB(255, 180, 0),
        Color3.fromRGB(255, 120, 0),
        Color3.fromRGB(180, 0, 0),
        Color3.fromRGB(80, 0, 80),
    },

    COIN_REWARDS = {
        STEAL        = 50,
        HOLD_STAGE2  = 125,
        HOLD_STAGE4  = 400,
        WIN_ROUND    = 150,
        PARTICIPATE  = 20,
        SLAM_HIT     = 10,   -- coins per player hit by Royal Slam
    },
}

-------------------------------------------------
-- STATE
-------------------------------------------------
local State = {
    holder        = nil,
    holdStart     = 0,
    crownPart     = nil,
    isFree        = false,
    freeUntil     = 0,
    recentDamage  = {},
    roundActive   = false,
    roundEnd      = 0,
    holdTotals    = {},
    stageIndex    = 1,
    hideTimer     = 0,
    lastPos       = Vector3.zero,
    stageAOETimer = 0,
    slamCooldowns = {},  -- [userId] = lastSlamTick
}

-------------------------------------------------
-- UTILITIES
-------------------------------------------------
local function announce(msg)
    for _, p in Players:GetPlayers() do
        RE.CrowdEvent:FireClient(p, "ANNOUNCE", msg)
    end
end

local function getRoot(player)
    local char = player.Character
    return char and char:FindFirstChild("HumanoidRootPart")
end

local function getHumanoid(player)
    local char = player.Character
    return char and char:FindFirstChildOfClass("Humanoid")
end

-------------------------------------------------
-- CROWN OBJECT
-------------------------------------------------
local function buildCrownPart()
    if State.crownPart and State.crownPart.Parent then
        State.crownPart:Destroy()
    end

    local spawnAnchor = workspace:FindFirstChild("CrownSpawn")
    local spawnCFrame = spawnAnchor and spawnAnchor.CFrame or CFrame.new(0, 25, 0)

    local crown = Instance.new("Part")
    crown.Name          = "TheCrown"
    crown.Size          = Vector3.new(2.5, 1.5, 2.5)
    crown.Shape         = Enum.PartType.Ball
    crown.Material      = Enum.Material.Neon
    crown.Color         = Color3.fromRGB(255, 215, 0)
    crown.CastShadow    = true
    crown.TopSurface    = Enum.SurfaceType.Smooth
    crown.BottomSurface = Enum.SurfaceType.Smooth
    crown.CFrame        = spawnCFrame
    crown.Parent        = workspace

    local light = Instance.new("PointLight")
    light.Brightness = 5
    light.Range      = 20
    light.Color      = Color3.fromRGB(255, 215, 0)
    light.Parent     = crown

    local bb = Instance.new("BillboardGui")
    bb.Size        = UDim2.new(0, 120, 0, 40)
    bb.StudsOffset = Vector3.new(0, 3, 0)
    bb.AlwaysOnTop = false
    bb.Parent      = crown

    local lbl = Instance.new("TextLabel")
    lbl.Size                   = UDim2.fromScale(1, 1)
    lbl.BackgroundTransparency = 1
    lbl.Text                   = "👑 CROWN"
    lbl.TextColor3             = Color3.fromRGB(255, 215, 0)
    lbl.TextScaled             = true
    lbl.Font                   = Enum.Font.GothamBold
    lbl.Parent                 = bb

    State.crownPart = crown
    State.isFree    = true
    State.freeUntil = tick() + CONFIG.CROWN_SPAWN_DELAY
    return crown
end

local function setCrownVisuals(stageIndex)
    if not State.crownPart or not State.crownPart.Parent then return end
    local stage = CONFIG.STAGES[stageIndex]
    local color = CONFIG.STAGE_COLORS[stageIndex] or CONFIG.STAGE_COLORS[1]

    State.crownPart.Color = color

    local light = State.crownPart:FindFirstChildOfClass("PointLight")
    if light then
        light.Range      = stage.glowRange
        light.Brightness = 5 + (stageIndex * 2)
        light.Color      = color
    end
end

-------------------------------------------------
-- PICKUP / DROP
-------------------------------------------------
local function attachCrown(player)
    local root = getRoot(player)
    if not root or not State.crownPart or not State.crownPart.Parent then return end

    local previousHolder = State.holder

    State.holder     = player
    State.holdStart  = tick()
    State.isFree     = false
    State.stageIndex = 1
    State.hideTimer  = 0
    State.lastPos    = root.Position

    -- Remove any existing weld
    local oldWeld = State.crownPart:FindFirstChild("CrownWeld")
    if oldWeld then oldWeld:Destroy() end

    local weld     = Instance.new("WeldConstraint")
    weld.Name      = "CrownWeld"
    weld.Part0     = State.crownPart
    weld.Part1     = root
    weld.Parent    = State.crownPart
    State.crownPart.CFrame = root.CFrame * CFrame.new(0, 4, 0)

    local bb = State.crownPart:FindFirstChildOfClass("BillboardGui")
    if bb then
        local lbl = bb:FindFirstChildOfClass("TextLabel")
        if lbl then lbl.Text = "👑 " .. player.Name end
    end

    for _, p in Players:GetPlayers() do
        RE.CrownPickup:FireClient(p, player)
    end
    Bindables.CrownPickup:Fire(player)

    awardCoins(player, CONFIG.COIN_REWARDS.STEAL, "Crown Steal!")

    -- FIX: increment totalSteals in player's data via attribute signal
    -- DataService listens to this attribute change and increments the stat
    player:SetAttribute("StealsThisSession", (player:GetAttribute("StealsThisSession") or 0) + 1)

    if previousHolder then
        announce("👑 " .. player.Name .. " stole the crown from " .. previousHolder.Name .. "!")
    else
        announce("👑 " .. player.Name .. " grabbed the crown!")
    end
end

local function dropCrown(player, impulse)
    if State.holder ~= player then return end

    local root    = getRoot(player)
    local dropPos = root and root.Position or Vector3.new(0, 10, 0)

    if State.crownPart and State.crownPart.Parent then
        local weld = State.crownPart:FindFirstChild("CrownWeld")
        if weld then weld:Destroy() end

        State.crownPart.Anchored = false
        State.crownPart.CFrame   = CFrame.new(dropPos + Vector3.new(0, 3, 0))
        State.crownPart.AssemblyLinearVelocity = impulse
            or Vector3.new(math.random(-15, 15), 25, math.random(-15, 15))
    end

    local held = tick() - State.holdStart
    State.holdTotals[player] = (State.holdTotals[player] or 0) + held

    -- Coin rewards for hold milestones
    if held >= 45  then awardCoins(player, CONFIG.COIN_REWARDS.HOLD_STAGE2, "Survived Stage 2!") end
    if held >= 120 then awardCoins(player, CONFIG.COIN_REWARDS.HOLD_STAGE4, "Tyrant Survival!") end

    local hum = getHumanoid(player)
    if hum then hum.WalkSpeed = 16 end

    State.holder      = nil
    State.holdStart   = 0
    State.isFree      = true
    State.freeUntil   = tick() + CONFIG.BOUNCE_FREE_TIME
    State.stageIndex  = 1
    State.stageAOETimer = 0

    for _, p in Players:GetPlayers() do
        RE.CrownDrop:FireClient(p, player)
    end

    announce("💥 " .. player.Name .. " dropped the crown!")
end

-------------------------------------------------
-- ROYAL SLAM — holder's active fight-back ability
-- Client fires RoyalSlam remote → server validates cooldown → applies AOE
-------------------------------------------------
RE.RoyalSlam.OnServerEvent:Connect(function(player)
    -- Must be holding crown
    if State.holder ~= player then return end

    local uid  = player.UserId
    local now  = tick()
    local last = State.slamCooldowns[uid] or 0

    -- Check cooldown
    if now - last < CONFIG.SLAM_COOLDOWN then
        -- Fire back the remaining cooldown so client can show it
        RE.RoyalSlam:FireClient(player, "COOLDOWN", CONFIG.SLAM_COOLDOWN - (now - last))
        return
    end

    State.slamCooldowns[uid] = now

    local root = getRoot(player)
    if not root then return end

    -- Rage power-up multipliers
    local isRaging   = player:GetAttribute("Rage") == true
    local radius     = CONFIG.SLAM_RADIUS * (isRaging and CONFIG.RAGE_SLAM_RADIUS_MULT or 1)
    local force      = CONFIG.SLAM_FORCE  * (isRaging and CONFIG.RAGE_SLAM_FORCE_MULT  or 1)

    local hitCount = 0
    for _, target in Players:GetPlayers() do
        if target == player then continue end
        local tr = getRoot(target)
        if not tr then continue end

        local dist = (tr.Position - root.Position).Magnitude
        if dist <= radius then
            -- Directional knockback away from holder
            local dir = (tr.Position - root.Position)
            dir = dir.Magnitude > 0 and dir.Unit or Vector3.new(0, 1, 0)
            tr.AssemblyLinearVelocity = dir * force + Vector3.new(0, force * 0.4, 0)

            -- Deal damage
            local hum = target.Character and target.Character:FindFirstChildOfClass("Humanoid")
            if hum then hum:TakeDamage(CONFIG.SLAM_DAMAGE) end

            hitCount = hitCount + 1
        end
    end

    -- Fire slam event to all clients for VFX
    for _, p in Players:GetPlayers() do
        RE.RoyalSlam:FireClient(p, "SLAM", player, root.Position, radius)
    end

    if hitCount > 0 then
        awardCoins(player, CONFIG.COIN_REWARDS.SLAM_HIT * hitCount,
            "Royal Slam ×" .. hitCount .. "!")
        -- If 4+ players hit in one slam, trigger coin shower
        if hitCount >= 4 then
            Bindables.CoinShower:Fire(player)
        end
    end

    announce("⚔️ " .. player.Name .. " unleashes a ROYAL SLAM!")
end)

-------------------------------------------------
-- DAMAGE TRACKING (drop on burst damage + shield)
-------------------------------------------------
Players.PlayerAdded:Connect(function(player)
    player.CharacterAdded:Connect(function(char)
        State.recentDamage[player] = { total = 0, windowStart = tick() }

        local hum    = char:WaitForChild("Humanoid")
        local prevHP = hum.MaxHealth

        hum.HealthChanged:Connect(function(newHP)
            if State.holder ~= player then
                prevHP = newHP
                return
            end

            -- FIX: LuckyShield absorbs one drop trigger
            if player:GetAttribute("ShieldActive") then
                player:SetAttribute("ShieldActive", false)
                prevHP = newHP
                announce("🛡️ " .. player.Name .. "'s shield absorbed the hit!")
                return
            end

            local dmg = math.max(0, prevHP - newHP)
            prevHP = newHP

            local rec = State.recentDamage[player]
            if tick() - rec.windowStart > CONFIG.DROP_DAMAGE_WINDOW then
                rec.total       = 0
                rec.windowStart = tick()
            end
            rec.total = rec.total + dmg

            if rec.total / hum.MaxHealth >= CONFIG.DROP_DAMAGE_THRESH then
                rec.total = 0
                dropCrown(player)
            end
        end)
    end)
end)

Players.PlayerRemoving:Connect(function(player)
    if State.holder == player then dropCrown(player) end
    State.recentDamage[player]  = nil
    State.holdTotals[player]    = nil
    State.slamCooldowns[player.UserId] = nil
end)

-------------------------------------------------
-- PROXIMITY PICKUP LOOP
-------------------------------------------------
RunService.Heartbeat:Connect(function()
    if not State.crownPart or not State.crownPart.Parent then return end
    if not State.isFree then return end
    if tick() < State.freeUntil then return end

    for _, player in Players:GetPlayers() do
        local root = getRoot(player)
        if root then
            local dist = (root.Position - State.crownPart.Position).Magnitude
            if dist < CONFIG.PROXIMITY_PICKUP_DIST then
                attachCrown(player)
                break
            end
        end
    end
end)

-------------------------------------------------
-- CORRUPTION & STAGE LOOP
-------------------------------------------------
RunService.Heartbeat:Connect(function(dt)
    if not State.roundActive then return end
    if not State.holder then return end

    local root = getRoot(State.holder)
    if not root then return end

    local held     = tick() - State.holdStart
    local newStage = 1
    for i, stage in ipairs(CONFIG.STAGES) do
        if held >= stage.time then newStage = i end
    end

    -- Stage transition
    if newStage ~= State.stageIndex then
        State.stageIndex = newStage
        local stage = CONFIG.STAGES[newStage]

        local hum = getHumanoid(State.holder)
        if hum then hum.WalkSpeed = 16 * stage.speedMult end

        setCrownVisuals(newStage)

        if stage.announcement then
            announce(stage.announcement:gsub("{name}", State.holder.Name))
        end

        for _, p in Players:GetPlayers() do
            RE.StageChanged:FireClient(p, State.holder, newStage)
            RE.CorruptionStageChanged:FireClient(p, newStage, math.min(held / 120, 1))
        end
        Bindables.StageChanged:Fire(State.holder, newStage)

        -- Stage 3+: hint that the holder can slam back
        if newStage == 3 then
            RE.RoyalSlam:FireClient(State.holder, "UNLOCK",
                "👑 You can now use ROYAL SLAM to fight back! Press [F]")
        end
    end

    -- Stage 3+ auto AOE shockwave every 20s (passive, different from Royal Slam)
    if State.stageIndex >= 3 then
        State.stageAOETimer = State.stageAOETimer + dt
        if State.stageAOETimer >= 20 then
            State.stageAOETimer = 0
            for _, p in Players:GetPlayers() do
                if p ~= State.holder then
                    local pr = getRoot(p)
                    if pr then
                        local dist = (pr.Position - root.Position).Magnitude
                        if dist < 25 then
                            pr.AssemblyLinearVelocity =
                                (pr.Position - root.Position).Unit * 40
                                + Vector3.new(0, 20, 0)
                        end
                    end
                end
            end
            announce("💀 " .. State.holder.Name .. "'s corruption PULSES outward!")
        end
    end

    -- Hide/boo detection
    local moved = (root.Position - State.lastPos).Magnitude
    if moved < 2 then
        State.hideTimer = State.hideTimer + dt
        if State.hideTimer >= CONFIG.HIDE_BOO_TIME then
            for _, p in Players:GetPlayers() do
                RE.CrowdEvent:FireClient(p, "BOO", State.holder)
            end
        end
        if State.hideTimer >= CONFIG.HIDE_HAZARD_TIME then
            announce("🏟️ THE CROWD DEMANDS ACTION. A hazard spawns near " .. State.holder.Name .. "!")
            -- Spawn a random power-up right next to the hiding holder as a hazard
            local hazardPart = Instance.new("Part")
            hazardPart.Size     = Vector3.new(3, 3, 3)
            hazardPart.Shape    = Enum.PartType.Ball
            hazardPart.Color    = Color3.fromRGB(255, 60, 60)
            hazardPart.Material = Enum.Material.Neon
            hazardPart.CFrame   = CFrame.new(root.Position + Vector3.new(math.random(-6,6), 2, math.random(-6,6)))
            hazardPart.Anchored = true
            hazardPart.Parent   = workspace
            hazardPart.Touched:Connect(function(hit)
                local p = Players:GetPlayerFromCharacter(hit.Parent)
                if p then
                    local h = p.Character and p.Character:FindFirstChildOfClass("Humanoid")
                    if h then h:TakeDamage(20) end
                    hazardPart:Destroy()
                end
            end)
            game:GetService("Debris"):AddItem(hazardPart, 8)
            State.hideTimer = 0
        end
    else
        State.hideTimer = 0
    end
    State.lastPos = root.Position
end)

-------------------------------------------------
-- ROUND LOOP
-- FIX: replaced task.wait(1) drift with tick()-based 0.25s poll
-------------------------------------------------
local function startRound()
    State.roundActive   = true
    State.roundEnd      = tick() + CONFIG.ROUND_LENGTH
    State.holdTotals    = {}
    State.holder        = nil
    State.stageIndex    = 1
    State.stageAOETimer = 0

    for _, p in Players:GetPlayers() do
        local hum = getHumanoid(p)
        if hum then hum.WalkSpeed = 16 end
        awardCoins(p, CONFIG.COIN_REWARDS.PARTICIPATE, "Participation")
    end

    announce("🏟️ A new round begins! The Crown drops in " .. CONFIG.CROWN_SPAWN_DELAY .. " seconds!")
    task.wait(CONFIG.CROWN_SPAWN_DELAY)
    buildCrownPart()

    local final30Fired   = false
    local lastTimerSent  = -1

    while State.roundActive and tick() < State.roundEnd do
        local remaining = math.ceil(State.roundEnd - tick())

        -- Only fire timer update when the second actually changes (saves bandwidth)
        if remaining ~= lastTimerSent then
            lastTimerSent = remaining
            for _, p in Players:GetPlayers() do
                RE.UpdateTimer:FireClient(p, remaining)
            end
        end

        -- Stage 5 instant win check
        if State.stageIndex == 5 and State.holder then
            announce("🔥 " .. State.holder.Name .. " reaches TYRANT — INSTANT WIN!")
            break
        end

        -- Final 30
        if remaining <= 30 and not final30Fired then
            final30Fired = true
            Bindables.Final30:Fire()
            announce("⏰ FINAL 30 SECONDS. Power-ups double!")
            for _, p in Players:GetPlayers() do
                RE.CrowdEvent:FireClient(p, "FINAL30")
            end
        end

        -- Final 10 silence
        if remaining == 10 then
            for _, p in Players:GetPlayers() do
                RE.CrowdEvent:FireClient(p, "SILENCE")
            end
        end

        task.wait(0.25)  -- FIX: was task.wait(1) causing timer drift
    end

    -- Finalise hold totals for current holder
    State.roundActive = false
    if State.holder then
        local held = tick() - State.holdStart
        State.holdTotals[State.holder] = (State.holdTotals[State.holder] or 0) + held
    end

    -- Find winner (most total hold time)
    local winner, best = nil, 0
    for player, total in pairs(State.holdTotals) do
        if total > best and player.Parent then
            best   = total
            winner = player
        end
    end

    -- Build podium
    local sorted = {}
    for player, total in pairs(State.holdTotals) do
        if player.Parent then
            table.insert(sorted, { Name = player.Name, HoldTime = math.floor(total) })
        end
    end
    table.sort(sorted, function(a, b) return a.HoldTime > b.HoldTime end)

    local podium = {}
    for i = 1, 3 do podium[i] = sorted[i] end

    if winner then
        awardCoins(winner, CONFIG.COIN_REWARDS.WIN_ROUND, "Round Win!")

        -- FIX: increment totalWins via attribute signal (DataService picks this up)
        winner:SetAttribute("WinsThisSession", (winner:GetAttribute("WinsThisSession") or 0) + 1)

        for _, p in Players:GetPlayers() do
            RE.RoundEnd:FireClient(p, winner.Name, podium, sorted,
                CONFIG.COIN_REWARDS.WIN_ROUND, 50, 100, 5, false)
        end
        Bindables.RoundEnd:Fire(winner)
        announce("🏆 " .. winner.Name .. " wins with " .. math.floor(best) .. "s held!")
    else
        announce("🏟️ No winner this round — the Crown was never claimed!")
        for _, p in Players:GetPlayers() do
            RE.RoundEnd:FireClient(p, "Nobody", podium, sorted, 0, 0, 0, 0, false)
        end
    end

    -- Cleanup
    if State.crownPart and State.crownPart.Parent then
        State.crownPart:Destroy()
    end
    State.crownPart = nil
    State.holder    = nil

    task.wait(15)
    startRound()
end

task.delay(3, startRound)

print("[CrownChaos] CrownService loaded.")
