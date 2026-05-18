-- WorkspaceSetup | ServerScriptService
-- Royal Ascension Lobby V3 master build.
-- Source of truth: AAA_Design_Bible/ROYAL_ASCENSION_MASTER.docx
-- Compact 96 x 96 footprint. Ceiling read ~28 studs. Neon on route/portal/hub only.

local RunService        = game:GetService("RunService")
local CollectionService = game:GetService("CollectionService")
local Lighting          = game:GetService("Lighting")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local COLORS

-------------------------------------------------
-- HELPERS
-------------------------------------------------
local function makePart(props)
    local p = Instance.new("Part")
    p.Name          = props.name or "Part"
    p.Anchored      = true
    p.CanCollide    = props.canCollide  ~= nil and props.canCollide  or false
    p.CanTouch      = props.canTouch   ~= nil and props.canTouch   or false
    p.CanQuery      = props.canQuery   ~= nil and props.canQuery   or false
    p.CastShadow    = props.castShadow ~= nil and props.castShadow or false
    p.Transparency  = props.transparency or 0
    p.Size          = props.size or Vector3.new(4, 4, 4)
    p.CFrame        = props.cframe or CFrame.new()
    p.Color         = props.color or Color3.fromRGB(20, 20, 20)
    p.Material      = props.material or Enum.Material.SmoothPlastic
    p.Reflectance   = props.reflectance or 0
    p.TopSurface    = Enum.SurfaceType.Smooth
    p.BottomSurface = Enum.SurfaceType.Smooth
    p.Parent        = props.parent or workspace
    return p
end

local function makeFolder(name, parent)
    local f = Instance.new("Folder")
    f.Name   = name
    f.Parent = parent
    return f
end

local function makeModel(name, parent)
    local m = Instance.new("Model")
    m.Name   = name
    m.Parent = parent or workspace
    return m
end

local function makeCylinderY(props)
    local p   = makePart(props)
    p.Shape   = Enum.PartType.Cylinder
    p.Size    = Vector3.new(props.height or props.size.X, props.diameter or props.size.Y, props.diameter or props.size.Z)
    p.CFrame  = (props.cframe or CFrame.new()) * CFrame.Angles(0, 0, math.pi / 2)
    return p
end

local function makePointLight(parent, color, range, brightness)
    local l        = Instance.new("PointLight")
    l.Color        = color
    l.Range        = range
    l.Brightness   = brightness
    l.Parent       = parent
    return l
end

local function makeSpotLight(parent, color, range, brightness, angle, face)
    local l       = Instance.new("SpotLight")
    l.Color       = color
    l.Range       = range
    l.Brightness  = brightness
    l.Angle       = angle or 60
    l.Face        = face or Enum.NormalId.Bottom
    l.Parent      = parent
    return l
end

local function addLabel(part, text, color)
    local gui            = Instance.new("SurfaceGui")
    gui.Name             = "RAL_SurfaceLabel"
    gui.Face             = Enum.NormalId.Front
    gui.SizingMode       = Enum.SurfaceGuiSizingMode.PixelsPerStud
    gui.PixelsPerStud    = 32
    gui.Parent           = part

    local label                    = Instance.new("TextLabel")
    label.BackgroundTransparency   = 1
    label.Size                     = UDim2.fromScale(1, 1)
    label.Text                     = text
    label.TextColor3               = color
    label.TextStrokeColor3         = Color3.fromRGB(0, 0, 0)
    label.TextStrokeTransparency   = 0.35
    label.Font                     = Enum.Font.GothamBold
    label.TextScaled               = true
    label.Parent                   = gui
end

local function makeAttachmentAnchor(name, position, parent)
    local anchor = makePart({
        name         = name .. "_Anchor",
        size         = Vector3.new(0.1, 0.1, 0.1),
        cframe       = CFrame.new(position),
        transparency = 1,
        parent       = parent,
    })
    local attachment      = Instance.new("Attachment")
    attachment.Name       = name
    attachment.Parent     = anchor
    return attachment
end

local function makeParticle(parent, color, rate, size)
    local p            = Instance.new("ParticleEmitter")
    p.Rate             = rate
    p.Lifetime         = NumberRange.new(2.4, 4.0)
    p.Speed            = NumberRange.new(0.4, 1.2)
    p.Drag             = 2
    p.LightEmission    = 0.35
    p.Color            = ColorSequence.new(color)
    p.Size             = NumberSequence.new({
        NumberSequenceKeypoint.new(0,    size * 0.35),
        NumberSequenceKeypoint.new(0.5,  size),
        NumberSequenceKeypoint.new(1,    0),
    })
    p.Transparency     = NumberSequence.new({
        NumberSequenceKeypoint.new(0,    1),
        NumberSequenceKeypoint.new(0.15, 0.2),
        NumberSequenceKeypoint.new(0.85, 0.25),
        NumberSequenceKeypoint.new(1,    1),
    })
    p.Parent = parent
    return p
end

local function ringSegments(parent, prefix, center, radius, y, count, segLen, thick, height, color, material, tag)
    local parts = {}
    for i = 1, count do
        local angle = (i - 1) * math.tau / count
        local part  = makePart({
            name      = prefix .. "_" .. string.format("%02d", i) .. "_MSH",
            size      = Vector3.new(segLen, height, thick),
            cframe    = CFrame.new(center.X + math.cos(angle) * radius, y, center.Z + math.sin(angle) * radius)
                        * CFrame.Angles(0, -angle, 0),
            color     = color,
            material  = material,
            castShadow= material ~= Enum.Material.Neon,
            parent    = parent,
        })
        if tag then CollectionService:AddTag(part, tag) end
        table.insert(parts, part)
    end
    return parts
end

local function localPart(parent, base, name, offset, size, color, material, reflectance, castShadow)
    return makePart({
        name       = name,
        size       = size,
        cframe     = base * CFrame.new(offset),
        color      = color,
        material   = material,
        reflectance= reflectance or 0,
        castShadow = castShadow ~= nil and castShadow or true,
        parent     = parent,
    })
end

local function gateFrame(parent, base, prefix, width, height, depth, glowColor, labelText, labelColor)
    localPart(parent, base, prefix .. "_LeftPier_MSH",       Vector3.new(-width / 2, height / 2, 0),        Vector3.new(2, height, depth),       COLORS.STEEL, Enum.Material.Metal,         0.08)
    localPart(parent, base, prefix .. "_RightPier_MSH",      Vector3.new( width / 2, height / 2, 0),        Vector3.new(2, height, depth),       COLORS.STEEL, Enum.Material.Metal,         0.08)
    localPart(parent, base, prefix .. "_TopLintel_MSH",      Vector3.new(0, height, 0),                     Vector3.new(width + 3, 2, depth),    COLORS.GOLD,  Enum.Material.SmoothPlastic,  0.1)
    localPart(parent, base, prefix .. "_InnerGlowLeft_MSH",  Vector3.new(-width / 2 + 1.4, height / 2, -depth / 2 - 0.05), Vector3.new(0.7, height - 4, 0.25), glowColor, Enum.Material.Neon, 0, false)
    localPart(parent, base, prefix .. "_InnerGlowRight_MSH", Vector3.new( width / 2 - 1.4, height / 2, -depth / 2 - 0.05), Vector3.new(0.7, height - 4, 0.25), glowColor, Enum.Material.Neon, 0, false)
    local label = localPart(parent, base, prefix .. "_LabelPanel_MSH", Vector3.new(0, height + 3, -depth / 2 - 0.1), Vector3.new(width + 1, 3, 0.25), COLORS.STONE, Enum.Material.SmoothPlastic, 0, false)
    addLabel(label, labelText, labelColor or COLORS.GOLD)
    return label
end

-------------------------------------------------
-- COLORS
-------------------------------------------------
COLORS = {
    FLOOR      = Color3.fromRGB(28, 28, 28),
    BASALT     = Color3.fromRGB(20, 20, 20),
    STONE      = Color3.fromRGB(26, 21, 32),
    PATH       = Color3.fromRGB(30, 30, 38),
    MOON       = Color3.fromRGB(42, 42, 56),
    STEEL      = Color3.fromRGB(14, 14, 14),
    STEEL_EDGE = Color3.fromRGB(30, 30, 30),
    GOLD       = Color3.fromRGB(199, 166, 90),
    GOLD_DARK  = Color3.fromRGB(138, 110, 46),
    GOLD_BRIGHT= Color3.fromRGB(232, 201, 106),
    VIOLET     = Color3.fromRGB(139, 46, 255),
    VIOLET_DARK= Color3.fromRGB(85,  0, 204),
    BLUE       = Color3.fromRGB(170, 182, 255),
    CRIMSON    = Color3.fromRGB(74,  14,  14),
    DANGER     = Color3.fromRGB(204, 51,  51),
    RUST       = Color3.fromRGB(30,  20,  16),
}

-------------------------------------------------
-- SURFACE APPEARANCE PLACEHOLDERS
-------------------------------------------------
local packageRoot = ReplicatedStorage:FindFirstChild("RAL_Packages") or makeFolder("RAL_Packages", ReplicatedStorage)
local surfaceRoot = packageRoot:FindFirstChild("SurfaceAppearances") or makeFolder("SurfaceAppearances", packageRoot)
for _, saName in ipairs({
    "RAL_MAT_CrackedDarkMarble_SA",
    "RAL_MAT_CorruptionVeinedStone_SA",
    "RAL_MAT_BlackenedSteel_SA",
    "RAL_MAT_AgedBrass_SA",
}) do
    if not surfaceRoot:FindFirstChild(saName) then
        local sa = Instance.new("SurfaceAppearance")
        sa.Name   = saName
        sa.Parent = surfaceRoot
    end
end

-------------------------------------------------
-- ROOT / DISTRICTS
-------------------------------------------------
local old = workspace:FindFirstChild("TheRoyalAscension_Lobby")
if old then old:Destroy() end

local lobbyRoot = makeModel("TheRoyalAscension_Lobby", workspace)

local DISTRICTS = {
    { name = "RAL_Core_Persistent",           streaming = Enum.ModelStreamingMode.Persistent, lod = Enum.ModelLevelOfDetail.Automatic      },
    { name = "RAL_NorthThrone_Atomic",        streaming = Enum.ModelStreamingMode.Atomic,     lod = Enum.ModelLevelOfDetail.StreamingMesh  },
    { name = "RAL_EastCommerce_Atomic",       streaming = Enum.ModelStreamingMode.Atomic,     lod = Enum.ModelLevelOfDetail.StreamingMesh  },
    { name = "RAL_WestWar_Atomic",            streaming = Enum.ModelStreamingMode.Atomic,     lod = Enum.ModelLevelOfDetail.StreamingMesh  },
    { name = "RAL_SouthGate_Atomic",          streaming = Enum.ModelStreamingMode.Atomic,     lod = Enum.ModelLevelOfDetail.StreamingMesh  },
    { name = "RAL_SoutheastTraining_Atomic",  streaming = Enum.ModelStreamingMode.Atomic,     lod = Enum.ModelLevelOfDetail.StreamingMesh  },
    { name = "RAL_SouthwestProgression_Atomic", streaming = Enum.ModelStreamingMode.Atomic,   lod = Enum.ModelLevelOfDetail.StreamingMesh  },
}

local districtModels = {}
for _, d in ipairs(DISTRICTS) do
    local model = makeModel(d.name, lobbyRoot)
    model.ModelStreamingMode = d.streaming
    model.LevelOfDetail      = d.lod
    makeFolder("Collisions", model)
    makeFolder("Visuals",    model)
    makeFolder("Lights",     model)
    makeFolder("VFX",        model)
    districtModels[d.name] = model
end

local function col(name)    return districtModels[name].Collisions end
local function vis(name)    return districtModels[name].Visuals    end
local function lights(name) return districtModels[name].Lights     end
local function vfx(name)    return districtModels[name].VFX        end

-------------------------------------------------
-- CORE FOUNDATION  (96 × 96, world center Y=50)
-------------------------------------------------
makePart({ name = "RAL_MainFloor_A_COL", size = Vector3.new(96, 1, 96), cframe = CFrame.new(0, 50, 0),    canCollide = true, canTouch = true, transparency = 1,  parent = col("RAL_Core_Persistent") })
makePart({ name = "RAL_MainFloor_A_MSH", size = Vector3.new(96, 1, 96), cframe = CFrame.new(0, 50.03, 0), color = COLORS.FLOOR, material = Enum.Material.SmoothPlastic, reflectance = 0.08, castShadow = true, parent = vis("RAL_Core_Persistent") })

-- Gold rim border
makePart({ name = "RAL_Rim_North_MSH", size = Vector3.new(96, 0.5, 2), cframe = CFrame.new( 0, 50.8,  47), color = COLORS.GOLD, material = Enum.Material.SmoothPlastic, reflectance = 0.12, parent = vis("RAL_Core_Persistent") })
makePart({ name = "RAL_Rim_South_MSH", size = Vector3.new(96, 0.5, 2), cframe = CFrame.new( 0, 50.8, -47), color = COLORS.GOLD, material = Enum.Material.SmoothPlastic, reflectance = 0.12, parent = vis("RAL_Core_Persistent") })
makePart({ name = "RAL_Rim_East_MSH",  size = Vector3.new(2, 0.5, 96), cframe = CFrame.new( 47, 50.8,  0), color = COLORS.GOLD, material = Enum.Material.SmoothPlastic, reflectance = 0.12, parent = vis("RAL_Core_Persistent") })
makePart({ name = "RAL_Rim_West_MSH",  size = Vector3.new(2, 0.5, 96), cframe = CFrame.new(-47, 50.8,  0), color = COLORS.GOLD, material = Enum.Material.SmoothPlastic, reflectance = 0.12, parent = vis("RAL_Core_Persistent") })

-- Central hub platform
makePart({ name = "RAL_CentralHub_A_COL", size = Vector3.new(24, 2, 24), cframe = CFrame.new(0, 51.25, 0), canCollide = true, canTouch = true, transparency = 1, parent = col("RAL_Core_Persistent") })
makePart({ name = "RAL_CentralHub_A_MSH", size = Vector3.new(24, 2, 24), cframe = CFrame.new(0, 51.28, 0), color = COLORS.STONE, material = Enum.Material.SmoothPlastic, reflectance = 0.05, castShadow = true, parent = vis("RAL_Core_Persistent") })

ringSegments(vis("RAL_Core_Persistent"), "RAL_HubGoldRing",         Vector3.new(0,0,0), 12.7, 52.55, 16, 4.2, 0.45, 0.35, COLORS.GOLD,   Enum.Material.SmoothPlastic)
ringSegments(vis("RAL_Core_Persistent"), "RAL_CorruptionEnergyRing", Vector3.new(0,0,0), 12,   53.15, 16, 3.6, 0.55, 0.35, COLORS.VIOLET, Enum.Material.Neon, "RAL_CorruptionRing")

-- Crown beam
local crownBeamShell = makePart({ name = "RAL_CrownBeamShell_A_MSH", size = Vector3.new(4, 30, 4), cframe = CFrame.new(0, 67, 0), color = COLORS.GOLD, material = Enum.Material.SmoothPlastic, reflectance = 0.18, castShadow = true, parent = vis("RAL_Core_Persistent") })
local crownBeamCore  = makePart({ name = "RAL_CrownBeamCore_A_MSH",  size = Vector3.new(1, 32, 1), cframe = CFrame.new(0, 68, 0), color = COLORS.VIOLET, material = Enum.Material.Neon, castShadow = false, parent = vis("RAL_Core_Persistent") })
CollectionService:AddTag(crownBeamCore, "RAL_BeamPulse")
makePointLight(crownBeamCore, COLORS.VIOLET, 35, 2.5)

-- Floating crown
local crown = makePart({ name = "RAL_Crown_A_MSH", size = Vector3.new(6, 2, 6), cframe = CFrame.new(0, 83, 0), color = COLORS.GOLD_BRIGHT, material = Enum.Material.Neon, castShadow = false, parent = vis("RAL_Core_Persistent") })
CollectionService:AddTag(crown, "RAL_Crown")

-- Route guides (axis-aligned neon only)
makePart({ name = "RAL_RouteGuide_North_MSH", size = Vector3.new(1, 0.25, 8), cframe = CFrame.new( 0, 51.2,  22), color = COLORS.VIOLET, material = Enum.Material.Neon, parent = vis("RAL_Core_Persistent") })
makePart({ name = "RAL_RouteGuide_South_MSH", size = Vector3.new(1, 0.25, 8), cframe = CFrame.new( 0, 51.2, -22), color = COLORS.VIOLET, material = Enum.Material.Neon, parent = vis("RAL_Core_Persistent") })
makePart({ name = "RAL_RouteGuide_East_MSH",  size = Vector3.new(8, 0.25, 1), cframe = CFrame.new( 22, 51.2,  0), color = COLORS.VIOLET, material = Enum.Material.Neon, parent = vis("RAL_Core_Persistent") })
makePart({ name = "RAL_RouteGuide_West_MSH",  size = Vector3.new(8, 0.25, 1), cframe = CFrame.new(-22, 51.2,  0), color = COLORS.VIOLET, material = Enum.Material.Neon, parent = vis("RAL_Core_Persistent") })

-------------------------------------------------
-- FORTRESS WALLS, BUTTRESSES, CORNER TOWERS
-------------------------------------------------
local wallParent = vis("RAL_Core_Persistent")

for _, z in ipairs({ -48, 48 }) do
    for i = -2, 2 do
        makePart({ name = "RAL_OuterWall_Z" .. z .. "_" .. i .. "_MSH", size = Vector3.new(16, 24, 2), cframe = CFrame.new(i * 16, 62, z), color = COLORS.BASALT, material = Enum.Material.Basalt, castShadow = true, parent = wallParent })
    end
end
for _, x in ipairs({ -48, 48 }) do
    for i = -2, 2 do
        makePart({ name = "RAL_OuterWall_X" .. x .. "_" .. i .. "_MSH", size = Vector3.new(2, 24, 16), cframe = CFrame.new(x, 62, i * 16), color = COLORS.BASALT, material = Enum.Material.Basalt, castShadow = true, parent = wallParent })
    end
end

for _, pos in ipairs({
    Vector3.new(-45, 62, -45), Vector3.new(45, 62, -45),
    Vector3.new(-45, 62,  45), Vector3.new(45, 62,  45),
}) do
    makePart({ name = "RAL_CornerButtress_MSH",      size = Vector3.new(6, 24, 6),   cframe = CFrame.new(pos),               color = COLORS.BASALT, material = Enum.Material.Basalt,         parent = wallParent })
    makePart({ name = "RAL_CornerTower_MSH",         size = Vector3.new(4, 26, 4),   cframe = CFrame.new(pos.X, 76, pos.Z),  color = COLORS.BASALT, material = Enum.Material.Basalt,         parent = wallParent })
    makePart({ name = "RAL_CornerTowerGoldCap_MSH",  size = Vector3.new(5, 1.2, 5),  cframe = CFrame.new(pos.X, 89.5, pos.Z), color = COLORS.GOLD,  material = Enum.Material.SmoothPlastic, reflectance = 0.1, parent = wallParent })
end

-------------------------------------------------
-- NORTH: THRONE + SHOP CATHEDRAL + FOUNDERS WALL
-------------------------------------------------
local northVis = vis("RAL_NorthThrone_Atomic")
local northCol = col("RAL_NorthThrone_Atomic")

makePart({ name = "RAL_NorthWingPad_COL", size = Vector3.new(16, 1, 16), cframe = CFrame.new(0, 51, 32),    transparency = 1, canCollide = true, canTouch = true, parent = northCol })
makePart({ name = "RAL_NorthWingPad_MSH", size = Vector3.new(16, 1, 16), cframe = CFrame.new(0, 51.05, 32), color = COLORS.STONE, material = Enum.Material.SmoothPlastic, parent = northVis })

gateFrame(northVis, CFrame.new(0, 51, 40), "RAL_ShopCathedralEntrance", 14, 16, 2, COLORS.VIOLET, "SHOP", COLORS.GOLD)

local shopPedestal = makePart({ name = "RAL_ShopPromptPedestal_A_MSH", size = Vector3.new(5, 3, 5), cframe = CFrame.new(0, 53, 32), color = COLORS.STEEL, material = Enum.Material.Metal, reflectance = 0.08, parent = northVis })
makePointLight(shopPedestal, COLORS.GOLD, 18, 1.5)
local shopPrompt = Instance.new("ProximityPrompt")
shopPrompt.ObjectText          = "Royal Shop"
shopPrompt.ActionText          = "Browse Artifacts"
shopPrompt.KeyboardKeyCode     = Enum.KeyCode.E
shopPrompt.MaxActivationDistance = 10
shopPrompt.HoldDuration        = 0.25
shopPrompt.Parent              = shopPedestal
shopPrompt.Triggered:Connect(function(player)
    local remotes  = ReplicatedStorage:FindFirstChild("Remotes")
    local openShop = remotes and remotes:FindFirstChild("OpenShop")
    if openShop then openShop:FireClient(player) end
end)

for i, x in ipairs({ -6, -3, 3, 6 }) do
    local ped = makePart({ name = "RAL_ShopRarityPedestal_" .. i .. "_MSH", size = Vector3.new(2, 2, 2), cframe = CFrame.new(x, 53, 37), color = COLORS.BASALT, material = Enum.Material.Basalt, parent = northVis })
    local lightColor = i == 1 and COLORS.BLUE or i == 2 and COLORS.VIOLET or i == 3 and COLORS.GOLD or COLORS.DANGER
    makePointLight(ped, lightColor, 8, 1.2)
end

-- Throne (compact V3 position, visible from spawn)
local throne = makePart({ name = "RAL_Throne_MSH", size = Vector3.new(10, 8, 10), cframe = CFrame.new(0, 56, 14), color = COLORS.STONE, material = Enum.Material.SmoothPlastic, reflectance = 0.05, parent = northVis })
makePart({ name = "RAL_ThroneGoldSeat_MSH", size = Vector3.new(8, 1, 8), cframe = CFrame.new(0, 58.5, 12), color = COLORS.GOLD, material = Enum.Material.SmoothPlastic, reflectance = 0.1, parent = northVis })
makeSpotLight(throne, COLORS.GOLD, 20, 2.0, 45, Enum.NormalId.Front)

-- Hall of Founders title panel
local founderPanel = makePart({ name = "RAL_FoundersHall_TitlePanel_MSH", size = Vector3.new(18, 6, 1), cframe = CFrame.new(-28, 58, 40), color = COLORS.STONE, material = Enum.Material.SmoothPlastic, parent = northVis })
addLabel(founderPanel, "FOUNDERS", COLORS.GOLD)

-------------------------------------------------
-- SOUTH: SPAWN DAIS + TRAINING GATE
-------------------------------------------------
local southVis = vis("RAL_SouthGate_Atomic")
local southCol = col("RAL_SouthGate_Atomic")

makePart({ name = "RAL_SpawnDais_COL", size = Vector3.new(12, 2, 12), cframe = CFrame.new(0, 52, -28),    transparency = 1, canCollide = true, canTouch = true, parent = southCol })
makePart({ name = "RAL_SpawnDais_MSH", size = Vector3.new(12, 2, 12), cframe = CFrame.new(0, 52.03, -28), color = COLORS.MOON, material = Enum.Material.SmoothPlastic, reflectance = 0.04, parent = southVis })
ringSegments(southVis, "RAL_SpawnSigilRing", Vector3.new(0, 0, -28), 5.4, 53.2, 12, 2.6, 0.35, 0.25, COLORS.VIOLET_DARK, Enum.Material.Neon)

local spawnFill = makePart({ name = "RAL_LGT_SpawnFill_PL", size = Vector3.new(0.1, 0.1, 0.1), cframe = CFrame.new(0, 54, -28), transparency = 1, parent = lights("RAL_SouthGate_Atomic") })
makePointLight(spawnFill, COLORS.BLUE, 22, 0.8)

makePart({ name = "RAL_SouthWingPad_COL", size = Vector3.new(16, 1, 16), cframe = CFrame.new(0, 51, -38),    transparency = 1, canCollide = true, canTouch = true, parent = southCol })
makePart({ name = "RAL_SouthWingPad_MSH", size = Vector3.new(16, 1, 16), cframe = CFrame.new(0, 51.05, -38), color = COLORS.STONE, material = Enum.Material.SmoothPlastic, parent = southVis })

gateFrame(southVis, CFrame.new(0, 51, -44) * CFrame.Angles(0, math.pi, 0), "RAL_ArenaGate", 14, 16, 2, COLORS.DANGER, "TRAIN", COLORS.DANGER)
local arenaGate = makePart({ name = "RAL_ArenaGate_MSH", size = Vector3.new(14, 16, 2), cframe = CFrame.new(0, 59, -46), color = COLORS.STEEL, material = Enum.Material.Metal, reflectance = 0.08, transparency = 1, parent = southVis })
makeSpotLight(arenaGate, COLORS.DANGER, 20, 2.0, 55, Enum.NormalId.Front)

-------------------------------------------------
-- EAST: RANKED PORTAL + LEADERBOARD + MATCH HISTORY
-------------------------------------------------
local eastVis = vis("RAL_EastCommerce_Atomic")
local eastCol = col("RAL_EastCommerce_Atomic")

makePart({ name = "RAL_EastWingPad_COL", size = Vector3.new(16, 1, 16), cframe = CFrame.new(32, 51, 0),    transparency = 1, canCollide = true, canTouch = true, parent = eastCol })
makePart({ name = "RAL_EastWingPad_MSH", size = Vector3.new(16, 1, 16), cframe = CFrame.new(32, 51.05, 0), color = COLORS.STONE, material = Enum.Material.SmoothPlastic, parent = eastVis })
gateFrame(eastVis, CFrame.new(40, 51, 0) * CFrame.Angles(0, -math.pi / 2, 0), "RAL_RankedPortal", 12, 14, 2, COLORS.VIOLET, "RANKED", COLORS.BLUE)

local portalFill = makePart({ name = "RAL_RankedPortalFill_MSH", size = Vector3.new(0.6, 10, 8), cframe = CFrame.new(41.2, 58, 0), color = COLORS.VIOLET, material = Enum.Material.Neon, transparency = 0.25, parent = eastVis })
CollectionService:AddTag(portalFill, "RAL_PortalGlyph")
makePointLight(portalFill, COLORS.VIOLET, 25, 3.0)

local leaderboard = makePart({ name = "RAL_LeaderboardWall",  size = Vector3.new(1, 10, 18), cframe = CFrame.new(46.5, 58,  18), color = COLORS.STONE, material = Enum.Material.SmoothPlastic, parent = eastVis })
addLabel(leaderboard, "LEADERS", COLORS.GOLD)
local matchHistory = makePart({ name = "RAL_MatchHistoryWall", size = Vector3.new(1,  8, 14), cframe = CFrame.new(46.5, 57, -18), color = COLORS.STONE, material = Enum.Material.SmoothPlastic, parent = eastVis })
addLabel(matchHistory, "MATCHES", COLORS.BLUE)

-------------------------------------------------
-- WEST: GUILD HALL + WAR TABLE + EVENT WALL
-------------------------------------------------
local westVis = vis("RAL_WestWar_Atomic")
local westCol = col("RAL_WestWar_Atomic")

makePart({ name = "RAL_WestWingPad_COL", size = Vector3.new(16, 1, 16), cframe = CFrame.new(-32, 51, 0),    transparency = 1, canCollide = true, canTouch = true, parent = westCol })
makePart({ name = "RAL_WestWingPad_MSH", size = Vector3.new(16, 1, 16), cframe = CFrame.new(-32, 51.05, 0), color = COLORS.STONE, material = Enum.Material.SmoothPlastic, parent = westVis })
gateFrame(westVis, CFrame.new(-40, 51, 0) * CFrame.Angles(0, math.pi / 2, 0), "RAL_GuildHall", 14, 16, 2, COLORS.CRIMSON, "GUILD", COLORS.GOLD)

local warTable = makePart({ name = "RAL_GuildWarTable_A_MSH", size = Vector3.new(10, 2, 6), cframe = CFrame.new(-32, 53, 0), color = COLORS.STEEL, material = Enum.Material.Metal, reflectance = 0.08, parent = westVis })
makePointLight(warTable, COLORS.GOLD, 10, 0.8)
ringSegments(westVis, "RAL_GuildDuelCircle", Vector3.new(-32, 0, 0), 5, 52.2, 12, 2.3, 0.25, 0.25, COLORS.VIOLET, Enum.Material.Neon)
local eventWall = makePart({ name = "RAL_SeasonalEventWall", size = Vector3.new(1, 8, 14), cframe = CFrame.new(-46.5, 57, -18), color = COLORS.STONE, material = Enum.Material.SmoothPlastic, parent = westVis })
addLabel(eventWall, "EVENT", COLORS.DANGER)

-------------------------------------------------
-- REWARD WHEEL + EMOTE CIRCLE + BANNERS + DEBRIS
-------------------------------------------------
local wheel = makePart({ name = "RAL_RewardWheel_Disc", size = Vector3.new(0.5, 8, 8), cframe = CFrame.new(18, 56, 34) * CFrame.Angles(0, math.pi / 2, 0), color = COLORS.GOLD, material = Enum.Material.Neon, parent = northVis })
wheel.Shape = Enum.PartType.Cylinder
CollectionService:AddTag(wheel, "RAL_RewardWheel")
makePointLight(wheel, COLORS.GOLD, 10, 1.2)

ringSegments(vis("RAL_Core_Persistent"), "RAL_EmoteCircle", Vector3.new(-22, 0, -28), 5, 51.5, 16, 2.1, 0.25, 0.25, COLORS.VIOLET, Enum.Material.Neon)

local bannerPositions = {
    { -42, 61,  26, 0           }, { -42, 61,  10, 0           },
    {  42, 61,  26, 0           }, {  42, 61,  10, 0           },
    { -26, 61,  42, math.pi / 2 }, { -10, 61,  42, math.pi / 2 },
    {  26, 61, -42, math.pi / 2 }, {  10, 61, -42, math.pi / 2 },
}
for i, data in ipairs(bannerPositions) do
    local banner = makePart({ name = "RAL_Banner_" .. i .. "_MSH", size = Vector3.new(2, 10, 0.5), cframe = CFrame.new(data[1], data[2], data[3]) * CFrame.Angles(0, data[4], 0), color = COLORS.CRIMSON, material = Enum.Material.Fabric, parent = vis("RAL_Core_Persistent") })
    CollectionService:AddTag(banner, "RAL_Banner")
end

for i = 1, 10 do
    local angle  = i * math.tau / 10
    local radius = 58 + (i % 3) * 4
    makePart({ name = "RAL_AbyssDebris_" .. i .. "_MSH",
        size   = Vector3.new(1 + (i % 3), 1 + (i % 2), 1 + (i % 4)),
        cframe = CFrame.new(math.cos(angle) * radius, 46 + (i % 4), math.sin(angle) * radius)
                 * CFrame.Angles(math.rad(i * 18), math.rad(i * 11), math.rad(i * 7)),
        color  = COLORS.BASALT, material = Enum.Material.Basalt, parent = vis("RAL_Core_Persistent") })
end

-------------------------------------------------
-- CROWN SPAWN MARKER + VFX ANCHORS
-------------------------------------------------
makePart({ name = "CrownSpawn", size = Vector3.new(1, 1, 1), cframe = CFrame.new(0, 62, 0), transparency = 1, parent = workspace })

local vfxRoot = vfx("RAL_Core_Persistent")
for _, pos in ipairs({
    Vector3.new( 12, 53.4,   0),
    Vector3.new(-12, 53.4,   0),
    Vector3.new(  0, 53.4,  12),
    Vector3.new(  0, 53.4, -12),
}) do
    makeParticle(makeAttachmentAnchor("RAL_VFX_CorruptionMist_ATT", pos, vfxRoot), COLORS.VIOLET, 3, 1.2)
end

-------------------------------------------------
-- LIGHTING  (Master V3 anti-reflective settings)
-------------------------------------------------
pcall(function() Lighting.Technology               = Enum.Technology.Future       end)
pcall(function() Lighting.LightingStyle            = Enum.LightingStyle.Realistic  end)
pcall(function() Lighting.PrioritizeLightingQuality= true                          end)

Lighting.Brightness              = 1.1
Lighting.ExposureCompensation    = 0
Lighting.GlobalShadows           = true
Lighting.ShadowSoftness          = 0.18
Lighting.ClockTime               = 21.4
Lighting.Ambient                 = Color3.fromRGB(30,  24,  40)
Lighting.OutdoorAmbient          = Color3.fromRGB(20,  16,  30)
Lighting.ColorShift_Bottom       = Color3.fromRGB(40,  20,  80)
Lighting.ColorShift_Top          = Color3.fromRGB(55,  45,  90)
Lighting.EnvironmentSpecularScale= 0.08
Lighting.EnvironmentDiffuseScale = 0.25
Lighting.FogColor                = Color3.fromRGB(42,  26,  74)
Lighting.FogStart                = 80
Lighting.FogEnd                  = 260

for _, child in ipairs(Lighting:GetChildren()) do
    if child:IsA("Atmosphere") or child:IsA("BloomEffect")
    or child:IsA("ColorCorrectionEffect") or child:IsA("DepthOfFieldEffect") then
        child:Destroy()
    end
end

local atmosphere      = Instance.new("Atmosphere")
atmosphere.Density    = 0.35
atmosphere.Offset     = 0.1
atmosphere.Color      = Color3.fromRGB(42, 26, 74)
atmosphere.Decay      = Color3.fromRGB(22, 12, 44)
atmosphere.Glare      = 0.04
atmosphere.Haze       = 1.8
atmosphere.Parent     = Lighting

local bloom           = Instance.new("BloomEffect")
bloom.Intensity       = 0.45
bloom.Size            = 32
bloom.Threshold       = 1.0
bloom.Parent          = Lighting

local correction          = Instance.new("ColorCorrectionEffect")
correction.Brightness     = 0
correction.Contrast       = 0.1
correction.Saturation     = -0.03
correction.TintColor      = Color3.fromRGB(230, 225, 255)
correction.Parent         = Lighting

-------------------------------------------------
-- ANIMATION  (all on server Heartbeat)
-------------------------------------------------
local timeAcc  = 0
local crownSpin= 0

RunService.Heartbeat:Connect(function(dt)
    timeAcc   += dt
    crownSpin += math.rad(8) * dt

    for _, part in ipairs(CollectionService:GetTagged("RAL_CorruptionRing")) do
        if part.Parent then
            part.CFrame *= CFrame.Angles(0, math.rad(16) * dt, 0)
        end
    end

    for _, part in ipairs(CollectionService:GetTagged("RAL_Crown")) do
        if part.Parent then
            part.CFrame = CFrame.new(0, 83 + math.sin(timeAcc * 1.4) * 0.35, 0) * CFrame.Angles(0, crownSpin, 0)
        end
    end

    for _, part in ipairs(CollectionService:GetTagged("RAL_BeamPulse")) do
        if part.Parent then
            part.Transparency = 0.05 + math.abs(math.sin(timeAcc)) * 0.18
        end
    end

    for _, part in ipairs(CollectionService:GetTagged("RAL_Banner")) do
        if part.Parent then
            part.CFrame *= CFrame.Angles(0, math.sin(timeAcc * 0.8) * math.rad(0.04), 0)
        end
    end

    for _, part in ipairs(CollectionService:GetTagged("RAL_RewardWheel")) do
        if part.Parent then
            part.CFrame *= CFrame.Angles(0, 0, math.rad(18) * dt)
        end
    end
end)

print("[CrownChaos] WorkspaceSetup: Royal Ascension Lobby V3 master built.")
print("[CrownChaos]   Footprint: 96 x 96 studs | Ceiling: 28 studs | Neon: route/portal/hub only")
