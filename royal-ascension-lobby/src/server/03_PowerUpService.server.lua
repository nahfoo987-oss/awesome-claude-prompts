-- PowerUpService | ServerScriptService
-- Spawns and manages the 10 arena power-ups.
-- During Final30 (bindable from CrownService) spawn rate doubles.

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Debris            = game:GetService("Debris")

local Remotes    = ReplicatedStorage:WaitForChild("Remotes")
local Bindables  = {
    Final30 = ReplicatedStorage:WaitForChild("Final30"),
}

local isFinal30 = false
Bindables.Final30.Event:Connect(function() isFinal30 = true end)

-------------------------------------------------
-- POWER-UP DEFINITIONS
-------------------------------------------------
local POWERUPS = {
    {
        id       = "SpeedBoots",
        label    = "Speed Boots",
        color    = Color3.fromRGB(255, 220, 0),
        duration = 8,
        apply    = function(player)
            local hum = player.Character and player.Character:FindFirstChildOfClass("Humanoid")
            if hum then hum.WalkSpeed = hum.WalkSpeed + 10 end
            task.delay(8, function()
                local h = player.Character and player.Character:FindFirstChildOfClass("Humanoid")
                if h then h.WalkSpeed = math.max(16, h.WalkSpeed - 10) end
            end)
        end,
    },
    {
        id       = "LuckyShield",
        label    = "Lucky Shield",
        color    = Color3.fromRGB(80, 200, 255),
        duration = 0,
        apply    = function(player)
            player:SetAttribute("ShieldActive", true)
        end,
    },
    {
        id       = "ShockwaveHammer",
        label    = "Shockwave Hammer",
        color    = Color3.fromRGB(255, 100, 0),
        duration = 0,
        apply    = function(player)
            Remotes.ActivateHammer:FireClient(player)
            local root = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
            if root then
                for _, p in Players:GetPlayers() do
                    if p ~= player then
                        local pr = p.Character and p.Character:FindFirstChild("HumanoidRootPart")
                        if pr and (pr.Position - root.Position).Magnitude < 22 then
                            pr.AssemblyLinearVelocity =
                                (pr.Position - root.Position).Unit * 55 + Vector3.new(0, 22, 0)
                        end
                    end
                end
            end
        end,
    },
    {
        id       = "TeleportOrb",
        label    = "Teleport Orb",
        color    = Color3.fromRGB(200, 100, 255),
        duration = 0,
        apply    = function(player)
            local root = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
            if root then
                local angle = math.random() * math.pi * 2
                local dist  = math.random(20, 50)
                root.CFrame = CFrame.new(
                    root.Position + Vector3.new(math.cos(angle)*dist, 0, math.sin(angle)*dist)
                )
            end
        end,
    },
    {
        id       = "MagnetGlove",
        label    = "Magnet Glove",
        color    = Color3.fromRGB(100, 255, 200),
        duration = 10,
        apply    = function(player)
            player:SetAttribute("Magnet", true)
            task.delay(10, function() player:SetAttribute("Magnet", false) end)
        end,
    },
    {
        id       = "RagePotion",
        label    = "Rage Potion",
        color    = Color3.fromRGB(220, 30, 30),
        duration = 6,
        apply    = function(player)
            player:SetAttribute("Rage", true)
            task.delay(6, function() player:SetAttribute("Rage", false) end)
        end,
    },
    {
        id       = "FreezeTrap",
        label    = "Freeze Trap",
        color    = Color3.fromRGB(150, 220, 255),
        duration = 0,
        apply    = function(player)
            local root = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
            if root then
                for _, p in Players:GetPlayers() do
                    if p ~= player then
                        local pr = p.Character and p.Character:FindFirstChild("HumanoidRootPart")
                        local ph = p.Character and p.Character:FindFirstChildOfClass("Humanoid")
                        if pr and ph and (pr.Position - root.Position).Magnitude < 18 then
                            local origSpeed = ph.WalkSpeed
                            ph.WalkSpeed = 0
                            task.delay(3, function()
                                if ph and ph.Parent then ph.WalkSpeed = origSpeed end
                            end)
                        end
                    end
                end
            end
        end,
    },
    {
        id       = "BetrayalTrap",
        label    = "Betrayal Trap",
        color    = Color3.fromRGB(160, 0, 160),
        duration = 0,
        apply    = function(player)
            -- Nearest player takes 20 damage
            local root = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
            if not root then return end
            local closest, bestDist = nil, math.huge
            for _, p in Players:GetPlayers() do
                if p ~= player then
                    local pr = p.Character and p.Character:FindFirstChild("HumanoidRootPart")
                    if pr then
                        local d = (pr.Position - root.Position).Magnitude
                        if d < bestDist then bestDist=d; closest=p end
                    end
                end
            end
            if closest then
                local h = closest.Character and closest.Character:FindFirstChildOfClass("Humanoid")
                if h then h:TakeDamage(20) end
            end
        end,
    },
    {
        id       = "HermesDash",
        label    = "Hermes Dash",
        color    = Color3.fromRGB(255, 255, 100),
        duration = 0,
        apply    = function(player)
            local root = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
            if root then
                local look = root.CFrame.LookVector
                root.AssemblyLinearVelocity = look * 80 + Vector3.new(0, 10, 0)
            end
        end,
    },
    {
        id       = "RoyalDecree",
        label    = "Royal Decree",
        color    = Color3.fromRGB(255, 200, 0),
        duration = 0,
        apply    = function(player)
            -- Slows all other players for 4 seconds
            for _, p in Players:GetPlayers() do
                if p ~= player then
                    local ph = p.Character and p.Character:FindFirstChildOfClass("Humanoid")
                    if ph then
                        local orig = ph.WalkSpeed
                        ph.WalkSpeed = math.max(4, orig * 0.4)
                        task.delay(4, function()
                            if ph and ph.Parent then ph.WalkSpeed = orig end
                        end)
                    end
                end
            end
        end,
    },
}

-------------------------------------------------
-- SPAWN LOCATIONS (spread around arena floor)
-------------------------------------------------
local SPAWN_POINTS = {
    Vector3.new( 30, 53,  0 ),
    Vector3.new(-30, 53,  0 ),
    Vector3.new(  0, 53, 30 ),
    Vector3.new(  0, 53,-30 ),
    Vector3.new( 22, 53, 22 ),
    Vector3.new(-22, 53, 22 ),
    Vector3.new( 22, 53,-22 ),
    Vector3.new(-22, 53,-22 ),
    Vector3.new( 42, 53, 10 ),
    Vector3.new(-42, 53, 10 ),
}

local activePowerUps = {}

local function spawnPowerUp(puData, position)
    if activePowerUps[position] then return end

    local part = Instance.new("Part")
    part.Name          = "PowerUp_" .. puData.id
    part.Size          = Vector3.new(2.5, 2.5, 2.5)
    part.Shape         = Enum.PartType.Ball
    part.Material      = Enum.Material.Neon
    part.Color         = puData.color
    part.CastShadow    = false
    part.TopSurface    = Enum.SurfaceType.Smooth
    part.BottomSurface = Enum.SurfaceType.Smooth
    part.CFrame        = CFrame.new(position)
    part.Anchored      = true
    part.Parent        = workspace

    local light         = Instance.new("PointLight")
    light.Brightness    = 3
    light.Range         = 12
    light.Color         = puData.color
    light.Parent        = part

    local bb = Instance.new("BillboardGui")
    bb.Size        = UDim2.new(0, 100, 0, 30)
    bb.StudsOffset = Vector3.new(0, 2.5, 0)
    bb.AlwaysOnTop = false
    bb.Parent      = part
    local lbl = Instance.new("TextLabel")
    lbl.Size                   = UDim2.fromScale(1,1)
    lbl.BackgroundTransparency = 1
    lbl.Text                   = puData.label
    lbl.TextColor3             = puData.color
    lbl.Font                   = Enum.Font.GothamBold
    lbl.TextScaled             = true
    lbl.Parent                 = bb

    activePowerUps[position] = part

    local picked = false
    part.Touched:Connect(function(hit)
        if picked then return end
        local player = Players:GetPlayerFromCharacter(hit.Parent)
        if not player then return end
        picked = true
        activePowerUps[position] = nil
        part:Destroy()

        -- Apply effect
        pcall(puData.apply, player)

        -- Notify clients
        for _, p in Players:GetPlayers() do
            Remotes.PowerUpCollected:FireClient(p, player, puData.id, puData.label)
        end

        -- Respawn after cooldown (halved during Final30)
        local cooldown = isFinal30 and 12 or 25
        task.delay(cooldown, function()
            spawnPowerUp(puData, position)
        end)
    end)
end

-------------------------------------------------
-- INITIAL SPAWN
-------------------------------------------------
task.wait(8)  -- Wait for WorkspaceSetup to finish
for i, pos in ipairs(SPAWN_POINTS) do
    local pu = POWERUPS[((i-1) % #POWERUPS) + 1]
    task.delay((i-1) * 0.5, function()
        spawnPowerUp(pu, pos)
    end)
end

print("[CrownChaos] PowerUpService loaded. " .. #SPAWN_POINTS .. " spawn points active.")
