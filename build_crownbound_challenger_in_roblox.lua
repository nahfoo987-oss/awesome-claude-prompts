-- Builds Crownbound Challenger directly inside Roblox Studio.
-- Creates:
-- 1. ReplicatedStorage.CrownChaosCharacters.CrownboundChallenger
-- 2. Workspace.CrownboundChallengerPreview
-- 3. StarterPlayer.StarterCharacter

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local StarterPlayer = game:GetService("StarterPlayer")
local Workspace = game:GetService("Workspace")

local COLORS = {
	Armor = Color3.fromRGB(7, 7, 11),
	ArmorSoft = Color3.fromRGB(15, 14, 20),
	ArmorEdge = Color3.fromRGB(30, 28, 36),
	Gold = Color3.fromRGB(198, 160, 78),
	GoldDark = Color3.fromRGB(118, 88, 36),
	Purple = Color3.fromRGB(141, 46, 255),
	Magenta = Color3.fromRGB(209, 70, 255),
	Cloth = Color3.fromRGB(43, 20, 63),
	Skin = Color3.fromRGB(214, 169, 111),
	SkinShadow = Color3.fromRGB(132, 92, 62),
	Hair = Color3.fromRGB(12, 9, 12),
	FaceLine = Color3.fromRGB(38, 22, 19),
}

local function clearNamed(parent, name)
	local existing = parent:FindFirstChild(name)
	if existing then
		existing:Destroy()
	end
end

local function part(className, name, size, cframe, color, material, parent, anchored)
	local object = Instance.new(className or "Part")
	object.Name = name
	object.Size = size
	object.CFrame = cframe
	object.Color = color
	object.Material = material or Enum.Material.SmoothPlastic
	object.Anchored = anchored
	object.CanCollide = false
	object.CanTouch = false
	object.CanQuery = true
	object.CastShadow = true
	object.TopSurface = Enum.SurfaceType.Smooth
	object.BottomSurface = Enum.SurfaceType.Smooth
	object.Parent = parent
	if object:IsA("BasePart") then
		object.Massless = name ~= "HumanoidRootPart"
	end
	return object
end

local function weld(part0, part1)
	local constraint = Instance.new("WeldConstraint")
	constraint.Name = "Weld_" .. part1.Name
	constraint.Part0 = part0
	constraint.Part1 = part1
	constraint.Parent = part1
	return constraint
end

local function accessory(model, basePart, className, name, size, localCFrame, color, material, anchored, shape)
	local object = part(className, name, size, basePart.CFrame * localCFrame, color, material, model, anchored)
	if shape then
		object.Shape = shape
	end
	weld(basePart, object)
	return object
end

local function glow(object, color, range, brightness)
	local light = Instance.new("PointLight")
	light.Name = "Glow"
	light.Color = color
	light.Range = range
	light.Brightness = brightness
	light.Shadows = false
	light.Parent = object
	return light
end

local function motor(name, part0, part1, c0, c1)
	local joint = Instance.new("Motor6D")
	joint.Name = name
	joint.Part0 = part0
	joint.Part1 = part1
	joint.C0 = c0
	joint.C1 = c1
	joint.Parent = part0
	return joint
end

local function addFace(model, head, anchored)
	local front = -0.545

	accessory(model, head, "Part", "Accessory_Hair_ShadowCap", Vector3.new(1.22, 0.22, 1.00), CFrame.new(0, 0.50, -0.03), COLORS.Hair, Enum.Material.SmoothPlastic, anchored)
	accessory(model, head, "Part", "Accessory_Hair_FrontFringe", Vector3.new(1.04, 0.26, 0.16), CFrame.new(0, 0.28, front - 0.025), COLORS.Hair, Enum.Material.SmoothPlastic, anchored)
	accessory(model, head, "Part", "Accessory_Hair_LeftChunk", Vector3.new(0.20, 0.55, 0.16), CFrame.new(-0.48, 0.02, front - 0.015), COLORS.Hair, Enum.Material.SmoothPlastic, anchored)
	accessory(model, head, "Part", "Accessory_Hair_RightChunk", Vector3.new(0.20, 0.48, 0.16), CFrame.new(0.48, 0.04, front - 0.015), COLORS.Hair, Enum.Material.SmoothPlastic, anchored)
	accessory(model, head, "Part", "Accessory_Hair_BackMass", Vector3.new(1.15, 0.52, 0.18), CFrame.new(0, 0.18, 0.55), COLORS.Hair, Enum.Material.SmoothPlastic, anchored)
	accessory(model, head, "Part", "Accessory_Hair_BackLock_L", Vector3.new(0.18, 0.72, 0.14), CFrame.new(-0.46, -0.12, 0.55) * CFrame.Angles(0, 0, math.rad(7)), COLORS.Hair, Enum.Material.SmoothPlastic, anchored)
	accessory(model, head, "Part", "Accessory_Hair_BackLock_R", Vector3.new(0.18, 0.68, 0.14), CFrame.new(0.46, -0.10, 0.55) * CFrame.Angles(0, 0, math.rad(-7)), COLORS.Hair, Enum.Material.SmoothPlastic, anchored)
	accessory(model, head, "Part", "Accessory_Hair_TopLock_L", Vector3.new(0.30, 0.12, 0.36), CFrame.new(-0.22, 0.64, -0.05) * CFrame.Angles(0, 0, math.rad(-8)), COLORS.Hair, Enum.Material.SmoothPlastic, anchored)
	accessory(model, head, "Part", "Accessory_Hair_TopLock_R", Vector3.new(0.34, 0.12, 0.34), CFrame.new(0.18, 0.65, -0.07) * CFrame.Angles(0, 0, math.rad(8)), COLORS.Hair, Enum.Material.SmoothPlastic, anchored)

	accessory(model, head, "Part", "Accessory_TempleGuard_L", Vector3.new(0.08, 0.46, 0.08), CFrame.new(-0.60, 0.05, -0.28), COLORS.GoldDark, Enum.Material.Metal, anchored)
	accessory(model, head, "Part", "Accessory_TempleGuard_R", Vector3.new(0.08, 0.46, 0.08), CFrame.new(0.60, 0.05, -0.28), COLORS.GoldDark, Enum.Material.Metal, anchored)

	accessory(model, head, "Part", "Accessory_Brow_L", Vector3.new(0.24, 0.035, 0.035), CFrame.new(-0.22, 0.10, front - 0.035) * CFrame.Angles(0, 0, math.rad(-6)), COLORS.Hair, Enum.Material.SmoothPlastic, anchored)
	accessory(model, head, "Part", "Accessory_Brow_R", Vector3.new(0.24, 0.035, 0.035), CFrame.new(0.22, 0.10, front - 0.035) * CFrame.Angles(0, 0, math.rad(6)), COLORS.Hair, Enum.Material.SmoothPlastic, anchored)

	accessory(model, head, "Part", "Accessory_EyeSocket_L", Vector3.new(0.23, 0.11, 0.030), CFrame.new(-0.22, -0.015, front - 0.030), COLORS.FaceLine, Enum.Material.SmoothPlastic, anchored)
	accessory(model, head, "Part", "Accessory_EyeSocket_R", Vector3.new(0.23, 0.11, 0.030), CFrame.new(0.22, -0.015, front - 0.030), COLORS.FaceLine, Enum.Material.SmoothPlastic, anchored)
	local eyeL = accessory(model, head, "Part", "Accessory_EyeGlow_L", Vector3.new(0.15, 0.055, 0.035), CFrame.new(-0.22, -0.015, front - 0.055), COLORS.Magenta, Enum.Material.Neon, anchored)
	local eyeR = accessory(model, head, "Part", "Accessory_EyeGlow_R", Vector3.new(0.15, 0.055, 0.035), CFrame.new(0.22, -0.015, front - 0.055), COLORS.Magenta, Enum.Material.Neon, anchored)
	glow(eyeL, COLORS.Purple, 3, 0.35)
	glow(eyeR, COLORS.Purple, 3, 0.35)

	accessory(model, head, "Part", "Accessory_EyeCut_L", Vector3.new(0.28, 0.030, 0.035), CFrame.new(-0.22, -0.085, front - 0.058), COLORS.Hair, Enum.Material.SmoothPlastic, anchored)
	accessory(model, head, "Part", "Accessory_EyeCut_R", Vector3.new(0.28, 0.030, 0.035), CFrame.new(0.22, -0.085, front - 0.058), COLORS.Hair, Enum.Material.SmoothPlastic, anchored)
	accessory(model, head, "Part", "Accessory_NoseBridge", Vector3.new(0.040, 0.13, 0.026), CFrame.new(0.012, -0.09, front - 0.056), COLORS.FaceLine, Enum.Material.SmoothPlastic, anchored)
	accessory(model, head, "Part", "Accessory_NoseShadow", Vector3.new(0.055, 0.20, 0.026), CFrame.new(0.015, -0.18, front - 0.052), COLORS.SkinShadow, Enum.Material.SmoothPlastic, anchored)
	accessory(model, head, "Part", "Accessory_Mouth_Smirk", Vector3.new(0.32, 0.025, 0.028), CFrame.new(0.02, -0.39, front - 0.056) * CFrame.Angles(0, 0, math.rad(1.5)), COLORS.FaceLine, Enum.Material.SmoothPlastic, anchored)
	accessory(model, head, "Part", "Accessory_Mouth_LowerShadow", Vector3.new(0.22, 0.020, 0.022), CFrame.new(0.03, -0.455, front - 0.052), COLORS.SkinShadow, Enum.Material.SmoothPlastic, anchored)
	accessory(model, head, "Part", "Accessory_CheekShadow_L", Vector3.new(0.12, 0.035, 0.022), CFrame.new(-0.34, -0.24, front - 0.050), COLORS.SkinShadow, Enum.Material.SmoothPlastic, anchored)
	accessory(model, head, "Part", "Accessory_CheekShadow_R", Vector3.new(0.12, 0.035, 0.022), CFrame.new(0.34, -0.24, front - 0.050), COLORS.SkinShadow, Enum.Material.SmoothPlastic, anchored)

	accessory(model, head, "Part", "Accessory_Corruption_FaceScar_Main", Vector3.new(0.040, 0.38, 0.036), CFrame.new(0.42, -0.05, front - 0.065) * CFrame.Angles(0, 0, math.rad(-14)), COLORS.Purple, Enum.Material.Neon, anchored)
	accessory(model, head, "Part", "Accessory_Corruption_FaceScar_Branch_A", Vector3.new(0.030, 0.20, 0.032), CFrame.new(0.50, 0.02, front - 0.070) * CFrame.Angles(0, 0, math.rad(62)), COLORS.Magenta, Enum.Material.Neon, anchored)
	accessory(model, head, "Part", "Accessory_Corruption_FaceScar_Branch_B", Vector3.new(0.026, 0.17, 0.030), CFrame.new(0.48, -0.18, front - 0.070) * CFrame.Angles(0, 0, math.rad(-58)), COLORS.Purple, Enum.Material.Neon, anchored)
	accessory(model, head, "Part", "Accessory_Corruption_FaceScar_GlowSeed", Vector3.new(0.085, 0.085, 0.034), CFrame.new(0.43, -0.035, front - 0.078), COLORS.Magenta, Enum.Material.Neon, anchored)
end

local function addCrown(model, head, anchored)
	local ring = accessory(model, head, "Part", "Accessory_Crown_Circlet", Vector3.new(1.34, 0.12, 1.34), CFrame.new(0, 0.72, 0), COLORS.Gold, Enum.Material.Metal, anchored, Enum.PartType.Cylinder)
	glow(ring, COLORS.Gold, 3, 0.08)

	local spikeData = {
		{-0.48, 0.42},
		{-0.24, 0.34},
		{0, 0.55},
		{0.24, 0.34},
		{0.48, 0.42},
	}

	for index, data in ipairs(spikeData) do
		accessory(model, head, "WedgePart", "Accessory_Crown_Spike_" .. index, Vector3.new(0.19, data[2], 0.18), CFrame.new(data[1], 0.98 + data[2] * 0.22, -0.05) * CFrame.Angles(0, math.rad(180), 0), COLORS.Gold, Enum.Material.Metal, anchored)
	end

	accessory(model, head, "Part", "Accessory_Crown_BrokenBackProng_L", Vector3.new(0.13, 0.42, 0.13), CFrame.new(-0.42, 1.07, 0.45) * CFrame.Angles(math.rad(-10), 0, math.rad(-12)), COLORS.GoldDark, Enum.Material.Metal, anchored)
	accessory(model, head, "Part", "Accessory_Crown_BrokenBackProng_R", Vector3.new(0.13, 0.30, 0.13), CFrame.new(0.42, 1.02, 0.45) * CFrame.Angles(math.rad(8), 0, math.rad(12)), COLORS.GoldDark, Enum.Material.Metal, anchored)
	accessory(model, head, "Part", "Accessory_Crown_FrontFiligree", Vector3.new(0.62, 0.045, 0.055), CFrame.new(0, 0.80, -0.70), COLORS.GoldDark, Enum.Material.Metal, anchored)
	local gem = accessory(model, head, "Part", "Accessory_Crown_FrontGem", Vector3.new(0.14, 0.14, 0.05), CFrame.new(0, 0.72, -0.68) * CFrame.Angles(0, 0, math.rad(45)), COLORS.Magenta, Enum.Material.Neon, anchored)
	glow(gem, COLORS.Purple, 4, 0.5)
end

local function addArmor(model, torso, leftArm, rightArm, leftLeg, rightLeg, anchored)
	accessory(model, torso, "Part", "Accessory_InnerChestPlate", Vector3.new(1.54, 1.34, 0.06), CFrame.new(0, 0.05, -0.535), COLORS.ArmorSoft, Enum.Material.Metal, anchored)
	accessory(model, torso, "Part", "Accessory_ChestFrame_Top", Vector3.new(1.46, 0.10, 0.08), CFrame.new(0, 0.68, -0.56), COLORS.Gold, Enum.Material.Metal, anchored)
	accessory(model, torso, "Part", "Accessory_ChestFrame_Bottom", Vector3.new(1.46, 0.10, 0.08), CFrame.new(0, -0.56, -0.56), COLORS.Gold, Enum.Material.Metal, anchored)
	accessory(model, torso, "Part", "Accessory_ChestFrame_Left", Vector3.new(0.10, 1.20, 0.08), CFrame.new(-0.78, 0.05, -0.56), COLORS.Gold, Enum.Material.Metal, anchored)
	accessory(model, torso, "Part", "Accessory_ChestFrame_Right", Vector3.new(0.10, 1.20, 0.08), CFrame.new(0.78, 0.05, -0.56), COLORS.Gold, Enum.Material.Metal, anchored)
	accessory(model, torso, "Part", "Accessory_ChestDiagonalSash", Vector3.new(0.12, 1.54, 0.075), CFrame.new(-0.02, 0.04, -0.60) * CFrame.Angles(0, 0, math.rad(-38)), COLORS.GoldDark, Enum.Material.Metal, anchored)
	local chestGem = accessory(model, torso, "Part", "Accessory_ChestGem", Vector3.new(0.28, 0.28, 0.08), CFrame.new(0, 0.10, -0.62) * CFrame.Angles(0, 0, math.rad(45)), COLORS.Magenta, Enum.Material.Neon, anchored)
	glow(chestGem, COLORS.Purple, 7, 0.9)
	accessory(model, torso, "Part", "Accessory_Corruption_Chest_Crack_L", Vector3.new(0.42, 0.035, 0.035), CFrame.new(-0.26, 0.25, -0.64) * CFrame.Angles(0, 0, math.rad(34)), COLORS.Purple, Enum.Material.Neon, anchored)
	accessory(model, torso, "Part", "Accessory_Corruption_Chest_Crack_R", Vector3.new(0.46, 0.035, 0.035), CFrame.new(0.30, -0.06, -0.64) * CFrame.Angles(0, 0, math.rad(-32)), COLORS.Purple, Enum.Material.Neon, anchored)
	accessory(model, torso, "Part", "Accessory_Corruption_Chest_Crack_Branch", Vector3.new(0.29, 0.030, 0.030), CFrame.new(0.12, 0.28, -0.645) * CFrame.Angles(0, 0, math.rad(-68)), COLORS.Magenta, Enum.Material.Neon, anchored)

	accessory(model, torso, "Part", "Accessory_RoyalSideScarf", Vector3.new(0.12, 1.30, 0.10), CFrame.new(-0.72, 0.05, -0.62) * CFrame.Angles(0, 0, math.rad(-13)), COLORS.Cloth, Enum.Material.Fabric, anchored)
	accessory(model, torso, "Part", "Accessory_RoyalSideScarf_GoldPin", Vector3.new(0.07, 0.38, 0.08), CFrame.new(-0.62, 0.45, -0.66) * CFrame.Angles(0, 0, math.rad(-13)), COLORS.Gold, Enum.Material.Metal, anchored)

	accessory(model, torso, "Part", "Accessory_WaistGoldBelt", Vector3.new(2.12, 0.14, 0.12), CFrame.new(0, -0.93, -0.53), COLORS.Gold, Enum.Material.Metal, anchored)
	accessory(model, torso, "Part", "Accessory_WaistBuckleGem", Vector3.new(0.18, 0.18, 0.065), CFrame.new(0, -0.93, -0.62) * CFrame.Angles(0, 0, math.rad(45)), COLORS.Purple, Enum.Material.Neon, anchored)
	accessory(model, torso, "Part", "Accessory_RoyalWaistCloth", Vector3.new(0.55, 0.88, 0.12), CFrame.new(0, -1.36, -0.58), COLORS.Cloth, Enum.Material.Fabric, anchored)
	accessory(model, torso, "Part", "Accessory_ShortRoyalCape", Vector3.new(2.35, 1.65, 0.13), CFrame.new(0, -0.08, 0.63) * CFrame.Angles(math.rad(-5), 0, 0), COLORS.Cloth, Enum.Material.Fabric, anchored)
	accessory(model, torso, "Part", "Accessory_CapeGoldTrim_L", Vector3.new(0.08, 1.56, 0.08), CFrame.new(-1.12, -0.08, 0.56) * CFrame.Angles(math.rad(-5), 0, 0), COLORS.GoldDark, Enum.Material.Metal, anchored)
	accessory(model, torso, "Part", "Accessory_CapeGoldTrim_R", Vector3.new(0.08, 1.56, 0.08), CFrame.new(1.12, -0.08, 0.56) * CFrame.Angles(math.rad(-5), 0, 0), COLORS.GoldDark, Enum.Material.Metal, anchored)
	accessory(model, torso, "Part", "Accessory_CapeBottomTrim", Vector3.new(2.18, 0.08, 0.08), CFrame.new(0, -0.89, 0.53) * CFrame.Angles(math.rad(-5), 0, 0), COLORS.GoldDark, Enum.Material.Metal, anchored)
	accessory(model, torso, "Part", "Accessory_CapeGoldClasp_L", Vector3.new(0.25, 0.18, 0.12), CFrame.new(-0.45, 0.78, -0.58), COLORS.Gold, Enum.Material.Metal, anchored)
	accessory(model, torso, "Part", "Accessory_CapeGoldClasp_R", Vector3.new(0.25, 0.18, 0.12), CFrame.new(0.45, 0.78, -0.58), COLORS.Gold, Enum.Material.Metal, anchored)

	accessory(model, leftArm, "Part", "Accessory_Shoulder_L", Vector3.new(1.00, 0.42, 1.00), CFrame.new(0, 0.82, 0), COLORS.ArmorSoft, Enum.Material.Metal, anchored)
	accessory(model, leftArm, "Part", "Accessory_ShoulderGold_L", Vector3.new(1.04, 0.09, 0.12), CFrame.new(0, 0.92, -0.48), COLORS.Gold, Enum.Material.Metal, anchored)
	accessory(model, rightArm, "Part", "Accessory_Shoulder_R_Corrupted", Vector3.new(1.05, 0.46, 1.05), CFrame.new(0, 0.84, 0), COLORS.ArmorSoft, Enum.Material.Metal, anchored)
	accessory(model, rightArm, "Part", "Accessory_ShoulderGold_R", Vector3.new(1.08, 0.09, 0.12), CFrame.new(0, 0.95, -0.50), COLORS.Gold, Enum.Material.Metal, anchored)
	accessory(model, leftArm, "Part", "Accessory_WristGold_L", Vector3.new(0.92, 0.20, 0.92), CFrame.new(0, -0.84, 0), COLORS.Gold, Enum.Material.Metal, anchored)
	accessory(model, rightArm, "Part", "Accessory_WristGold_R", Vector3.new(0.96, 0.20, 0.96), CFrame.new(0, -0.84, 0), COLORS.Gold, Enum.Material.Metal, anchored)
	accessory(model, leftArm, "Part", "Accessory_GlovePlate_L", Vector3.new(0.70, 0.12, 0.20), CFrame.new(0, -0.55, -0.48), COLORS.ArmorEdge, Enum.Material.Metal, anchored)
	accessory(model, rightArm, "Part", "Accessory_GlovePlate_R", Vector3.new(0.72, 0.12, 0.20), CFrame.new(0, -0.55, -0.50), COLORS.ArmorEdge, Enum.Material.Metal, anchored)
	accessory(model, rightArm, "Part", "Accessory_Corruption_RightArm_Vein_A", Vector3.new(0.055, 1.22, 0.040), CFrame.new(0.30, 0.02, -0.47), COLORS.Magenta, Enum.Material.Neon, anchored)
	accessory(model, rightArm, "Part", "Accessory_Corruption_RightArm_Vein_B", Vector3.new(0.050, 0.58, 0.040), CFrame.new(0.21, 0.25, -0.49) * CFrame.Angles(0, 0, math.rad(38)), COLORS.Purple, Enum.Material.Neon, anchored)
	accessory(model, rightArm, "Part", "Accessory_Corruption_RightHandSeed", Vector3.new(0.13, 0.13, 0.050), CFrame.new(0.18, -0.76, -0.51), COLORS.Magenta, Enum.Material.Neon, anchored)

	accessory(model, leftLeg, "Part", "Accessory_KneeGold_L", Vector3.new(0.76, 0.14, 0.10), CFrame.new(0, 0.20, -0.46), COLORS.Gold, Enum.Material.Metal, anchored)
	accessory(model, rightLeg, "Part", "Accessory_KneeGold_R", Vector3.new(0.76, 0.14, 0.10), CFrame.new(0, 0.20, -0.46), COLORS.Gold, Enum.Material.Metal, anchored)
	accessory(model, leftLeg, "Part", "Accessory_ThighPlate_L", Vector3.new(0.72, 0.42, 0.10), CFrame.new(0, 0.58, -0.45), COLORS.ArmorSoft, Enum.Material.Metal, anchored)
	accessory(model, rightLeg, "Part", "Accessory_ThighPlate_R", Vector3.new(0.72, 0.42, 0.10), CFrame.new(0, 0.58, -0.45), COLORS.ArmorSoft, Enum.Material.Metal, anchored)
	accessory(model, leftLeg, "Part", "Accessory_Boot_L", Vector3.new(0.96, 0.32, 1.08), CFrame.new(0, -0.86, -0.03), COLORS.Armor, Enum.Material.Metal, anchored)
	accessory(model, rightLeg, "Part", "Accessory_Boot_R", Vector3.new(0.96, 0.32, 1.08), CFrame.new(0, -0.86, -0.03), COLORS.Armor, Enum.Material.Metal, anchored)
	accessory(model, leftLeg, "Part", "Accessory_BootGoldToe_L", Vector3.new(0.82, 0.13, 0.18), CFrame.new(0, -0.78, -0.58), COLORS.GoldDark, Enum.Material.Metal, anchored)
	accessory(model, rightLeg, "Part", "Accessory_BootGoldToe_R", Vector3.new(0.82, 0.13, 0.18), CFrame.new(0, -0.78, -0.58), COLORS.GoldDark, Enum.Material.Metal, anchored)
end

local function addUtilityAttachments(root, torso, head, leftArm, rightArm)
	local auraRoot = Instance.new("Attachment")
	auraRoot.Name = "AuraRootAttachment"
	auraRoot.Position = Vector3.new(0, 0, 0)
	auraRoot.Parent = root

	local chest = Instance.new("Attachment")
	chest.Name = "ChestRelicAttachment"
	chest.Position = Vector3.new(0, 0.12, -0.62)
	chest.Parent = torso

	local crown = Instance.new("Attachment")
	crown.Name = "CrownSocketAttachment"
	crown.Position = Vector3.new(0, 0.95, 0)
	crown.Parent = head

	local leftGrip = Instance.new("Attachment")
	leftGrip.Name = "LeftHandGripAttachment"
	leftGrip.Position = Vector3.new(0, -0.94, -0.46)
	leftGrip.Parent = leftArm

	local rightGrip = Instance.new("Attachment")
	rightGrip.Name = "RightHandGripAttachment"
	rightGrip.Position = Vector3.new(0, -0.94, -0.48)
	rightGrip.Parent = rightArm
end

local function createCharacter(name, parent, origin, anchored)
	local model = Instance.new("Model")
	model.Name = name
	model.Parent = parent

	local base = CFrame.new(origin)
	local root = part("Part", "HumanoidRootPart", Vector3.new(2.0, 2.0, 1.0), base * CFrame.new(0, 3.0, 0), Color3.new(1, 1, 1), Enum.Material.SmoothPlastic, model, anchored)
	root.Transparency = 1
	root.CastShadow = false

	local torso = part("Part", "Torso", Vector3.new(2.0, 2.0, 1.0), base * CFrame.new(0, 3.0, 0), COLORS.Armor, Enum.Material.Metal, model, anchored)
	local head = part("Part", "Head", Vector3.new(1.15, 1.05, 1.05), base * CFrame.new(0, 4.55, -0.02), COLORS.Skin, Enum.Material.SmoothPlastic, model, anchored)
	local leftArm = part("Part", "Left Arm", Vector3.new(0.86, 2.0, 0.86), base * CFrame.new(-1.48, 3.0, 0), COLORS.Armor, Enum.Material.Metal, model, anchored)
	local rightArm = part("Part", "Right Arm", Vector3.new(0.90, 2.0, 0.90), base * CFrame.new(1.48, 3.0, 0), COLORS.Armor, Enum.Material.Metal, model, anchored)
	local leftLeg = part("Part", "Left Leg", Vector3.new(0.86, 2.0, 0.86), base * CFrame.new(-0.48, 1.0, 0), COLORS.Armor, Enum.Material.Metal, model, anchored)
	local rightLeg = part("Part", "Right Leg", Vector3.new(0.86, 2.0, 0.86), base * CFrame.new(0.48, 1.0, 0), COLORS.Armor, Enum.Material.Metal, model, anchored)

	local humanoid = Instance.new("Humanoid")
	humanoid.Name = "Humanoid"
	humanoid.RigType = Enum.HumanoidRigType.R6
	humanoid.DisplayName = "Crownbound Challenger"
	humanoid.HipHeight = 0
	humanoid.Parent = model

	model.PrimaryPart = root

	motor("RootJoint", root, torso, CFrame.new(), CFrame.new())
	motor("Neck", torso, head, CFrame.new(0, 1.0, 0), CFrame.new(0, -0.53, 0))
	motor("Left Shoulder", torso, leftArm, CFrame.new(-1.02, 0.48, 0), CFrame.new(0.43, 0.52, 0))
	motor("Right Shoulder", torso, rightArm, CFrame.new(1.02, 0.48, 0), CFrame.new(-0.45, 0.52, 0))
	motor("Left Hip", torso, leftLeg, CFrame.new(-0.50, -1.0, 0), CFrame.new(0, 1.0, 0))
	motor("Right Hip", torso, rightLeg, CFrame.new(0.50, -1.0, 0), CFrame.new(0, 1.0, 0))

	addFace(model, head, anchored)
	addCrown(model, head, anchored)
	addArmor(model, torso, leftArm, rightArm, leftLeg, rightLeg, anchored)
	addUtilityAttachments(root, torso, head, leftArm, rightArm)

	for _, descendant in ipairs(model:GetDescendants()) do
		if descendant:IsA("BasePart") then
			descendant.Locked = false
		end
	end

	return model
end

local charactersFolder = ReplicatedStorage:FindFirstChild("CrownChaosCharacters")
if not charactersFolder then
	charactersFolder = Instance.new("Folder")
	charactersFolder.Name = "CrownChaosCharacters"
	charactersFolder.Parent = ReplicatedStorage
end

clearNamed(charactersFolder, "CrownboundChallenger")
local template = createCharacter("CrownboundChallenger", charactersFolder, Vector3.new(0, 0, 0), false)

clearNamed(Workspace, "CrownboundChallengerPreview")
local preview = template:Clone()
preview.Name = "CrownboundChallengerPreview"
preview.Parent = Workspace
preview:PivotTo(CFrame.new(0, 0, 0))
for _, descendant in ipairs(preview:GetDescendants()) do
	if descendant:IsA("BasePart") then
		descendant.Anchored = true
	end
end

local existingStarter = StarterPlayer:FindFirstChild("StarterCharacter")
if existingStarter and existingStarter:GetAttribute("CrownChaosGenerated") ~= true then
	existingStarter.Name = "StarterCharacter_Previous_" .. os.time()
elseif existingStarter then
	existingStarter:Destroy()
end

local starterCharacter = template:Clone()
starterCharacter.Name = "StarterCharacter"
starterCharacter:SetAttribute("CrownChaosGenerated", true)
starterCharacter.Parent = StarterPlayer
for _, descendant in ipairs(starterCharacter:GetDescendants()) do
	if descendant:IsA("BasePart") then
		descendant.Anchored = false
	end
end

local camera = Workspace.CurrentCamera
if camera then
	camera.FieldOfView = 45
	camera.CFrame = CFrame.lookAt(Vector3.new(5.8, 4.4, 8.5), Vector3.new(0, 3.0, 0))
end

return {
	template = template:GetFullName(),
	preview = preview:GetFullName(),
	starterCharacter = starterCharacter:GetFullName(),
	parts = #preview:GetDescendants(),
}
