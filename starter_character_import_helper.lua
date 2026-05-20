-- Crown Chaos StarterCharacter import helper.
-- Run this in Roblox Studio command bar after importing crownbound_challenger_v4_rig_ready.obj.
-- Select nothing; set IMPORTED_MODEL_NAME below to the imported model's Explorer name.

local IMPORTED_MODEL_NAME = "crownbound_challenger_v6_face_refine"

local model = workspace:FindFirstChild(IMPORTED_MODEL_NAME)
if not model then
	error(("Could not find imported model named %s in Workspace."):format(IMPORTED_MODEL_NAME))
end

local renameMap = {
	Left_Arm = "Left Arm",
	Right_Arm = "Right Arm",
	Left_Leg = "Left Leg",
	Right_Leg = "Right Leg",
}

for oldName, newName in pairs(renameMap) do
	local object = model:FindFirstChild(oldName, true)
	if object then
		object.Name = newName
	end
end

local torso = model:FindFirstChild("Torso", true)
if not torso then
	error("Imported model is missing Torso.")
end

local humanoidRootPart = model:FindFirstChild("HumanoidRootPart")
if not humanoidRootPart then
	humanoidRootPart = torso:Clone()
	humanoidRootPart.Name = "HumanoidRootPart"
	humanoidRootPart.Transparency = 1
	humanoidRootPart.CanCollide = false
	humanoidRootPart.Parent = model
end

local humanoid = model:FindFirstChildOfClass("Humanoid")
if not humanoid then
	humanoid = Instance.new("Humanoid")
	humanoid.Parent = model
end

for _, descendant in ipairs(model:GetDescendants()) do
	if descendant:IsA("BasePart") then
		descendant.Anchored = false
		descendant.CanCollide = false
		descendant.Massless = descendant.Name ~= "HumanoidRootPart"
	end
end

model.Name = "StarterCharacter"
print("Crownbound Challenger prepared. Next: use RigEdit Light to create Motor6D joints.")
