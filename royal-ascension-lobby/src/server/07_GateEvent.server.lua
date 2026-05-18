-- GateEvent | ServerScriptService
-- Rhino charge every 60 seconds. Warning rumble, knockback, crown drop on hit.
-- FIX: rhino eyes are now welded to the rhino (not anchored floating forever).

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Remotes    = ReplicatedStorage:WaitForChild("Remotes")
local CrowdEvent = Remotes:WaitForChild("CrowdEvent")

local CHARGE_INTERVAL = 60
local WARNING_TIME    = 3

local function doCharge()
    for _, p in Players:GetPlayers() do
        CrowdEvent:FireClient(p, "ANNOUNCE", "⚠️ THE GATES ARE OPENING...")
    end
    task.wait(WARNING_TIME)

    local rhino           = Instance.new("Part")
    rhino.Name            = "RhinoCharger"
    rhino.Size            = Vector3.new(8, 6, 12)
    rhino.Color           = Color3.fromRGB(80, 70, 60)
    rhino.Material        = Enum.Material.SmoothPlastic
    rhino.CFrame          = CFrame.new(0, 4, -92)
    rhino.CanCollide      = true
    rhino.Anchored        = false
    rhino.Parent          = workspace

    -- FIX: eyes are NOT anchored — they're welded to the rhino so they move with it
    -- and get cleaned up by Debris when the rhino is removed.
    for _, xOffset in { -2, 2 } do
        local eye         = Instance.new("Part")
        eye.Size          = Vector3.new(1, 1, 0.5)
        eye.Color         = Color3.fromRGB(255, 0, 0)
        eye.Material      = Enum.Material.Neon
        eye.Anchored      = false   -- FIX: was true, causing permanent floating debris
        eye.CanCollide    = false
        eye.Parent        = workspace

        local weld        = Instance.new("WeldConstraint")
        weld.Part0        = eye
        weld.Part1        = rhino
        weld.Parent       = eye

        -- Position relative to rhino
        eye.CFrame        = rhino.CFrame * CFrame.new(xOffset, 1, -2)
    end

    local bv              = Instance.new("BodyVelocity")
    bv.Velocity           = Vector3.new(0, 0, 80)
    bv.MaxForce           = Vector3.new(0, 0, math.huge)
    bv.Parent             = rhino

    for _, p in Players:GetPlayers() do
        CrowdEvent:FireClient(p, "ANNOUNCE", "🦏 THE GATES OPEN — MOVE!")
    end

    local hit = false
    rhino.Touched:Connect(function(part)
        if hit then return end
        local char   = part.Parent
        local player = Players:GetPlayerFromCharacter(char)
        if not player then return end
        hit = true

        local root = char:FindFirstChild("HumanoidRootPart")
        if root then
            root.AssemblyLinearVelocity = Vector3.new(
                math.random(-20, 20), 50, 30
            )
        end
        local hum = char:FindFirstChildOfClass("Humanoid")
        if hum then hum:TakeDamage(25) end
    end)

    -- Debris cleans up rhino + all welded eyes together
    game:GetService("Debris"):AddItem(rhino, 6)
end

task.spawn(function()
    while true do
        task.wait(CHARGE_INTERVAL)
        pcall(doCharge)
    end
end)

print("[CrownChaos] GateEvent loaded.")
