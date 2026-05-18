-- ThroneSit | ServerScriptService
-- ProximityPrompt on throne at (0,73.5,98).
-- Requires Robux gamepass ownership. Broadcasts a royal sit event to all clients.

local Players              = game:GetService("Players")
local ReplicatedStorage    = game:GetService("ReplicatedStorage")
local MarketplaceService   = game:GetService("MarketplaceService")

local Remotes = ReplicatedStorage:WaitForChild("Remotes")
local RE = {
    ThroneSitResult = Remotes:WaitForChild("ThroneSitResult"),
}

-- Replace 0 with the real gamepass ID from Creator Hub
local THRONE_SIT_GAMEPASS_ID = 0
local SIT_COOLDOWN           = 30  -- seconds between sits per player

local sitCooldowns = {}  -- userId → tick

-------------------------------------------------
-- GAMEPASS OWNERSHIP CACHE  (per session)
-------------------------------------------------
local ownershipCache = {}

local function ownsGamepass(player)
    local uid = player.UserId
    if ownershipCache[uid] ~= nil then return ownershipCache[uid] end
    if THRONE_SIT_GAMEPASS_ID == 0 then
        -- Placeholder: allow all during development
        ownershipCache[uid] = true
        return true
    end
    local ok, result = pcall(function()
        return MarketplaceService:UserOwnsGamePassAsync(uid, THRONE_SIT_GAMEPASS_ID)
    end)
    ownershipCache[uid] = ok and result or false
    return ownershipCache[uid]
end

-------------------------------------------------
-- THRONE SETUP
-------------------------------------------------
task.spawn(function()
    task.wait(12)

    -- Find throne in workspace (WorkspaceSetup names it RAL_Throne_MSH)
    local throne = workspace:FindFirstChild("RAL_Throne_MSH", true)
    if not throne then
        -- Placeholder part if mesh not yet placed
        throne = Instance.new("Part")
        throne.Name       = "RAL_Throne_Placeholder"
        throne.Size       = Vector3.new(8, 5, 8)
        throne.CFrame     = CFrame.new(0, 73.5, 98)
        throne.Anchored   = true
        throne.CanCollide = false
        throne.Color      = Color3.fromRGB(80, 64, 24)
        throne.Material   = Enum.Material.SmoothPlastic
        throne.Parent     = workspace
    end

    -- Gold glow under throne
    local light = throne:FindFirstChildOfClass("PointLight")
    if not light then
        light = Instance.new("PointLight")
        light.Brightness = 1.5
        light.Range      = 20
        light.Color      = Color3.fromRGB(199, 166, 90)
        light.Parent     = throne
    end

    -- Robux badge label
    local bb = Instance.new("BillboardGui")
    bb.Size        = UDim2.new(0, 200, 0, 50)
    bb.StudsOffset = Vector3.new(0, 6, 0)
    bb.AlwaysOnTop = false
    bb.Parent      = throne

    local lbl = Instance.new("TextLabel")
    lbl.Size                   = UDim2.fromScale(1, 1)
    lbl.BackgroundTransparency = 1
    lbl.Text                   = "👑 ROYAL THRONE\n✨ Exclusive"
    lbl.TextColor3             = Color3.fromRGB(255, 215, 0)
    lbl.Font                   = Enum.Font.GothamBold
    lbl.TextScaled             = true
    lbl.TextStrokeTransparency = 0.3
    lbl.Parent                 = bb

    -- ProximityPrompt
    local prompt = Instance.new("ProximityPrompt")
    prompt.ObjectText              = "Royal Throne"
    prompt.ActionText              = "Sit  [Exclusive]"
    prompt.KeyboardKeyCode         = Enum.KeyCode.E
    prompt.MaxActivationDistance   = 8
    prompt.HoldDuration            = 0.5
    prompt.RequiresLineOfSight     = false
    prompt.Parent                  = throne

    prompt.Triggered:Connect(function(player)
        -- Cooldown check
        local uid = player.UserId
        if sitCooldowns[uid] and tick() - sitCooldowns[uid] < SIT_COOLDOWN then
            return
        end

        -- Gamepass check
        if not ownsGamepass(player) then
            -- Prompt purchase
            if THRONE_SIT_GAMEPASS_ID ~= 0 then
                MarketplaceService:PromptGamePassPurchase(player, THRONE_SIT_GAMEPASS_ID)
            end
            return
        end

        sitCooldowns[uid] = tick()

        -- Teleport player to sit position
        local char = player.Character
        if char then
            local root = char:FindFirstChild("HumanoidRootPart")
            if root then
                root.CFrame = CFrame.new(0, 75.5, 96) * CFrame.Angles(0, math.pi, 0)
            end
            -- Apply sit state
            local hum = char:FindFirstChildOfClass("Humanoid")
            if hum then
                hum.Sit = true
            end
        end

        -- Broadcast to all: crown holder sits on throne
        for _, p in Players:GetPlayers() do
            RE.ThroneSitResult:FireClient(p, player.Name, player.UserId)
        end
    end)

    -- Handle gamepass purchase events
    MarketplaceService.PromptGamePassPurchaseFinished:Connect(function(player, gpId, purchased)
        if gpId == THRONE_SIT_GAMEPASS_ID and purchased then
            ownershipCache[player.UserId] = true
        end
    end)
end)

-- Clear cache on leave
Players.PlayerRemoving:Connect(function(player)
    ownershipCache[player.UserId] = nil
    sitCooldowns[player.UserId] = nil
end)

print("[CrownChaos] ThroneSit loaded. Gamepass ID: " .. THRONE_SIT_GAMEPASS_ID)
