-- Builds the active Crown Chaos hero as a genuine Roblox R15 avatar.
-- Detail pass: real Roblox avatar accessories + layered 3D clothing.
-- No loose rectangle-body costume pieces are used for the crown, beard, coat,
-- pants, cape, hair, or shoulder armor.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local StarterPlayer = game:GetService("StarterPlayer")
local Workspace = game:GetService("Workspace")

local ASSETS = {
	Hair = 139952763739095, -- Black Messy Hair
	HairLayer = 107857807286869, -- Black Layered Messy Hair
	Crown = 137190817734431, -- Royal Void Crown
	Jacket = 123658042616040, -- Black and gold royal prince coat
	Pants = 97490033292579, -- Black and gold royal prince pants with boots
	Cape = 87787024617625, -- Black Gold Royal Cape
	LeftShoulder = 92134472122240, -- Black Left Shoulder Gold Armor
	RightShoulder = 126944646551924, -- Black Right Shoulder Gold Armor
}

local COLORS = {
	Skin = Color3.fromRGB(214, 169, 111),
	BlackCloth = Color3.fromRGB(10, 10, 14),
	Armor = Color3.fromRGB(17, 17, 22),
	Gold = Color3.fromRGB(198, 160, 78),
	Beard = Color3.fromRGB(18, 12, 12),
	BeardSoft = Color3.fromRGB(42, 28, 24),
	FaceLine = Color3.fromRGB(34, 20, 18),
	Scar = Color3.fromRGB(116, 33, 36),
	ScarFresh = Color3.fromRGB(190, 57, 78),
	Purple = Color3.fromRGB(141, 46, 255),
	EyeWhite = Color3.fromRGB(239, 224, 189),
	EyeGold = Color3.fromRGB(218, 164, 62),
}

local function clearNamed(parent, name)
	local existing = parent:FindFirstChild(name)
	if existing then
		existing:Destroy()
	end
end

local function countDescendantsOfClass(model, className)
	local count = 0
	if not model then
		return count
	end
	for _, descendant in ipairs(model:GetDescendants()) do
		if descendant:IsA(className) then
			count += 1
		end
	end
	return count
end

local function getAccessoryNames(model)
	local names = {}
	for _, descendant in ipairs(model:GetDescendants()) do
		if descendant:IsA("Accessory") then
			table.insert(names, descendant.Name)
		end
	end
	table.sort(names)
	return names
end

local function configurePart(part)
	part.Anchored = false
	part.CanCollide = false
	part.CanTouch = false
	part.CanQuery = false
	part.CastShadow = true
	part.TopSurface = Enum.SurfaceType.Smooth
	part.BottomSurface = Enum.SurfaceType.Smooth
end

local function tintBaseBody(model)
	local bodyColors = model:FindFirstChildOfClass("BodyColors")
	if bodyColors then
		bodyColors.HeadColor3 = COLORS.Skin
		bodyColors.LeftArmColor3 = COLORS.BlackCloth
		bodyColors.RightArmColor3 = COLORS.BlackCloth
		bodyColors.LeftLegColor3 = COLORS.BlackCloth
		bodyColors.RightLegColor3 = COLORS.BlackCloth
		bodyColors.TorsoColor3 = COLORS.BlackCloth
	end

	for _, descendant in ipairs(model:GetDescendants()) do
		if descendant:IsA("BasePart") then
			configurePart(descendant)
			if descendant.Name == "Head" or descendant.Name == "LeftHand" or descendant.Name == "RightHand" then
				descendant.Color = COLORS.Skin
				descendant.Material = Enum.Material.SmoothPlastic
			elseif descendant.Name == "UpperTorso" or descendant.Name:find("LowerLeg") or descendant.Name:find("Foot") then
				descendant.Color = COLORS.Armor
				descendant.Material = Enum.Material.Metal
			else
				descendant.Color = COLORS.BlackCloth
				descendant.Material = Enum.Material.SmoothPlastic
			end
		end
	end
end

local function addFaceFrame(parent, name, position, size, color, rotation, transparency, zIndex, cornerScale)
	local frame = Instance.new("Frame")
	frame.Name = name
	frame.AnchorPoint = Vector2.new(0.5, 0.5)
	frame.Position = position
	frame.Size = size
	frame.BackgroundColor3 = color
	frame.BackgroundTransparency = transparency or 0
	frame.BorderSizePixel = 0
	frame.Rotation = rotation or 0
	frame.ZIndex = zIndex or 1
	frame.Parent = parent

	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(cornerScale or 0.5, 0)
	corner.Parent = frame

	return frame
end

local function addDrawnRoyalFace(model)
	local head = model:FindFirstChild("Head")
	if not head or not head:IsA("BasePart") then
		return
	end

	clearNamed(head, "CrownChaosRobloxFace")
	clearNamed(head, "CrownboundFaceLayer")

	local baseFace = Instance.new("Decal")
	baseFace.Name = "CrownChaosRobloxFace"
	baseFace.Face = Enum.NormalId.Front
	baseFace.Texture = "rbxasset://textures/face.png"
	baseFace.Transparency = 0.12
	baseFace.Parent = head

	local surface = Instance.new("SurfaceGui")
	surface.Name = "CrownboundFaceLayer"
	surface.Adornee = head
	surface.Face = Enum.NormalId.Front
	surface.AlwaysOnTop = false
	surface.Brightness = 1.05
	surface.LightInfluence = 0
	surface.PixelsPerStud = 220
	surface.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
	surface.ZOffset = 0.03
	surface.Parent = head

	local root = Instance.new("Frame")
	root.Name = "PaintedRoyalFace"
	root.Size = UDim2.fromScale(1, 1)
	root.BackgroundTransparency = 1
	root.ClipsDescendants = true
	root.Parent = surface

	-- Beard first, with broken skin windows and strand texture so it doesn't read as one ink blob.
	addFaceFrame(root, "BeardJawShadow", UDim2.fromScale(0.50, 0.780), UDim2.fromScale(0.54, 0.210), COLORS.Beard, 0, 0.18, 2, 0.46)
	addFaceFrame(root, "BeardChinCore", UDim2.fromScale(0.50, 0.875), UDim2.fromScale(0.32, 0.175), COLORS.Beard, 0, 0.10, 3, 0.55)
	addFaceFrame(root, "BeardLeftJawPatch", UDim2.fromScale(0.365, 0.715), UDim2.fromScale(0.160, 0.190), COLORS.Beard, -18, 0.19, 3, 0.52)
	addFaceFrame(root, "BeardRightJawPatch", UDim2.fromScale(0.635, 0.715), UDim2.fromScale(0.160, 0.190), COLORS.Beard, 18, 0.19, 3, 0.52)
	addFaceFrame(root, "SkinBreakUnderLip", UDim2.fromScale(0.50, 0.700), UDim2.fromScale(0.160, 0.042), COLORS.Skin, 0, 0.08, 5, 1)
	addFaceFrame(root, "SkinBreakLeftCheek", UDim2.fromScale(0.315, 0.622), UDim2.fromScale(0.070, 0.150), COLORS.Skin, -16, 0.20, 5, 1)
	addFaceFrame(root, "SkinBreakRightCheek", UDim2.fromScale(0.685, 0.622), UDim2.fromScale(0.070, 0.150), COLORS.Skin, 16, 0.20, 5, 1)
	addFaceFrame(root, "MustacheLeftHeavy", UDim2.fromScale(0.425, 0.600), UDim2.fromScale(0.210, 0.045), COLORS.Beard, -10, 0.03, 8, 1)
	addFaceFrame(root, "MustacheRightHeavy", UDim2.fromScale(0.575, 0.600), UDim2.fromScale(0.210, 0.045), COLORS.Beard, 10, 0.03, 8, 1)
	addFaceFrame(root, "MustacheLeftHighlight", UDim2.fromScale(0.427, 0.586), UDim2.fromScale(0.145, 0.014), COLORS.BeardSoft, -10, 0.30, 9, 1)
	addFaceFrame(root, "MustacheRightHighlight", UDim2.fromScale(0.573, 0.586), UDim2.fromScale(0.145, 0.014), COLORS.BeardSoft, 10, 0.30, 9, 1)
	addFaceFrame(root, "MouthCut", UDim2.fromScale(0.505, 0.666), UDim2.fromScale(0.160, 0.020), Color3.fromRGB(5, 3, 4), 1, 0.03, 10, 1)

	local strandData = {
		{0.305, 0.690, 0.100, -25, COLORS.BeardSoft, 0.34},
		{0.345, 0.744, 0.120, -18, Color3.fromRGB(8, 6, 7), 0.26},
		{0.395, 0.800, 0.145, -12, COLORS.BeardSoft, 0.30},
		{0.455, 0.845, 0.125, -5, Color3.fromRGB(7, 5, 6), 0.22},
		{0.510, 0.880, 0.150, 2, COLORS.BeardSoft, 0.36},
		{0.565, 0.845, 0.125, 8, Color3.fromRGB(7, 5, 6), 0.22},
		{0.625, 0.800, 0.145, 12, COLORS.BeardSoft, 0.30},
		{0.675, 0.744, 0.120, 18, Color3.fromRGB(8, 6, 7), 0.26},
		{0.715, 0.690, 0.100, 25, COLORS.BeardSoft, 0.34},
		{0.420, 0.735, 0.075, 24, COLORS.BeardSoft, 0.45},
		{0.585, 0.735, 0.075, -24, COLORS.BeardSoft, 0.45},
	}
	for index, data in ipairs(strandData) do
		addFaceFrame(
			root,
			"BeardStrand_" .. index,
			UDim2.fromScale(data[1], data[2]),
			UDim2.fromScale(0.025, data[3]),
			data[5],
			data[4],
			data[6],
			4,
			1
		)
	end

	for index = 1, 34 do
		local column = (index * 17) % 100
		local row = (index * 23) % 100
		local x = 0.285 + column / 100 * 0.43
		local y = 0.612 + row / 100 * 0.235
		if not (x > 0.445 and x < 0.565 and y < 0.715) then
			addFaceFrame(
				root,
				"BeardStubble_" .. index,
				UDim2.fromScale(x, y),
				UDim2.fromScale(0.010 + (index % 3) * 0.004, 0.010 + (index % 2) * 0.005),
				if index % 4 == 0 then COLORS.BeardSoft else Color3.fromRGB(9, 6, 7),
				(index * 19) % 36 - 18,
				0.20 + (index % 5) * 0.08,
				7,
				1
			)
		end
	end

	-- Eyes and brows are intentionally drawn last and bright so they stay readable in the menu.
	addFaceFrame(root, "LeftEyeSocket", UDim2.fromScale(0.385, 0.405), UDim2.fromScale(0.185, 0.068), COLORS.FaceLine, -4, 0.00, 20, 1)
	addFaceFrame(root, "RightEyeSocket", UDim2.fromScale(0.615, 0.405), UDim2.fromScale(0.185, 0.068), COLORS.FaceLine, 4, 0.00, 20, 1)
	addFaceFrame(root, "LeftEyeWhite", UDim2.fromScale(0.386, 0.402), UDim2.fromScale(0.132, 0.041), COLORS.EyeWhite, -4, 0.00, 21, 1)
	addFaceFrame(root, "RightEyeWhite", UDim2.fromScale(0.614, 0.402), UDim2.fromScale(0.132, 0.041), COLORS.EyeWhite, 4, 0.00, 21, 1)
	addFaceFrame(root, "LeftIrisGold", UDim2.fromScale(0.398, 0.402), UDim2.fromScale(0.044, 0.044), COLORS.EyeGold, 0, 0.00, 22, 1)
	addFaceFrame(root, "RightIrisGold", UDim2.fromScale(0.602, 0.402), UDim2.fromScale(0.044, 0.044), COLORS.EyeGold, 0, 0.00, 22, 1)
	addFaceFrame(root, "LeftPupil", UDim2.fromScale(0.398, 0.402), UDim2.fromScale(0.018, 0.024), Color3.fromRGB(2, 1, 2), 0, 0.00, 23, 1)
	addFaceFrame(root, "RightPupil", UDim2.fromScale(0.602, 0.402), UDim2.fromScale(0.018, 0.024), Color3.fromRGB(2, 1, 2), 0, 0.00, 23, 1)
	addFaceFrame(root, "LeftEyePurpleRim", UDim2.fromScale(0.386, 0.423), UDim2.fromScale(0.130, 0.011), COLORS.Purple, -4, 0.18, 24, 1)
	addFaceFrame(root, "RightEyePurpleRim", UDim2.fromScale(0.614, 0.423), UDim2.fromScale(0.130, 0.011), COLORS.Purple, 4, 0.18, 24, 1)
	addFaceFrame(root, "LeftBrow", UDim2.fromScale(0.370, 0.322), UDim2.fromScale(0.220, 0.034), COLORS.Beard, -11, 0.00, 25, 1)
	addFaceFrame(root, "RightBrow", UDim2.fromScale(0.630, 0.322), UDim2.fromScale(0.220, 0.034), COLORS.Beard, 11, 0.00, 25, 1)

	-- Character-right cheek scar. On the front face this appears viewer-left.
	addFaceFrame(root, "RightCheekScar_DarkBase", UDim2.fromScale(0.347, 0.520), UDim2.fromScale(0.030, 0.285), COLORS.Scar, -31, 0.00, 8, 1)
	addFaceFrame(root, "RightCheekScar_FreshCut", UDim2.fromScale(0.352, 0.520), UDim2.fromScale(0.010, 0.250), COLORS.ScarFresh, -31, 0.05, 9, 1)
	addFaceFrame(root, "RightCheekScar_BreakTop", UDim2.fromScale(0.313, 0.446), UDim2.fromScale(0.026, 0.080), COLORS.Skin, -31, 0.08, 10, 1)
	addFaceFrame(root, "RightCheekScar_BreakBottom", UDim2.fromScale(0.392, 0.610), UDim2.fromScale(0.026, 0.070), COLORS.Skin, -31, 0.10, 10, 1)
	addFaceFrame(root, "RightCheekScar_ShortBranch", UDim2.fromScale(0.397, 0.493), UDim2.fromScale(0.018, 0.115), COLORS.ScarFresh, 31, 0.08, 9, 1)

	model:SetAttribute("DrawnFaceLayer", true)
	model:SetAttribute("RightCheekScar", true)
end

local function createDescription()
	local description = Instance.new("HumanoidDescription")
	description.Name = "CrownboundRoyalHumanoidDescription"

	description.HeadColor = COLORS.Skin
	description.TorsoColor = COLORS.BlackCloth
	description.LeftArmColor = COLORS.BlackCloth
	description.RightArmColor = COLORS.BlackCloth
	description.LeftLegColor = COLORS.BlackCloth
	description.RightLegColor = COLORS.BlackCloth

	description.BodyTypeScale = 0.22
	description.ProportionScale = 0.12
	description.HeightScale = 1.05
	description.WidthScale = 0.92
	description.DepthScale = 0.90
	description.HeadScale = 1.00

	description:SetAccessories({
		{
			AssetId = ASSETS.Hair,
			AccessoryType = Enum.AccessoryType.Hair,
			IsLayered = false,
		},
		{
			AssetId = ASSETS.HairLayer,
			AccessoryType = Enum.AccessoryType.Hair,
			IsLayered = false,
		},
		{
			AssetId = ASSETS.Crown,
			AccessoryType = Enum.AccessoryType.Hat,
			IsLayered = false,
		},
		{
			AssetId = ASSETS.Cape,
			AccessoryType = Enum.AccessoryType.Back,
			IsLayered = false,
		},
		{
			AssetId = ASSETS.LeftShoulder,
			AccessoryType = Enum.AccessoryType.Shoulder,
			IsLayered = false,
		},
		{
			AssetId = ASSETS.RightShoulder,
			AccessoryType = Enum.AccessoryType.Shoulder,
			IsLayered = false,
		},
		{
			AssetId = ASSETS.Jacket,
			AccessoryType = Enum.AccessoryType.Jacket,
			IsLayered = true,
			Order = 1,
			Puffiness = 0.20,
		},
		{
			AssetId = ASSETS.Pants,
			AccessoryType = Enum.AccessoryType.Pants,
			IsLayered = true,
			Order = 2,
			Puffiness = 0.12,
		},
	}, true)

	return description
end

local function createRobloxAvatar()
	local ok, modelOrErr = pcall(function()
		return Players:CreateHumanoidModelFromDescription(createDescription(), Enum.HumanoidRigType.R15)
	end)
	if not ok then
		error("Could not create Roblox R15 avatar with catalog details: " .. tostring(modelOrErr))
	end

	local model = modelOrErr
	model.Name = "CrownboundRobloxAvatarTemplate"
	model.PrimaryPart = model:FindFirstChild("HumanoidRootPart")
	model.Archivable = true
	model:SetAttribute("CrownChaosGenerated", true)
	model:SetAttribute("SkinId", "crownbound_real_roblox_avatar")
	model:SetAttribute("Format", "RobloxGeneratedR15Avatar")
	model:SetAttribute("BodySource", "Players:CreateHumanoidModelFromDescription")
	model:SetAttribute("DetailPass", "Royal3DClothingCrownBeard")
	model:SetAttribute("UsesLayeredClothing", true)

	local humanoid = model:FindFirstChildOfClass("Humanoid")
	if humanoid then
		humanoid.DisplayName = "Crownbound Challenger"
		humanoid.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.None
		humanoid.HealthDisplayType = Enum.HumanoidHealthDisplayType.AlwaysOff
	end

	tintBaseBody(model)
	addDrawnRoyalFace(model)
	return model
end

local function configureTemplate(model)
	for _, descendant in ipairs(model:GetDescendants()) do
		if descendant:IsA("BasePart") then
			configurePart(descendant)
		elseif descendant:IsA("Script") or descendant:IsA("LocalScript") then
			descendant.Disabled = false
		end
	end
end

local function configurePreview(model)
	for _, descendant in ipairs(model:GetDescendants()) do
		if descendant:IsA("BasePart") then
			configurePart(descendant)
			descendant.Anchored = true
		elseif descendant:IsA("Script") or descendant:IsA("LocalScript") then
			descendant.Disabled = true
		end
	end
end

local function install()
	clearNamed(Workspace, "RealRobloxAvatarTest")
	clearNamed(Workspace, "CrownboundChallengerSkinPreview")
	clearNamed(Workspace, "CrownboundRobloxAvatarPreview")

	local charactersFolder = ReplicatedStorage:FindFirstChild("CrownChaosCharacters")
	if not charactersFolder then
		charactersFolder = Instance.new("Folder")
		charactersFolder.Name = "CrownChaosCharacters"
		charactersFolder.Parent = ReplicatedStorage
	end
	clearNamed(charactersFolder, "CrownboundRobloxAvatarTemplate")

	local preview = createRobloxAvatar()
	preview.Name = "CrownboundRobloxAvatarPreview"
	preview.Parent = Workspace
	preview:PivotTo(CFrame.new(0, 3, 0) * CFrame.Angles(0, math.rad(180), 0))
	configurePreview(preview)

	local template = preview:Clone()
	template.Name = "CrownboundRobloxAvatarTemplate"
	template.Parent = charactersFolder
	template:PivotTo(CFrame.new(0, 0, 0))
	configureTemplate(template)

	local previousStarter = StarterPlayer:FindFirstChild("StarterCharacter")
	if previousStarter then
		if previousStarter:GetAttribute("CrownChaosGenerated") then
			previousStarter:Destroy()
		else
			previousStarter.Name = "StarterCharacter_Previous_" .. os.time()
		end
	end

	local starterCharacter = template:Clone()
	starterCharacter.Name = "StarterCharacter"
	starterCharacter.Parent = StarterPlayer
	starterCharacter:SetAttribute("CrownChaosGenerated", true)
	starterCharacter:SetAttribute("SkinId", "crownbound_real_roblox_avatar")
	starterCharacter:SetAttribute("Format", "RobloxGeneratedR15Avatar")
	starterCharacter:SetAttribute("DetailPass", "Royal3DClothingCrownBeard")
	starterCharacter:SetAttribute("UsesLayeredClothing", true)
	configureTemplate(starterCharacter)

	local camera = Workspace.CurrentCamera
	if camera then
		camera.FieldOfView = 48
		camera.CFrame = CFrame.lookAt(Vector3.new(5.5, 4.1, 8.2), Vector3.new(0, 3.1, 0))
		camera.Focus = CFrame.new(0, 3, 0)
	end

	return {
		ok = true,
		format = "RobloxGeneratedR15Avatar",
		detailPass = "Royal3DClothingCrownBeard",
		template = template:GetFullName(),
		preview = preview:GetFullName(),
		starterCharacter = starterCharacter:GetFullName(),
		meshParts = countDescendantsOfClass(template, "MeshPart"),
		accessories = countDescendantsOfClass(template, "Accessory"),
		surfaceFaces = countDescendantsOfClass(template, "SurfaceGui"),
		wrapLayers = countDescendantsOfClass(template, "WrapLayer"),
		wrapTargets = countDescendantsOfClass(template, "WrapTarget"),
		accessoryNames = getAccessoryNames(template),
	}
end

return install()
