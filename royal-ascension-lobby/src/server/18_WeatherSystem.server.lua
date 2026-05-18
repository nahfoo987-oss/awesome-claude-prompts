-- WeatherSystem | ServerScriptService
-- Random storm events every 10-15 minutes. Lasts 90 seconds.
-- Fires WeatherEvent to all clients. Adjusts server-side atmosphere during storm.

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Lighting          = game:GetService("Lighting")
local TweenService      = game:GetService("TweenService")

local Remotes = ReplicatedStorage:WaitForChild("Remotes")
local RE = {
    WeatherEvent = Remotes:WaitForChild("WeatherEvent"),
}

local STORM_MIN_INTERVAL = 600   -- 10 minutes
local STORM_MAX_INTERVAL = 900   -- 15 minutes
local STORM_DURATION     = 90    -- seconds

-------------------------------------------------
-- BASELINE LIGHTING  (from WorkspaceSetup)
-------------------------------------------------
local BASELINE = {
    Brightness             = 2.2,
    ClockTime              = 21.4,
    Ambient                = Color3.fromRGB(18, 18, 24),
    OutdoorAmbient         = Color3.fromRGB(38, 42, 52),
    ColorShift_Top         = Color3.fromRGB(18, 8, 36),
}

local STORM = {
    Brightness             = 0.8,
    ClockTime              = 22.8,
    Ambient                = Color3.fromRGB(8, 6, 18),
    OutdoorAmbient         = Color3.fromRGB(18, 16, 30),
    ColorShift_Top         = Color3.fromRGB(6, 0, 28),
}

local function fireAll(event, data)
    for _, p in Players:GetPlayers() do
        RE.WeatherEvent:FireClient(p, event, data)
    end
end

local function tweenLighting(props, duration)
    local tween = TweenService:Create(
        Lighting,
        TweenInfo.new(duration, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut),
        props
    )
    tween:Play()
end

local function tweenAtmosphere(props, duration)
    local atm = Lighting:FindFirstChildOfClass("Atmosphere")
    if not atm then return end
    local tween = TweenService:Create(
        atm,
        TweenInfo.new(duration, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut),
        props
    )
    tween:Play()
end

-------------------------------------------------
-- LIGHTNING FLASHES
-------------------------------------------------
local stormActive = false

local function lightningLoop()
    while stormActive do
        task.wait(math.random(4, 12))
        if not stormActive then break end

        -- Quick white flash
        local savedBrightness = Lighting.Brightness
        Lighting.Brightness = 8
        task.wait(0.08)
        Lighting.Brightness = 0.5
        task.wait(0.05)
        Lighting.Brightness = 6
        task.wait(0.06)
        Lighting.Brightness = savedBrightness

        fireAll("LIGHTNING", nil)
    end
end

-------------------------------------------------
-- STORM CYCLE
-------------------------------------------------
local function doStorm()
    stormActive = true
    fireAll("STORM_START", STORM_DURATION)

    -- Darken atmosphere
    tweenLighting(STORM, 5)
    tweenAtmosphere({
        Density = 0.55,
        Haze    = 3.5,
        Color   = Color3.fromRGB(60, 55, 90),
        Decay   = Color3.fromRGB(35, 30, 60),
    }, 5)

    task.spawn(lightningLoop)

    -- Wait storm duration
    task.wait(STORM_DURATION)

    stormActive = false
    fireAll("STORM_END", nil)

    -- Restore atmosphere
    tweenLighting(BASELINE, 8)
    tweenAtmosphere({
        Density = 0.24,
        Haze    = 1.4,
        Color   = Color3.fromRGB(112, 104, 144),
        Decay   = Color3.fromRGB(76, 68, 112),
    }, 8)
end

-------------------------------------------------
-- MAIN LOOP
-------------------------------------------------
task.spawn(function()
    while true do
        local waitTime = STORM_MIN_INTERVAL + math.random() * (STORM_MAX_INTERVAL - STORM_MIN_INTERVAL)
        task.wait(waitTime)
        pcall(doStorm)
    end
end)

-- Push current weather state to new joiners
Players.PlayerAdded:Connect(function(player)
    if stormActive then
        task.wait(2)
        RE.WeatherEvent:FireClient(player, "STORM_START", STORM_DURATION)
    end
end)

print("[CrownChaos] WeatherSystem loaded. Storms every 10-15 min.")
