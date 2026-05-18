-- CreatorTools | StarterPlayerScripts > LocalScript
-- Fly, god mode, noclip, speed for the game creator only.
-- Toggle panel with [/] key. Only activates if UserId matches game creator.

local Players          = game:GetService("Players")
local RunService       = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")
local TweenService     = game:GetService("TweenService")

local localPlayer = Players.LocalPlayer
local playerGui   = localPlayer:WaitForChild("PlayerGui")

-- Only the game creator gets these tools
-- game.CreatorId = the UserId of whoever owns the game
if localPlayer.UserId ~= game.CreatorId and game.CreatorId ~= 0 then
    return
end

local GOLD   = Color3.fromRGB(255, 215, 0)
local BG     = Color3.fromRGB(10, 6, 20)
local GREEN  = Color3.fromRGB(60, 180, 60)
local RED    = Color3.fromRGB(180, 40, 40)
local WHITE  = Color3.new(1, 1, 1)

-------------------------------------------------
-- STATE
-------------------------------------------------
local flyEnabled   = false
local godEnabled   = false
local noclipEnabled= false
local flySpeed     = 60

local flyConnection, godConnection, noclipConnection

-------------------------------------------------
-- SCREEN
-------------------------------------------------
local screen = Instance.new("ScreenGui")
screen.Name           = "CreatorTools"
screen.ResetOnSpawn   = false
screen.IgnoreGuiInset = true
screen.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
screen.Parent         = playerGui

local panelOpen = false

local panel = Instance.new("Frame")
panel.Size                   = UDim2.new(0, 200, 0, 320)
panel.Position               = UDim2.new(0, 10, 0.5, -160)
panel.BackgroundColor3       = BG
panel.BackgroundTransparency = 0.05
panel.BorderSizePixel        = 0
panel.Visible                = false
panel.Parent                 = screen

local pCorner = Instance.new("UICorner")
pCorner.CornerRadius = UDim.new(0, 10)
pCorner.Parent = panel

local pStroke = Instance.new("UIStroke")
pStroke.Color     = GOLD
pStroke.Thickness = 1.5
pStroke.Parent    = panel

local title = Instance.new("TextLabel")
title.Size                   = UDim2.new(1, 0, 0, 36)
title.BackgroundTransparency = 1
title.Text                   = "👑 CREATOR TOOLS"
title.TextColor3             = GOLD
title.Font                   = Enum.Font.GothamBold
title.TextSize               = 13
title.Parent                 = panel

local hint = Instance.new("TextLabel")
hint.Size                   = UDim2.new(1, 0, 0, 20)
hint.Position               = UDim2.new(0, 0, 0, 290)
hint.BackgroundTransparency = 1
hint.Text                   = "[/] toggle panel"
hint.TextColor3             = Color3.fromRGB(100, 90, 80)
hint.Font                   = Enum.Font.Gotham
hint.TextSize               = 10
hint.Parent                 = screen

-------------------------------------------------
-- BUTTON HELPER
-------------------------------------------------
local function makeToggleBtn(label, yPos)
    local btn = Instance.new("TextButton")
    btn.Size             = UDim2.new(0.88, 0, 0, 38)
    btn.Position         = UDim2.new(0.06, 0, 0, yPos)
    btn.BackgroundColor3 = Color3.fromRGB(30, 20, 50)
    btn.BackgroundTransparency = 0.2
    btn.BorderSizePixel  = 0
    btn.Text             = label .. ": OFF"
    btn.TextColor3       = Color3.fromRGB(180, 160, 160)
    btn.Font             = Enum.Font.GothamBold
    btn.TextSize         = 13
    btn.AutoButtonColor  = false
    btn.Parent           = panel

    local c = Instance.new("UICorner")
    c.CornerRadius = UDim.new(0, 7)
    c.Parent = btn

    local function setOn(on)
        btn.Text             = label .. (on and ": ON" or ": OFF")
        btn.TextColor3       = on and GREEN or Color3.fromRGB(180, 160, 160)
        btn.BackgroundColor3 = on and Color3.fromRGB(20, 45, 20) or Color3.fromRGB(30, 20, 50)
    end

    return btn, setOn
end

-------------------------------------------------
-- FLY
-------------------------------------------------
local flyBtn, flySet = makeToggleBtn("✈️  FLY", 44)

local function startFly()
    local char = localPlayer.Character
    if not char then return end
    local root = char:FindFirstChild("HumanoidRootPart")
    local hum  = char:FindFirstChildOfClass("Humanoid")
    if not root or not hum then return end

    hum.PlatformStand = true

    local bv = Instance.new("BodyVelocity")
    bv.Velocity   = Vector3.zero
    bv.MaxForce   = Vector3.new(1e5, 1e5, 1e5)
    bv.Parent     = root

    local bg = Instance.new("BodyGyro")
    bg.MaxTorque  = Vector3.new(1e5, 1e5, 1e5)
    bg.D          = 100
    bg.Parent     = root

    local cam = workspace.CurrentCamera

    flyConnection = RunService.Heartbeat:Connect(function()
        if not flyEnabled then
            bv:Destroy()
            bg:Destroy()
            hum.PlatformStand = false
            flyConnection:Disconnect()
            return
        end

        local dir = Vector3.zero
        if UserInputService:IsKeyDown(Enum.KeyCode.W) then dir = dir + cam.CFrame.LookVector end
        if UserInputService:IsKeyDown(Enum.KeyCode.S) then dir = dir - cam.CFrame.LookVector end
        if UserInputService:IsKeyDown(Enum.KeyCode.A) then dir = dir - cam.CFrame.RightVector end
        if UserInputService:IsKeyDown(Enum.KeyCode.D) then dir = dir + cam.CFrame.RightVector end
        if UserInputService:IsKeyDown(Enum.KeyCode.E) or
           UserInputService:IsKeyDown(Enum.KeyCode.Space) then dir = dir + Vector3.new(0,1,0) end
        if UserInputService:IsKeyDown(Enum.KeyCode.Q) then dir = dir - Vector3.new(0,1,0) end

        bv.Velocity  = dir.Magnitude > 0 and dir.Unit * flySpeed or Vector3.zero
        bg.CFrame    = cam.CFrame
    end)
end

flyBtn.MouseButton1Click:Connect(function()
    flyEnabled = not flyEnabled
    flySet(flyEnabled)
    if flyEnabled then
        startFly()
    end
end)

-------------------------------------------------
-- GOD MODE
-------------------------------------------------
local godBtn, godSet = makeToggleBtn("🛡️  GOD MODE", 90)

local function startGod()
    godConnection = RunService.Heartbeat:Connect(function()
        if not godEnabled then
            godConnection:Disconnect()
            return
        end
        local char = localPlayer.Character
        local hum  = char and char:FindFirstChildOfClass("Humanoid")
        if hum then
            hum.Health    = hum.MaxHealth
        end
    end)
end

godBtn.MouseButton1Click:Connect(function()
    godEnabled = not godEnabled
    godSet(godEnabled)
    if godEnabled then startGod() end
end)

-------------------------------------------------
-- NOCLIP
-------------------------------------------------
local noclipBtn, noclipSet = makeToggleBtn("👻 NOCLIP", 136)

noclipBtn.MouseButton1Click:Connect(function()
    noclipEnabled = not noclipEnabled
    noclipSet(noclipEnabled)

    if noclipEnabled then
        noclipConnection = RunService.Stepped:Connect(function()
            if not noclipEnabled then
                noclipConnection:Disconnect()
                return
            end
            local char = localPlayer.Character
            if not char then return end
            for _, part in char:GetDescendants() do
                if part:IsA("BasePart") and part.Name ~= "HumanoidRootPart" then
                    part.CanCollide = false
                end
            end
        end)
    end
end)

-------------------------------------------------
-- SPEED SLIDER  (simple +/- buttons)
-------------------------------------------------
local speedLabel = Instance.new("TextLabel")
speedLabel.Size                   = UDim2.new(0.88, 0, 0, 24)
speedLabel.Position               = UDim2.new(0.06, 0, 0, 186)
speedLabel.BackgroundTransparency = 1
speedLabel.Text                   = "Fly Speed: " .. flySpeed
speedLabel.TextColor3             = Color3.fromRGB(200, 190, 170)
speedLabel.Font                   = Enum.Font.Gotham
speedLabel.TextSize               = 12
speedLabel.Parent                 = panel

local minusBtn = Instance.new("TextButton")
minusBtn.Size             = UDim2.new(0.38, 0, 0, 28)
minusBtn.Position         = UDim2.new(0.06, 0, 0, 212)
minusBtn.BackgroundColor3 = Color3.fromRGB(60, 20, 20)
minusBtn.BackgroundTransparency = 0.3
minusBtn.BorderSizePixel  = 0
minusBtn.Text             = "－ Slower"
minusBtn.TextColor3       = WHITE
minusBtn.Font             = Enum.Font.GothamBold
minusBtn.TextSize         = 11
minusBtn.Parent           = panel
local mc = Instance.new("UICorner"); mc.CornerRadius = UDim.new(0,6); mc.Parent = minusBtn

local plusBtn = Instance.new("TextButton")
plusBtn.Size             = UDim2.new(0.38, 0, 0, 28)
plusBtn.Position         = UDim2.new(0.56, 0, 0, 212)
plusBtn.BackgroundColor3 = Color3.fromRGB(20, 60, 20)
plusBtn.BackgroundTransparency = 0.3
plusBtn.BorderSizePixel  = 0
plusBtn.Text             = "＋ Faster"
plusBtn.TextColor3       = WHITE
plusBtn.Font             = Enum.Font.GothamBold
plusBtn.TextSize         = 11
plusBtn.Parent           = panel
local pc = Instance.new("UICorner"); pc.CornerRadius = UDim.new(0,6); pc.Parent = plusBtn

minusBtn.MouseButton1Click:Connect(function()
    flySpeed = math.max(10, flySpeed - 20)
    speedLabel.Text = "Fly Speed: " .. flySpeed
end)
plusBtn.MouseButton1Click:Connect(function()
    flySpeed = math.min(300, flySpeed + 20)
    speedLabel.Text = "Fly Speed: " .. flySpeed
end)

-------------------------------------------------
-- TELEPORT TO SPAWN
-------------------------------------------------
local tpBtn = Instance.new("TextButton")
tpBtn.Size             = UDim2.new(0.88, 0, 0, 34)
tpBtn.Position         = UDim2.new(0.06, 0, 0, 248)
tpBtn.BackgroundColor3 = Color3.fromRGB(20, 40, 80)
tpBtn.BackgroundTransparency = 0.2
tpBtn.BorderSizePixel  = 0
tpBtn.Text             = "🔵 Teleport to Crown"
tpBtn.TextColor3       = WHITE
tpBtn.Font             = Enum.Font.GothamBold
tpBtn.TextSize         = 12
tpBtn.Parent           = panel
local tc2 = Instance.new("UICorner"); tc2.CornerRadius = UDim.new(0,7); tc2.Parent = tpBtn

tpBtn.MouseButton1Click:Connect(function()
    local char = localPlayer.Character
    local root = char and char:FindFirstChild("HumanoidRootPart")
    if root then root.CFrame = CFrame.new(0, 96, 0) end
end)

-------------------------------------------------
-- PANEL TOGGLE
-------------------------------------------------
UserInputService.InputBegan:Connect(function(input, processed)
    if processed then return end
    if input.KeyCode == Enum.KeyCode.Slash then
        panelOpen = not panelOpen
        panel.Visible = panelOpen
    end
end)

print("[CrownChaos] CreatorTools loaded for " .. localPlayer.Name)
