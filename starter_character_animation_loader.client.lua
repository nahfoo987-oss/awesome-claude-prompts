-- Crown Chaos custom R6 avatar animation loader.
-- Put this in StarterPlayer > StarterCharacterScripts after publishing the real animations.

local character = script.Parent
local humanoid = character:WaitForChild("Humanoid")

local animateScript = character:FindFirstChild("Animate")
if animateScript then
	animateScript:Destroy()
end

local walkAnimation = Instance.new("Animation")
walkAnimation.AnimationId = "rbxassetid://YOUR_PUBLISHED_WALK_ANIMATION_ID"

local idleAnimation = Instance.new("Animation")
idleAnimation.AnimationId = "rbxassetid://YOUR_PUBLISHED_IDLE_ANIMATION_ID"

local walkTrack = humanoid:LoadAnimation(walkAnimation)
walkTrack.Priority = Enum.AnimationPriority.Movement

local idleTrack = humanoid:LoadAnimation(idleAnimation)
idleTrack.Priority = Enum.AnimationPriority.Idle
idleTrack.Looped = true
walkTrack.Looped = true

local function playIdle()
	if walkTrack.IsPlaying then
		walkTrack:Stop(0.15)
	end
	if not idleTrack.IsPlaying then
		idleTrack:Play(0.15)
	end
end

local function playWalk()
	if idleTrack.IsPlaying then
		idleTrack:Stop(0.12)
	end
	if not walkTrack.IsPlaying then
		walkTrack:Play(0.12)
	end
end

humanoid.Running:Connect(function(speed)
	if speed > 0.1 then
		playWalk()
	else
		playIdle()
	end
end)

playIdle()
