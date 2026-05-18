-- KingdomWars | ServerScriptService
-- Tracks Iron/Gold/Stone/Ash team scores across rounds.
-- Crown holder earns 1 pt/s for their kingdom. Round winner earns +50 bonus.
-- Updates the leaderboard wall SurfaceGui in the West district.

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService        = game:GetService("RunService")

local Remotes    = ReplicatedStorage:WaitForChild("Remotes")
local Bindables  = {
    CrownPickup = ReplicatedStorage:WaitForChild("CrownPickupBindable"),
    RoundEnd    = ReplicatedStorage:WaitForChild("RoundEndBindable"),
}

local RE = {
    KingdomScoreUpdate = Remotes:WaitForChild("KingdomScoreUpdate"),
}

-------------------------------------------------
-- STATE
-------------------------------------------------
local KINGDOMS = { "Iron", "Gold", "Stone", "Ash" }

local KINGDOM_COLORS = {
    Iron  = Color3.fromRGB(160, 160, 175),
    Gold  = Color3.fromRGB(220, 180, 40),
    Stone = Color3.fromRGB(130, 120, 110),
    Ash   = Color3.fromRGB(90,  80,  100),
}

local scores = { Iron = 0, Gold = 0, Stone = 0, Ash = 0 }
local currentHolder = nil   -- Player object
local tickAccum  = 0
local TICK_INTERVAL = 1     -- award 1 pt per second

-------------------------------------------------
-- LEADERBOARD WALL BUILD
-- East district wall RAL_LeaderboardWall at (46.5,58,18) — compact V3 layout
-------------------------------------------------
local wallPart = nil
task.spawn(function()
    -- Wait for WorkspaceSetup to build geometry
    task.wait(12)
    wallPart = workspace:FindFirstChild("RAL_LeaderboardWall", true)
    if not wallPart then
        -- Fallback backing part matching V3 east wall position
        wallPart = Instance.new("Part")
        wallPart.Name        = "RAL_KingdomBoard"
        wallPart.Size        = Vector3.new(1, 10, 18)
        wallPart.CFrame      = CFrame.new(46.5, 58, 18)
        wallPart.Anchored    = true
        wallPart.CanCollide  = false
        wallPart.CastShadow  = false
        wallPart.Color       = Color3.fromRGB(15, 16, 22)
        wallPart.Material    = Enum.Material.SmoothPlastic
        wallPart.Parent      = workspace
    end

    -- Clear existing SurfaceGui if any
    for _, child in wallPart:GetChildren() do
        if child:IsA("SurfaceGui") then child:Destroy() end
    end

    local sg = Instance.new("SurfaceGui")
    sg.Name        = "KingdomBoard"
    sg.Face        = Enum.NormalId.Left
    sg.SizingMode  = Enum.SurfaceGuiSizingMode.PixelsPerStud
    sg.PixelsPerStud = 40
    sg.Parent      = wallPart

    local title = Instance.new("TextLabel")
    title.Size                   = UDim2.new(1, 0, 0.18, 0)
    title.BackgroundTransparency = 1
    title.Text                   = "⚔️  KINGDOM WARS"
    title.TextColor3             = Color3.fromRGB(255, 215, 0)
    title.Font                   = Enum.Font.GothamBold
    title.TextScaled             = true
    title.Parent                 = sg

    for i, kingdom in ipairs(KINGDOMS) do
        local row = Instance.new("Frame")
        row.Name                  = "Row_" .. kingdom
        row.Size                  = UDim2.new(1, 0, 0.18, 0)
        row.Position              = UDim2.new(0, 0, 0.18 + (i-1) * 0.18, 0)
        row.BackgroundTransparency= 0.85
        row.BackgroundColor3      = KINGDOM_COLORS[kingdom]
        row.BorderSizePixel       = 0
        row.Parent                = sg

        local nameLabel = Instance.new("TextLabel")
        nameLabel.Name                  = "KingdomName"
        nameLabel.Size                  = UDim2.new(0.55, 0, 1, 0)
        nameLabel.BackgroundTransparency= 1
        nameLabel.Text                  = kingdom
        nameLabel.TextColor3            = KINGDOM_COLORS[kingdom]
        nameLabel.Font                  = Enum.Font.GothamBold
        nameLabel.TextScaled            = true
        nameLabel.TextXAlignment        = Enum.TextXAlignment.Left
        nameLabel.Parent                = row

        local scoreLabel = Instance.new("TextLabel")
        scoreLabel.Name                  = "Score"
        scoreLabel.Size                  = UDim2.new(0.45, 0, 1, 0)
        scoreLabel.Position              = UDim2.new(0.55, 0, 0, 0)
        scoreLabel.BackgroundTransparency= 1
        scoreLabel.Text                  = "0"
        scoreLabel.TextColor3            = Color3.new(1,1,1)
        scoreLabel.Font                  = Enum.Font.GothamBold
        scoreLabel.TextScaled            = true
        scoreLabel.TextXAlignment        = Enum.TextXAlignment.Right
        scoreLabel.Parent                = row
    end
end)

local function refreshWall()
    if not wallPart then return end
    local sg = wallPart:FindFirstChild("KingdomBoard")
    if not sg then return end
    -- Sort kingdoms by score
    local sorted = {}
    for _, k in ipairs(KINGDOMS) do table.insert(sorted, { name = k, score = scores[k] }) end
    table.sort(sorted, function(a, b) return a.score > b.score end)

    for i, entry in ipairs(sorted) do
        local row = sg:FindFirstChild("Row_" .. entry.name)
        if row then
            local sl = row:FindFirstChild("Score")
            if sl then sl.Text = tostring(entry.score) end
            row.Position = UDim2.new(0, 0, 0.18 + (i-1) * 0.18, 0)
        end
    end
end

local function broadcastScores()
    local data = {}
    for _, k in ipairs(KINGDOMS) do data[k] = scores[k] end
    for _, p in Players:GetPlayers() do
        RE.KingdomScoreUpdate:FireClient(p, data)
    end
    refreshWall()
end

-------------------------------------------------
-- CROWN TRACKING
-------------------------------------------------
Bindables.CrownPickup.Event:Connect(function(player)
    currentHolder = player
end)

Bindables.RoundEnd.Event:Connect(function(winner)
    currentHolder = nil
    if winner then
        local kingdom = winner:GetAttribute("Kingdom")
        if kingdom and scores[kingdom] then
            scores[kingdom] = scores[kingdom] + 50
        end
    end
    broadcastScores()
end)

-- Tick: award 1pt/s to holder's kingdom
RunService.Heartbeat:Connect(function(dt)
    tickAccum = tickAccum + dt
    if tickAccum < TICK_INTERVAL then return end
    tickAccum = tickAccum - TICK_INTERVAL

    if currentHolder and currentHolder.Parent then
        local kingdom = currentHolder:GetAttribute("Kingdom")
        if kingdom and scores[kingdom] then
            scores[kingdom] = scores[kingdom] + 1
        end
    end

    broadcastScores()
end)

-- Broadcast every 30s even if nothing changed (new players)
Players.PlayerAdded:Connect(function(player)
    task.wait(2)
    local data = {}
    for _, k in ipairs(KINGDOMS) do data[k] = scores[k] end
    RE.KingdomScoreUpdate:FireClient(player, data)
end)

print("[CrownChaos] KingdomWars loaded.")
