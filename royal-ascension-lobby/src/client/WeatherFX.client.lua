-- WeatherFX | StarterPlayerScripts > LocalScript
-- Client-side storm effects: rain particles, lightning screen flash, ambient shake.
-- Listens to WeatherEvent remote from WeatherSystem.

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService      = game:GetService("TweenService")
local RunService        = game:GetService("RunService")

local localPlayer = Players.LocalPlayer
local playerGui   = localPlayer:WaitForChild("PlayerGui")
local Remotes     = ReplicatedStorage:WaitForChild("Remotes")

-------------------------------------------------
-- SCREEN OVERLAY FOR LIGHTNING FLASH
-------------------------------------------------
local screen = Instance.new("ScreenGui")
screen.Name           = "WeatherFX"
screen.ResetOnSpawn   = false
screen.IgnoreGuiInset = true
screen.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
screen.Parent         = playerGui

local flashOverlay = Instance.new("Frame")
flashOverlay.Size                   = UDim2.fromScale(1, 1)
flashOverlay.BackgroundColor3       = Color3.new(1, 1, 1)
flashOverlay.BackgroundTransparency = 1
flashOverlay.BorderSizePixel        = 0
flashOverlay.Visible                = false
flashOverlay.Parent                 = screen

local stormLabel = Instance.new("TextLabel")
stormLabel.Size                   = UDim2.new(0, 280, 0, 40)
stormLabel.Position               = UDim2.new(0.5, -140, 0, 60)
stormLabel.BackgroundColor3       = Color3.fromRGB(8, 5, 18)
stormLabel.BackgroundTransparency = 0.2
stormLabel.BorderSizePixel        = 0
stormLabel.Text                   = "⛈️  STORM APPROACHING..."
stormLabel.TextColor3             = Color3.fromRGB(180, 160, 255)
stormLabel.Font                   = Enum.Font.GothamBold
stormLabel.TextSize               = 15
stormLabel.Visible                = false
stormLabel.Parent                 = screen

local stormLabelCorner = Instance.new("UICorner")
stormLabelCorner.CornerRadius = UDim.new(0, 8)
stormLabelCorner.Parent = stormLabel

-------------------------------------------------
-- RAIN PARTICLE SYSTEM  (attached to camera)
-------------------------------------------------
local rainFolder = Instance.new("Folder")
rainFolder.Name   = "RainFX"
rainFolder.Parent = workspace

local rainPart = Instance.new("Part")
rainPart.Name        = "RainSource"
rainPart.Size        = Vector3.new(0.1, 0.1, 0.1)
rainPart.Anchored    = true
rainPart.CanCollide  = false
rainPart.Transparency= 1
rainPart.CastShadow  = false
rainPart.Parent      = rainFolder

local rainAtt = Instance.new("Attachment")
rainAtt.Parent = rainPart

local rainEmitter = Instance.new("ParticleEmitter")
rainEmitter.Rate         = 0
rainEmitter.Lifetime     = NumberRange.new(0.6, 1.0)
rainEmitter.Speed        = NumberRange.new(30, 45)
rainEmitter.Rotation     = NumberRange.new(85, 92)
rainEmitter.SpreadAngle  = Vector2.new(8, 0)
rainEmitter.LightEmission= 0.1
rainEmitter.Color        = ColorSequence.new(Color3.fromRGB(140, 160, 200))
rainEmitter.Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0, 0.3),
    NumberSequenceKeypoint.new(0.8, 0.3),
    NumberSequenceKeypoint.new(1, 1),
})
rainEmitter.Size = NumberSequence.new({
    NumberSequenceKeypoint.new(0, 0.05),
    NumberSequenceKeypoint.new(1, 0.05),
})
rainEmitter.Parent = rainAtt

-- Keep rain source above camera
local cam = workspace.CurrentCamera
local rainConnection

-------------------------------------------------
-- STORM ACTIVE STATE
-------------------------------------------------
local stormActive = false

local function startStorm()
    stormActive = true

    -- Show label briefly
    stormLabel.Visible = true
    stormLabel.BackgroundTransparency = 0.2
    task.delay(4, function()
        TweenService:Create(stormLabel, TweenInfo.new(1), { BackgroundTransparency = 1 }):Play()
        task.delay(1, function() stormLabel.Visible = false end)
    end)

    -- Start rain
    rainEmitter.Rate = 80

    -- Follow camera
    rainConnection = RunService.Heartbeat:Connect(function()
        if cam then
            rainPart.CFrame = cam.CFrame * CFrame.new(0, 20, 0)
        end
    end)
end

local function endStorm()
    stormActive = false
    rainEmitter.Rate = 0
    if rainConnection then
        rainConnection:Disconnect()
        rainConnection = nil
    end
end

-------------------------------------------------
-- LIGHTNING FLASH
-------------------------------------------------
local function doLightningFlash()
    flashOverlay.Visible = true
    flashOverlay.BackgroundTransparency = 0.3
    TweenService:Create(flashOverlay, TweenInfo.new(0.08), { BackgroundTransparency = 0.1 }):Play()
    task.wait(0.08)
    TweenService:Create(flashOverlay, TweenInfo.new(0.15), { BackgroundTransparency = 1 }):Play()
    task.wait(0.15)
    flashOverlay.Visible = false
end

-------------------------------------------------
-- REMOTE LISTENER
-------------------------------------------------
Remotes:WaitForChild("WeatherEvent").OnClientEvent:Connect(function(event, _data)
    if event == "STORM_START" then
        startStorm()
    elseif event == "STORM_END" then
        endStorm()
    elseif event == "LIGHTNING" then
        if stormActive then
            pcall(doLightningFlash)
        end
    end
end)

print("[CrownChaos] WeatherFX loaded.")
