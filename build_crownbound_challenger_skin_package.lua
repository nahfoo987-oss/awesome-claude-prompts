-- Builds Crownbound Challenger as a Roblox-format character skin package.
-- This uses real Roblox character structures:
-- - R6 body parts + Humanoid + BodyColors
-- - Shirt/Pants containers
-- - Accessory instances with Handle parts and matching Attachments
-- - ReplicatedStorage skin package for reuse

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

local function setAccessoryType(accessory, enumName)
	pcall(function()
		accessory.AccessoryType = Enum.AccessoryType[enumName]
	end)
end

local function configurePart(object, color, material)
	object.Color = color
	object.Material = material or Enum.Material.SmoothPlastic
	object.Anchored = false
	object.CanCollide = false
	object.CanTouch = false
	object.CanQuery = false
	object.CastShadow = true
	object.Massless = true
	object.TopSurface = Enum.SurfaceType.Smooth
	object.BottomSurface = Enum.SurfaceType.Smooth
end

local function detailPart(parent, handle, className, name, size, localCFrame, color, material, shape)
	local object = Instance.new(className or "Part")
	object.Name = name
	object.Size = size
	object.CFrame = handle.CFrame * localCFrame
	configurePart(object, color, material)
	if shape and object:IsA("Part") then
		object.Shape = shape
	end
	object.Parent = parent

	local weld = Instance.new("WeldConstraint")
	weld.Name = "WeldToHandle"
	weld.Part0 = handle
	weld.Part1 = object
	weld.Parent = object

	return object
end

local function glow(object, color, range, brightness)
	local light = Instance.new("PointLight")
	light.Name = "CosmeticGlow"
	light.Color = color
	light.Range = range
	light.Brightness = brightness
	light.Shadows = false
	light.Parent = object
	return light
end

local function makeAccessory(name, accessoryType, attachmentName, buildDetails)
	local accessory = Instance.new("Accessory")
	accessory.Name = name
	setAccessoryType(accessory, accessoryType)

	local handle = Instance.new("Part")
	handle.Name = "Handle"
	handle.Size = Vector3.new(0.2, 0.2, 0.2)
	handle.Transparency = 1
	configurePart(handle, COLORS.Armor, Enum.Material.SmoothPlastic)
	handle.Parent = accessory

	local attachment = Instance.new("Attachment")
	attachment.Name = attachmentName
	attachment.Parent = handle

	buildDetails(accessory, handle)
	return accessory
end

local function makeSkinAccessories(parent)
	local accessories = Instance.new("Folder")
	accessories.Name = "Accessories"
	accessories.Parent = parent

	local hair = makeAccessory("Crownbound_Hair", "Hair", "HairAttachment", function(accessory, handle)
		detailPart(accessory, handle, "Part", "Hair_ShadowCap", Vector3.new(1.22, 0.22, 1.00), CFrame.new(0, 0.08, -0.03), COLORS.Hair, Enum.Material.SmoothPlastic)
		detailPart(accessory, handle, "Part", "Hair_FrontFringe", Vector3.new(1.04, 0.26, 0.16), CFrame.new(0, -0.18, -0.56), COLORS.Hair, Enum.Material.SmoothPlastic)
		detailPart(accessory, handle, "Part", "Hair_LeftChunk", Vector3.new(0.20, 0.55, 0.16), CFrame.new(-0.48, -0.44, -0.55), COLORS.Hair, Enum.Material.SmoothPlastic)
		detailPart(accessory, handle, "Part", "Hair_RightChunk", Vector3.new(0.20, 0.48, 0.16), CFrame.new(0.48, -0.42, -0.55), COLORS.Hair, Enum.Material.SmoothPlastic)
		detailPart(accessory, handle, "Part", "Hair_BackMass", Vector3.new(1.15, 0.52, 0.18), CFrame.new(0, -0.28, 0.55), COLORS.Hair, Enum.Material.SmoothPlastic)
		detailPart(accessory, handle, "Part", "Hair_BackLock_L", Vector3.new(0.18, 0.72, 0.14), CFrame.new(-0.46, -0.58, 0.55) * CFrame.Angles(0, 0, math.rad(7)), COLORS.Hair, Enum.Material.SmoothPlastic)
		detailPart(accessory, handle, "Part", "Hair_BackLock_R", Vector3.new(0.18, 0.68, 0.14), CFrame.new(0.46, -0.56, 0.55) * CFrame.Angles(0, 0, math.rad(-7)), COLORS.Hair, Enum.Material.SmoothPlastic)
		detailPart(accessory, handle, "Part", "Hair_TopLock_L", Vector3.new(0.30, 0.12, 0.36), CFrame.new(-0.22, 0.22, -0.05) * CFrame.Angles(0, 0, math.rad(-8)), COLORS.Hair, Enum.Material.SmoothPlastic)
		detailPart(accessory, handle, "Part", "Hair_TopLock_R", Vector3.new(0.34, 0.12, 0.34), CFrame.new(0.18, 0.23, -0.07) * CFrame.Angles(0, 0, math.rad(8)), COLORS.Hair, Enum.Material.SmoothPlastic)
	end)
	hair.Parent = accessories

	local crown = makeAccessory("Crownbound_FounderCrown", "Hat", "HatAttachment", function(accessory, handle)
		local ring = detailPart(accessory, handle, "Part", "Crown_Circlet", Vector3.new(1.34, 0.12, 1.34), CFrame.new(0, -0.05, 0), COLORS.Gold, Enum.Material.Metal, Enum.PartType.Cylinder)
		glow(ring, COLORS.Gold, 3, 0.08)

		local spikeData = {
			{-0.48, 0.42},
			{-0.24, 0.34},
			{0, 0.55},
			{0.24, 0.34},
			{0.48, 0.42},
		}

		for index, data in ipairs(spikeData) do
			detailPart(accessory, handle, "WedgePart", "Crown_Spike_" .. index, Vector3.new(0.19, data[2], 0.18), CFrame.new(data[1], 0.22 + data[2] * 0.22, -0.05) * CFrame.Angles(0, math.rad(180), 0), COLORS.Gold, Enum.Material.Metal)
		end

		detailPart(accessory, handle, "Part", "Crown_BrokenBackProng_L", Vector3.new(0.13, 0.42, 0.13), CFrame.new(-0.42, 0.24, 0.45) * CFrame.Angles(math.rad(-10), 0, math.rad(-12)), COLORS.GoldDark, Enum.Material.Metal)
		detailPart(accessory, handle, "Part", "Crown_BrokenBackProng_R", Vector3.new(0.13, 0.30, 0.13), CFrame.new(0.42, 0.20, 0.45) * CFrame.Angles(math.rad(8), 0, math.rad(12)), COLORS.GoldDark, Enum.Material.Metal)
		detailPart(accessory, handle, "Part", "Crown_FrontFiligree", Vector3.new(0.62, 0.045, 0.055), CFrame.new(0, 0.02, -0.70), COLORS.GoldDark, Enum.Material.Metal)
		local gem = detailPart(accessory, handle, "Part", "Crown_FrontGem", Vector3.new(0.14, 0.14, 0.05), CFrame.new(0, -0.06, -0.68) * CFrame.Angles(0, 0, math.rad(45)), COLORS.Magenta, Enum.Material.Neon)
		glow(gem, COLORS.Purple, 4, 0.5)
	end)
	crown.Parent = accessories

	local face = makeAccessory("Crownbound_FaceMarks", "Face", "FaceFrontAttachment", function(accessory, handle)
		detailPart(accessory, handle, "Part", "TempleGuard_L", Vector3.new(0.08, 0.46, 0.08), CFrame.new(-0.60, 0.07, 0.30), COLORS.GoldDark, Enum.Material.Metal)
		detailPart(accessory, handle, "Part", "TempleGuard_R", Vector3.new(0.08, 0.46, 0.08), CFrame.new(0.60, 0.07, 0.30), COLORS.GoldDark, Enum.Material.Metal)
		detailPart(accessory, handle, "Part", "Brow_L", Vector3.new(0.24, 0.035, 0.035), CFrame.new(-0.22, 0.12, -0.02) * CFrame.Angles(0, 0, math.rad(-6)), COLORS.Hair, Enum.Material.SmoothPlastic)
		detailPart(accessory, handle, "Part", "Brow_R", Vector3.new(0.24, 0.035, 0.035), CFrame.new(0.22, 0.12, -0.02) * CFrame.Angles(0, 0, math.rad(6)), COLORS.Hair, Enum.Material.SmoothPlastic)
		detailPart(accessory, handle, "Part", "EyeSocket_L", Vector3.new(0.23, 0.11, 0.030), CFrame.new(-0.22, 0.005, -0.020), COLORS.FaceLine, Enum.Material.SmoothPlastic)
		detailPart(accessory, handle, "Part", "EyeSocket_R", Vector3.new(0.23, 0.11, 0.030), CFrame.new(0.22, 0.005, -0.020), COLORS.FaceLine, Enum.Material.SmoothPlastic)
		local eyeL = detailPart(accessory, handle, "Part", "EyeGlow_L", Vector3.new(0.15, 0.055, 0.035), CFrame.new(-0.22, 0.005, -0.045), COLORS.Magenta, Enum.Material.Neon)
		local eyeR = detailPart(accessory, handle, "Part", "EyeGlow_R", Vector3.new(0.15, 0.055, 0.035), CFrame.new(0.22, 0.005, -0.045), COLORS.Magenta, Enum.Material.Neon)
		glow(eyeL, COLORS.Purple, 3, 0.35)
		glow(eyeR, COLORS.Purple, 3, 0.35)
		detailPart(accessory, handle, "Part", "EyeCut_L", Vector3.new(0.28, 0.030, 0.035), CFrame.new(-0.22, -0.065, -0.048), COLORS.Hair, Enum.Material.SmoothPlastic)
		detailPart(accessory, handle, "Part", "EyeCut_R", Vector3.new(0.28, 0.030, 0.035), CFrame.new(0.22, -0.065, -0.048), COLORS.Hair, Enum.Material.SmoothPlastic)
		detailPart(accessory, handle, "Part", "NoseBridge", Vector3.new(0.040, 0.13, 0.026), CFrame.new(0.012, -0.07, -0.046), COLORS.FaceLine, Enum.Material.SmoothPlastic)
		detailPart(accessory, handle, "Part", "NoseShadow", Vector3.new(0.055, 0.20, 0.026), CFrame.new(0.015, -0.16, -0.042), COLORS.SkinShadow, Enum.Material.SmoothPlastic)
		detailPart(accessory, handle, "Part", "Mouth_Smirk", Vector3.new(0.32, 0.025, 0.028), CFrame.new(0.02, -0.37, -0.046) * CFrame.Angles(0, 0, math.rad(1.5)), COLORS.FaceLine, Enum.Material.SmoothPlastic)
		detailPart(accessory, handle, "Part", "Mouth_LowerShadow", Vector3.new(0.22, 0.020, 0.022), CFrame.new(0.03, -0.435, -0.042), COLORS.SkinShadow, Enum.Material.SmoothPlastic)
		detailPart(accessory, handle, "Part", "Corruption_FaceScar_Main", Vector3.new(0.040, 0.38, 0.036), CFrame.new(0.42, -0.03, -0.055) * CFrame.Angles(0, 0, math.rad(-14)), COLORS.Purple, Enum.Material.Neon)
		detailPart(accessory, handle, "Part", "Corruption_FaceScar_Branch_A", Vector3.new(0.030, 0.20, 0.032), CFrame.new(0.50, 0.04, -0.060) * CFrame.Angles(0, 0, math.rad(62)), COLORS.Magenta, Enum.Material.Neon)
		detailPart(accessory, handle, "Part", "Corruption_FaceScar_Branch_B", Vector3.new(0.026, 0.17, 0.030), CFrame.new(0.48, -0.16, -0.060) * CFrame.Angles(0, 0, math.rad(-58)), COLORS.Purple, Enum.Material.Neon)
	end)
	face.Parent = accessories

	local armor = makeAccessory("Crownbound_RoyalArmor", "Front", "BodyFrontAttachment", function(accessory, handle)
		detailPart(accessory, handle, "Part", "InnerChestPlate", Vector3.new(1.54, 1.34, 0.06), CFrame.new(0, 0.05, -0.035), COLORS.ArmorSoft, Enum.Material.Metal)
		detailPart(accessory, handle, "Part", "ChestFrame_Top", Vector3.new(1.46, 0.10, 0.08), CFrame.new(0, 0.68, -0.06), COLORS.Gold, Enum.Material.Metal)
		detailPart(accessory, handle, "Part", "ChestFrame_Bottom", Vector3.new(1.46, 0.10, 0.08), CFrame.new(0, -0.56, -0.06), COLORS.Gold, Enum.Material.Metal)
		detailPart(accessory, handle, "Part", "ChestFrame_Left", Vector3.new(0.10, 1.20, 0.08), CFrame.new(-0.78, 0.05, -0.06), COLORS.Gold, Enum.Material.Metal)
		detailPart(accessory, handle, "Part", "ChestFrame_Right", Vector3.new(0.10, 1.20, 0.08), CFrame.new(0.78, 0.05, -0.06), COLORS.Gold, Enum.Material.Metal)
		detailPart(accessory, handle, "Part", "ChestDiagonalSash", Vector3.new(0.12, 1.54, 0.075), CFrame.new(-0.02, 0.04, -0.10) * CFrame.Angles(0, 0, math.rad(-38)), COLORS.GoldDark, Enum.Material.Metal)
		local chestGem = detailPart(accessory, handle, "Part", "ChestGem", Vector3.new(0.28, 0.28, 0.08), CFrame.new(0, 0.10, -0.12) * CFrame.Angles(0, 0, math.rad(45)), COLORS.Magenta, Enum.Material.Neon)
		glow(chestGem, COLORS.Purple, 7, 0.9)
		detailPart(accessory, handle, "Part", "Corruption_Chest_Crack_L", Vector3.new(0.42, 0.035, 0.035), CFrame.new(-0.26, 0.25, -0.14) * CFrame.Angles(0, 0, math.rad(34)), COLORS.Purple, Enum.Material.Neon)
		detailPart(accessory, handle, "Part", "Corruption_Chest_Crack_R", Vector3.new(0.46, 0.035, 0.035), CFrame.new(0.30, -0.06, -0.14) * CFrame.Angles(0, 0, math.rad(-32)), COLORS.Purple, Enum.Material.Neon)
		detailPart(accessory, handle, "Part", "RoyalSideScarf", Vector3.new(0.12, 1.30, 0.10), CFrame.new(-0.72, 0.05, -0.12) * CFrame.Angles(0, 0, math.rad(-13)), COLORS.Cloth, Enum.Material.Fabric)
	end)
	armor.Parent = accessories

	local cape = makeAccessory("Crownbound_Cape", "Back", "BodyBackAttachment", function(accessory, handle)
		detailPart(accessory, handle, "Part", "ShortRoyalCape", Vector3.new(2.35, 1.65, 0.13), CFrame.new(0, -0.08, 0.10) * CFrame.Angles(math.rad(-5), 0, 0), COLORS.Cloth, Enum.Material.Fabric)
		detailPart(accessory, handle, "Part", "CapeGoldTrim_L", Vector3.new(0.08, 1.56, 0.08), CFrame.new(-1.12, -0.08, 0.03) * CFrame.Angles(math.rad(-5), 0, 0), COLORS.GoldDark, Enum.Material.Metal)
		detailPart(accessory, handle, "Part", "CapeGoldTrim_R", Vector3.new(0.08, 1.56, 0.08), CFrame.new(1.12, -0.08, 0.03) * CFrame.Angles(math.rad(-5), 0, 0), COLORS.GoldDark, Enum.Material.Metal)
		detailPart(accessory, handle, "Part", "CapeBottomTrim", Vector3.new(2.18, 0.08, 0.08), CFrame.new(0, -0.89, 0.00) * CFrame.Angles(math.rad(-5), 0, 0), COLORS.GoldDark, Enum.Material.Metal)
	end)
	cape.Parent = accessories

	local waist = makeAccessory("Crownbound_WaistCloth", "Waist", "WaistFrontAttachment", function(accessory, handle)
		detailPart(accessory, handle, "Part", "WaistGoldBelt", Vector3.new(2.12, 0.14, 0.12), CFrame.new(0, 0.06, -0.03), COLORS.Gold, Enum.Material.Metal)
		local buckle = detailPart(accessory, handle, "Part", "WaistBuckleGem", Vector3.new(0.18, 0.18, 0.065), CFrame.new(0, 0.06, -0.12) * CFrame.Angles(0, 0, math.rad(45)), COLORS.Purple, Enum.Material.Neon)
		glow(buckle, COLORS.Purple, 4, 0.35)
		detailPart(accessory, handle, "Part", "RoyalWaistCloth", Vector3.new(0.55, 0.88, 0.12), CFrame.new(0, -0.43, -0.08), COLORS.Cloth, Enum.Material.Fabric)
	end)
	waist.Parent = accessories

	local leftShoulder = makeAccessory("Crownbound_LeftShoulder", "Shoulder", "LeftShoulderAttachment", function(accessory, handle)
		detailPart(accessory, handle, "Part", "Shoulder_L", Vector3.new(1.00, 0.42, 1.00), CFrame.new(0, 0, 0), COLORS.ArmorSoft, Enum.Material.Metal)
		detailPart(accessory, handle, "Part", "ShoulderGold_L", Vector3.new(1.04, 0.09, 0.12), CFrame.new(0, 0.10, -0.48), COLORS.Gold, Enum.Material.Metal)
	end)
	leftShoulder.Parent = accessories

	local rightShoulder = makeAccessory("Crownbound_RightShoulder_Corrupted", "Shoulder", "RightShoulderAttachment", function(accessory, handle)
		detailPart(accessory, handle, "Part", "Shoulder_R_Corrupted", Vector3.new(1.05, 0.46, 1.05), CFrame.new(0, 0, 0), COLORS.ArmorSoft, Enum.Material.Metal)
		detailPart(accessory, handle, "Part", "ShoulderGold_R", Vector3.new(1.08, 0.09, 0.12), CFrame.new(0, 0.11, -0.50), COLORS.Gold, Enum.Material.Metal)
		detailPart(accessory, handle, "Part", "Corruption_RightArm_Vein_A", Vector3.new(0.055, 1.22, 0.040), CFrame.new(0.30, -0.82, -0.47), COLORS.Magenta, Enum.Material.Neon)
		detailPart(accessory, handle, "Part", "Corruption_RightArm_Vein_B", Vector3.new(0.050, 0.58, 0.040), CFrame.new(0.21, -0.59, -0.49) * CFrame.Angles(0, 0, math.rad(38)), COLORS.Purple, Enum.Material.Neon)
	end)
	rightShoulder.Parent = accessories

	local leftBoot = makeAccessory("Crownbound_LeftBoot", "LeftShoe", "LeftFootAttachment", function(accessory, handle)
		detailPart(accessory, handle, "Part", "ThighPlate_L", Vector3.new(0.72, 0.42, 0.10), CFrame.new(0, 1.44, -0.25), COLORS.ArmorSoft, Enum.Material.Metal)
		detailPart(accessory, handle, "Part", "KneeGold_L", Vector3.new(0.76, 0.14, 0.10), CFrame.new(0, 1.06, -0.26), COLORS.Gold, Enum.Material.Metal)
		detailPart(accessory, handle, "Part", "Boot_L", Vector3.new(0.96, 0.32, 1.08), CFrame.new(0, 0.02, 0), COLORS.Armor, Enum.Material.Metal)
		detailPart(accessory, handle, "Part", "BootGoldToe_L", Vector3.new(0.82, 0.13, 0.18), CFrame.new(0, 0.10, -0.55), COLORS.GoldDark, Enum.Material.Metal)
	end)
	leftBoot.Parent = accessories

	local rightBoot = makeAccessory("Crownbound_RightBoot", "RightShoe", "RightFootAttachment", function(accessory, handle)
		detailPart(accessory, handle, "Part", "ThighPlate_R", Vector3.new(0.72, 0.42, 0.10), CFrame.new(0, 1.44, -0.25), COLORS.ArmorSoft, Enum.Material.Metal)
		detailPart(accessory, handle, "Part", "KneeGold_R", Vector3.new(0.76, 0.14, 0.10), CFrame.new(0, 1.06, -0.26), COLORS.Gold, Enum.Material.Metal)
		detailPart(accessory, handle, "Part", "Boot_R", Vector3.new(0.96, 0.32, 1.08), CFrame.new(0, 0.02, 0), COLORS.Armor, Enum.Material.Metal)
		detailPart(accessory, handle, "Part", "BootGoldToe_R", Vector3.new(0.82, 0.13, 0.18), CFrame.new(0, 0.10, -0.55), COLORS.GoldDark, Enum.Material.Metal)
	end)
	rightBoot.Parent = accessories

	return accessories
end

local function addRigAttachment(part, name, position)
	local attachment = Instance.new("Attachment")
	attachment.Name = name
	attachment.Position = position
	attachment.Parent = part
	return attachment
end

local function basePart(name, size, cframe, color, material, parent, anchored)
	local object = Instance.new("Part")
	object.Name = name
	object.Size = size
	object.CFrame = cframe
	configurePart(object, color, material)
	object.Anchored = anchored
	object.CanCollide = name == "Torso" or name:find("Leg") ~= nil
	object.CanQuery = true
	object.Parent = parent
	return object
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

local function addBodyColors(model)
	local bodyColors = Instance.new("BodyColors")
	bodyColors.Name = "BodyColors"
	local skin = BrickColor.new(COLORS.Skin)
	local armor = BrickColor.new(COLORS.Armor)
	bodyColors.HeadColor = skin
	bodyColors.LeftArmColor = armor
	bodyColors.RightArmColor = armor
	bodyColors.LeftLegColor = armor
	bodyColors.RightLegColor = armor
	bodyColors.TorsoColor = armor
	bodyColors.Parent = model
	return bodyColors
end

local function addSkinClothing(model)
	local shirt = Instance.new("Shirt")
	shirt.Name = "CrownboundSkin_ShirtContainer"
	shirt.Parent = model

	local pants = Instance.new("Pants")
	pants.Name = "CrownboundSkin_PantsContainer"
	pants.Parent = model

	return shirt, pants
end

local function addUtilityAttachments(root, torso, head, leftArm, rightArm)
	addRigAttachment(root, "AuraRootAttachment", Vector3.new(0, 0, 0))
	addRigAttachment(torso, "ChestRelicAttachment", Vector3.new(0, 0.12, -0.62))
	addRigAttachment(head, "CrownSocketAttachment", Vector3.new(0, 0.95, 0))
	addRigAttachment(leftArm, "LeftHandGripAttachment", Vector3.new(0, -0.94, -0.46))
	addRigAttachment(rightArm, "RightHandGripAttachment", Vector3.new(0, -0.94, -0.48))
end

local function createRig(name, parent, origin, anchored)
	local model = Instance.new("Model")
	model.Name = name
	model.Parent = parent

	local base = CFrame.new(origin)
	local root = basePart("HumanoidRootPart", Vector3.new(2.0, 2.0, 1.0), base * CFrame.new(0, 3.0, 0), Color3.new(1, 1, 1), Enum.Material.SmoothPlastic, model, anchored)
	root.Transparency = 1
	root.CastShadow = false
	root.CanCollide = false
	root.Massless = false

	local torso = basePart("Torso", Vector3.new(2.0, 2.0, 1.0), base * CFrame.new(0, 3.0, 0), COLORS.Armor, Enum.Material.Metal, model, anchored)
	local head = basePart("Head", Vector3.new(1.15, 1.05, 1.05), base * CFrame.new(0, 4.55, -0.02), COLORS.Skin, Enum.Material.SmoothPlastic, model, anchored)
	local leftArm = basePart("Left Arm", Vector3.new(0.86, 2.0, 0.86), base * CFrame.new(-1.48, 3.0, 0), COLORS.Armor, Enum.Material.Metal, model, anchored)
	local rightArm = basePart("Right Arm", Vector3.new(0.90, 2.0, 0.90), base * CFrame.new(1.48, 3.0, 0), COLORS.Armor, Enum.Material.Metal, model, anchored)
	local leftLeg = basePart("Left Leg", Vector3.new(0.86, 2.0, 0.86), base * CFrame.new(-0.48, 1.0, 0), COLORS.Armor, Enum.Material.Metal, model, anchored)
	local rightLeg = basePart("Right Leg", Vector3.new(0.86, 2.0, 0.86), base * CFrame.new(0.48, 1.0, 0), COLORS.Armor, Enum.Material.Metal, model, anchored)

	addRigAttachment(head, "HatAttachment", Vector3.new(0, 0.77, 0))
	addRigAttachment(head, "HairAttachment", Vector3.new(0, 0.42, 0))
	addRigAttachment(head, "FaceFrontAttachment", Vector3.new(0, -0.02, -0.59))
	addRigAttachment(torso, "BodyFrontAttachment", Vector3.new(0, 0, -0.55))
	addRigAttachment(torso, "BodyBackAttachment", Vector3.new(0, 0, 0.55))
	addRigAttachment(torso, "WaistFrontAttachment", Vector3.new(0, -0.94, -0.52))
	addRigAttachment(leftArm, "LeftShoulderAttachment", Vector3.new(0, 0.82, 0))
	addRigAttachment(rightArm, "RightShoulderAttachment", Vector3.new(0, 0.82, 0))
	addRigAttachment(leftLeg, "LeftFootAttachment", Vector3.new(0, -0.86, -0.03))
	addRigAttachment(rightLeg, "RightFootAttachment", Vector3.new(0, -0.86, -0.03))
	addUtilityAttachments(root, torso, head, leftArm, rightArm)

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

	addBodyColors(model)
	addSkinClothing(model)

	return model, humanoid
end

local function applySkinAccessories(character, accessoriesFolder, anchored)
	local humanoid = character:FindFirstChildOfClass("Humanoid")
	for _, template in ipairs(accessoriesFolder:GetChildren()) do
		if template:IsA("Accessory") then
			local clone = template:Clone()
			clone.Parent = character
			humanoid:AddAccessory(clone)
		end
	end

	for _, descendant in ipairs(character:GetDescendants()) do
		if descendant:IsA("BasePart") then
			descendant.Anchored = anchored
			descendant.CanCollide = descendant.Name == "Torso" or descendant.Name:find("Leg") ~= nil
			descendant.CanTouch = false
			descendant.CanQuery = true
			descendant.Locked = false
		end
	end
end

local function createHumanoidDescription(parent)
	local description = Instance.new("HumanoidDescription")
	description.Name = "CrownboundChallengerHumanoidDescription"
	pcall(function()
		description.HeadColor = COLORS.Skin
		description.LeftArmColor = COLORS.Armor
		description.RightArmColor = COLORS.Armor
		description.LeftLegColor = COLORS.Armor
		description.RightLegColor = COLORS.Armor
		description.TorsoColor = COLORS.Armor
		description.BodyTypeScale = 0
		description.ProportionScale = 0
		description.DepthScale = 1
		description.HeadScale = 1
		description.HeightScale = 1
		description.WidthScale = 1
	end)
	description.Parent = parent
	return description
end

local skinsFolder = ReplicatedStorage:FindFirstChild("CrownChaosSkins")
if not skinsFolder then
	skinsFolder = Instance.new("Folder")
	skinsFolder.Name = "CrownChaosSkins"
	skinsFolder.Parent = ReplicatedStorage
end

clearNamed(skinsFolder, "CrownboundChallengerSkin")
local skinPackage = Instance.new("Folder")
skinPackage.Name = "CrownboundChallengerSkin"
skinPackage:SetAttribute("SkinId", "crownbound_challenger")
skinPackage:SetAttribute("Format", "RobloxAccessorySkin")
skinPackage:SetAttribute("Rig", "R6")
skinPackage.Parent = skinsFolder

createHumanoidDescription(skinPackage)

local bodyColorsTemplate = Instance.new("BodyColors")
bodyColorsTemplate.Name = "BodyColors"
bodyColorsTemplate.HeadColor = BrickColor.new(COLORS.Skin)
bodyColorsTemplate.LeftArmColor = BrickColor.new(COLORS.Armor)
bodyColorsTemplate.RightArmColor = BrickColor.new(COLORS.Armor)
bodyColorsTemplate.LeftLegColor = BrickColor.new(COLORS.Armor)
bodyColorsTemplate.RightLegColor = BrickColor.new(COLORS.Armor)
bodyColorsTemplate.TorsoColor = BrickColor.new(COLORS.Armor)
bodyColorsTemplate.Parent = skinPackage

local clothingFolder = Instance.new("Folder")
clothingFolder.Name = "Clothing"
clothingFolder.Parent = skinPackage
local skinShirt = Instance.new("Shirt")
skinShirt.Name = "Crownbound_Shirt"
skinShirt.Parent = clothingFolder
local skinPants = Instance.new("Pants")
skinPants.Name = "Crownbound_Pants"
skinPants.Parent = clothingFolder

local accessoriesFolder = makeSkinAccessories(skinPackage)

clearNamed(ReplicatedStorage, "CrownChaosCharacters")
local charactersFolder = Instance.new("Folder")
charactersFolder.Name = "CrownChaosCharacters"
charactersFolder.Parent = ReplicatedStorage

local template = createRig("CrownboundChallenger_RobloxSkinTemplate", charactersFolder, Vector3.new(0, 0, 0), false)
applySkinAccessories(template, accessoriesFolder, false)

clearNamed(Workspace, "CrownboundChallengerPreview")
clearNamed(Workspace, "CrownboundChallengerSkinPreview")
local preview = template:Clone()
preview.Name = "CrownboundChallengerSkinPreview"
preview.Parent = Workspace
preview:PivotTo(CFrame.new(0, 0, 0))
for _, descendant in ipairs(preview:GetDescendants()) do
	if descendant:IsA("BasePart") then
		descendant.Anchored = true
		descendant.CanCollide = false
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
starterCharacter:SetAttribute("SkinId", "crownbound_challenger")
starterCharacter:SetAttribute("Format", "RobloxAccessorySkin")
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
	camera.Focus = CFrame.new(0, 3, 0)
end

local accessoryCount = 0
for _, child in ipairs(accessoriesFolder:GetChildren()) do
	if child:IsA("Accessory") then
		accessoryCount += 1
	end
end

return {
	format = "RobloxAccessorySkin",
	skinPackage = skinPackage:GetFullName(),
	template = template:GetFullName(),
	preview = preview:GetFullName(),
	starterCharacter = starterCharacter:GetFullName(),
	accessories = accessoryCount,
	previewDescendants = #preview:GetDescendants(),
}
