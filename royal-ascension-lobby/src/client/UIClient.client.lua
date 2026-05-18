-- UIClient | StarterPlayerScripts > LocalScript
-- HUD: timer, corruption bar, crown holder tracker, kill feed, coin popups,
-- announcements, crowd reactions, power-up indicator, Royal Slam button,
-- round-end podium screen.
-- FIX: stageNames corrected to match CrownService stage definitions.
--      Royal Slam [F] keybind + cooldown ring added.
--      Round-end screen shows podium + hold times.

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService      = game:GetService("TweenService")
local RunService        = game:GetService("RunService")
local UserInputService  = game:GetService("UserInputService")

local localPlayer = Players.LocalPlayer
local playerGui   = localPlayer:WaitForChild("PlayerGui")
local Remotes     = ReplicatedStorage:WaitForChild("Remotes")

-------------------------------------------------
-- COLORS
-------------------------------------------------
local GOLD     = Color3.fromRGB(255, 215, 0)
local DIM_GOLD = Color3.fromRGB(180, 150, 60)
local RED      = Color3.fromRGB(255, 80, 80)
local DARK_RED = Color3.fromRGB(180, 30, 30)
local BG       = Color3.fromRGB(12, 8, 2)
local STONE    = Color3.fromRGB(50, 42, 35)
local PURPLE   = Color3.fromRGB(80, 0, 80)

-------------------------------------------------
-- STATE
-------------------------------------------------
local isHoldingCrown  = false
local crownHolderName = "No Holder"
local localCoins      = 0
local slamUnlocked    = false
local slamOnCooldown  = false

-------------------------------------------------
-- BUILD SCREEN
-------------------------------------------------
local screen = Instance.new("ScreenGui")
screen.Name           = "CrownHUD"
screen.ResetOnSpawn   = false
screen.IgnoreGuiInset = true
screen.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
screen.Parent         = playerGui

local function makeCorner(parent, radius)
    local c = Instance.new("UICorner")
    c.CornerRadius = UDim.new(0, radius or 8)
    c.Parent = parent
    return c
end

local function makeStroke(parent, color, thickness)
    local s = Instance.new("UIStroke")
    s.Color           = color or GOLD
    s.Thickness       = thickness or 1.5
    s.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
    s.Parent          = parent
    return s
end

-------------------------------------------------
-- TIMER (top center)
-------------------------------------------------
local timerFrame = Instance.new("Frame")
timerFrame.Size                   = UDim2.new(0, 180, 0, 56)
timerFrame.Position               = UDim2.new(0.5, -90, 0, 16)
timerFrame.BackgroundColor3       = BG
timerFrame.BackgroundTransparency = 0.3
timerFrame.BorderSizePixel        = 0
timerFrame.Parent                 = screen
makeCorner(timerFrame, 10)
makeStroke(timerFrame, GOLD)

local timerLabel = Instance.new("TextLabel")
timerLabel.Size                   = UDim2.fromScale(1, 1)
timerLabel.BackgroundTransparency = 1
timerLabel.Text                   = "3:00"
timerLabel.TextColor3             = GOLD
timerLabel.Font                   = Enum.Font.GothamBold
timerLabel.TextSize               = 32
timerLabel.Parent                 = timerFrame

-------------------------------------------------
-- CORRUPTION BAR (below timer)
-------------------------------------------------
local corruptBarBg = Instance.new("Frame")
corruptBarBg.Size                   = UDim2.new(0, 300, 0, 22)
corruptBarBg.Position               = UDim2.new(0.5, -150, 0, 80)
corruptBarBg.BackgroundColor3       = STONE
corruptBarBg.BackgroundTransparency = 0.2
corruptBarBg.BorderSizePixel        = 0
corruptBarBg.Parent                 = screen
makeCorner(corruptBarBg, 6)
makeStroke(corruptBarBg, DIM_GOLD, 1)

local corruptFill = Instance.new("Frame")
corruptFill.Size             = UDim2.fromScale(0, 1)
corruptFill.BackgroundColor3 = GOLD
corruptFill.BorderSizePixel  = 0
corruptFill.Parent           = corruptBarBg
makeCorner(corruptFill, 6)

local corruptLabel = Instance.new("TextLabel")
corruptLabel.Size                   = UDim2.fromScale(1, 1)
corruptLabel.BackgroundTransparency = 1
corruptLabel.Text                   = "CORRUPTION"
corruptLabel.TextColor3             = Color3.new(1, 1, 1)
corruptLabel.Font                   = Enum.Font.GothamBold
corruptLabel.TextSize               = 12
corruptLabel.ZIndex                 = 2
corruptLabel.Parent                 = corruptBarBg

-------------------------------------------------
-- CROWN HOLDER TRACKER (left side)
-------------------------------------------------
local holderFrame = Instance.new("Frame")
holderFrame.Size                   = UDim2.new(0, 170, 0, 90)
holderFrame.Position               = UDim2.new(0, 14, 0.5, -45)
holderFrame.BackgroundColor3       = BG
holderFrame.BackgroundTransparency = 0.3
holderFrame.BorderSizePixel        = 0
holderFrame.Parent                 = screen
makeCorner(holderFrame, 10)
makeStroke(holderFrame, GOLD)

local holderCrownLabel = Instance.new("TextLabel")
holderCrownLabel.Size                   = UDim2.new(1, 0, 0, 44)
holderCrownLabel.BackgroundTransparency = 1
holderCrownLabel.Text                   = "👑"
holderCrownLabel.TextSize               = 36
holderCrownLabel.Font                   = Enum.Font.GothamBold
holderCrownLabel.Parent                 = holderFrame

local holderNameLabel = Instance.new("TextLabel")
holderNameLabel.Size                   = UDim2.new(1, -8, 0, 40)
holderNameLabel.Position               = UDim2.new(0, 4, 0, 46)
holderNameLabel.BackgroundTransparency = 1
holderNameLabel.Text                   = "No Holder"
holderNameLabel.TextColor3             = GOLD
holderNameLabel.Font                   = Enum.Font.GothamBold
holderNameLabel.TextSize               = 14
holderNameLabel.TextWrapped            = true
holderNameLabel.Parent                 = holderFrame

-- Off-screen arrow
local offArrow = Instance.new("TextLabel")
offArrow.Size                   = UDim2.new(0, 30, 0, 30)
offArrow.BackgroundTransparency = 1
offArrow.Text                   = "▶"
offArrow.TextColor3             = GOLD
offArrow.TextSize               = 24
offArrow.Font                   = Enum.Font.GothamBold
offArrow.Visible                = false
offArrow.Parent                 = screen

-------------------------------------------------
-- KILL FEED (top right)
-------------------------------------------------
local killFeedFrame = Instance.new("Frame")
killFeedFrame.Size                   = UDim2.new(0, 310, 0, 200)
killFeedFrame.Position               = UDim2.new(1, -320, 0, 14)
killFeedFrame.BackgroundTransparency = 1
killFeedFrame.BorderSizePixel        = 0
killFeedFrame.Parent                 = screen

local killFeedLayout = Instance.new("UIListLayout")
killFeedLayout.SortOrder           = Enum.SortOrder.LayoutOrder
killFeedLayout.VerticalAlignment   = Enum.VerticalAlignment.Bottom
killFeedLayout.HorizontalAlignment = Enum.HorizontalAlignment.Right
killFeedLayout.Padding             = UDim.new(0, 4)
killFeedLayout.Parent              = killFeedFrame

-------------------------------------------------
-- ANNOUNCEMENT BANNER (center)
-------------------------------------------------
local announceLabel = Instance.new("TextLabel")
announceLabel.Size                   = UDim2.new(1, 0, 0, 56)
announceLabel.Position               = UDim2.new(0, 0, 0.33, 0)
announceLabel.BackgroundTransparency = 1
announceLabel.Text                   = ""
announceLabel.TextColor3             = GOLD
announceLabel.Font                   = Enum.Font.GothamBold
announceLabel.TextSize               = 22
announceLabel.TextStrokeTransparency = 0.5
announceLabel.TextTransparency       = 1
announceLabel.Parent                 = screen

-------------------------------------------------
-- COIN POPUP (bottom left)
-------------------------------------------------
local coinPopupLabel = Instance.new("TextLabel")
coinPopupLabel.Size                   = UDim2.new(0, 220, 0, 36)
coinPopupLabel.Position               = UDim2.new(0, 14, 0.75, 0)
coinPopupLabel.BackgroundTransparency = 1
coinPopupLabel.Text                   = ""
coinPopupLabel.TextColor3             = GOLD
coinPopupLabel.Font                   = Enum.Font.GothamBold
coinPopupLabel.TextSize               = 18
coinPopupLabel.TextTransparency       = 1
coinPopupLabel.TextXAlignment         = Enum.TextXAlignment.Left
coinPopupLabel.Parent                 = screen

-------------------------------------------------
-- POWER-UP INDICATOR (bottom center)
-------------------------------------------------
local puFrame = Instance.new("Frame")
puFrame.Size                   = UDim2.new(0, 260, 0, 52)
puFrame.Position               = UDim2.new(0.5, -130, 1, -66)
puFrame.BackgroundColor3       = BG
puFrame.BackgroundTransparency = 0.4
puFrame.BorderSizePixel        = 0
puFrame.Visible                = false
puFrame.Parent                 = screen
makeCorner(puFrame, 10)
makeStroke(puFrame, GOLD)

local puIcon = Instance.new("TextLabel")
puIcon.Size                   = UDim2.new(0, 40, 1, 0)
puIcon.BackgroundTransparency = 1
puIcon.Text                   = "⚡"
puIcon.TextSize               = 28
puIcon.Font                   = Enum.Font.GothamBold
puIcon.Parent                 = puFrame

local puName = Instance.new("TextLabel")
puName.Size                   = UDim2.new(1, -50, 0.55, 0)
puName.Position               = UDim2.new(0, 46, 0, 4)
puName.BackgroundTransparency = 1
puName.Text                   = ""
puName.TextColor3             = GOLD
puName.Font                   = Enum.Font.GothamBold
puName.TextSize               = 15
puName.TextXAlignment         = Enum.TextXAlignment.Left
puName.Parent                 = puFrame

local puTimer = Instance.new("TextLabel")
puTimer.Size                   = UDim2.new(1, -50, 0.45, 0)
puTimer.Position               = UDim2.new(0, 46, 0.55, 0)
puTimer.BackgroundTransparency = 1
puTimer.Text                   = ""
puTimer.TextColor3             = DIM_GOLD
puTimer.Font                   = Enum.Font.Gotham
puTimer.TextSize               = 13
puTimer.TextXAlignment         = Enum.TextXAlignment.Left
puTimer.Parent                 = puFrame

-------------------------------------------------
-- ROYAL SLAM BUTTON (bottom right, only when holding crown)
-------------------------------------------------
local slamFrame = Instance.new("Frame")
slamFrame.Size                   = UDim2.new(0, 100, 0, 100)
slamFrame.Position               = UDim2.new(1, -120, 1, -130)
slamFrame.BackgroundColor3       = BG
slamFrame.BackgroundTransparency = 0.3
slamFrame.BorderSizePixel        = 0
slamFrame.Visible                = false
slamFrame.Parent                 = screen
makeCorner(slamFrame, 50)  -- circle
makeStroke(slamFrame, GOLD, 2)

local slamIcon = Instance.new("TextLabel")
slamIcon.Size                   = UDim2.fromScale(1, 0.6)
slamIcon.BackgroundTransparency = 1
slamIcon.Text                   = "⚔️"
slamIcon.TextSize               = 36
slamIcon.Font                   = Enum.Font.GothamBold
slamIcon.Parent                 = slamFrame

local slamKeyLabel = Instance.new("TextLabel")
slamKeyLabel.Size                   = UDim2.new(1, 0, 0.3, 0)
slamKeyLabel.Position               = UDim2.new(0, 0, 0.6, 0)
slamKeyLabel.BackgroundTransparency = 1
slamKeyLabel.Text                   = "[F]"
slamKeyLabel.TextColor3             = GOLD
slamKeyLabel.Font                   = Enum.Font.GothamBold
slamKeyLabel.TextSize               = 16
slamKeyLabel.Parent                 = slamFrame

local slamCooldownLabel = Instance.new("TextLabel")
slamCooldownLabel.Size                   = UDim2.fromScale(1, 1)
slamCooldownLabel.BackgroundColor3       = Color3.new(0, 0, 0)
slamCooldownLabel.BackgroundTransparency = 0.4
slamCooldownLabel.Text                   = ""
slamCooldownLabel.TextColor3             = Color3.new(1, 1, 1)
slamCooldownLabel.Font                   = Enum.Font.GothamBold
slamCooldownLabel.TextSize               = 22
slamCooldownLabel.ZIndex                 = 2
slamCooldownLabel.Visible                = false
slamCooldownLabel.Parent                 = slamFrame
makeCorner(slamCooldownLabel, 50)

local function showSlamCooldown(seconds)
    slamOnCooldown = true
    slamCooldownLabel.Visible = true
    local remaining = math.ceil(seconds)
    slamCooldownLabel.Text = tostring(remaining)
    task.spawn(function()
        while remaining > 0 do
            task.wait(1)
            remaining = remaining - 1
            slamCooldownLabel.Text = remaining > 0 and tostring(remaining) or ""
        end
        slamCooldownLabel.Visible = false
        slamOnCooldown = false
    end)
end

-- F key to slam
UserInputService.InputBegan:Connect(function(input, gameProcessed)
    if gameProcessed then return end
    if input.KeyCode ~= Enum.KeyCode.F then return end
    if not isHoldingCrown then return end
    if not slamUnlocked then return end
    if slamOnCooldown then return end
    Remotes.RoyalSlam:FireServer()
end)

-------------------------------------------------
-- VIGNETTE (screen edge when holding crown)
-------------------------------------------------
local vignette = Instance.new("Frame")
vignette.Size             = UDim2.fromScale(1, 1)
vignette.BackgroundTransparency = 1
vignette.BorderSizePixel  = 0
vignette.ZIndex           = 8
vignette.Parent           = screen

local vignetteGradientData = {
    { size = UDim2.new(1, 0, 0.15, 0), pos = UDim2.new(0, 0, 0, 0),    rot = 0 },
    { size = UDim2.new(1, 0, 0.15, 0), pos = UDim2.new(0, 0, 0.85, 0), rot = 180 },
    { size = UDim2.new(0.1, 0, 1, 0),  pos = UDim2.new(0, 0, 0, 0),    rot = 270 },
    { size = UDim2.new(0.1, 0, 1, 0),  pos = UDim2.new(0.9, 0, 0, 0),  rot = 90 },
}
local vignetteFrames = {}
for _, d in vignetteGradientData do
    local f = Instance.new("Frame")
    f.Size             = d.size
    f.Position         = d.pos
    f.BackgroundTransparency = 1
    f.BorderSizePixel  = 0
    f.ZIndex           = 8
    f.Parent           = vignette
    local g = Instance.new("UIGradient")
    g.Color        = ColorSequence.new(Color3.fromRGB(255, 140, 0), Color3.fromRGB(0, 0, 0))
    g.Transparency = NumberSequence.new({
        NumberSequenceKeypoint.new(0, 0.3),
        NumberSequenceKeypoint.new(1, 1),
    })
    g.Rotation = d.rot
    g.Parent   = f
    table.insert(vignetteFrames, f)
end

local function setVignetteOpacity(show, stage)
    local transparency = 1
    if show then
        if stage == 2 then transparency = 0.5
        elseif stage == 3 then transparency = 0.3
        elseif stage == 4 then transparency = 0.15
        elseif stage >= 5 then transparency = 0.0
        else transparency = 0.8
        end
    end
    for _, f in vignetteFrames do
        local g = f:FindFirstChildOfClass("UIGradient")
        if g then
            g.Transparency = NumberSequence.new({
                NumberSequenceKeypoint.new(0, transparency),
                NumberSequenceKeypoint.new(1, 1),
            })
        end
    end
end

-------------------------------------------------
-- ROUND END SCREEN
-------------------------------------------------
local roundEndScreen = Instance.new("Frame")
roundEndScreen.Size                   = UDim2.fromScale(1, 1)
roundEndScreen.BackgroundColor3       = Color3.new(0, 0, 0)
roundEndScreen.BackgroundTransparency = 0.45
roundEndScreen.BorderSizePixel        = 0
roundEndScreen.ZIndex                 = 20
roundEndScreen.Visible                = false
roundEndScreen.Parent                 = screen

local roundEndCard = Instance.new("Frame")
roundEndCard.Size                   = UDim2.new(0, 460, 0, 340)
roundEndCard.Position               = UDim2.new(0.5, -230, 0.5, -170)
roundEndCard.BackgroundColor3       = BG
roundEndCard.BackgroundTransparency = 0.1
roundEndCard.BorderSizePixel        = 0
roundEndCard.ZIndex                 = 21
roundEndCard.Parent                 = roundEndScreen
makeCorner(roundEndCard, 16)
makeStroke(roundEndCard, GOLD, 2)

local roundEndTitle = Instance.new("TextLabel")
roundEndTitle.Size                   = UDim2.new(1, 0, 0, 50)
roundEndTitle.BackgroundTransparency = 1
roundEndTitle.Text                   = "🏆 ROUND OVER"
roundEndTitle.TextColor3             = GOLD
roundEndTitle.Font                   = Enum.Font.GothamBold
roundEndTitle.TextSize               = 28
roundEndTitle.ZIndex                 = 22
roundEndTitle.Parent                 = roundEndCard

local roundEndList = Instance.new("Frame")
roundEndList.Size             = UDim2.new(1, -40, 1, -70)
roundEndList.Position         = UDim2.new(0, 20, 0, 58)
roundEndList.BackgroundTransparency = 1
roundEndList.BorderSizePixel  = 0
roundEndList.ZIndex           = 22
roundEndList.Parent           = roundEndCard

local function showRoundEnd(winnerName, sorted)
    -- Clear old entries
    for _, child in roundEndList:GetChildren() do
        if child:IsA("Frame") or child:IsA("TextLabel") then child:Destroy() end
    end

    roundEndTitle.Text = "🏆 " .. (winnerName or "Nobody") .. " WINS!"

    local medals = { "🥇", "🥈", "🥉" }
    for i, entry in ipairs(sorted or {}) do
        local row = Instance.new("Frame")
        row.Size                   = UDim2.new(1, 0, 0, 44)
        row.Position               = UDim2.new(0, 0, 0, (i - 1) * 48)
        row.BackgroundColor3       = i <= 3 and Color3.fromRGB(30, 20, 5) or Color3.fromRGB(20, 15, 5)
        row.BackgroundTransparency = 0.3
        row.BorderSizePixel        = 0
        row.ZIndex                 = 23
        row.Parent                 = roundEndList
        makeCorner(row, 6)

        local medal = Instance.new("TextLabel")
        medal.Size                   = UDim2.new(0, 40, 1, 0)
        medal.BackgroundTransparency = 1
        medal.Text                   = medals[i] or tostring(i)
        medal.TextSize               = 22
        medal.Font                   = Enum.Font.GothamBold
        medal.ZIndex                 = 24
        medal.Parent                 = row

        local nameLabel = Instance.new("TextLabel")
        nameLabel.Size                   = UDim2.new(0.6, 0, 1, 0)
        nameLabel.Position               = UDim2.new(0, 44, 0, 0)
        nameLabel.BackgroundTransparency = 1
        nameLabel.Text                   = entry.Name or "?"
        nameLabel.TextColor3             = entry.Name == localPlayer.Name and GOLD or Color3.new(1, 1, 1)
        nameLabel.Font                   = Enum.Font.GothamBold
        nameLabel.TextSize               = 16
        nameLabel.TextXAlignment         = Enum.TextXAlignment.Left
        nameLabel.ZIndex                 = 24
        nameLabel.Parent                 = row

        local timeLabel = Instance.new("TextLabel")
        timeLabel.Size                   = UDim2.new(0.35, 0, 1, 0)
        timeLabel.Position               = UDim2.new(0.65, 0, 0, 0)
        timeLabel.BackgroundTransparency = 1
        timeLabel.Text                   = (entry.HoldTime or 0) .. "s held"
        timeLabel.TextColor3             = DIM_GOLD
        timeLabel.Font                   = Enum.Font.Gotham
        timeLabel.TextSize               = 14
        timeLabel.TextXAlignment         = Enum.TextXAlignment.Right
        timeLabel.ZIndex                 = 24
        timeLabel.Parent                 = row
    end

    roundEndScreen.Visible = true
    TweenService:Create(roundEndCard,
        TweenInfo.new(0.4, Enum.EasingStyle.Back, Enum.EasingDirection.Out),
        { Size = UDim2.new(0, 460, 0, 340) }
    ):Play()

    task.delay(12, function()
        if roundEndScreen.Visible then
            roundEndScreen.Visible = false
        end
    end)
end

-------------------------------------------------
-- HELPER FUNCTIONS
-------------------------------------------------
local function showAnnouncement(text)
    announceLabel.Text             = text
    announceLabel.TextTransparency = 0
    TweenService:Create(announceLabel,
        TweenInfo.new(3, Enum.EasingStyle.Quad, Enum.EasingDirection.In),
        { TextTransparency = 1 }
    ):Play()
end

local function addKillFeedEntry(text)
    local entry = Instance.new("TextLabel")
    entry.Size                   = UDim2.new(1, 0, 0, 28)
    entry.BackgroundColor3       = Color3.fromRGB(0, 0, 0)
    entry.BackgroundTransparency = 0.55
    entry.TextColor3             = GOLD
    entry.Font                   = Enum.Font.GothamBold
    entry.TextSize               = 13
    entry.Text                   = text
    entry.TextXAlignment         = Enum.TextXAlignment.Right
    entry.LayoutOrder            = -os.clock()
    entry.BorderSizePixel        = 0
    entry.Parent                 = killFeedFrame
    makeCorner(entry, 4)

    task.delay(3, function()
        TweenService:Create(entry,
            TweenInfo.new(0.8),
            { TextTransparency = 1, BackgroundTransparency = 1 }
        ):Play()
        task.wait(0.9)
        if entry.Parent then entry:Destroy() end
    end)

    local entries = {}
    for _, c in killFeedFrame:GetChildren() do
        if c:IsA("TextLabel") then table.insert(entries, c) end
    end
    if #entries > 5 then
        table.sort(entries, function(a, b) return a.LayoutOrder > b.LayoutOrder end)
        entries[#entries]:Destroy()
    end
end

local function showCoinPopup(amount, reason)
    if amount <= 0 then return end
    coinPopupLabel.Text             = "+" .. amount .. " 🪙 " .. (reason ~= "" and reason or "")
    coinPopupLabel.TextTransparency = 0
    coinPopupLabel.Position         = UDim2.new(0, 14, 0.75, 0)
    TweenService:Create(coinPopupLabel,
        TweenInfo.new(1.8, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
        { Position = UDim2.new(0, 14, 0.68, 0), TextTransparency = 1 }
    ):Play()
end

local function formatTime(seconds)
    local m = math.floor(seconds / 60)
    local s = seconds % 60
    return string.format("%d:%02d", m, s)
end

local function updatePowerUp(name, iconEmoji, duration)
    puFrame.Visible = true
    puIcon.Text = iconEmoji or "⚡"
    puName.Text = name

    local remaining = duration
    puTimer.Text = remaining .. "s"

    task.spawn(function()
        while remaining > 0 do
            task.wait(1)
            remaining = remaining - 1
            puTimer.Text = remaining .. "s"
        end
        puFrame.Visible = false
    end)
end

-------------------------------------------------
-- FIX: Stage names corrected to match CrownService CONFIG.STAGES
-- Stage 1 = just picked up (RISING)
-- Stage 2 = 20s (DANGEROUS)
-- Stage 3 = 45s (WARLORD) — was "TYRANT" which is only for stage 5
-- Stage 4 = 75s (THE BURDEN) — was mismatched
-- Stage 5 = 120s (TYRANT) — instant win state
-------------------------------------------------
local stageColors = {
    GOLD,
    Color3.fromRGB(255, 180, 0),
    Color3.fromRGB(255, 120, 0),
    Color3.fromRGB(180, 0, 0),
    PURPLE,
}
local stageNames = {
    "RISING",       -- stage 1: just grabbed
    "DANGEROUS",    -- stage 2: 20s
    "WARLORD",      -- stage 3: 45s  FIX: was "TYRANT"
    "THE BURDEN",   -- stage 4: 75s
    "👹 TYRANT",    -- stage 5: 120s — the real instant-win tyrant
}

-------------------------------------------------
-- REMOTE LISTENERS
-------------------------------------------------

-- Timer
Remotes.UpdateTimer.OnClientEvent:Connect(function(remaining)
    timerLabel.Text = formatTime(remaining)
    if remaining <= 10 then
        timerLabel.TextColor3 = RED
        TweenService:Create(timerLabel,
            TweenInfo.new(0.5, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, 0, true),
            { TextTransparency = 0.4 }
        ):Play()
    elseif remaining <= 30 then
        timerLabel.TextColor3       = RED
        timerLabel.TextTransparency = 0
    else
        timerLabel.TextColor3       = GOLD
        timerLabel.TextTransparency = 0
    end
end)

-- Crown pickup
Remotes.CrownPickup.OnClientEvent:Connect(function(holder)
    crownHolderName = holder.Name
    holderNameLabel.Text = "👑 " .. holder.Name
    isHoldingCrown = (holder == localPlayer)
    addKillFeedEntry("👑 " .. holder.Name .. " TOOK THE CROWN")

    -- Show/hide slam button
    slamFrame.Visible   = isHoldingCrown
    slamUnlocked        = false  -- re-locked until stage 3 when holding

    if isHoldingCrown then
        local flash = Instance.new("Frame")
        flash.Size             = UDim2.fromScale(1, 1)
        flash.BackgroundColor3 = GOLD
        flash.BackgroundTransparency = 0.4
        flash.ZIndex           = 9
        flash.BorderSizePixel  = 0
        flash.Parent           = screen
        TweenService:Create(flash,
            TweenInfo.new(0.4),
            { BackgroundTransparency = 1 }
        ):Play()
        task.delay(0.5, function() if flash.Parent then flash:Destroy() end end)
    end
end)

-- Crown drop
Remotes.CrownDrop.OnClientEvent:Connect(function(former)
    if former == localPlayer then
        isHoldingCrown  = false
        slamFrame.Visible = false
        slamUnlocked    = false
    end
    holderNameLabel.Text = "Crown is FREE!"
    crownHolderName = "FREE"
    addKillFeedEntry("💥 " .. former.Name .. " DROPPED THE CROWN")
    setVignetteOpacity(false, 1)
    task.delay(2, function()
        if crownHolderName == "FREE" then
            holderNameLabel.Text = "No Holder"
            crownHolderName = "No Holder"
        end
    end)
end)

-- Stage changed
Remotes.StageChanged.OnClientEvent:Connect(function(holder, stage)
    local color = stageColors[stage] or GOLD
    local name  = stageNames[stage] or "RISING"

    corruptLabel.Text = name
    TweenService:Create(corruptFill,
        TweenInfo.new(0.5),
        { Size = UDim2.fromScale(math.min((stage - 1) / 4, 1), 1), BackgroundColor3 = color }
    ):Play()

    if holder == localPlayer then
        setVignetteOpacity(true, stage)
        if stage >= 2 then showAnnouncement("⚠️ YOU ARE " .. name) end
    end
end)

-- Corruption stage (progress bar update)
Remotes.CorruptionStageChanged.OnClientEvent:Connect(function(stage, progress)
    local color = stageColors[stage] or GOLD
    local name  = stageNames[stage] or "RISING"
    corruptLabel.Text = name
    TweenService:Create(corruptFill,
        TweenInfo.new(0.4),
        { Size = UDim2.fromScale(math.clamp(progress, 0, 1), 1), BackgroundColor3 = color }
    ):Play()
end)

-- Royal Slam events from server
Remotes.RoyalSlam.OnClientEvent:Connect(function(eventType, data, pos, radius)
    if eventType == "UNLOCK" then
        slamUnlocked = true
        showAnnouncement(data or "👑 ROYAL SLAM UNLOCKED — Press [F]!")
        -- Flash the slam button
        TweenService:Create(slamFrame,
            TweenInfo.new(0.3, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, 3, true),
            { BackgroundTransparency = 0 }
        ):Play()

    elseif eventType == "SLAM" then
        -- Show VFX (shockwave ring) centered on the slammer
        addKillFeedEntry("⚔️ " .. (data and data.Name or "???") .. " ROYAL SLAM!")
        showAnnouncement("⚔️ ROYAL SLAM!")
        if data == localPlayer then
            -- Cooldown starts now (server already validated)
            showSlamCooldown(12)
        end

    elseif eventType == "COOLDOWN" then
        showSlamCooldown(data or 12)
    end
end)

-- Crowd events
Remotes.CrowdEvent.OnClientEvent:Connect(function(eventType, data)
    if eventType == "ANNOUNCE" then
        showAnnouncement(data)

    elseif eventType == "BOO" then
        local name = (type(data) == "userdata" and data.Name) or "???"
        showAnnouncement("😤 THE CROWD BOOS " .. name .. "!")

    elseif eventType == "FINAL30" then
        local cam = workspace.CurrentCamera
        task.spawn(function()
            for _ = 1, 8 do
                cam.CFrame = cam.CFrame
                    * CFrame.new(math.random(-1, 1) * 0.25, math.random(-1, 1) * 0.25, 0)
                task.wait(0.05)
            end
        end)

    elseif eventType == "SILENCE" then
        showAnnouncement("...")

    elseif eventType == "COIN_SHOWER" then
        showAnnouncement("🪙 THE CROWD THROWS COINS!")

    elseif eventType == "CROWD_FAVORITE" then
        local name = (type(data) == "userdata" and data.Name) or "???"
        showAnnouncement("⭐ CROWD FAVORITE: " .. name)

    elseif eventType == "ERUPTION" then
        local name = (type(data) == "userdata" and data.Name) or "???"
        showAnnouncement("🏆 " .. name .. " WINS! THE CROWD ERUPTS!")
    end
end)

-- Coin reward popup
Remotes.CoinReward.OnClientEvent:Connect(function(amount, reason)
    if amount and amount > 0 then
        localCoins = localCoins + amount
        showCoinPopup(amount, reason or "")
    end
end)

-- Power-up collected
Remotes.PowerUpCollected.OnClientEvent:Connect(function(player, id, label)
    addKillFeedEntry("⚡ " .. player.Name .. " grabbed " .. label)
    if player == localPlayer then
        local iconMap = {
            SpeedBoots      = "⚡",
            LuckyShield     = "🛡️",
            ShockwaveHammer = "🔨",
            TeleportOrb     = "🌀",
            MagnetGlove     = "🧲",
            RagePotion      = "🔴",
            FreezeTrap      = "❄️",
            BetrayalTrap    = "🎭",
            HermesDash      = "💨",
            RoyalDecree     = "📯",
        }
        local durationMap = {
            SpeedBoots = 8, LuckyShield = 0, ShockwaveHammer = 0,
            TeleportOrb = 0, MagnetGlove = 10, RagePotion = 6,
            FreezeTrap = 0, BetrayalTrap = 0, HermesDash = 0, RoyalDecree = 0,
        }
        local duration = durationMap[id] or 0
        updatePowerUp(label, iconMap[id] or "⚡", duration > 0 and duration or 3)
        showAnnouncement("⚡ " .. label .. " ACTIVATED!")
    end
end)

-- Round end — show podium screen
Remotes.RoundEnd.OnClientEvent:Connect(function(winnerName, podium, sorted, ...)
    showRoundEnd(winnerName, sorted)
    isHoldingCrown  = false
    slamFrame.Visible = false
    slamUnlocked    = false
    setVignetteOpacity(false, 1)
end)

-- Init client
Remotes.InitClient.OnClientEvent:Connect(function(data)
    localCoins = data.coins or 0
end)

-------------------------------------------------
-- OFF-SCREEN ARROW (tracks crown holder)
-------------------------------------------------
RunService.RenderStepped:Connect(function()
    if isHoldingCrown or crownHolderName == "No Holder" or crownHolderName == "FREE" then
        offArrow.Visible = false
        return
    end

    local holder = Players:FindFirstChild(crownHolderName)
    if not holder or not holder.Character then
        offArrow.Visible = false
        return
    end

    local head = holder.Character:FindFirstChild("Head")
    if not head then offArrow.Visible = false return end

    local cam                = workspace.CurrentCamera
    local vp                 = cam.ViewportSize
    local screenPos, onScreen = cam:WorldToScreenPoint(head.Position)

    if onScreen then
        offArrow.Visible = false
    else
        offArrow.Visible = true
        local cx, cy     = vp.X / 2, vp.Y / 2
        local angle      = math.atan2(screenPos.Y - cy, screenPos.X - cx)
        local margin     = 55
        local x = cx + math.cos(angle) * (cx - margin)
        local y = cy + math.sin(angle) * (cy - margin)
        x = math.clamp(x, margin, vp.X - margin)
        y = math.clamp(y, margin, vp.Y - margin)
        offArrow.Position = UDim2.new(0, x - 15, 0, y - 15)
        offArrow.Rotation = math.deg(angle)
    end
end)

print("[CrownChaos] UIClient loaded.")
