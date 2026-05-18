-- TrophySystem | ServerScriptService
-- Tracks per-round steals and hold time.
-- On round end, updates the kill feed trophy display on the south gate archway
-- and fires TrophyUpdate to all clients.

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Remotes   = ReplicatedStorage:WaitForChild("Remotes")
local Bindables = {
    CrownPickup = ReplicatedStorage:WaitForChild("CrownPickupBindable"),
    RoundEnd    = ReplicatedStorage:WaitForChild("RoundEndBindable"),
}

local RE = {
    TrophyUpdate = Remotes:WaitForChild("TrophyUpdate"),
}

-------------------------------------------------
-- ROUND STAT TRACKING
-------------------------------------------------
local steals    = {}   -- userId → count
local holdTime  = {}   -- userId → seconds
local holdStart = {}   -- userId → tick
local lastHolder= nil

local function getOrZero(t, uid) return t[uid] or 0 end

Bindables.CrownPickup.Event:Connect(function(player)
    -- Stop previous holder's timer
    if lastHolder and lastHolder.Parent then
        local uid = lastHolder.UserId
        if holdStart[uid] then
            holdTime[uid] = getOrZero(holdTime, uid) + (tick() - holdStart[uid])
            holdStart[uid] = nil
        end
    end

    -- Credit steal to new holder (not on first pickup)
    if lastHolder and lastHolder ~= player then
        local uid = player.UserId
        steals[uid] = getOrZero(steals, uid) + 1
    end

    -- Start new holder's timer
    holdStart[player.UserId] = tick()
    lastHolder = player
end)

-------------------------------------------------
-- TROPHY WALL SETUP
-- South gate archway at (0,74,-198) — horizontal strip on archway face
-------------------------------------------------
local trophyWallSG = nil

local function buildTrophyWall()
    task.wait(14)

    local archway = workspace:FindFirstChild("RAL_ArenaGate_MSH", true)
    local wallPart
    if archway then
        wallPart = archway
    else
        wallPart = Instance.new("Part")
        wallPart.Name        = "RAL_TrophyStrip"
        wallPart.Size        = Vector3.new(0.3, 6, 60)
        wallPart.CFrame      = CFrame.new(0, 76, -198)
        wallPart.Anchored    = true
        wallPart.CanCollide  = false
        wallPart.Transparency= 0.98
        wallPart.Parent      = workspace
    end

    local sg = Instance.new("SurfaceGui")
    sg.Name          = "TrophyDisplaySG"
    sg.Face          = Enum.NormalId.Front
    sg.SizingMode    = Enum.SurfaceGuiSizingMode.PixelsPerStud
    sg.PixelsPerStud = 30
    sg.Parent        = wallPart

    -- Header
    local header = Instance.new("TextLabel")
    header.Size                   = UDim2.new(1, 0, 0.3, 0)
    header.BackgroundTransparency = 1
    header.Text                   = "🏆  ROUND TROPHIES"
    header.TextColor3             = Color3.fromRGB(255, 215, 0)
    header.Font                   = Enum.Font.GothamBold
    header.TextScaled             = true
    header.Parent                 = sg

    local topStealsLabel = Instance.new("TextLabel")
    topStealsLabel.Name                  = "TopSteals"
    topStealsLabel.Size                  = UDim2.new(0.5, 0, 0.35, 0)
    topStealsLabel.Position              = UDim2.new(0, 0, 0.32, 0)
    topStealsLabel.BackgroundTransparency= 1
    topStealsLabel.Text                  = "⚔️ Top Thief\n—"
    topStealsLabel.TextColor3            = Color3.fromRGB(220, 80, 80)
    topStealsLabel.Font                  = Enum.Font.Gotham
    topStealsLabel.TextScaled            = true
    topStealsLabel.Parent                = sg

    local topHoldLabel = Instance.new("TextLabel")
    topHoldLabel.Name                  = "TopHold"
    topHoldLabel.Size                  = UDim2.new(0.5, 0, 0.35, 0)
    topHoldLabel.Position              = UDim2.new(0.5, 0, 0.32, 0)
    topHoldLabel.BackgroundTransparency= 1
    topHoldLabel.Text                  = "👑 Longest Hold\n—"
    topHoldLabel.TextColor3            = Color3.fromRGB(255, 215, 0)
    topHoldLabel.Font                  = Enum.Font.Gotham
    topHoldLabel.TextScaled            = true
    topHoldLabel.Parent                = sg

    trophyWallSG = sg
end

task.spawn(buildTrophyWall)

-------------------------------------------------
-- ROUND END → COMPUTE TROPHIES
-------------------------------------------------
Bindables.RoundEnd.Event:Connect(function(_winner)
    -- Flush current holder's time
    if lastHolder and lastHolder.Parent then
        local uid = lastHolder.UserId
        if holdStart[uid] then
            holdTime[uid] = getOrZero(holdTime, uid) + (tick() - holdStart[uid])
        end
    end

    -- Find top stealer
    local topStealer, topSteals = nil, 0
    for uid, count in pairs(steals) do
        if count > topSteals then
            topSteals   = count
            topStealer  = Players:GetPlayerByUserId(uid)
        end
    end

    -- Find longest holder
    local topHolder, topHold = nil, 0
    for uid, secs in pairs(holdTime) do
        if secs > topHold then
            topHold   = secs
            topHolder = Players:GetPlayerByUserId(uid)
        end
    end

    local trophyData = {
        topStealer = topStealer and topStealer.Name or nil,
        topSteals  = topSteals,
        topHolder  = topHolder  and topHolder.Name  or nil,
        topHold    = math.floor(topHold),
    }

    -- Update wall
    if trophyWallSG then
        local ts = trophyWallSG:FindFirstChild("TopSteals")
        local th = trophyWallSG:FindFirstChild("TopHold")
        if ts then
            ts.Text = topStealer
                and string.format("⚔️ Top Thief\n%s (%dx)", topStealer.Name, topSteals)
                or  "⚔️ Top Thief\n—"
        end
        if th then
            th.Text = topHolder
                and string.format("👑 Longest Hold\n%s (%ds)", topHolder.Name, math.floor(topHold))
                or  "👑 Longest Hold\n—"
        end
    end

    -- Broadcast to clients
    for _, p in Players:GetPlayers() do
        RE.TrophyUpdate:FireClient(p, trophyData)
    end

    -- Reset for next round
    steals    = {}
    holdTime  = {}
    holdStart = {}
    lastHolder= nil
end)

print("[CrownChaos] TrophySystem loaded.")
