-- RewardWheel | ServerScriptService
-- ProximityPrompt on wheel disc at (18,56,34) — compact V3 layout.
-- Daily cooldown per player. Server picks prize, fires result after spin delay.

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local CollectionService = game:GetService("CollectionService")
local DataStoreService  = game:GetService("DataStoreService")

local Remotes   = ReplicatedStorage:WaitForChild("Remotes")
local RE = {
    RewardWheelSpin = Remotes:WaitForChild("RewardWheelSpin"),
}

local AddCoins   = ReplicatedStorage:WaitForChild("AddCoins")
local WheelStore = DataStoreService:GetDataStore("CrownChaos_RewardWheel_v1")

local SPIN_DELAY  = 3.5   -- seconds client animates before server sends result

-------------------------------------------------
-- PRIZE TABLE  (weights sum to 100)
-------------------------------------------------
local PRIZES = {
    { label = "100 Coins",       type = "coins",     value = 100,  weight = 30 },
    { label = "250 Coins",       type = "coins",     value = 250,  weight = 25 },
    { label = "500 Coins",       type = "coins",     value = 500,  weight = 15 },
    { label = "XP Boost (2h)",   type = "xpBoost",   value = 7200, weight = 12 },
    { label = "Trail Sparks",    type = "cosmetic",  value = "trail_sparks", weight = 8 },
    { label = "Embers Trail",    type = "cosmetic",  value = "trail_embers", weight = 5 },
    { label = "Crown Toss",      type = "cosmetic",  value = "pose_toss",    weight = 3 },
    { label = "💎 JACKPOT: 1000 Coins", type = "coins", value = 1000, weight = 2 },
}

local function rollPrize()
    local roll = math.random(1, 100)
    local cumulative = 0
    for _, prize in ipairs(PRIZES) do
        cumulative = cumulative + prize.weight
        if roll <= cumulative then
            return prize
        end
    end
    return PRIZES[1]
end

-------------------------------------------------
-- COOLDOWN HELPERS
-------------------------------------------------
local function getDayKey() return math.floor(os.time() / 86400) end

local function hasSpin(player)
    local ok, val = pcall(function()
        return WheelStore:GetAsync("spin_" .. player.UserId)
    end)
    return ok and val == getDayKey()
end

local function markSpin(player)
    pcall(function()
        WheelStore:SetAsync("spin_" .. player.UserId, getDayKey())
    end)
end

-------------------------------------------------
-- WHEEL SETUP
-------------------------------------------------
task.spawn(function()
    task.wait(12)   -- wait for WorkspaceSetup

    -- Find wheel tagged part or create placeholder
    local wheelPart
    local tagged = CollectionService:GetTagged("RAL_RewardWheel")
    if #tagged > 0 then
        wheelPart = tagged[1]
    end

    if not wheelPart then
        wheelPart = Instance.new("Part")
        wheelPart.Name        = "RAL_RewardWheel_Disc"
        wheelPart.Shape       = Enum.PartType.Cylinder
        wheelPart.Size        = Vector3.new(1, 24, 24)
        wheelPart.CFrame      = CFrame.new(18, 56, 34) * CFrame.Angles(0, math.pi / 2, 0)
        wheelPart.Anchored    = true
        wheelPart.CanCollide  = false
        wheelPart.Color       = Color3.fromRGB(120, 40, 200)
        wheelPart.Material    = Enum.Material.Neon
        wheelPart.Parent      = workspace
        CollectionService:AddTag(wheelPart, "RAL_RewardWheel")
    end

    -- Glowing pedestal under wheel
    local pedestal = Instance.new("Part")
    pedestal.Name       = "RAL_WheelPedestal"
    pedestal.Size       = Vector3.new(6, 2, 6)
    pedestal.CFrame     = CFrame.new(18, 53.5, 34)
    pedestal.Anchored   = true
    pedestal.CanCollide = true
    pedestal.Color      = Color3.fromRGB(25, 20, 40)
    pedestal.Material   = Enum.Material.SmoothPlastic
    pedestal.Parent     = workspace

    local light = Instance.new("PointLight")
    light.Brightness = 2
    light.Range      = 16
    light.Color      = Color3.fromRGB(140, 80, 255)
    light.Parent     = pedestal

    -- ProximityPrompt
    local prompt = Instance.new("ProximityPrompt")
    prompt.ObjectText    = "Reward Wheel"
    prompt.ActionText    = "Spin (Once Daily)"
    prompt.KeyboardKeyCode = Enum.KeyCode.E
    prompt.MaxActivationDistance = 10
    prompt.HoldDuration  = 0.8
    prompt.Parent        = pedestal

    prompt.Triggered:Connect(function(player)
        if hasSpin(player) then
            RE.RewardWheelSpin:FireClient(player, nil, "COOLDOWN",
                "Come back tomorrow for your next spin!")
            return
        end

        -- Tell client to start spin animation (random prize index for anim)
        local prize = rollPrize()
        RE.RewardWheelSpin:FireClient(player, "START", nil, nil)

        -- After spin animation completes, send actual result
        task.delay(SPIN_DELAY, function()
            if not player.Parent then return end

            markSpin(player)

            if prize.type == "coins" then
                pcall(function() AddCoins:Invoke(player, prize.value) end)
            elseif prize.type == "xpBoost" then
                player:SetAttribute("XPBoostExpiry", os.time() + prize.value)
            elseif prize.type == "cosmetic" then
                local cosmetics = player:GetAttribute("Cosmetics") or ""
                if not cosmetics:find(prize.value) then
                    player:SetAttribute("Cosmetics", cosmetics .. "," .. prize.value)
                    Remotes:WaitForChild("CosmeticUnlocked"):FireClient(player, prize.value)
                end
            end

            RE.RewardWheelSpin:FireClient(player, "RESULT", prize.label, prize.type)
        end)
    end)
end)

print("[CrownChaos] RewardWheel loaded.")
