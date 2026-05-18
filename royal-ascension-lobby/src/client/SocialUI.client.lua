-- SocialUI | StarterPlayerScripts > LocalScript
-- Handles: Kingdom score overlay, Bandit mode HUD, Guild create/join UI,
--          Throne sit broadcast, Reward wheel result toast, Challenge toasts.

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService      = game:GetService("TweenService")
local UserInputService  = game:GetService("UserInputService")

local localPlayer = Players.LocalPlayer
local playerGui   = localPlayer:WaitForChild("PlayerGui")
local Remotes     = ReplicatedStorage:WaitForChild("Remotes")

local GOLD   = Color3.fromRGB(255, 215, 0)
local RED    = Color3.fromRGB(220, 50, 50)
local PURPLE = Color3.fromRGB(80, 0, 160)
local WHITE  = Color3.new(1, 1, 1)
local BG     = Color3.fromRGB(12, 8, 2)

-------------------------------------------------
-- SCREEN
-------------------------------------------------
local screen = Instance.new("ScreenGui")
screen.Name           = "SocialUI"
screen.ResetOnSpawn   = false
screen.IgnoreGuiInset = true
screen.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
screen.Parent         = playerGui

-------------------------------------------------
-- KINGDOM SCORE BAR (top-right corner)
-------------------------------------------------
local kingdomFrame = Instance.new("Frame")
kingdomFrame.Size                   = UDim2.new(0, 200, 0, 90)
kingdomFrame.Position               = UDim2.new(1, -210, 0, 10)
kingdomFrame.BackgroundColor3       = BG
kingdomFrame.BackgroundTransparency = 0.3
kingdomFrame.BorderSizePixel        = 0
kingdomFrame.Parent                 = screen

local kCorner = Instance.new("UICorner")
kCorner.CornerRadius = UDim.new(0, 8)
kCorner.Parent = kingdomFrame

local kTitle = Instance.new("TextLabel")
kTitle.Size                   = UDim2.new(1, 0, 0.22, 0)
kTitle.BackgroundTransparency = 1
kTitle.Text                   = "⚔️ KINGDOM WARS"
kTitle.TextColor3             = GOLD
kTitle.Font                   = Enum.Font.GothamBold
kTitle.TextSize               = 11
kTitle.Parent                 = kingdomFrame

local KINGDOMS = { "Iron", "Gold", "Stone", "Ash" }
local KINGDOM_COLORS = {
    Iron  = Color3.fromRGB(160, 160, 175),
    Gold  = Color3.fromRGB(220, 180, 40),
    Stone = Color3.fromRGB(130, 120, 110),
    Ash   = Color3.fromRGB(90, 80, 100),
}

local kingdomRows = {}
for i, kingdom in ipairs(KINGDOMS) do
    local row = Instance.new("TextLabel")
    row.Size                   = UDim2.new(1, -8, 0.19, 0)
    row.Position               = UDim2.new(0, 4, 0.22 + (i-1) * 0.19, 0)
    row.BackgroundTransparency = 1
    row.Text                   = kingdom .. ": 0"
    row.TextColor3             = KINGDOM_COLORS[kingdom]
    row.Font                   = Enum.Font.Gotham
    row.TextSize               = 11
    row.TextXAlignment         = Enum.TextXAlignment.Left
    row.Parent                 = kingdomFrame
    kingdomRows[kingdom] = row
end

Remotes:WaitForChild("KingdomScoreUpdate").OnClientEvent:Connect(function(data)
    -- Sort by score
    local sorted = {}
    for k, v in pairs(data) do table.insert(sorted, { name = k, score = v }) end
    table.sort(sorted, function(a, b) return a.score > b.score end)

    for i, entry in ipairs(sorted) do
        local row = kingdomRows[entry.name]
        if row then
            local medal = (i == 1) and "🥇" or (i == 2) and "🥈" or (i == 3) and "🥉" or "  "
            row.Text     = medal .. " " .. entry.name .. ": " .. entry.score
            row.Position = UDim2.new(0, 4, 0.22 + (i-1) * 0.19, 0)
        end
    end
end)

-------------------------------------------------
-- BANDIT MODE HUD  (center screen flash + bottom bar)
-------------------------------------------------
local banditOverlay = Instance.new("Frame")
banditOverlay.Size                   = UDim2.new(1, 0, 1, 0)
banditOverlay.BackgroundColor3       = RED
banditOverlay.BackgroundTransparency = 1
banditOverlay.BorderSizePixel        = 0
banditOverlay.Visible                = false
banditOverlay.Parent                 = screen

local banditBar = Instance.new("Frame")
banditBar.Size                   = UDim2.new(0, 360, 0, 60)
banditBar.Position               = UDim2.new(0.5, -180, 0, 80)
banditBar.BackgroundColor3       = Color3.fromRGB(140, 20, 20)
banditBar.BackgroundTransparency = 0.1
banditBar.BorderSizePixel        = 0
banditBar.Visible                = false
banditBar.Parent                 = screen

local bBarCorner = Instance.new("UICorner")
bBarCorner.CornerRadius = UDim.new(0, 10)
bBarCorner.Parent = banditBar

local banditLabel = Instance.new("TextLabel")
banditLabel.Size                   = UDim2.fromScale(1, 0.5)
banditLabel.BackgroundTransparency = 1
banditLabel.Text                   = "⚔️  YOU ARE A BANDIT — RECLAIM THE CROWN!"
banditLabel.TextColor3             = WHITE
banditLabel.Font                   = Enum.Font.GothamBold
banditLabel.TextSize               = 14
banditLabel.Parent                 = banditBar

local banditTimer = Instance.new("TextLabel")
banditTimer.Size                   = UDim2.new(1, 0, 0.5, 0)
banditTimer.Position               = UDim2.new(0, 0, 0.5, 0)
banditTimer.BackgroundTransparency = 1
banditTimer.Text                   = "60s remaining"
banditTimer.TextColor3             = Color3.fromRGB(255, 150, 150)
banditTimer.Font                   = Enum.Font.Gotham
banditTimer.TextSize               = 12
banditTimer.Parent                 = banditBar

local banditTimeLeft = 0
local banditThread   = nil

Remotes:WaitForChild("BanditModeStart").OnClientEvent:Connect(function(duration)
    banditTimeLeft = duration
    banditBar.Visible = true

    -- Red edge flash
    banditOverlay.Visible                = true
    banditOverlay.BackgroundTransparency = 0.85
    TweenService:Create(banditOverlay,
        TweenInfo.new(1.5, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
        { BackgroundTransparency = 1 }
    ):Play()
    task.delay(1.5, function() banditOverlay.Visible = false end)

    if banditThread then task.cancel(banditThread) end
    banditThread = task.spawn(function()
        while banditTimeLeft > 0 and banditBar.Visible do
            banditTimer.Text = banditTimeLeft .. "s remaining"
            task.wait(1)
            banditTimeLeft = banditTimeLeft - 1
        end
        banditBar.Visible = false
    end)
end)

Remotes:WaitForChild("BanditModeEnd").OnClientEvent:Connect(function(reclaimed)
    if banditThread then task.cancel(banditThread) end
    banditBar.Visible = false
    if reclaimed then
        showToast("👑 Crown reclaimed! Bonus earned!", GOLD)
    end
end)

Remotes:WaitForChild("BanditReclaim").OnClientEvent:Connect(function()
    showToast("⚔️ You reclaimed your crown! +75 coins!", GOLD)
end)

-------------------------------------------------
-- TOAST HELPER
-------------------------------------------------
local toastQueue = {}
local toastActive = false

local function showToast(msg, color)
    table.insert(toastQueue, { msg = msg, color = color or GOLD })
    if toastActive then return end
    toastActive = true

    task.spawn(function()
        while #toastQueue > 0 do
            local entry = table.remove(toastQueue, 1)

            local toast = Instance.new("Frame")
            toast.Size                   = UDim2.new(0, 420, 0, 48)
            toast.Position               = UDim2.new(0.5, -210, 1, 20)
            toast.BackgroundColor3       = BG
            toast.BackgroundTransparency = 0.1
            toast.BorderSizePixel        = 0
            toast.Parent                 = screen

            local tc = Instance.new("UICorner")
            tc.CornerRadius = UDim.new(0, 8)
            tc.Parent = toast

            local tl = Instance.new("TextLabel")
            tl.Size                   = UDim2.fromScale(1, 1)
            tl.BackgroundTransparency = 1
            tl.Text                   = entry.msg
            tl.TextColor3             = entry.color
            tl.Font                   = Enum.Font.GothamBold
            tl.TextSize               = 14
            tl.Parent                 = toast

            -- Slide in
            TweenService:Create(toast,
                TweenInfo.new(0.3, Enum.EasingStyle.Back, Enum.EasingDirection.Out),
                { Position = UDim2.new(0.5, -210, 1, -60) }
            ):Play()

            task.wait(3)

            -- Slide out
            TweenService:Create(toast,
                TweenInfo.new(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.In),
                { Position = UDim2.new(0.5, -210, 1, 20) }
            ):Play()
            task.wait(0.25)
            toast:Destroy()
        end
        toastActive = false
    end)
end

-------------------------------------------------
-- CHALLENGE TOASTS
-------------------------------------------------
Remotes:WaitForChild("ChallengeComplete").OnClientEvent:Connect(function(label, reward)
    showToast("✅ Challenge: " .. label .. " (+🪙" .. reward .. ")", GOLD)
end)

-------------------------------------------------
-- THRONE SIT BROADCAST
-------------------------------------------------
Remotes:WaitForChild("ThroneSitResult").OnClientEvent:Connect(function(playerName, _uid)
    showToast("👑 " .. playerName .. " sits upon the Royal Throne!", GOLD)
end)

-------------------------------------------------
-- REWARD WHEEL RESULT
-------------------------------------------------
Remotes:WaitForChild("RewardWheelSpin").OnClientEvent:Connect(function(state, label, _type)
    if state == "RESULT" then
        showToast("🎡 Wheel Prize: " .. (label or "?"), Color3.fromRGB(200, 100, 255))
    elseif state == "COOLDOWN" then
        showToast("🎡 " .. (label or "Come back tomorrow!"), Color3.fromRGB(150, 150, 150))
    end
end)

-------------------------------------------------
-- GUILD UI  ([G] key)
-------------------------------------------------
local guildOpen = false

local guildPanel = Instance.new("Frame")
guildPanel.Size                   = UDim2.new(0, 340, 0, 260)
guildPanel.Position               = UDim2.new(0.5, -170, 0.5, -130)
guildPanel.BackgroundColor3       = BG
guildPanel.BackgroundTransparency = 0.05
guildPanel.BorderSizePixel        = 0
guildPanel.Visible                = false
guildPanel.Parent                 = screen

local gpCorner = Instance.new("UICorner")
gpCorner.CornerRadius = UDim.new(0, 12)
gpCorner.Parent = guildPanel

local gpStroke = Instance.new("UIStroke")
gpStroke.Color     = PURPLE
gpStroke.Thickness = 2
gpStroke.Parent    = guildPanel

local gpTitle = Instance.new("TextLabel")
gpTitle.Size                   = UDim2.new(1, 0, 0.15, 0)
gpTitle.BackgroundTransparency = 1
gpTitle.Text                   = "⚔️  GUILD SYSTEM"
gpTitle.TextColor3             = GOLD
gpTitle.Font                   = Enum.Font.GothamBold
gpTitle.TextSize               = 18
gpTitle.Parent                 = guildPanel

-- Status text
local gpStatus = Instance.new("TextLabel")
gpStatus.Size                   = UDim2.new(0.9, 0, 0.12, 0)
gpStatus.Position               = UDim2.new(0.05, 0, 0.15, 0)
gpStatus.BackgroundTransparency = 1
gpStatus.Text                   = "Create a guild or join one with a tag."
gpStatus.TextColor3             = Color3.fromRGB(180, 170, 150)
gpStatus.Font                   = Enum.Font.Gotham
gpStatus.TextSize               = 12
gpStatus.TextWrapped            = true
gpStatus.Parent                 = guildPanel

-- Name input box
local nameInput = Instance.new("TextBox")
nameInput.Size                   = UDim2.new(0.6, 0, 0.12, 0)
nameInput.Position               = UDim2.new(0.05, 0, 0.3, 0)
nameInput.BackgroundColor3       = Color3.fromRGB(30, 25, 40)
nameInput.BackgroundTransparency = 0.3
nameInput.BorderSizePixel        = 0
nameInput.PlaceholderText        = "Guild Name"
nameInput.Text                   = ""
nameInput.TextColor3             = WHITE
nameInput.Font                   = Enum.Font.Gotham
nameInput.TextSize               = 13
nameInput.Parent                 = guildPanel

-- Tag input box
local tagInput = Instance.new("TextBox")
tagInput.Size                   = UDim2.new(0.28, 0, 0.12, 0)
tagInput.Position               = UDim2.new(0.67, 0, 0.3, 0)
tagInput.BackgroundColor3       = Color3.fromRGB(30, 25, 40)
tagInput.BackgroundTransparency = 0.3
tagInput.BorderSizePixel        = 0
tagInput.PlaceholderText        = "TAG"
tagInput.Text                   = ""
tagInput.TextColor3             = WHITE
tagInput.Font                   = Enum.Font.GothamBold
tagInput.TextSize               = 14
tagInput.Parent                 = guildPanel

local function makeButton(text, pos, size, bgColor)
    local btn = Instance.new("TextButton")
    btn.Size             = size or UDim2.new(0.42, 0, 0.13, 0)
    btn.Position         = pos
    btn.BackgroundColor3 = bgColor or PURPLE
    btn.BackgroundTransparency = 0.2
    btn.BorderSizePixel  = 0
    btn.Text             = text
    btn.TextColor3       = WHITE
    btn.Font             = Enum.Font.GothamBold
    btn.TextSize         = 13
    btn.Parent           = guildPanel
    local c = Instance.new("UICorner"); c.CornerRadius = UDim.new(0, 6); c.Parent = btn
    return btn
end

local createBtn = makeButton("CREATE GUILD", UDim2.new(0.05, 0, 0.46, 0), nil, Color3.fromRGB(60, 30, 100))
local joinBtn   = makeButton("JOIN GUILD",   UDim2.new(0.53, 0, 0.46, 0), nil, Color3.fromRGB(30, 60, 100))

local guildInfoLabel = Instance.new("TextLabel")
guildInfoLabel.Size                   = UDim2.new(0.9, 0, 0.3, 0)
guildInfoLabel.Position               = UDim2.new(0.05, 0, 0.62, 0)
guildInfoLabel.BackgroundTransparency = 1
guildInfoLabel.Text                   = ""
guildInfoLabel.TextColor3             = Color3.fromRGB(200, 190, 255)
guildInfoLabel.Font                   = Enum.Font.Gotham
guildInfoLabel.TextSize               = 12
guildInfoLabel.TextWrapped            = true
guildInfoLabel.TextYAlignment         = Enum.TextYAlignment.Top
guildInfoLabel.Parent                 = guildPanel

local gpClose = Instance.new("TextButton")
gpClose.Size             = UDim2.new(0, 32, 0, 32)
gpClose.Position         = UDim2.new(1, -38, 0, 6)
gpClose.BackgroundColor3 = Color3.fromRGB(100, 20, 20)
gpClose.BackgroundTransparency = 0.2
gpClose.BorderSizePixel  = 0
gpClose.Text             = "✕"
gpClose.TextColor3       = WHITE
gpClose.Font             = Enum.Font.GothamBold
gpClose.TextSize         = 16
gpClose.Parent           = guildPanel
local gpCloseCorner = Instance.new("UICorner"); gpCloseCorner.CornerRadius = UDim.new(0,5); gpCloseCorner.Parent = gpClose

createBtn.MouseButton1Click:Connect(function()
    local name = nameInput.Text:sub(1, 24)
    local tag  = tagInput.Text:sub(1, 3)
    if name == "" or tag == "" then
        gpStatus.Text = "Enter a guild name and 2-3 letter tag."
        return
    end
    Remotes.GuildCreate:FireServer(name, tag)
end)

joinBtn.MouseButton1Click:Connect(function()
    local tag = tagInput.Text:sub(1, 3)
    if tag == "" then
        gpStatus.Text = "Enter the guild tag to join."
        return
    end
    Remotes.GuildJoin:FireServer(tag)
end)

gpClose.MouseButton1Click:Connect(function()
    guildPanel.Visible = false
    guildOpen = false
end)

Remotes:WaitForChild("GuildCreate").OnClientEvent:Connect(function(success, msg)
    gpStatus.Text = msg or ""
end)

Remotes:WaitForChild("GuildJoin").OnClientEvent:Connect(function(success, msg)
    gpStatus.Text = msg or ""
end)

Remotes:WaitForChild("GuildUpdate").OnClientEvent:Connect(function(guildData)
    if not guildData then return end
    guildInfoLabel.Text = string.format(
        "[%s] %s\nMembers: %d/4   Score: %d",
        guildData.tag or "?",
        guildData.name or "Unknown",
        #(guildData.members or {}),
        guildData.score or 0
    )
end)

-- [G] key toggle
UserInputService.InputBegan:Connect(function(input, processed)
    if processed then return end
    if input.KeyCode == Enum.KeyCode.G then
        guildOpen = not guildOpen
        guildPanel.Visible = guildOpen
    end
end)

print("[CrownChaos] SocialUI loaded.")
