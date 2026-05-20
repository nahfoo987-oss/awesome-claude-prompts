local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local StarterPlayer = game:GetService("StarterPlayer")
local TweenService = game:GetService("TweenService")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")
local StarterGui = game:GetService("StarterGui")
local TextChatService = game:GetService("TextChatService")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")
local camera = workspace.CurrentCamera

local COLOR_SKY = Color3.fromRGB(18, 20, 31)
local COLOR_STONE = Color3.fromRGB(43, 43, 49)
local COLOR_STONE_DARK = Color3.fromRGB(17, 17, 22)
local COLOR_STONE_LIT = Color3.fromRGB(58, 58, 68)
local COLOR_STONE_GROOVE = Color3.fromRGB(8, 8, 12)
local COLOR_BANNER = Color3.fromRGB(42, 18, 74)
local COLOR_ASH = Color3.fromRGB(86, 82, 90)
local COLOR_GOLD = Color3.fromRGB(198, 160, 78)
local COLOR_PURPLE = Color3.fromRGB(141, 46, 255)
local COLOR_MAGENTA = Color3.fromRGB(209, 70, 255)
local COLOR_MOON = Color3.fromRGB(174, 184, 216)
local COLOR_CRIMSON = Color3.fromRGB(122, 27, 27)

local MENU_NAME = "CrownChaos3DMainMenu"
local SCENE_NAME = "CrownChaos3DMenuScene"

local function make(className, props, parent)
	local object = Instance.new(className)
	for key, value in pairs(props or {}) do
		object[key] = value
	end
	object.Parent = parent
	return object
end

local function part(name, size, cframe, color, material, parent, transparency)
	local object = Instance.new("Part")
	object.Name = name
	object.Anchored = true
	object.CanCollide = false
	object.CanTouch = false
	object.CanQuery = false
	object.CastShadow = false
	object.Size = size
	object.CFrame = cframe
	object.Color = color
	object.Material = material or Enum.Material.SmoothPlastic
	object.Transparency = transparency or 0
	object.Parent = parent
	return object
end

local function ball(name, size, cframe, color, material, parent, transparency)
	local object = part(name, Vector3.new(size, size, size), cframe, color, material or Enum.Material.Neon, parent, transparency)
	object.Shape = Enum.PartType.Ball
	return object
end

local function cylinder(name, size, cframe, color, material, parent, transparency)
	local object = part(name, size, cframe, color, material or Enum.Material.SmoothPlastic, parent, transparency)
	object.Shape = Enum.PartType.Cylinder
	return object
end

local function wedge(name, size, cframe, color, material, parent, transparency)
	local object = Instance.new("WedgePart")
	object.Name = name
	object.Anchored = true
	object.CanCollide = false
	object.CanTouch = false
	object.CanQuery = false
	object.CastShadow = false
	object.Size = size
	object.CFrame = cframe
	object.Color = color
	object.Material = material or Enum.Material.SmoothPlastic
	object.Transparency = transparency or 0
	object.Parent = parent
	return object
end

local function lookAt(position, target)
	return CFrame.lookAt(position, target, Vector3.yAxis)
end

local function clearOld()
	local oldGui = playerGui:FindFirstChild(MENU_NAME)
	if oldGui then
		oldGui:Destroy()
	end

	for _, child in ipairs(playerGui:GetChildren()) do
		if child:IsA("SurfaceGui") and child.Name:find("^CrownChaos3DMenu_") then
			child:Destroy()
		end
	end

	local oldScene = workspace:FindFirstChild(SCENE_NAME)
	if oldScene then
		oldScene:Destroy()
	end
end

local function waitForLoadingScreen()
	-- Preload behind the loading screen so there is no dead pause between scenes.
	return
end

waitForLoadingScreen()
clearOld()

pcall(function()
	StarterGui:SetCoreGuiEnabled(Enum.CoreGuiType.All, false)
	StarterGui:SetCoreGuiEnabled(Enum.CoreGuiType.Chat, false)
	StarterGui:SetCore("TopbarEnabled", false)
end)

pcall(function()
	TextChatService.BubbleChatConfiguration.Enabled = false
	TextChatService.ChatWindowConfiguration.Enabled = false
	TextChatService.ChatInputBarConfiguration.Enabled = false
end)

local gui = make("ScreenGui", {
	Name = MENU_NAME,
	IgnoreGuiInset = true,
	ResetOnSpawn = false,
	DisplayOrder = 900000,
	ZIndexBehavior = Enum.ZIndexBehavior.Sibling,
}, playerGui)

local fade = make("Frame", {
	Name = "Fade",
	Size = UDim2.fromScale(1, 1),
	BackgroundColor3 = Color3.fromRGB(0, 0, 0),
	BackgroundTransparency = 1,
	BorderSizePixel = 0,
	ZIndex = 100,
}, gui)

local titleBlock = make("Frame", {
	Name = "TitleBlock",
	AnchorPoint = Vector2.new(0, 0),
	Position = UDim2.fromScale(0.055, 0.070),
	Size = UDim2.fromScale(0.31, 0.105),
	BackgroundTransparency = 1,
	ZIndex = 20,
}, gui)

make("TextLabel", {
	Name = "Title",
	Size = UDim2.fromScale(1, 0.44),
	BackgroundTransparency = 1,
	Font = Enum.Font.Garamond,
	Text = "CROWN CHAOS",
	TextXAlignment = Enum.TextXAlignment.Left,
	TextColor3 = COLOR_GOLD,
	TextScaled = true,
	TextStrokeColor3 = Color3.fromRGB(0, 0, 0),
	TextStrokeTransparency = 0.35,
	ZIndex = 21,
}, titleBlock)

make("TextLabel", {
	Name = "Subtitle",
	Position = UDim2.fromScale(0, 0.48),
	Size = UDim2.fromScale(1, 0.28),
	BackgroundTransparency = 1,
	Font = Enum.Font.Garamond,
	Text = "THE ROYAL ASCENSION",
	TextXAlignment = Enum.TextXAlignment.Left,
	TextColor3 = Color3.fromRGB(226, 217, 192),
	TextScaled = true,
	TextTransparency = 0.08,
	ZIndex = 21,
}, titleBlock)

local detailPanel = make("Frame", {
	Name = "DetailPanel",
	AnchorPoint = Vector2.new(1, 0.5),
	Position = UDim2.fromScale(0.955, 0.58),
	Size = UDim2.fromScale(0.28, 0.34),
	BackgroundColor3 = Color3.fromRGB(8, 8, 13),
	BackgroundTransparency = 0.22,
	BorderSizePixel = 0,
	Visible = false,
	ZIndex = 40,
}, gui)
make("UICorner", { CornerRadius = UDim.new(0, 8) }, detailPanel)
make("UIStroke", { Color = COLOR_GOLD, Thickness = 1.4, Transparency = 0.28 }, detailPanel)
make("UIGradient", {
	Color = ColorSequence.new({
		ColorSequenceKeypoint.new(0, Color3.fromRGB(18, 16, 24)),
		ColorSequenceKeypoint.new(1, Color3.fromRGB(6, 5, 11)),
	}),
	Rotation = 90,
}, detailPanel)

local detailTitle = make("TextLabel", {
	Name = "DetailTitle",
	Position = UDim2.fromScale(0.08, 0.08),
	Size = UDim2.fromScale(0.84, 0.16),
	BackgroundTransparency = 1,
	Font = Enum.Font.Garamond,
	Text = "",
	TextXAlignment = Enum.TextXAlignment.Left,
	TextColor3 = COLOR_GOLD,
	TextScaled = true,
	ZIndex = 41,
}, detailPanel)

local detailBody = make("TextLabel", {
	Name = "DetailBody",
	Position = UDim2.fromScale(0.08, 0.30),
	Size = UDim2.fromScale(0.84, 0.48),
	BackgroundTransparency = 1,
	Font = Enum.Font.Garamond,
	Text = "",
	TextXAlignment = Enum.TextXAlignment.Left,
	TextYAlignment = Enum.TextYAlignment.Top,
	TextWrapped = true,
	TextColor3 = Color3.fromRGB(218, 212, 230),
	TextScaled = true,
	ZIndex = 41,
}, detailPanel)

local detailAction = make("TextButton", {
	Name = "DetailAction",
	AnchorPoint = Vector2.new(0.5, 1),
	Position = UDim2.fromScale(0.5, 0.91),
	Size = UDim2.fromScale(0.64, 0.13),
	BackgroundColor3 = COLOR_PURPLE,
	BorderSizePixel = 0,
	Font = Enum.Font.Garamond,
	Text = "OPEN",
	TextColor3 = Color3.fromRGB(255, 248, 230),
	TextScaled = true,
	ZIndex = 42,
}, detailPanel)
make("UICorner", { CornerRadius = UDim.new(0, 6) }, detailAction)

local scene = Instance.new("Folder")
scene.Name = SCENE_NAME
scene.Parent = workspace

local character = player.Character or player.CharacterAdded:Wait()
local humanoid = character:FindFirstChildOfClass("Humanoid")
local rootPart = character:FindFirstChild("HumanoidRootPart")
local originalRootCFrame = rootPart and rootPart.CFrame
local originalWalkSpeed = humanoid and humanoid.WalkSpeed
local originalJumpPower = humanoid and humanoid.JumpPower
local originalJumpHeight = humanoid and humanoid.JumpHeight
local hiddenCharacterParts = {}
local hiddenCharacterGuis = {}

if humanoid then
	humanoid.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.None
	humanoid.WalkSpeed = 0
	humanoid.JumpPower = 0
	humanoid.JumpHeight = 0
end

if rootPart then
	rootPart.Anchored = true
	rootPart.CFrame = lookAt(Vector3.new(0, 5.0, 35), Vector3.new(0, 15, 82))
end

for _, descendant in ipairs(character:GetDescendants()) do
	if descendant:IsA("BasePart") then
		hiddenCharacterParts[descendant] = descendant.LocalTransparencyModifier
		descendant.LocalTransparencyModifier = 1
	elseif descendant:IsA("BillboardGui") or descendant:IsA("SurfaceGui") then
		hiddenCharacterGuis[descendant] = descendant.Enabled
		descendant.Enabled = false
	end
end

local baseCameraPosition = Vector3.new(0, 14.4, 88)
local baseCameraTarget = Vector3.new(0, 13.2, 43.5)
camera.CameraType = Enum.CameraType.Scriptable
camera.CFrame = lookAt(baseCameraPosition, baseCameraTarget)
camera.FieldOfView = 36

local backdrop = make("Model", { Name = "LobbyBackdrop" }, scene)
local buttonsModel = make("Model", { Name = "MenuDepthAnchors" }, scene)
local heroModel = make("Model", { Name = "CenteredPlayerHero" }, scene)
local motionParts = {}
local ashParts = {}
local buttonParts = {}
local surfaceGuis = {}
local heroCrownVfxParts = {}

part("AbyssSkyPlane", Vector3.new(240, 90, 1), CFrame.new(0, 32, -55), COLOR_SKY, Enum.Material.SmoothPlastic, backdrop, 0)
ball("EclipsedMoonGlow", 15, CFrame.new(-46, 42, -44), COLOR_MOON, Enum.Material.Neon, backdrop, 0.66)
ball("EclipsedMoonShadow", 13, CFrame.new(-42, 43, -43), COLOR_SKY, Enum.Material.SmoothPlastic, backdrop, 0.02)
ball("PurpleMoonCorona", 19, CFrame.new(-46, 42, -45), COLOR_PURPLE, Enum.Material.Neon, backdrop, 0.92)

for i = 1, 9 do
	local x = -70 + i * 16
	local y = 38 + (i % 3) * 3
	local z = -48 - (i % 2) * 3
	part("StormCloud" .. i, Vector3.new(20 + (i % 3) * 8, 2.2, 4.0), CFrame.new(x, y, z) * CFrame.Angles(0, math.rad(i * 5), 0), Color3.fromRGB(24, 26, 36), Enum.Material.Slate, backdrop, 0.28)
end

local floor = part("LobbyGatheringPlatform", Vector3.new(120, 1.0, 120), CFrame.new(0, 1.2, 1), Color3.fromRGB(31, 31, 37), Enum.Material.Basalt, backdrop, 0)
floor.Name = "LobbyGatheringPlatform"
part("GoldFloorAxis", Vector3.new(3, 0.10, 82), CFrame.new(0, 3.8, 1), COLOR_GOLD, Enum.Material.Metal, backdrop, 0.16)
part("GoldFloorCross", Vector3.new(82, 0.10, 3), CFrame.new(0, 3.82, 1), COLOR_GOLD, Enum.Material.Metal, backdrop, 0.20)

local function addFloorDetail()
	for i = -5, 5 do
		local x = i * 9.5
		part("FloorLongJoint" .. i, Vector3.new(0.08, 0.08, 92), CFrame.new(x, 3.92, 3), COLOR_STONE_GROOVE, Enum.Material.Basalt, backdrop, 0.58)
	end

	for i = -4, 5 do
		local z = -38 + i * 10
		part("FloorCrossJoint" .. i, Vector3.new(92, 0.08, 0.08), CFrame.new(0, 3.93, z), COLOR_STONE_GROOVE, Enum.Material.Basalt, backdrop, 0.64)
	end

	local cracks = {
		{ -26, 9, 18, 23, 0.20 },
		{ -18, 13, 11, -18, 0.32 },
		{ 20, 4, 21, -26, 0.22 },
		{ 29, -3, 9, 31, 0.32 },
		{ -7, -12, 16, -11, 0.25 },
		{ 10, -24, 22, 17, 0.30 },
		{ -39, -17, 13, -32, 0.37 },
		{ 41, 18, 12, 29, 0.36 },
	}
	for index, crack in ipairs(cracks) do
		part("PurpleFloorCrack" .. index, Vector3.new(crack[3], 0.10, 0.12), CFrame.new(crack[1], 4.02, crack[2]) * CFrame.Angles(0, math.rad(crack[4]), 0), COLOR_PURPLE, Enum.Material.Neon, backdrop, crack[5])
		part("DarkFloorSplit" .. index, Vector3.new(crack[3] + 1.4, 0.08, 0.08), CFrame.new(crack[1], 3.99, crack[2]) * CFrame.Angles(0, math.rad(crack[4] + 4), 0), COLOR_STONE_GROOVE, Enum.Material.Basalt, backdrop, 0.26)
	end

	for i = 1, 18 do
		local x = -48 + ((i * 17) % 96)
		local z = -28 + ((i * 23) % 60)
		local size = 0.55 + (i % 4) * 0.18
		ball("FloorDebrisPebble" .. i, size, CFrame.new(x, 4.16 + (i % 3) * 0.05, z), if i % 5 == 0 then COLOR_ASH else COLOR_STONE_LIT, Enum.Material.Basalt, backdrop, 0.18)
	end
end

local function addFacadePanel(prefix, x, y, z, width, height)
	part(prefix .. "PanelInset", Vector3.new(width, height, 0.18), CFrame.new(x, y, z), Color3.fromRGB(11, 11, 16), Enum.Material.Basalt, backdrop, 0.24)
	part(prefix .. "PanelTopGroove", Vector3.new(width + 0.5, 0.10, 0.22), CFrame.new(x, y + height * 0.5, z - 0.02), COLOR_STONE_GROOVE, Enum.Material.Basalt, backdrop, 0.20)
	part(prefix .. "PanelBottomGroove", Vector3.new(width + 0.5, 0.10, 0.22), CFrame.new(x, y - height * 0.5, z - 0.02), COLOR_STONE_GROOVE, Enum.Material.Basalt, backdrop, 0.20)
	part(prefix .. "PanelLeftGroove", Vector3.new(0.10, height + 0.4, 0.22), CFrame.new(x - width * 0.5, y, z - 0.02), COLOR_STONE_GROOVE, Enum.Material.Basalt, backdrop, 0.20)
	part(prefix .. "PanelRightGroove", Vector3.new(0.10, height + 0.4, 0.22), CFrame.new(x + width * 0.5, y, z - 0.02), COLOR_STONE_GROOVE, Enum.Material.Basalt, backdrop, 0.20)
end

local function addSurfaceCrack(prefix, x, y, z, length, rotation, color, transparency)
	part(prefix .. "Main", Vector3.new(length, 0.08, 0.10), CFrame.new(x, y, z) * CFrame.Angles(0, 0, math.rad(rotation)), color or COLOR_PURPLE, Enum.Material.Neon, backdrop, transparency or 0.32)
	part(prefix .. "BranchA", Vector3.new(length * 0.42, 0.07, 0.09), CFrame.new(x + length * 0.20, y + length * 0.05, z - 0.02) * CFrame.Angles(0, 0, math.rad(rotation + 32)), color or COLOR_PURPLE, Enum.Material.Neon, backdrop, (transparency or 0.32) + 0.08)
	part(prefix .. "BranchB", Vector3.new(length * 0.30, 0.07, 0.09), CFrame.new(x - length * 0.18, y - length * 0.04, z - 0.02) * CFrame.Angles(0, 0, math.rad(rotation - 28)), color or COLOR_PURPLE, Enum.Material.Neon, backdrop, (transparency or 0.32) + 0.12)
end

local function addBanner(prefix, x, y, z, width, height, tilt)
	local frame = part(prefix .. "TopBar", Vector3.new(width + 1.8, 0.38, 0.28), CFrame.new(x, y + height * 0.5, z) * CFrame.Angles(0, 0, math.rad(tilt or 0)), COLOR_GOLD, Enum.Material.Metal, backdrop, 0.12)
	part(prefix .. "Cloth", Vector3.new(width, height, 0.18), frame.CFrame * CFrame.new(0, -height * 0.50, -0.02), COLOR_BANNER, Enum.Material.Fabric, backdrop, 0.08)
	part(prefix .. "BottomFray", Vector3.new(width * 0.74, 0.25, 0.20), frame.CFrame * CFrame.new(0, -height - 0.15, -0.02), COLOR_GOLD, Enum.Material.Metal, backdrop, 0.28)
	part(prefix .. "SigilStem", Vector3.new(0.20, height * 0.48, 0.22), frame.CFrame * CFrame.new(0, -height * 0.48, -0.14), COLOR_GOLD, Enum.Material.Metal, backdrop, 0.22)
	part(prefix .. "SigilCrown", Vector3.new(width * 0.42, 0.22, 0.22), frame.CFrame * CFrame.new(0, -height * 0.27, -0.14), COLOR_GOLD, Enum.Material.Metal, backdrop, 0.22)
end

local function addBrazier(prefix, x, z)
	part(prefix .. "Pedestal", Vector3.new(1.6, 2.1, 1.6), CFrame.new(x, 4.85, z), COLOR_STONE_DARK, Enum.Material.Basalt, backdrop, 0.06)
	cylinder(prefix .. "Bowl", Vector3.new(2.4, 0.65, 2.4), CFrame.new(x, 6.22, z), COLOR_GOLD, Enum.Material.Metal, backdrop, 0.18)
	ball(prefix .. "FlameCore", 1.55, CFrame.new(x, 7.05, z), COLOR_PURPLE, Enum.Material.Neon, backdrop, 0.20)
	ball(prefix .. "FlameHotCenter", 0.72, CFrame.new(x, 7.20, z - 0.05), COLOR_MAGENTA, Enum.Material.Neon, backdrop, 0.10)
end

local function addSegmentedChain(prefix, fromPosition, toPosition, count)
	for i = 1, count do
		local alpha = i / (count + 1)
		local nextAlpha = (i + 0.55) / (count + 1)
		local a = fromPosition:Lerp(toPosition, alpha)
		local b = fromPosition:Lerp(toPosition, nextAlpha)
		local mid = (a + b) * 0.5
		local length = (b - a).Magnitude
		part(prefix .. "Link" .. i, Vector3.new(0.34 + (i % 2) * 0.10, 0.34, length), lookAt(mid, b) * CFrame.Angles(0, 0, math.rad((i % 2) * 90)), COLOR_STONE_DARK, Enum.Material.Metal, backdrop, 0.05)
	end
end

addFloorDetail()

local function addGoldBand(prefix, x, y, z, width, depth, thickness)
	part(prefix .. "GoldBand", Vector3.new(width, thickness or 0.24, depth), CFrame.new(x, y, z), COLOR_GOLD, Enum.Material.Metal, backdrop, 0.34)
end

local function addArchedWindow(prefix, x, y, z, width, height, glowTransparency)
	part(prefix .. "WindowGlow", Vector3.new(width, height, 0.28), CFrame.new(x, y, z), COLOR_PURPLE, Enum.Material.Neon, backdrop, glowTransparency or 0.36)
	ball(prefix .. "WindowCrownGlow", width * 0.92, CFrame.new(x, y + height * 0.50, z - 0.03), COLOR_PURPLE, Enum.Material.Neon, backdrop, 0.62)
	part(prefix .. "WindowCore", Vector3.new(width * 0.28, height * 0.86, 0.34), CFrame.new(x, y, z - 0.05), COLOR_MAGENTA, Enum.Material.Neon, backdrop, 0.18)
	part(prefix .. "LeftGoldMullion", Vector3.new(0.18, height + width * 0.44, 0.34), CFrame.new(x - width * 0.62, y + width * 0.16, z + 0.02), COLOR_GOLD, Enum.Material.Metal, backdrop, 0.24)
	part(prefix .. "RightGoldMullion", Vector3.new(0.18, height + width * 0.44, 0.34), CFrame.new(x + width * 0.62, y + width * 0.16, z + 0.02), COLOR_GOLD, Enum.Material.Metal, backdrop, 0.24)
	part(prefix .. "BottomGoldSill", Vector3.new(width + 1.15, 0.22, 0.34), CFrame.new(x, y - height * 0.54, z + 0.02), COLOR_GOLD, Enum.Material.Metal, backdrop, 0.22)
end

local function addTower(prefix, x, z, width, height, depth, windowCount, crownScale)
	local baseY = 4.0
	local centerY = baseY + height * 0.5
	part(prefix .. "Foundation", Vector3.new(width + 5.0, 4.2, depth + 1.6), CFrame.new(x, 4.4, z + 0.3), COLOR_STONE_DARK, Enum.Material.Basalt, backdrop, 0.04)
	part(prefix .. "LowerShaft", Vector3.new(width + 2.2, height * 0.34, depth + 0.9), CFrame.new(x, baseY + height * 0.17, z + 0.15), COLOR_STONE_DARK, Enum.Material.Basalt, backdrop, 0.04)
	part(prefix .. "MainShaft", Vector3.new(width, height, depth), CFrame.new(x, centerY, z), COLOR_STONE_DARK, Enum.Material.Basalt, backdrop, 0.02)
	part(prefix .. "InsetPanel", Vector3.new(width * 0.58, height * 0.80, 0.30), CFrame.new(x, centerY + 1.0, z + depth * 0.54), Color3.fromRGB(23, 23, 30), Enum.Material.Basalt, backdrop, 0.03)
	addFacadePanel(prefix .. "LowerStonePanel", x, baseY + height * 0.22, z + depth * 0.62, width * 0.66, height * 0.22)
	addFacadePanel(prefix .. "UpperStonePanel", x, baseY + height * 0.74, z + depth * 0.62, width * 0.60, height * 0.22)
	addSurfaceCrack(prefix .. "CorruptionHairline", x + width * 0.22, baseY + height * 0.46, z + depth * 0.68, height * 0.22, 66, COLOR_PURPLE, 0.46)

	for side = -1, 1, 2 do
		part(prefix .. "Buttress" .. side, Vector3.new(0.66, height + 3.2, depth + 0.72), CFrame.new(x + side * width * 0.60, centerY + 0.7, z + 0.06), COLOR_STONE_LIT, Enum.Material.Basalt, backdrop, 0.10)
		part(prefix .. "GoldEdge" .. side, Vector3.new(0.12, height + 2.8, depth + 0.86), CFrame.new(x + side * width * 0.70, centerY + 0.7, z + 0.09), COLOR_GOLD, Enum.Material.Metal, backdrop, 0.42)
	end

	addGoldBand(prefix .. "Low", x, baseY + height * 0.34, z + 0.08, width + 2.4, depth + 0.9, 0.24)
	addGoldBand(prefix .. "Mid", x, baseY + height * 0.63, z + 0.08, width + 1.4, depth + 0.8, 0.18)
	addGoldBand(prefix .. "Top", x, baseY + height + 0.1, z + 0.08, width + 1.8, depth + 0.9, 0.24)

	local spacing = math.max(4.9, height / (windowCount + 1))
	for index = 1, windowCount do
		addArchedWindow(prefix .. "Stack" .. index, x, 9.8 + (index - 1) * spacing, z + depth * 0.58 + 0.04, math.max(0.9, width * 0.22), 3.0, 0.34)
	end

	local battlementY = baseY + height + 1.5
	local battlementCount = math.max(4, math.floor(width / 1.45))
	for index = 1, battlementCount do
		local offset = (index - (battlementCount + 1) * 0.5) * (width / battlementCount)
		part(prefix .. "Battlement" .. index, Vector3.new(0.75, 2.4, depth + 0.62), CFrame.new(x + offset, battlementY, z + 0.05), COLOR_STONE_DARK, Enum.Material.Basalt, backdrop, 0.00)
	end

	wedge(prefix .. "LeftRoofPlane", Vector3.new(width * 0.54, 4.6 * crownScale, depth * 0.76), CFrame.new(x - width * 0.21, battlementY + 2.5 * crownScale, z) * CFrame.Angles(0, 0, math.rad(180)), COLOR_GOLD, Enum.Material.Metal, backdrop, 0.28)
	wedge(prefix .. "RightRoofPlane", Vector3.new(width * 0.54, 4.6 * crownScale, depth * 0.76), CFrame.new(x + width * 0.21, battlementY + 2.5 * crownScale, z) * CFrame.Angles(0, math.rad(180), math.rad(180)), COLOR_GOLD, Enum.Material.Metal, backdrop, 0.28)
	part(prefix .. "SpireNeedle", Vector3.new(0.58 * crownScale, 11.5 * crownScale, 0.58 * crownScale), CFrame.new(x, battlementY + 8.3 * crownScale, z), COLOR_GOLD, Enum.Material.Metal, backdrop, 0.03)
	ball(prefix .. "SpireGem", 0.95 * crownScale, CFrame.new(x, battlementY + 14.4 * crownScale, z + 0.05), COLOR_PURPLE, Enum.Material.Neon, backdrop, 0.18)
end

local function addPalaceWing(prefix, side)
	local sign = if side == "Left" then -1 else 1
	local x = sign * 15.5
	part(prefix .. "OuterMass", Vector3.new(19.0, 20.0, 3.3), CFrame.new(x, 13.5, -41.4), COLOR_STONE_DARK, Enum.Material.Basalt, backdrop, 0.05)
	part(prefix .. "UpperMass", Vector3.new(13.0, 12.4, 3.6), CFrame.new(sign * 13.7, 30.0, -41.6), COLOR_STONE_DARK, Enum.Material.Basalt, backdrop, 0.04)
	part(prefix .. "RearDepth", Vector3.new(21.5, 15.0, 2.2), CFrame.new(sign * 19.3, 17.5, -44.4), Color3.fromRGB(12, 13, 18), Enum.Material.Basalt, backdrop, 0.16)
	addFacadePanel(prefix .. "OuterPanelA", sign * 11.0, 13.4, -39.55, 4.0, 12.5)
	addFacadePanel(prefix .. "OuterPanelB", sign * 20.0, 13.4, -39.55, 4.0, 12.5)
	addSurfaceCrack(prefix .. "WingVeinA", sign * 18.8, 19.5, -39.25, 7.2, sign * 36, COLOR_PURPLE, 0.52)
	addGoldBand(prefix .. "Lower", x, 23.4, -40.7, 20.2, 3.3, 0.24)
	addGoldBand(prefix .. "Upper", sign * 13.7, 36.5, -40.7, 14.0, 3.4, 0.22)

	for index = 1, 4 do
		local wx = sign * (7.7 + index * 3.45)
		addArchedWindow(prefix .. "LowerWindow" .. index, wx, 13.7, -39.6, 0.82, 5.4, 0.42)
	end
	for index = 1, 3 do
		local wx = sign * (8.9 + index * 3.1)
		addArchedWindow(prefix .. "UpperWindow" .. index, wx, 29.4, -39.5, 0.70, 4.2, 0.48)
	end

	for index = 1, 4 do
		local wx = sign * (6.2 + index * 4.7)
		part(prefix .. "RoofFinial" .. index, Vector3.new(0.42, 5.8 + (index % 2) * 1.2, 0.42), CFrame.new(wx, 39.4 + (index % 2) * 0.8, -40.0), COLOR_GOLD, Enum.Material.Metal, backdrop, 0.07)
	end
end

local function addCentralPalace()
	part("PalaceRearMass", Vector3.new(46, 27, 3.4), CFrame.new(0, 18.8, -43.7), Color3.fromRGB(12, 13, 18), Enum.Material.Basalt, backdrop, 0.13)
	part("PalaceNaveLower", Vector3.new(24, 24, 4.1), CFrame.new(0, 15.0, -41.8), COLOR_STONE_DARK, Enum.Material.Basalt, backdrop, 0.03)
	part("PalaceNaveUpper", Vector3.new(15.8, 25, 4.3), CFrame.new(0, 35.8, -42.0), COLOR_STONE_DARK, Enum.Material.Basalt, backdrop, 0.03)
	addFacadePanel("PalaceLeftLowerPanel", -11.0, 14.6, -39.4, 4.2, 14.0)
	addFacadePanel("PalaceRightLowerPanel", 11.0, 14.6, -39.4, 4.2, 14.0)
	addFacadePanel("PalaceLeftUpperPanel", -6.2, 36.3, -39.25, 2.2, 16.5)
	addFacadePanel("PalaceRightUpperPanel", 6.2, 36.3, -39.25, 2.2, 16.5)
	part("PalaceCentralRibLeft", Vector3.new(0.72, 47, 4.7), CFrame.new(-8.3, 26.0, -41.8), COLOR_STONE_LIT, Enum.Material.Basalt, backdrop, 0.08)
	part("PalaceCentralRibRight", Vector3.new(0.72, 47, 4.7), CFrame.new(8.3, 26.0, -41.8), COLOR_STONE_LIT, Enum.Material.Basalt, backdrop, 0.08)
	part("PalaceLeftInnerRib", Vector3.new(0.42, 37, 4.8), CFrame.new(-4.2, 28.0, -41.5), COLOR_STONE_LIT, Enum.Material.Basalt, backdrop, 0.20)
	part("PalaceRightInnerRib", Vector3.new(0.42, 37, 4.8), CFrame.new(4.2, 28.0, -41.5), COLOR_STONE_LIT, Enum.Material.Basalt, backdrop, 0.20)
	addGoldBand("PalaceLowerCrown", 0, 26.5, -40.5, 26.4, 4.0, 0.24)
	addGoldBand("PalaceUpperCrown", 0, 48.7, -40.4, 16.8, 4.0, 0.22)

	part("PalaceGateLeftPillar", Vector3.new(2.2, 18.5, 2.4), CFrame.new(-6.2, 13.0, -39.8), COLOR_STONE_DARK, Enum.Material.Basalt, backdrop, 0.05)
	part("PalaceGateRightPillar", Vector3.new(2.2, 18.5, 2.4), CFrame.new(6.2, 13.0, -39.8), COLOR_STONE_DARK, Enum.Material.Basalt, backdrop, 0.05)
	part("PalaceGateTopArch", Vector3.new(14.4, 2.2, 2.5), CFrame.new(0, 22.6, -39.5), COLOR_STONE_DARK, Enum.Material.Basalt, backdrop, 0.04)
	addArchedWindow("PalaceMainGate", 0, 13.7, -38.5, 4.8, 13.0, 0.45)
	part("PalaceGateCore", Vector3.new(1.35, 13.2, 0.5), CFrame.new(0, 14.0, -38.1), COLOR_MAGENTA, Enum.Material.Neon, backdrop, 0.25)
	addSurfaceCrack("PalaceMainGateVein", -2.8, 17.4, -38.12, 9.0, 76, COLOR_MAGENTA, 0.46)
	addArchedWindow("PalaceUpperSanctum", 0, 35.4, -38.4, 3.6, 12.5, 0.36)
	ball("PalaceRoseWindowGlow", 5.2, CFrame.new(0, 28.7, -38.0), COLOR_PURPLE, Enum.Material.Neon, backdrop, 0.42)
	ball("PalaceRoseWindowCore", 2.2, CFrame.new(0, 28.7, -37.6), COLOR_MAGENTA, Enum.Material.Neon, backdrop, 0.10)

	for index = 1, 6 do
		local x = -15.5 + index * 4.45
		part("PalaceRoofSpike" .. index, Vector3.new(0.48, 7.0 + (index % 2) * 1.8, 0.48), CFrame.new(x, 51.7 + (index % 2), -40.2), COLOR_GOLD, Enum.Material.Metal, backdrop, 0.06)
	end
	part("PalaceCentralSpire", Vector3.new(0.8, 16.0, 0.8), CFrame.new(0, 58.7, -41.0), COLOR_GOLD, Enum.Material.Metal, backdrop, 0.03)
	ball("PalaceCentralSpireGem", 1.2, CFrame.new(0, 67.0, -40.9), COLOR_PURPLE, Enum.Material.Neon, backdrop, 0.18)
end

addCentralPalace()
addPalaceWing("LeftPalace", "Left")
addPalaceWing("RightPalace", "Right")
addTower("LeftRoyalTower", -28.8, -41.7, 7.2, 42.0, 4.4, 5, 1.0)
addTower("RightRoyalTower", 28.8, -41.7, 7.2, 42.0, 4.4, 5, 1.0)
addTower("LeftRearSpire", -43.0, -47.0, 5.6, 34.0, 3.8, 4, 0.78)
addTower("RightRearSpire", 43.0, -47.0, 5.6, 34.0, 3.8, 4, 0.78)

addBanner("LeftRoyalBanner", -54, 32, -38.6, 4.6, 15.5, -4)
addBanner("RightRoyalBanner", 54, 32, -38.6, 4.6, 15.5, 4)
addBanner("LeftInnerBanner", -22, 26, -38.4, 3.4, 11.5, 2)
addBanner("RightInnerBanner", 22, 26, -38.4, 3.4, 11.5, -2)
addBrazier("LeftForegroundBrazier", -43, 20)
addBrazier("RightForegroundBrazier", 43, 20)
addBrazier("LeftGateBrazier", -10.8, -8)
addBrazier("RightGateBrazier", 10.8, -8)
addSegmentedChain("LeftSkyChain", Vector3.new(-57, 56, -35), Vector3.new(-8.5, 27, -14), 14)
addSegmentedChain("RightSkyChain", Vector3.new(57, 56, -35), Vector3.new(8.5, 27, -14), 14)

for i = 1, 12 do
	local angle = (i / 12) * math.pi * 2
	local radius = 50
	local x = math.cos(angle) * radius
	local z = math.sin(angle) * radius + 1
	local height = 30 + (i % 3) * 5
	if math.abs(x) > 7 then
		part("GothicLobbyPillar" .. i, Vector3.new(4.2, height, 4.2), CFrame.new(x, 4 + height * 0.5, z), COLOR_STONE, Enum.Material.Basalt, backdrop, 0.05)
		part("PillarGoldCap" .. i, Vector3.new(5.2, 0.7, 5.2), CFrame.new(x, 7 + height, z), COLOR_GOLD, Enum.Material.Metal, backdrop, 0.18)
	end
end

local function getMainCharacterTemplate()
	local charactersFolder = ReplicatedStorage:FindFirstChild("CrownChaosCharacters")
	if charactersFolder then
		local template = charactersFolder:FindFirstChild("CrownboundRobloxAvatarTemplate")
			or charactersFolder:FindFirstChild("CrownboundChallenger_RobloxSkinTemplate")
			or charactersFolder:FindFirstChild("CrownboundChallenger")
		if template then
			return template
		end
	end

	return StarterPlayer:FindFirstChild("StarterCharacter") or character
end

local function buildMenuHeroCharacter()
	local template = getMainCharacterTemplate()
	local clone = template:Clone()
	clone.Name = "MainCharacterInMenu"
	clone.Parent = heroModel

	for _, descendant in ipairs(clone:GetDescendants()) do
		if descendant:IsA("BasePart") then
			descendant.Anchored = true
			descendant.CanCollide = false
			descendant.CanTouch = false
			descendant.CanQuery = false
			descendant.CastShadow = true
			descendant.LocalTransparencyModifier = 0
		elseif descendant:IsA("Humanoid") then
			descendant.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.None
			descendant.HealthDisplayType = Enum.HumanoidHealthDisplayType.AlwaysOff
		elseif descendant:IsA("Script") or descendant:IsA("LocalScript") then
			descendant:Destroy()
		elseif descendant:IsA("SurfaceGui") and descendant.Name == "CrownboundFaceLayer" then
			descendant.Enabled = true
			descendant.LightInfluence = 0
		elseif descendant:IsA("BillboardGui") or descendant:IsA("SurfaceGui") then
			descendant.Enabled = false
		end
	end

	pcall(function()
		clone:ScaleTo(3.05)
	end)

	local targetPivot = CFrame.new(0, 4.0, 43.5)
	clone:PivotTo(targetPivot)

	local boxCFrame, boxSize = clone:GetBoundingBox()
	local bottomY = boxCFrame.Position.Y - boxSize.Y * 0.5
	clone:PivotTo(clone:GetPivot() * CFrame.new(0, 4.05 - bottomY, 0))

	return clone
end

local menuHeroCharacter = buildMenuHeroCharacter()
menuHeroCharacter:SetAttribute("MenuUsesActualCharacter", true)

local faceKeyLightPart = part("HeroFaceKeyLight", Vector3.new(0.25, 0.25, 0.25), CFrame.new(0, 13.6, 58), COLOR_GOLD, Enum.Material.Neon, heroModel, 1)
make("PointLight", {
	Name = "WarmFaceKeyLight",
	Color = Color3.fromRGB(255, 222, 157),
	Brightness = 2.1,
	Range = 20,
	Shadows = false,
}, faceKeyLightPart)

local heroRimLightPart = part("HeroCrownPurpleRimLight", Vector3.new(0.25, 0.25, 0.25), CFrame.new(-3.8, 16.0, 45.5), COLOR_PURPLE, Enum.Material.Neon, heroModel, 1)
make("PointLight", {
	Name = "PurpleCrownRimLight",
	Color = COLOR_PURPLE,
	Brightness = 1.25,
	Range = 17,
	Shadows = false,
}, heroRimLightPart)

local function addHeroCrownVFX(characterModel)
	local head = characterModel:FindFirstChild("Head")
	if not head or not head:IsA("BasePart") then
		return
	end

	local headPosition = head.Position
	local vfx = make("Model", { Name = "HeroCrownAscensionVFX" }, heroModel)
	local core = part("CrownAuraCore", Vector3.new(0.25, 0.25, 0.25), CFrame.new(headPosition + Vector3.new(0, 2.75, 0)), COLOR_GOLD, Enum.Material.Neon, vfx, 1)
	local top = part("CrownAuraBeamTop", Vector3.new(0.2, 0.2, 0.2), CFrame.new(headPosition + Vector3.new(0, 7.4, 0)), COLOR_PURPLE, Enum.Material.Neon, vfx, 1)
	local left = part("CrownAuraLeftAnchor", Vector3.new(0.2, 0.2, 0.2), CFrame.new(headPosition + Vector3.new(-1.65, 3.3, 0.15)), COLOR_GOLD, Enum.Material.Neon, vfx, 1)
	local right = part("CrownAuraRightAnchor", Vector3.new(0.2, 0.2, 0.2), CFrame.new(headPosition + Vector3.new(1.65, 3.3, 0.15)), COLOR_GOLD, Enum.Material.Neon, vfx, 1)

	local coreAttachment = make("Attachment", { Name = "CoreAttachment" }, core)
	local topAttachment = make("Attachment", { Name = "TopAttachment" }, top)
	local leftAttachment = make("Attachment", { Name = "LeftAttachment" }, left)
	local rightAttachment = make("Attachment", { Name = "RightAttachment" }, right)

	make("PointLight", {
		Name = "CrownGoldKeyLight",
		Color = COLOR_GOLD,
		Brightness = 2.6,
		Range = 14,
		Shadows = false,
	}, core)
	make("PointLight", {
		Name = "CrownCorruptionRimLight",
		Color = COLOR_PURPLE,
		Brightness = 1.7,
		Range = 18,
		Shadows = false,
	}, top)

	make("Beam", {
		Name = "VerticalCrownAscensionBeam",
		Attachment0 = coreAttachment,
		Attachment1 = topAttachment,
		Color = ColorSequence.new({
			ColorSequenceKeypoint.new(0, COLOR_GOLD),
			ColorSequenceKeypoint.new(0.58, Color3.fromRGB(238, 230, 255)),
			ColorSequenceKeypoint.new(1, COLOR_PURPLE),
		}),
		Transparency = NumberSequence.new({
			NumberSequenceKeypoint.new(0, 0.35),
			NumberSequenceKeypoint.new(0.5, 0.12),
			NumberSequenceKeypoint.new(1, 0.70),
		}),
		Width0 = 0.55,
		Width1 = 0.14,
		Brightness = 3.5,
		LightEmission = 1,
		FaceCamera = true,
	}, core)

	for index, attachment in ipairs({ leftAttachment, rightAttachment }) do
		make("Beam", {
			Name = "CrownSideLightArc" .. index,
			Attachment0 = coreAttachment,
			Attachment1 = attachment,
			Color = ColorSequence.new(COLOR_GOLD, COLOR_PURPLE),
			Transparency = NumberSequence.new(0.28, 0.82),
			Width0 = 0.18,
			Width1 = 0.05,
			CurveSize0 = if index == 1 then -1.6 else 1.6,
			CurveSize1 = if index == 1 then 1.2 else -1.2,
			Brightness = 2.2,
			LightEmission = 1,
			FaceCamera = true,
		}, core)
	end

	make("ParticleEmitter", {
		Name = "CrownGoldMotes",
		Texture = "rbxasset://textures/particles/sparkles_main.dds",
		Color = ColorSequence.new(COLOR_GOLD, Color3.fromRGB(255, 240, 170)),
		Transparency = NumberSequence.new({
			NumberSequenceKeypoint.new(0, 1),
			NumberSequenceKeypoint.new(0.18, 0.18),
			NumberSequenceKeypoint.new(1, 1),
		}),
		Size = NumberSequence.new({
			NumberSequenceKeypoint.new(0, 0.10),
			NumberSequenceKeypoint.new(0.55, 0.32),
			NumberSequenceKeypoint.new(1, 0.03),
		}),
		Rate = 18,
		Lifetime = NumberRange.new(1.1, 1.8),
		Speed = NumberRange.new(0.35, 1.05),
		SpreadAngle = Vector2.new(45, 45),
		Drag = 1.8,
		LightEmission = 1,
		LightInfluence = 0,
	}, coreAttachment)

	make("ParticleEmitter", {
		Name = "CrownVoidWisps",
		Texture = "rbxasset://textures/particles/smoke_main.dds",
		Color = ColorSequence.new(COLOR_PURPLE, COLOR_MAGENTA),
		Transparency = NumberSequence.new({
			NumberSequenceKeypoint.new(0, 1),
			NumberSequenceKeypoint.new(0.25, 0.58),
			NumberSequenceKeypoint.new(1, 1),
		}),
		Size = NumberSequence.new({
			NumberSequenceKeypoint.new(0, 0.35),
			NumberSequenceKeypoint.new(0.62, 0.90),
			NumberSequenceKeypoint.new(1, 0.15),
		}),
		Rate = 7,
		Lifetime = NumberRange.new(1.4, 2.4),
		Speed = NumberRange.new(0.12, 0.42),
		SpreadAngle = Vector2.new(22, 22),
		Drag = 2.4,
		LightEmission = 0.8,
		LightInfluence = 0,
	}, coreAttachment)

	for index = 1, 8 do
		local angle = (index / 8) * math.pi * 2
		local radius = if index % 2 == 0 then 1.25 else 0.88
		local glint = ball(
			"CrownOrbitGlint" .. index,
			0.16 + (index % 3) * 0.04,
			CFrame.new(headPosition + Vector3.new(math.cos(angle) * radius, 2.92 + (index % 2) * 0.42, math.sin(angle) * radius)),
			if index % 2 == 0 then COLOR_GOLD else COLOR_MAGENTA,
			Enum.Material.Neon,
			vfx,
			0.18
		)
		heroCrownVfxParts[#heroCrownVfxParts + 1] = {
			part = glint,
			center = headPosition + Vector3.new(0, 3.16, 0),
			radius = radius,
			angle = angle,
			height = (index % 2) * 0.42,
			speed = 0.65 + index * 0.045,
		}
	end
end

addHeroCrownVFX(menuHeroCharacter)

for i = 1, 10 do
	local x = -52 + i * 10.4
	if math.abs(x) < 16 then
		x += if x >= 0 then 28 else -28
	end
	local height = 20 + (i % 4) * 6
	part("DistantLobbyTower" .. i, Vector3.new(5.5, height, 5.5), CFrame.new(x, 3 + height * 0.5, -32 - (i % 2) * 7), COLOR_STONE_DARK, Enum.Material.Basalt, backdrop, 0.12)
	if i % 3 == 0 then
		part("TowerCorruptionWindow" .. i, Vector3.new(1.1, height * 0.45, 0.12), CFrame.new(x, 6 + height * 0.42, -29 - (i % 2) * 7), COLOR_PURPLE, Enum.Material.Neon, backdrop, 0.18)
	end
end

local beamOuter = part("LobbyCrownBeamOuter", Vector3.new(2.0, 88, 2.0), CFrame.new(0, 44, -14), COLOR_PURPLE, Enum.Material.Neon, backdrop, 0.90)
local beamCore = part("LobbyCrownBeamCore", Vector3.new(0.55, 96, 0.55), CFrame.new(0, 46, -14), Color3.fromRGB(238, 230, 255), Enum.Material.Neon, backdrop, 0.42)
motionParts[#motionParts + 1] = beamOuter
motionParts[#motionParts + 1] = beamCore

local crown = make("Model", { Name = "BackgroundFloatingCrown" }, backdrop)
for i = 1, 28 do
	local angle = (i / 28) * math.pi * 2
	local x = math.cos(angle) * 7.8
	local z = math.sin(angle) * 7.8 - 14
	local plate = part("CrownRingPlate" .. i, Vector3.new(0.92, 0.30, 0.22), lookAt(Vector3.new(x, 23.0, z), Vector3.new(x * 2, 23.0, z * 2)), COLOR_GOLD, Enum.Material.Metal, crown, 0.10)
	motionParts[#motionParts + 1] = plate
	if i % 4 == 0 then
		part("CrownVoidInset" .. i, Vector3.new(0.50, 1.25, 0.14), lookAt(Vector3.new(x, 24.0, z), Vector3.new(x * 2, 24.0, z * 2)), COLOR_STONE_DARK, Enum.Material.Metal, crown, 0.12)
	end
end

for i = 1, 8 do
	local angle = (i / 8) * math.pi * 2
	local x = math.cos(angle) * 7.0
	local z = math.sin(angle) * 7.0 - 14
	part("CrownTallSpike" .. i, Vector3.new(0.82, 6.2 + (i % 2) * 1.3, 0.24), lookAt(Vector3.new(x, 27.0, z), Vector3.new(x * 2, 27.0, z * 2)), COLOR_GOLD, Enum.Material.Metal, crown, 0.06)
	part("CrownSpikeVein" .. i, Vector3.new(0.08, 4.0, 0.06), lookAt(Vector3.new(x, 27.2, z), Vector3.new(x * 2, 27.2, z * 2)), COLOR_MAGENTA, Enum.Material.Neon, crown, 0.22)
end

local chainTargets = {
	{ Vector3.new(-8.5, 27, -14), Vector3.new(-42, 56, -34) },
	{ Vector3.new(8.5, 27, -14), Vector3.new(42, 56, -34) },
	{ Vector3.new(0, 27, -22), Vector3.new(0, 58, -48) },
}
for i, points in ipairs(chainTargets) do
	local a, b = points[1], points[2]
	local mid = (a + b) * 0.5
	local length = (b - a).Magnitude
	local chain = part("CrownSuspensionChain" .. i, Vector3.new(0.42, 0.42, length), lookAt(mid, b), COLOR_STONE_DARK, Enum.Material.Metal, backdrop, 0.12)
	motionParts[#motionParts + 1] = chain
end

addSegmentedChain("CenterBackChain", Vector3.new(0, 58, -48), Vector3.new(0, 27, -22), 11)

for i = 1, 42 do
	local x = -70 + ((i * 11) % 140)
	local y = 8 + ((i * 7) % 42)
	local z = -45 + ((i * 13) % 80)
	local ash = ball("MenuDriftingAsh" .. i, 0.16 + (i % 3) * 0.04, CFrame.new(x, y, z), if i % 9 == 0 then COLOR_PURPLE else COLOR_GOLD, Enum.Material.Neon, backdrop, 0.55)
	ashParts[#ashParts + 1] = ash
end

local function openDetail(kind)
	local copy = {
		Shop = {
			title = "SHOP",
			body = "Premium relics, skins, crowns, swords, finishers, and rotating featured cosmetics will live here.",
			action = "OPEN SHOP",
		},
		BattlePass = {
			title = "BATTLE PASS",
			body = "Season rewards, evolving cosmetics, free track rewards, founder flex items, and premium progression.",
			action = "VIEW PASS",
		},
		GameModes = {
			title = "GAME MODES",
			body = "Crown survival, ranked ascension, training arena, party modes, and future event queues.",
			action = "SELECT MODE",
		},
	}

	local data = copy[kind]
	if not data then
		return
	end

	detailTitle.Text = data.title
	detailBody.Text = data.body
	detailAction.Text = data.action
	detailPanel.Visible = true
	detailPanel.BackgroundTransparency = 0.45
	TweenService:Create(detailPanel, TweenInfo.new(0.18, Enum.EasingStyle.Quint, Enum.EasingDirection.Out), { BackgroundTransparency = 0.22 }):Play()
end

local function closeMenu()
	TweenService:Create(fade, TweenInfo.new(0.42, Enum.EasingStyle.Quint, Enum.EasingDirection.Out), { BackgroundTransparency = 0 }):Play()
	task.delay(0.45, function()
		camera.CameraType = Enum.CameraType.Custom
		if humanoid then
			humanoid.WalkSpeed = originalWalkSpeed or 16
			humanoid.JumpPower = originalJumpPower or humanoid.JumpPower
			humanoid.JumpHeight = originalJumpHeight or humanoid.JumpHeight
			humanoid.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.Viewer
		end
		if rootPart then
			rootPart.Anchored = false
			if originalRootCFrame then
				rootPart.CFrame = originalRootCFrame
			end
		end
		for object, transparency in pairs(hiddenCharacterParts) do
			if object.Parent then
				object.LocalTransparencyModifier = transparency
			end
		end
		for object, enabled in pairs(hiddenCharacterGuis) do
			if object.Parent then
				object.Enabled = enabled
			end
		end
		pcall(function()
			StarterGui:SetCoreGuiEnabled(Enum.CoreGuiType.All, true)
			StarterGui:SetCore("TopbarEnabled", true)
		end)
		pcall(function()
			TextChatService.BubbleChatConfiguration.Enabled = true
			TextChatService.ChatWindowConfiguration.Enabled = true
			TextChatService.ChatInputBarConfiguration.Enabled = true
		end)
		for _, surface in ipairs(surfaceGuis) do
			if surface.Parent then
				surface:Destroy()
			end
		end
		gui:Destroy()
		scene:Destroy()
	end)
end

local function addSurfaceButton(panel, face, label, eyebrow, accent, callback)
	local surface = make("SurfaceGui", {
		Name = "CrownChaos3DMenu_" .. panel.Name .. "_" .. face.Name .. "_Surface",
		Adornee = panel,
		Face = face,
		AlwaysOnTop = true,
		LightInfluence = 0,
		PixelsPerStud = 60,
		SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud,
		ZIndexBehavior = Enum.ZIndexBehavior.Sibling,
	}, playerGui)
	surfaceGuis[#surfaceGuis + 1] = surface

	local button = make("TextButton", {
		Name = label:gsub("%s+", "") .. "Button",
		Size = UDim2.fromScale(1, 1),
		BackgroundColor3 = Color3.fromRGB(10, 10, 15),
		BackgroundTransparency = 0.12,
		BorderSizePixel = 0,
		AutoButtonColor = false,
		Active = true,
		Text = "",
		ZIndex = 1,
	}, surface)
	make("UICorner", { CornerRadius = UDim.new(0, 8) }, button)
	make("UIStroke", { Color = accent, Thickness = 2, Transparency = 0.18 }, button)
	make("UIGradient", {
		Color = ColorSequence.new({
			ColorSequenceKeypoint.new(0, Color3.fromRGB(22, 20, 28)),
			ColorSequenceKeypoint.new(1, Color3.fromRGB(4, 4, 9)),
		}),
		Rotation = 90,
	}, button)

	make("TextLabel", {
		Name = "Eyebrow",
		Position = UDim2.fromScale(0.08, 0.15),
		Size = UDim2.fromScale(0.84, 0.20),
		BackgroundTransparency = 1,
		Font = Enum.Font.Garamond,
		Text = eyebrow,
		TextColor3 = accent,
		TextXAlignment = Enum.TextXAlignment.Left,
		TextScaled = true,
		ZIndex = 2,
	}, button)

	make("TextLabel", {
		Name = "Label",
		Position = UDim2.fromScale(0.08, 0.38),
		Size = UDim2.fromScale(0.84, 0.35),
		BackgroundTransparency = 1,
		Font = Enum.Font.Garamond,
		Text = label,
		TextColor3 = Color3.fromRGB(245, 236, 213),
		TextXAlignment = Enum.TextXAlignment.Left,
		TextScaled = true,
		TextStrokeColor3 = Color3.fromRGB(0, 0, 0),
		TextStrokeTransparency = 0.45,
		ZIndex = 2,
	}, button)

	make("Frame", {
		Name = "AccentLine",
		AnchorPoint = Vector2.new(0, 1),
		Position = UDim2.fromScale(0.08, 0.86),
		Size = UDim2.fromScale(0.72, 0.035),
		BackgroundColor3 = accent,
		BorderSizePixel = 0,
		ZIndex = 2,
	}, button)

	button.MouseEnter:Connect(function()
		TweenService:Create(button, TweenInfo.new(0.12), { BackgroundTransparency = 0.02 }):Play()
		TweenService:Create(panel, TweenInfo.new(0.12), { Color = accent }):Play()
	end)

	button.MouseLeave:Connect(function()
		TweenService:Create(button, TweenInfo.new(0.16), { BackgroundTransparency = 0.12 }):Play()
		TweenService:Create(panel, TweenInfo.new(0.16), { Color = Color3.fromRGB(12, 12, 18) }):Play()
	end)

	button.MouseButton1Click:Connect(callback)
end

local function addScreenCard(spec)
	local card = make("TextButton", {
		Name = spec.key .. "Card",
		AnchorPoint = spec.anchor or Vector2.new(0, 0),
		Position = spec.position,
		Size = spec.size,
		BackgroundColor3 = Color3.fromRGB(7, 7, 11),
		BackgroundTransparency = 0.08,
		BorderSizePixel = 0,
		AutoButtonColor = false,
		Text = "",
		Rotation = spec.rotation or 0,
		ZIndex = 35,
	}, gui)
	make("UICorner", { CornerRadius = UDim.new(0, 4) }, card)
	make("UIStroke", { Color = spec.color, Thickness = 2, Transparency = 0.15 }, card)
	make("UIGradient", {
		Color = ColorSequence.new({
			ColorSequenceKeypoint.new(0, Color3.fromRGB(16, 14, 22)),
			ColorSequenceKeypoint.new(1, Color3.fromRGB(2, 2, 6)),
		}),
		Rotation = 90,
	}, card)

	make("TextLabel", {
		Name = "Eyebrow",
		Position = UDim2.fromScale(0.09, 0.15),
		Size = UDim2.fromScale(0.82, 0.22),
		BackgroundTransparency = 1,
		Font = Enum.Font.Garamond,
		Text = spec.eyebrow,
		TextColor3 = spec.color,
		TextXAlignment = Enum.TextXAlignment.Left,
		TextScaled = true,
		ZIndex = 36,
	}, card)

	make("TextLabel", {
		Name = "Label",
		Position = UDim2.fromScale(0.09, 0.43),
		Size = UDim2.fromScale(0.84, 0.34),
		BackgroundTransparency = 1,
		Font = Enum.Font.Garamond,
		Text = spec.label,
		TextColor3 = Color3.fromRGB(255, 247, 220),
		TextXAlignment = Enum.TextXAlignment.Left,
		TextScaled = true,
		TextStrokeColor3 = Color3.fromRGB(0, 0, 0),
		TextStrokeTransparency = 0.42,
		ZIndex = 36,
	}, card)

	make("Frame", {
		Name = "AccentLine",
		AnchorPoint = Vector2.new(0, 1),
		Position = UDim2.fromScale(0.09, 0.87),
		Size = UDim2.fromScale(0.72, 0.035),
		BackgroundColor3 = spec.color,
		BorderSizePixel = 0,
		ZIndex = 36,
	}, card)

	card.MouseEnter:Connect(function()
		TweenService:Create(card, TweenInfo.new(0.13), { BackgroundTransparency = 0.01, Size = spec.hoverSize or spec.size }):Play()
	end)

	card.MouseLeave:Connect(function()
		TweenService:Create(card, TweenInfo.new(0.16), { BackgroundTransparency = 0.08, Size = spec.size }):Play()
	end)

	card.MouseButton1Click:Connect(function()
		if spec.key == "EnterArena" then
			closeMenu()
		else
			openDetail(spec.key)
		end
	end)

	return card
end

local buttonSpecs = {
	{
		key = "BattlePass",
		label = "BATTLE PASS",
		eyebrow = "SEASON OF THE CROWN",
		position = UDim2.fromScale(0.043, 0.535),
		size = UDim2.fromScale(0.215, 0.110),
		hoverSize = UDim2.fromScale(0.227, 0.116),
		color = COLOR_PURPLE,
		rotation = -1.5,
	},
	{
		key = "Shop",
		label = "SHOP",
		eyebrow = "RELIC VAULT",
		position = UDim2.fromScale(0.044, 0.675),
		size = UDim2.fromScale(0.215, 0.120),
		hoverSize = UDim2.fromScale(0.227, 0.126),
		color = COLOR_GOLD,
		rotation = -2.2,
	},
	{
		key = "GameModes",
		label = "GAME MODES",
		eyebrow = "CHOOSE YOUR ASCENSION",
		position = UDim2.fromScale(0.770, 0.645),
		size = UDim2.fromScale(0.205, 0.112),
		hoverSize = UDim2.fromScale(0.217, 0.118),
		color = COLOR_MAGENTA,
		rotation = 1.5,
	},
	{
		key = "EnterArena",
		label = "ENTER ARENA",
		eyebrow = "BEGIN",
		position = UDim2.fromScale(0.500, 0.910),
		size = UDim2.fromScale(0.300, 0.078),
		hoverSize = UDim2.fromScale(0.312, 0.084),
		anchor = Vector2.new(0.5, 0.5),
		color = COLOR_CRIMSON,
		rotation = 0,
	},
}

for _, spec in ipairs(buttonSpecs) do
	addScreenCard(spec)
end

local active = true
local parallax = Vector2.zero
local startedAt = os.clock()
local heroBasePivot = heroModel:GetPivot()

fade.BackgroundTransparency = 1

RunService.RenderStepped:Connect(function()
	if not active or not scene.Parent then
		return
	end

	local t = os.clock() - startedAt
	local mouse = UserInputService:GetMouseLocation()
	local screenSize = Vector2.new(math.max(camera.ViewportSize.X, 1), math.max(camera.ViewportSize.Y, 1))
	local targetParallax = Vector2.new(
		math.clamp((mouse.X - screenSize.X * 0.5) / (screenSize.X * 0.5), -1, 1),
		math.clamp((mouse.Y - screenSize.Y * 0.5) / (screenSize.Y * 0.5), -1, 1)
	)
	parallax = parallax:Lerp(targetParallax, 0.055)

	local cameraOffset = Vector3.new(parallax.X * 1.25, -parallax.Y * 0.70 + math.sin(t * 0.28) * 0.20, math.sin(t * 0.21) * 0.36)
	local lookOffset = Vector3.new(parallax.X * 0.30, -parallax.Y * 0.22, 0)
	camera.CFrame = camera.CFrame:Lerp(lookAt(baseCameraPosition + cameraOffset, baseCameraTarget + lookOffset), 0.075)

	crown:PivotTo(CFrame.new(0, 0.35 + math.sin(t * 1.15) * 0.35, 0) * CFrame.Angles(0, t * 0.085, 0))
	beamOuter.Transparency = 0.88 + math.sin(t * 2.2) * 0.03
	beamCore.Transparency = 0.38 + math.sin(t * 3.4) * 0.04

	for i, object in ipairs(motionParts) do
		if object.Parent and object.Name:find("Chain") then
			object.Transparency = 0.14 + math.sin(t * 0.8 + i) * 0.04
		end
	end

	for i, data in ipairs(heroCrownVfxParts) do
		if data.part.Parent then
			local angle = data.angle + t * data.speed
			data.part.CFrame = CFrame.new(data.center + Vector3.new(math.cos(angle) * data.radius, data.height + math.sin(t * 1.8 + i) * 0.10, math.sin(angle) * data.radius))
			data.part.Transparency = 0.18 + math.sin(t * 2.4 + i) * 0.10
		end
	end

	for i, ash in ipairs(ashParts) do
		ash.CFrame *= CFrame.new(0, 0.015 + (i % 3) * 0.004, 0) * CFrame.Angles(0, math.rad(0.06 * (i % 5)), 0)
		if ash.Position.Y > 55 then
			ash.CFrame = CFrame.new(ash.Position.X, 8, ash.Position.Z)
		end
	end

	heroModel:PivotTo(heroBasePivot * CFrame.new(parallax.X * 0.45, math.sin(t * 1.1) * 0.08, 0))
end)

gui.Destroying:Connect(function()
	active = false
end)
