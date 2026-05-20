
local ReplicatedFirst = game:GetService("ReplicatedFirst")
local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")
local RunService = game:GetService("RunService")
local StarterGui = game:GetService("StarterGui")
local SoundService = game:GetService("SoundService")
local UserInputService = game:GetService("UserInputService")

ReplicatedFirst:RemoveDefaultLoadingScreen()

pcall(function()
	StarterGui:SetCoreGuiEnabled(Enum.CoreGuiType.All, false)
	StarterGui:SetCore("TopbarEnabled", false)
end)

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local old = playerGui:FindFirstChild("CrownChaosLoadingScreen")
if old then
	old:Destroy()
end

local function make(className, props, parent)
	local object = Instance.new(className)
	for key, value in pairs(props or {}) do
		object[key] = value
	end
	object.Parent = parent
	return object
end

local COLOR_SKY = Color3.fromRGB(18, 20, 31)
local COLOR_CLOUD = Color3.fromRGB(42, 45, 58)
local COLOR_STONE = Color3.fromRGB(43, 43, 49)
local COLOR_GOLD = Color3.fromRGB(198, 160, 78)
local COLOR_PURPLE = Color3.fromRGB(141, 46, 255)
local COLOR_MAGENTA = Color3.fromRGB(209, 70, 255)
local COLOR_FOG = Color3.fromRGB(75, 59, 99)
local COLOR_MOON = Color3.fromRGB(174, 184, 216)
local COLOR_BLACK = Color3.fromRGB(17, 17, 22)

local gui = make("ScreenGui", {
	Name = "CrownChaosLoadingScreen",
	IgnoreGuiInset = true,
	ResetOnSpawn = false,
	DisplayOrder = 1000000,
	ZIndexBehavior = Enum.ZIndexBehavior.Sibling,
}, playerGui)

local root = make("Frame", {
	Name = "Root",
	Size = UDim2.fromScale(1, 1),
	BackgroundColor3 = COLOR_SKY,
	BorderSizePixel = 0,
}, gui)

make("UIGradient", {
	Color = ColorSequence.new({
		ColorSequenceKeypoint.new(0, Color3.fromRGB(5, 6, 10)),
		ColorSequenceKeypoint.new(0.40, COLOR_SKY),
		ColorSequenceKeypoint.new(1, Color3.fromRGB(3, 3, 7)),
	}),
	Rotation = 90,
}, root)

local viewport = make("ViewportFrame", {
	Name = "CinematicCrownScene",
	Size = UDim2.fromScale(1, 1),
	BackgroundTransparency = 1,
	Ambient = Color3.fromRGB(16, 14, 24),
	LightColor = COLOR_MOON,
	LightDirection = Vector3.new(-0.65, -0.42, -0.35),
	ZIndex = 8,
}, root)

local camera = Instance.new("Camera")
camera.Name = "LowAngleLoadingCamera"
camera.CFrame = CFrame.lookAt(Vector3.new(0, 4.2, 27), Vector3.new(0, 10.8, 0))
camera.FieldOfView = 34
camera.Parent = viewport
viewport.CurrentCamera = camera

local world = make("WorldModel", { Name = "LoadingWorld" }, viewport)
local arena = make("Model", { Name = "LowerThirdArenaSilhouette" }, world)
local crown = make("Model", { Name = "FloatingCrownHero" }, world)
local sky = make("Model", { Name = "ApocalypticSkyDepth" }, world)
local foreground = make("Model", { Name = "ForegroundDepth" }, world)

local function part(name, size, cframe, color, material, parent, transparency)
	local p = Instance.new("Part")
	p.Name = name
	p.Anchored = true
	p.CanCollide = false
	p.CanQuery = false
	p.CanTouch = false
	p.CastShadow = false
	p.Size = size
	p.CFrame = cframe
	p.Color = color
	p.Material = material or Enum.Material.SmoothPlastic
	p.Transparency = transparency or 0
	p.Parent = parent
	return p
end

local function ball(name, size, cframe, color, material, parent, transparency)
	local p = part(name, Vector3.new(size, size, size), cframe, color, material or Enum.Material.Neon, parent, transparency)
	p.Shape = Enum.PartType.Ball
	return p
end

local function wedge(name, size, cframe, color, material, parent, transparency)
	local p = Instance.new("WedgePart")
	p.Name = name
	p.Anchored = true
	p.CanCollide = false
	p.CanQuery = false
	p.CanTouch = false
	p.CastShadow = false
	p.Size = size
	p.CFrame = cframe
	p.Color = color
	p.Material = material or Enum.Material.SmoothPlastic
	p.Transparency = transparency or 0
	p.Parent = parent
	return p
end

local function segment(name, a, b, thickness, color, material, parent, transparency)
	local mid = (a + b) * 0.5
	local length = (b - a).Magnitude
	return part(name, Vector3.new(thickness, thickness, length), CFrame.lookAt(mid, b), color, material, parent, transparency)
end

local function radial(radius, angle, y, tangentOffset)
	local r = Vector3.new(math.cos(angle), 0, math.sin(angle))
	local t = Vector3.new(-math.sin(angle), 0, math.cos(angle))
	local pos = r * radius + t * (tangentOffset or 0) + Vector3.new(0, y, 0)
	return CFrame.lookAt(pos, pos + r, Vector3.yAxis)
end

local baseCameraPosition = Vector3.new(0, 4.2, 27)
local baseCameraLookAt = Vector3.new(0, 10.8, 0)
local parallax = Vector2.zero
local lightningParts = {}
local fogParts = {}
local foregroundChains = {}
local crownChains = {}

ball("EclipsedMoonGlow", 5.8, CFrame.new(-5.8, 24.5, -28), COLOR_MOON, Enum.Material.Neon, sky, 0.42)
ball("EclipsedMoonShadow", 5.35, CFrame.new(-4.6, 24.9, -27.7), COLOR_SKY, Enum.Material.SmoothPlastic, sky, 0.04)
ball("DistantMoonCorona", 7.4, CFrame.new(-6.1, 24.5, -28.4), COLOR_PURPLE, Enum.Material.Neon, sky, 0.86)

for i = 1, 10 do
	local x = -18 + i * 4.0
	local y = 17.8 + (i % 4) * 1.1
	local z = -25 - (i % 3) * 1.5
	part("StormCloudMass" .. i, Vector3.new(5.5 + (i % 3) * 1.4, 0.32, 1.2), CFrame.new(x, y, z) * CFrame.Angles(0, math.rad(i * 9), 0), COLOR_CLOUD, Enum.Material.Slate, sky, 0.42)
end

for i = 1, 4 do
	local x = -12 + i * 5.7
	lightningParts[i] = segment("PurpleLightningFracture" .. i, Vector3.new(x, 19 + i % 2, -24), Vector3.new(x + 2.2, 15.5 - i % 2, -22.5), 0.055, COLOR_MAGENTA, Enum.Material.Neon, sky, 1)
end

for i = 1, 22 do
	local x = -18 + i * 1.72
	local y = 14 + ((i * 7) % 9) * 0.62
	local z = -12 - (i % 4) * 2
	local ruin = part("DistantFloatingRuin" .. i, Vector3.new(0.55 + (i % 3) * 0.32, 0.10, 0.20), CFrame.new(x, y, z) * CFrame.Angles(0, math.rad(i * 17), math.rad(i * 11)), COLOR_CLOUD, Enum.Material.Slate, sky, 0.18)
	ruin.Color = if i % 5 == 0 then COLOR_PURPLE else COLOR_CLOUD
	ruin.Transparency = if i % 5 == 0 then 0.42 else 0.20
end

for i = 1, 5 do
	local x = -16 + i * 6.5
	part("DimTowerSilhouette" .. i, Vector3.new(1.8, 12 + i % 3 * 3, 1.2), CFrame.new(x, 4.5 + i % 3, -15), COLOR_STONE, Enum.Material.Basalt, sky, 0.10)
end

for i = 1, 34 do
	local angle = math.rad(-150 + i * 9)
	local radius = 8.4
	local height = 1.4 + (i % 5) * 0.34
	part("ArenaOuterWallSegment" .. i, Vector3.new(0.78, height, 0.34), radial(radius, angle, 1.2 + height * 0.5), COLOR_STONE, Enum.Material.Basalt, arena, 0.04)
	if i % 3 == 0 then
		part("ArenaGoldRim" .. i, Vector3.new(0.52, 0.08, 0.07), radial(radius + 0.06, angle, 3.35), COLOR_GOLD, Enum.Material.Metal, arena, 0.12)
	end
end

for i = 1, 18 do
	local angle = math.rad(-145 + i * 16)
	part("SeatingLayerShadow" .. i, Vector3.new(1.1, 0.10, 0.08), radial(7.15 + (i % 4) * 0.24, angle, 2.35 + (i % 3) * 0.24), COLOR_CLOUD, Enum.Material.Slate, arena, 0.22)
end

part("CentralArenaPlatformSilhouette", Vector3.new(4.9, 0.35, 1.2), CFrame.new(0, 2.0, 1.25), COLOR_STONE, Enum.Material.Basalt, arena, 0.08)
part("BrokenNorthBridgeSilhouette", Vector3.new(1.15, 0.16, 3.6), CFrame.new(0, 1.85, 3.2) * CFrame.Angles(math.rad(-5), 0, 0), COLOR_STONE, Enum.Material.Basalt, arena, 0.18)
part("ThroneDistrictBlockout", Vector3.new(2.4, 5.1, 0.75), CFrame.new(-6.8, 4.15, -7.5) * CFrame.Angles(0, math.rad(4), 0), COLOR_STONE, Enum.Material.Basalt, arena, 0.20)
part("TitanTowerLeanLeft", Vector3.new(1.3, 8.8, 0.9), CFrame.new(8.4, 5.0, -9.0) * CFrame.Angles(0, 0, math.rad(-8)), COLOR_STONE, Enum.Material.Basalt, arena, 0.18)
part("TitanTowerLeanRight", Vector3.new(1.0, 7.1, 0.8), CFrame.new(10.0, 4.2, -8.2) * CFrame.Angles(0, 0, math.rad(10)), COLOR_STONE, Enum.Material.Basalt, arena, 0.28)
for i = 1, 8 do
	local angle = math.rad(-120 + i * 30)
	local radius = 9.35
	part("ColosseumArchVoid" .. i, Vector3.new(0.44, 2.8 + (i % 2) * 0.6, 0.24), radial(radius, angle, 3.7), COLOR_BLACK, Enum.Material.SmoothPlastic, arena, 0.22)
end

for i = 1, 9 do
	local side = if i % 2 == 0 then -1 else 1
	local x = side * (8.5 + (i % 3) * 1.3)
	local y = 5.0 + i * 0.55
	local z = 4.8 - i * 0.70
	local chain = part("ForegroundChainLink" .. i, Vector3.new(0.22, 0.75, 0.08), CFrame.new(x, y, z) * CFrame.Angles(math.rad(64), math.rad(i * 18), math.rad(22)), COLOR_BLACK, Enum.Material.Metal, foreground, 0.25)
	chain.Shape = Enum.PartType.Cylinder
	foregroundChains[i] = chain
end
part("LeftForegroundPillar", Vector3.new(1.2, 9.5, 1.0), CFrame.new(-11.5, 3.2, 5.4) * CFrame.Angles(0, 0, math.rad(-5)), COLOR_STONE, Enum.Material.Basalt, foreground, 0.18)
part("RightForegroundBanner", Vector3.new(0.32, 5.8, 0.08), CFrame.new(10.2, 6.4, 3.3) * CFrame.Angles(0, math.rad(-16), math.rad(3)), COLOR_GOLD, Enum.Material.Fabric, foreground, 0.28)

for i = 1, 104 do
	local angle = (i / 104) * math.pi * 2
	part("LowerCrownRim" .. i, Vector3.new(0.48, 0.15, 0.14), radial(4.15, angle, 8.35), COLOR_GOLD, Enum.Material.Metal, crown, 0)
	if i % 2 == 0 then
		part("UpperCrownRim" .. i, Vector3.new(0.38, 0.10, 0.10), radial(3.95, angle, 9.75), COLOR_GOLD, Enum.Material.Metal, crown, 0.04)
	end
end

for i = 1, 24 do
	local angle = -math.pi / 2 + (i - 1) / 24 * math.pi * 2
	part("CrownPlate" .. i, Vector3.new(0.74, 1.12, 0.18), radial(4.05, angle, 9.02), if i % 4 == 0 then Color3.fromRGB(106, 78, 35) else COLOR_GOLD, Enum.Material.Metal, crown, 0)
	part("CrownDarkInset" .. i, Vector3.new(0.44, 0.58, 0.06), radial(4.24, angle, 9.02), COLOR_BLACK, Enum.Material.Metal, crown, 0.02)
	if i % 6 == 0 then
		part("ThinCorruptionCrack" .. i, Vector3.new(0.050, 0.96, 0.06), radial(4.36, angle, 9.08), COLOR_PURPLE, Enum.Material.Neon, crown, 0.10)
	end
	if i % 8 == 0 then
		ball("SmallCrownGem" .. i, 0.28, radial(4.46, angle, 9.04), COLOR_MAGENTA, Enum.Material.Neon, crown, 0.05)
	end
end

local toothSpecs = {
	{a = -90, h = 5.7, w = 1.02},
	{a = -122, h = 4.35, w = 0.82},
	{a = -58, h = 4.15, w = 0.82},
	{a = -154, h = 3.35, w = 0.72},
	{a = -26, h = 3.12, w = 0.72},
	{a = 180, h = 3.65, w = 0.78},
	{a = 128, h = 2.85, w = 0.64},
	{a = 42, h = 2.90, w = 0.64},
}
for i, spec in ipairs(toothSpecs) do
	local angle = math.rad(spec.a)
	local y = 9.55 + spec.h / 2
	part("GothicCrownTooth" .. i, Vector3.new(spec.w, spec.h, 0.20), radial(3.88, angle, y), if i == 1 then Color3.fromRGB(235, 196, 102) else COLOR_GOLD, Enum.Material.Metal, crown, 0)
	part("ToothVoidInset" .. i, Vector3.new(spec.w * 0.32, spec.h * 0.58, 0.055), radial(4.06, angle, y - 0.12), COLOR_BLACK, Enum.Material.Metal, crown, 0.02)
	wedge("CrownBladeTip" .. i, Vector3.new(spec.w * 0.72, 0.72, 0.20), radial(3.96, angle, 9.78 + spec.h) * CFrame.Angles(math.rad(180), 0, 0), if i == 1 then Color3.fromRGB(240, 206, 120) else COLOR_GOLD, Enum.Material.Metal, crown, 0)
	if i <= 4 then
		part("ToothEnergyVein" .. i, Vector3.new(0.055, spec.h * 0.72, 0.055), radial(4.20, angle, y), COLOR_PURPLE, Enum.Material.Neon, crown, 0.06)
	end
end

for i = 1, 10 do
	local angle = math.rad(116 + i * 5)
	part("BrokenCrownFragment" .. i, Vector3.new(0.34 + (i % 2) * 0.20, 0.44, 0.13), radial(4.55 + (i % 3) * 0.12, angle, 8.55 + (i % 4) * 0.30), if i % 3 == 0 then COLOR_BLACK else COLOR_GOLD, Enum.Material.Metal, crown, 0.03)
end

local beamOuter = part("CrownBeamFogColumn", Vector3.new(1.9, 34, 1.9), CFrame.new(0, 17.4, 0), COLOR_PURPLE, Enum.Material.Neon, world, 0.68)
local beamCore = part("CrownBeamCore", Vector3.new(0.48, 38, 0.48), CFrame.new(0, 18.7, 0), Color3.fromRGB(214, 230, 255), Enum.Material.Neon, world, 0.26)
local beamCrossA = part("CrownBeamCrossA", Vector3.new(4.4, 32, 0.06), CFrame.new(0, 17.4, 0), COLOR_PURPLE, Enum.Material.Neon, world, 0.86)
local beamCrossB = part("CrownBeamCrossB", Vector3.new(0.06, 32, 4.4), CFrame.new(0, 17.4, 0), COLOR_PURPLE, Enum.Material.Neon, world, 0.86)

crownChains[1] = segment("CrownSkyChainLeft", Vector3.new(-3.75, 12.2, 0), Vector3.new(-8.9, 24.5, -7.5), 0.09, COLOR_BLACK, Enum.Material.Metal, world, 0.22)
crownChains[2] = segment("CrownSkyChainRight", Vector3.new(3.75, 12.2, 0), Vector3.new(8.6, 24.1, -6.9), 0.09, COLOR_BLACK, Enum.Material.Metal, world, 0.22)
crownChains[3] = segment("CrownSkyChainRear", Vector3.new(0.0, 12.2, -3.4), Vector3.new(0.8, 25.2, -10.2), 0.08, COLOR_BLACK, Enum.Material.Metal, world, 0.35)

for i = 1, 9 do
	local fog = part("AtmosphericFogBand" .. i, Vector3.new(18 + i * 1.4, 0.05, 0.20), CFrame.new(0, 3.2 + i * 1.12, -5.5 - i * 0.35) * CFrame.Angles(0, math.rad(i * 7), 0), COLOR_FOG, Enum.Material.Neon, world, 0.82)
	fog.Shape = Enum.PartType.Cylinder
	fogParts[i] = fog
end

local ashParts = {}
for i = 1, 38 do
	local x = -15 + ((i * 7) % 31)
	local y = 1.5 + ((i * 11) % 19)
	local z = -8 + ((i * 5) % 14)
	local ash = ball("DriftingAsh" .. i, 0.05 + (i % 3) * 0.018, CFrame.new(x, y, z), if i % 7 == 0 then COLOR_PURPLE else COLOR_GOLD, Enum.Material.Neon, world, 0.28)
	ashParts[i] = ash
end

local titleBlock = make("Frame", {
	Name = "TitleBlock",
	AnchorPoint = Vector2.new(0, 1),
	Position = UDim2.fromScale(0.075, 0.91),
	Size = UDim2.fromScale(0.52, 0.18),
	BackgroundTransparency = 1,
	ZIndex = 30,
}, root)

local title = make("TextLabel", {
	Name = "Title",
	Size = UDim2.fromScale(1, 0.38),
	BackgroundTransparency = 1,
	Font = Enum.Font.Garamond,
	Text = "CROWN CHAOS",
	TextXAlignment = Enum.TextXAlignment.Left,
	TextColor3 = COLOR_GOLD,
	TextScaled = true,
	TextStrokeColor3 = Color3.fromRGB(0, 0, 0),
	TextStrokeTransparency = 0.36,
	ZIndex = 31,
}, titleBlock)

local tagline = make("TextLabel", {
	Name = "Tagline",
	Position = UDim2.fromScale(0, 0.38),
	Size = UDim2.fromScale(1, 0.19),
	BackgroundTransparency = 1,
	Font = Enum.Font.Garamond,
	Text = "ONLY ONE MAY ASCEND",
	TextXAlignment = Enum.TextXAlignment.Left,
	TextColor3 = Color3.fromRGB(226, 217, 192),
	TextScaled = true,
	TextTransparency = 0.08,
	ZIndex = 31,
}, titleBlock)

local progressShell = make("Frame", {
	Name = "ProgressShell",
	Position = UDim2.fromScale(0, 0.72),
	Size = UDim2.fromScale(0.58, 0.030),
	BackgroundColor3 = Color3.fromRGB(12, 11, 17),
	BorderSizePixel = 0,
	ZIndex = 32,
}, titleBlock)
make("UICorner", { CornerRadius = UDim.new(1, 0) }, progressShell)
make("UIStroke", { Color = COLOR_GOLD, Thickness = 1, Transparency = 0.42 }, progressShell)

local progressFill = make("Frame", {
	Name = "ProgressFill",
	Size = UDim2.fromScale(0.05, 1),
	BackgroundColor3 = COLOR_PURPLE,
	BorderSizePixel = 0,
	ZIndex = 33,
}, progressShell)
make("UICorner", { CornerRadius = UDim.new(1, 0) }, progressFill)
make("UIGradient", { Color = ColorSequence.new(COLOR_PURPLE, COLOR_GOLD) }, progressFill)

local status = make("TextLabel", {
	Name = "Status",
	Position = UDim2.fromScale(0, 0.80),
	Size = UDim2.fromScale(0.82, 0.17),
	BackgroundTransparency = 1,
	Font = Enum.Font.Garamond,
	Text = "The crown returns...",
	TextXAlignment = Enum.TextXAlignment.Left,
	TextColor3 = Color3.fromRGB(185, 176, 204),
	TextScaled = true,
	TextTransparency = 0.12,
	ZIndex = 31,
}, titleBlock)

local vignette = make("Frame", {
	Name = "CinematicVignette",
	Size = UDim2.fromScale(1, 1),
	BackgroundColor3 = Color3.fromRGB(0, 0, 0),
	BackgroundTransparency = 0.20,
	BorderSizePixel = 0,
	ZIndex = 40,
}, root)
make("UIGradient", {
	Transparency = NumberSequence.new({
		NumberSequenceKeypoint.new(0, 0.05),
		NumberSequenceKeypoint.new(0.34, 0.96),
		NumberSequenceKeypoint.new(0.72, 0.90),
		NumberSequenceKeypoint.new(1, 0.06),
	}),
	Rotation = 0,
}, vignette)

local cinematicFade = make("Frame", {
	Name = "CinematicBlackFade",
	Size = UDim2.fromScale(1, 1),
	BackgroundColor3 = Color3.fromRGB(0, 0, 0),
	BackgroundTransparency = 0,
	BorderSizePixel = 0,
	ZIndex = 60,
}, root)
TweenService:Create(cinematicFade, TweenInfo.new(1.05, Enum.EasingStyle.Quint, Enum.EasingDirection.Out), { BackgroundTransparency = 1 }):Play()

local ambientHum = Instance.new("Sound")
ambientHum.Name = "LoadingAmbientHum"
ambientHum.Volume = 0.18
ambientHum.Looped = true
ambientHum.SoundId = "rbxassetid://0"
ambientHum.Parent = SoundService

local startedAt = os.clock()
local minimumDuration = 5.2
local finished = false
local fading = false
local statusLines = {
	"The crown returns...",
	"Fog rises through the arena...",
	"Chains wake beneath the stone...",
	"The kingdom trembles...",
}

local line = 1
task.spawn(function()
	while not finished do
		task.wait(0.95)
		line = (line % #statusLines) + 1
		status.Text = statusLines[line]
	end
end)

task.spawn(function()
	if not game:IsLoaded() then
		game.Loaded:Wait()
	end
	local remaining = minimumDuration - (os.clock() - startedAt)
	if remaining > 0 then
		task.wait(remaining)
	end
	finished = true
end)

local function fadeOut()
	if fading then
		return
	end
	fading = true
	status.Text = "Enter the arena."
	local tweenInfo = TweenInfo.new(0.85, Enum.EasingStyle.Quint, Enum.EasingDirection.Out)
	for _, object in ipairs(gui:GetDescendants()) do
		if object:IsA("GuiObject") then
			TweenService:Create(object, tweenInfo, { BackgroundTransparency = 1 }):Play()
			if object:IsA("TextLabel") or object:IsA("TextButton") then
				TweenService:Create(object, tweenInfo, { TextTransparency = 1, TextStrokeTransparency = 1 }):Play()
			end
			if object:IsA("ViewportFrame") then
				TweenService:Create(object, tweenInfo, { ImageTransparency = 1 }):Play()
			end
		elseif object:IsA("UIStroke") then
			TweenService:Create(object, tweenInfo, { Transparency = 1 }):Play()
		end
	end
	task.delay(0.95, function()
		pcall(function()
			StarterGui:SetCoreGuiEnabled(Enum.CoreGuiType.All, true)
			StarterGui:SetCore("TopbarEnabled", true)
		end)
		ambientHum:Destroy()
		gui:Destroy()
	end)
end

RunService.RenderStepped:Connect(function()
	local t = os.clock() - startedAt
	local progress = math.clamp(t / minimumDuration, 0.03, 1)
	progressFill.Size = UDim2.fromScale(progress, 1)

	local mouse = UserInputService:GetMouseLocation()
	local viewportCenter = viewport.AbsolutePosition + viewport.AbsoluteSize * 0.5
	local viewportSize = Vector2.new(math.max(viewport.AbsoluteSize.X, 1), math.max(viewport.AbsoluteSize.Y, 1))
	local targetParallax = Vector2.new(
		math.clamp((mouse.X - viewportCenter.X) / (viewportSize.X * 0.5), -1, 1),
		math.clamp((mouse.Y - viewportCenter.Y) / (viewportSize.Y * 0.5), -1, 1)
	)
	parallax = parallax:Lerp(targetParallax, 0.055)
	local camOffset = Vector3.new(parallax.X * 0.58, -parallax.Y * 0.28 + math.sin(t * 0.22) * 0.08, math.sin(t * 0.18) * 0.28)
	local lookOffset = Vector3.new(parallax.X * 0.18, -parallax.Y * 0.12, 0)
	camera.CFrame = camera.CFrame:Lerp(CFrame.lookAt(baseCameraPosition + camOffset, baseCameraLookAt + lookOffset), 0.08)

	crown:PivotTo(CFrame.new(0, 10.2 + math.sin(t * 1.2) * 0.16, 0) * CFrame.Angles(0, t * 0.12, 0))
	beamOuter.Transparency = 0.64 + math.sin(t * 2.8) * 0.05
	beamCore.Transparency = 0.22 + math.sin(t * 4.2) * 0.04
	beamCrossA.Transparency = 0.84 + math.sin(t * 2.4) * 0.035
	beamCrossB.Transparency = 0.85 + math.cos(t * 2.1) * 0.030
	camera.FieldOfView = 34 + math.sin(t * 0.45) * 0.35

	for i, fog in ipairs(fogParts) do
		fog.CFrame = fog.CFrame * CFrame.Angles(0, math.rad(0.010 + i * 0.002), 0)
	end

	for i, chain in ipairs(foregroundChains) do
		chain.CFrame = chain.CFrame * CFrame.Angles(0, 0, math.sin(t * 0.9 + i) * 0.0008)
	end

	for i, chain in ipairs(crownChains) do
		chain.Transparency = 0.24 + math.sin(t * 0.8 + i) * 0.06
	end

	for i, ash in ipairs(ashParts) do
		ash.CFrame *= CFrame.new(0, 0.006 + (i % 3) * 0.002, 0) * CFrame.Angles(0, math.rad(0.08 * (i % 5)), 0)
	end

	if t > 2.6 and math.floor(t * 2) % 9 == 0 then
		viewport.LightColor = COLOR_MAGENTA:Lerp(COLOR_MOON, 0.62)
		for _, bolt in ipairs(lightningParts) do
			bolt.Transparency = 0.18
		end
	else
		viewport.LightColor = COLOR_MOON
		for _, bolt in ipairs(lightningParts) do
			bolt.Transparency = 1
		end
	end

	if finished then
		fadeOut()
	end
end)
