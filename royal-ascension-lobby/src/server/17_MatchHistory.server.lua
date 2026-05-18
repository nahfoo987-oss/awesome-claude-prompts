-- MatchHistory | ServerScriptService
-- Records the last 5 rounds (winner, duration, steals, kingdom winner).
-- Updates a SurfaceGui display wall in the West district.
-- Fires MatchHistoryUpdate to all clients on round end.

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local DataStoreService  = game:GetService("DataStoreService")

local Remotes   = ReplicatedStorage:WaitForChild("Remotes")
local Bindables = {
    CrownPickup = ReplicatedStorage:WaitForChild("CrownPickupBindable"),
    RoundEnd    = ReplicatedStorage:WaitForChild("RoundEndBindable"),
}

local RE = {
    MatchHistoryUpdate = Remotes:WaitForChild("MatchHistoryUpdate"),
}

local HistoryStore = DataStoreService:GetDataStore("CrownChaos_MatchHistory_v1")
local MAX_ENTRIES  = 5

-------------------------------------------------
-- IN-MEMORY HISTORY
-- Each entry: { winner, kingdom, steals, duration, timestamp }
-------------------------------------------------
local history  = {}
local roundStart= tick()
local roundSteals = 0

local function loadHistory()
    local ok, data = pcall(function()
        return HistoryStore:GetAsync("global_history")
    end)
    if ok and type(data) == "table" then
        history = data
    end
end

local function saveHistory()
    pcall(function()
        HistoryStore:SetAsync("global_history", history)
    end)
end

loadHistory()

-------------------------------------------------
-- STEAL COUNTING
-------------------------------------------------
local lastHolder = nil
Bindables.CrownPickup.Event:Connect(function(player)
    if lastHolder and lastHolder ~= player then
        roundSteals = roundSteals + 1
    end
    lastHolder = player
end)

-------------------------------------------------
-- ROUND END HANDLER
-------------------------------------------------
local function buildWallDisplay(sg)
    -- Clear existing rows
    for _, child in sg:GetChildren() do
        if child:IsA("Frame") or child:IsA("TextLabel") then child:Destroy() end
    end

    local title = Instance.new("TextLabel")
    title.Size                   = UDim2.new(1, 0, 0.12, 0)
    title.BackgroundTransparency = 1
    title.Text                   = "📜 MATCH HISTORY"
    title.TextColor3             = Color3.fromRGB(255, 215, 0)
    title.Font                   = Enum.Font.GothamBold
    title.TextScaled             = true
    title.Parent                 = sg

    if #history == 0 then
        local empty = Instance.new("TextLabel")
        empty.Size                   = UDim2.new(1, 0, 0.2, 0)
        empty.Position               = UDim2.new(0, 0, 0.15, 0)
        empty.BackgroundTransparency = 1
        empty.Text                   = "No rounds played yet"
        empty.TextColor3             = Color3.fromRGB(120, 110, 100)
        empty.Font                   = Enum.Font.Gotham
        empty.TextScaled             = true
        empty.Parent                 = sg
        return
    end

    local rowHeight = 0.82 / math.min(#history, MAX_ENTRIES)
    for i, entry in ipairs(history) do
        if i > MAX_ENTRIES then break end

        local row = Instance.new("Frame")
        row.Size                  = UDim2.new(0.96, 0, rowHeight - 0.01, 0)
        row.Position              = UDim2.new(0.02, 0, 0.14 + (i-1) * rowHeight, 0)
        row.BackgroundTransparency= 0.75
        row.BackgroundColor3      = (i == 1)
            and Color3.fromRGB(60, 50, 10)
             or Color3.fromRGB(25, 22, 30)
        row.BorderSizePixel       = 0
        row.Parent                = sg

        local corner = Instance.new("UICorner")
        corner.CornerRadius = UDim.new(0, 4)
        corner.Parent = row

        local text = Instance.new("TextLabel")
        text.Size                   = UDim2.fromScale(1, 1)
        text.BackgroundTransparency = 1
        text.Text = string.format(
            "#%d  %s  [%s]  %ds  ⚔️%d",
            i,
            entry.winner or "Unknown",
            entry.kingdom or "?",
            math.floor(entry.duration or 0),
            entry.steals or 0
        )
        text.TextColor3   = (i == 1)
            and Color3.fromRGB(255, 215, 0)
             or Color3.fromRGB(200, 190, 180)
        text.Font         = Enum.Font.Gotham
        text.TextScaled   = true
        text.TextXAlignment = Enum.TextXAlignment.Left
        text.Parent       = row
    end
end

local wallSG = nil  -- SurfaceGui reference

local function refreshWall()
    if wallSG then buildWallDisplay(wallSG) end
end

Bindables.RoundEnd.Event:Connect(function(winner)
    local entry = {
        winner    = winner and winner.Name or "No Holder",
        kingdom   = winner and winner:GetAttribute("Kingdom") or "None",
        steals    = roundSteals,
        duration  = math.floor(tick() - roundStart),
        timestamp = os.time(),
    }

    table.insert(history, 1, entry)
    while #history > MAX_ENTRIES do
        table.remove(history)
    end

    roundSteals = 0
    roundStart  = tick()
    lastHolder  = nil

    saveHistory()
    refreshWall()

    for _, p in Players:GetPlayers() do
        RE.MatchHistoryUpdate:FireClient(p, history)
    end
end)

-------------------------------------------------
-- MATCH HISTORY WALL  (East district RAL_MatchHistoryWall at (46.5,57,-18) — compact V3)
-------------------------------------------------
task.spawn(function()
    task.wait(14)

    local wallPart = workspace:FindFirstChild("RAL_MatchHistoryWall", true)
    if not wallPart then
        wallPart = Instance.new("Part")
        wallPart.Name        = "RAL_MatchHistoryWall"
        wallPart.Size        = Vector3.new(1, 8, 14)
        wallPart.CFrame      = CFrame.new(46.5, 57, -18)
        wallPart.Anchored    = true
        wallPart.CanCollide  = false
        wallPart.Color       = Color3.fromRGB(15, 16, 22)
        wallPart.Material    = Enum.Material.SmoothPlastic
        wallPart.Parent      = workspace
    end

    local sg = Instance.new("SurfaceGui")
    sg.Name          = "MatchHistorySG"
    sg.Face          = Enum.NormalId.Left
    sg.SizingMode    = Enum.SurfaceGuiSizingMode.PixelsPerStud
    sg.PixelsPerStud = 40
    sg.Parent        = wallPart

    wallSG = sg
    buildWallDisplay(sg)

    -- Also push history to any players already in game
    task.wait(1)
    for _, p in Players:GetPlayers() do
        RE.MatchHistoryUpdate:FireClient(p, history)
    end
end)

print("[CrownChaos] MatchHistory loaded.")
