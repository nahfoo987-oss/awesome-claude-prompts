-- FounderSystem | ServerScriptService
-- Reserves the first 100 player slots globally.
-- Founders receive: nameplate, join effect, and a plaque on the Hall of Founders wall.

local Players          = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")

-- Replace 0 with the real Roblox badge ID from Creator Hub
local FOUNDER_BADGE_ID  = 0
local FOUNDER_SLOT_COUNT = 100
local DATASTORE_NAME     = "FounderSlots_v1"

local FounderSlots = DataStoreService:GetOrderedDataStore(DATASTORE_NAME)
local FounderData  = DataStoreService:GetDataStore("FounderPlayerData_v1")

-------------------------------------------------
-- PLAQUE WALL — built in Founders Hall pad
-- Position: (-72, 70, 125) per blueprint
-------------------------------------------------
local PLAQUE_ROWS  = 10
local PLAQUE_COLS  = 10
local PLAQUE_SIZE  = Vector3.new(5, 1.8, 0.25)
local PLAQUE_START = Vector3.new(-72 - 22, 71.5, 125 - 14)  -- top-left corner of wall
local PLAQUE_GAP_X = 5.2
local PLAQUE_GAP_Y = 2.1

local plaqueWallModel = Instance.new("Model")
plaqueWallModel.Name   = "RAL_FounderPlaqueWall"
plaqueWallModel.Parent = workspace

-- Guardian statue placeholders (either side)
for _, xOffset in ipairs({ -26, 26 }) do
    local statue = Instance.new("MeshPart")
    statue.Name            = "RAL_GuardianStatue_MSH"
    statue.Size            = Vector3.new(6, 16, 6)
    statue.CFrame          = CFrame.new(-72 + xOffset, 78, 125)
    statue.Color           = Color3.fromRGB(30, 28, 35)
    statue.Material        = Enum.Material.SmoothPlastic
    statue.Anchored        = true
    statue.CanCollide      = false
    statue.MeshId          = ""  -- replace with uploaded statue mesh ID
    statue.CollisionFidelity = Enum.CollisionFidelity.Box
    statue.Parent          = plaqueWallModel
end

-- Wall backing
local wallBack = Instance.new("Part")
wallBack.Name        = "RAL_FounderWallBacking"
wallBack.Size        = Vector3.new(55, 22, 0.5)
wallBack.CFrame      = CFrame.new(-72, 74, 125 - 0.5)
wallBack.Color       = Color3.fromRGB(15, 16, 22)
wallBack.Material    = Enum.Material.SmoothPlastic
wallBack.Anchored    = true
wallBack.CanCollide  = false
wallBack.CastShadow  = false
wallBack.Parent      = plaqueWallModel

local wallLight = Instance.new("PointLight")
wallLight.Brightness = 1.5
wallLight.Range      = 30
wallLight.Color      = Color3.fromRGB(199, 166, 90)
wallLight.Parent     = wallBack

-- Build 100 plaques
local plaques = {}
for row = 1, PLAQUE_ROWS do
    for col = 1, PLAQUE_COLS do
        local n = (row - 1) * PLAQUE_COLS + col
        local px = PLAQUE_START.X + (col - 1) * PLAQUE_GAP_X
        local py = PLAQUE_START.Y - (row - 1) * PLAQUE_GAP_Y

        local plaque = Instance.new("Part")
        plaque.Name        = "Plaque_" .. n
        plaque.Size        = PLAQUE_SIZE
        plaque.CFrame      = CFrame.new(px, py, PLAQUE_START.Z)
        plaque.Color       = Color3.fromRGB(80, 64, 24)
        plaque.Material    = Enum.Material.SmoothPlastic
        plaque.Anchored    = true
        plaque.CanCollide  = false
        plaque.CastShadow  = false
        plaque.Parent      = plaqueWallModel

        local sg = Instance.new("SurfaceGui")
        sg.Face        = Enum.NormalId.Back
        sg.SizingMode  = Enum.SurfaceGuiSizingMode.PixelsPerStud
        sg.PixelsPerStud = 50
        sg.Parent      = plaque

        local numLabel = Instance.new("TextLabel")
        numLabel.Size                   = UDim2.new(1, 0, 0.4, 0)
        numLabel.BackgroundTransparency = 1
        numLabel.Text                   = "#" .. string.format("%03d", n)
        numLabel.TextColor3             = Color3.fromRGB(199, 166, 90)
        numLabel.Font                   = Enum.Font.GothamBold
        numLabel.TextScaled             = true
        numLabel.Parent                 = sg

        local nameLabel = Instance.new("TextLabel")
        nameLabel.Name                  = "FounderName"
        nameLabel.Size                  = UDim2.new(1, 0, 0.6, 0)
        nameLabel.Position              = UDim2.new(0, 0, 0.4, 0)
        nameLabel.BackgroundTransparency= 1
        nameLabel.Text                  = "—"
        nameLabel.TextColor3            = Color3.fromRGB(160, 140, 80)
        nameLabel.Font                  = Enum.Font.Gotham
        nameLabel.TextScaled            = true
        nameLabel.Parent                = sg

        plaques[n] = { part = plaque, nameLabel = nameLabel }
    end
end

local function activatePlaque(n, playerName)
    local entry = plaques[n]
    if not entry then return end
    entry.part.Color             = Color3.fromRGB(120, 96, 32)
    entry.nameLabel.Text         = playerName
    entry.nameLabel.TextColor3   = Color3.fromRGB(255, 215, 100)
end

-------------------------------------------------
-- FOUNDER SLOT RESERVATION
-------------------------------------------------
local function getOrAssignFounderSlot(player)
    local key = "player_" .. player.UserId
    local ok, slot = pcall(function()
        return FounderData:GetAsync(key)
    end)
    if ok and slot and slot <= FOUNDER_SLOT_COUNT then
        return slot
    end

    -- Try to claim a new slot atomically
    local newSlot
    local updateOk = pcall(function()
        FounderSlots:UpdateAsync("counter", function(current)
            current = current or 0
            if current >= FOUNDER_SLOT_COUNT then return nil end
            newSlot = current + 1
            return newSlot
        end)
    end)

    if updateOk and newSlot and newSlot <= FOUNDER_SLOT_COUNT then
        pcall(function()
            FounderData:SetAsync(key, newSlot)
        end)
        return newSlot
    end

    return nil
end

-------------------------------------------------
-- NAMEPLATE
-------------------------------------------------
local function applyFounderNameplate(player, slotNumber)
    local char = player.Character
    if not char then return end
    local head = char:FindFirstChild("Head")
    if not head then return end

    -- Remove any existing nameplate
    local existing = head:FindFirstChild("FounderNameplate")
    if existing then existing:Destroy() end

    local bb = Instance.new("BillboardGui")
    bb.Name        = "FounderNameplate"
    bb.Size        = UDim2.new(0, 200, 0, 40)
    bb.StudsOffset = Vector3.new(0, 2.5, 0)
    bb.AlwaysOnTop = false
    bb.Parent      = head

    local label = Instance.new("TextLabel")
    label.Size                   = UDim2.fromScale(1, 1)
    label.BackgroundTransparency = 1
    label.Text                   = "#" .. string.format("%03d", slotNumber) .. "  OG CHALLENGER"
    label.TextColor3             = Color3.fromRGB(199, 166, 90)
    label.Font                   = Enum.Font.GothamBold
    label.TextScaled             = true
    label.TextStrokeTransparency = 0.4
    label.Parent                 = label
    label.Parent                 = bb
end

-------------------------------------------------
-- JOIN EFFECT
-------------------------------------------------
local function spawnJoinEffect(player)
    local char = player.Character
    if not char then return end
    local root = char:FindFirstChild("HumanoidRootPart")
    if not root then return end

    local burst = Instance.new("Part")
    burst.Size        = Vector3.new(0.1, 0.1, 0.1)
    burst.Anchored    = true
    burst.CanCollide  = false
    burst.Transparency= 1
    burst.CastShadow  = false
    burst.CFrame      = root.CFrame
    burst.Parent      = workspace

    local att = Instance.new("Attachment")
    att.Parent = burst

    local pe = Instance.new("ParticleEmitter")
    pe.Rate          = 0
    pe.Lifetime      = NumberRange.new(0.8, 1.4)
    pe.Speed         = NumberRange.new(8, 18)
    pe.LightEmission = 0.9
    pe.Color         = ColorSequence.new(Color3.fromRGB(199, 166, 90))
    pe.Size          = NumberSequence.new({
        NumberSequenceKeypoint.new(0, 0.4),
        NumberSequenceKeypoint.new(0.5, 0.8),
        NumberSequenceKeypoint.new(1, 0),
    })
    pe.Transparency  = NumberSequence.new({
        NumberSequenceKeypoint.new(0, 0),
        NumberSequenceKeypoint.new(0.8, 0),
        NumberSequenceKeypoint.new(1, 1),
    })
    pe.Parent = att
    pe:Emit(80)

    game:GetService("Debris"):AddItem(burst, 3)
end

-------------------------------------------------
-- PLAYER LIFECYCLE
-------------------------------------------------
Players.PlayerAdded:Connect(function(player)
    local slot = getOrAssignFounderSlot(player)
    if not slot then return end

    player:SetAttribute("FounderNumber", slot)
    activatePlaque(slot, player.Name)

    player.CharacterAdded:Connect(function(char)
        task.wait(0.5)
        applyFounderNameplate(player, slot)
        spawnJoinEffect(player)
    end)

    if player.Character then
        task.wait(0.5)
        applyFounderNameplate(player, slot)
        spawnJoinEffect(player)
    end
end)

Players.PlayerRemoving:Connect(function(player)
    local slot = player:GetAttribute("FounderNumber")
    if slot and plaques[slot] then
        plaques[slot].nameLabel.Text      = "—"
        plaques[slot].nameLabel.TextColor3= Color3.fromRGB(160, 140, 80)
        plaques[slot].part.Color          = Color3.fromRGB(80, 64, 24)
    end
end)

print("[CrownChaos] FounderSystem loaded. Wall: " .. PLAQUE_ROWS*PLAQUE_COLS .. " plaques.")
