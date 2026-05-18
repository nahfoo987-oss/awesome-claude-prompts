-- EmoteSystem | ServerScriptService
-- Emote circles at (-24,52.03,17) and (24,52.03,17) trigger a radial menu on the client.
-- Client fires EmoteRequest with chosen emote id → server plays it on character and broadcasts.

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Remotes = ReplicatedStorage:WaitForChild("Remotes")
local RE = {
    EmotePlay    = Remotes:WaitForChild("EmotePlay"),
    EmoteRequest = Remotes:WaitForChild("EmoteRequest"),
}

-------------------------------------------------
-- EMOTE ANIMATIONS  (asset IDs are placeholders — replace with uploaded animations)
-------------------------------------------------
local EMOTE_ANIMS = {
    pose_toss  = { id = "rbxassetid://0", label = "Crown Toss"   },
    pose_bow   = { id = "rbxassetid://0", label = "Royal Bow"    },
    pose_laugh = { id = "rbxassetid://0", label = "Tyrant Laugh" },
    wave       = { id = "rbxassetid://0", label = "Wave"         },
    point      = { id = "rbxassetid://0", label = "Point"        },
    cheer      = { id = "rbxassetid://0", label = "Cheer"        },
}

-------------------------------------------------
-- EMOTE CIRCLES — built as invisible touch detectors
-------------------------------------------------
local CIRCLE_POSITIONS = {
    Vector3.new(-24, 52.03, 17),
    Vector3.new( 24, 52.03, 17),
}

task.spawn(function()
    task.wait(12)  -- wait for WorkspaceSetup

    for i, pos in ipairs(CIRCLE_POSITIONS) do
        local pad = Instance.new("Part")
        pad.Name       = "EmoteZone_" .. i
        pad.Size       = Vector3.new(14, 0.5, 14)
        pad.Shape      = Enum.PartType.Cylinder
        pad.CFrame     = CFrame.new(pos) * CFrame.Angles(0, 0, math.pi/2)
        pad.Anchored   = true
        pad.CanCollide = false
        pad.Transparency = 1
        pad.Parent     = workspace

        -- Neon ring visual (slightly above floor)
        local ring = Instance.new("Part")
        ring.Name        = "EmoteRing_" .. i
        ring.Size        = Vector3.new(0.3, 14, 14)
        ring.Shape       = Enum.PartType.Cylinder
        ring.CFrame      = CFrame.new(pos.X, pos.Y + 0.05, pos.Z) * CFrame.Angles(0, 0, math.pi/2)
        ring.Anchored    = true
        ring.CanCollide  = false
        ring.CastShadow  = false
        ring.Color       = Color3.fromRGB(80, 0, 160)
        ring.Material    = Enum.Material.Neon
        ring.Transparency= 0.4
        ring.Parent      = workspace

        local light = Instance.new("PointLight")
        light.Brightness = 1
        light.Range      = 10
        light.Color      = Color3.fromRGB(120, 0, 200)
        light.Parent     = ring

        -- Zone label billboard
        local bb = Instance.new("BillboardGui")
        bb.Size        = UDim2.new(0, 120, 0, 30)
        bb.StudsOffset = Vector3.new(0, 2, 0)
        bb.AlwaysOnTop = false
        bb.Parent      = ring

        local lbl = Instance.new("TextLabel")
        lbl.Size                   = UDim2.fromScale(1, 1)
        lbl.BackgroundTransparency = 1
        lbl.Text                   = "🎭 EMOTE ZONE"
        lbl.TextColor3             = Color3.fromRGB(180, 100, 255)
        lbl.Font                   = Enum.Font.GothamBold
        lbl.TextScaled             = true
        lbl.Parent                 = bb

        -- Detect players entering the zone
        pad.Touched:Connect(function(hit)
            local player = Players:GetPlayerFromCharacter(hit.Parent)
            if not player then return end
            -- Tell the client to open the radial emote menu
            RE.EmotePlay:FireClient(player, "OPEN_MENU", nil)
        end)
    end
end)

-------------------------------------------------
-- EMOTE REQUEST HANDLER
-------------------------------------------------
local emoteCooldowns = {}  -- userId → tick

RE.EmoteRequest.OnServerEvent:Connect(function(player, emoteId)
    -- Rate limit: 1 emote per 4 seconds
    local uid = player.UserId
    if emoteCooldowns[uid] and tick() - emoteCooldowns[uid] < 4 then return end
    emoteCooldowns[uid] = tick()

    local anim = EMOTE_ANIMS[emoteId]
    if not anim then return end

    local char = player.Character
    if not char then return end
    local humanoid = char:FindFirstChildOfClass("Humanoid")
    if not humanoid then return end

    -- Load and play animation on this character
    local animator = humanoid:FindFirstChildOfClass("Animator")
    if not animator then
        animator = Instance.new("Animator")
        animator.Parent = humanoid
    end

    local animObj = Instance.new("Animation")
    animObj.AnimationId = anim.id
    local track = animator:LoadAnimation(animObj)
    track:Play()

    -- Broadcast to all clients for visual sync
    for _, p in Players:GetPlayers() do
        RE.EmotePlay:FireClient(p, "PLAY", player, emoteId, anim.label)
    end
end)

-- Clean up cooldowns on leave
Players.PlayerRemoving:Connect(function(player)
    emoteCooldowns[player.UserId] = nil
end)

print("[CrownChaos] EmoteSystem loaded.")
