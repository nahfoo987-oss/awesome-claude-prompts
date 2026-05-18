-- WorkspaceSetup | ServerScriptService
-- Builds the entire Royal Ascension Lobby: districts, geometry, lighting,
-- local lights, ParticleEmitters, and RunService animations.
-- Runs once on server start. All MeshPart entries use MeshId="" as
-- artist placeholders — replace with uploaded asset IDs for final art.

local RunService        = game:GetService("RunService")
local CollectionService = game:GetService("CollectionService")
local Lighting          = game:GetService("Lighting")

-------------------------------------------------
-- HELPERS
-------------------------------------------------
local function makePart(props)
    local p = Instance.new("Part")
    p.Anchored       = true
    p.CanCollide     = props.canCollide  ~= nil and props.canCollide  or false
    p.CanTouch       = props.canTouch   ~= nil and props.canTouch   or false
    p.CanQuery       = props.canQuery   ~= nil and props.canQuery   or false
    p.CastShadow     = props.castShadow ~= nil and props.castShadow or false
    p.Transparency   = props.transparency or 0
    p.Size           = props.size or Vector3.new(4, 4, 4)
    p.CFrame         = props.cframe or CFrame.new(0, 0, 0)
    p.Color          = props.color or Color3.fromRGB(30, 28, 35)
    p.Material       = props.material or Enum.Material.SmoothPlastic
    p.Name           = props.name or "Part"
    p.TopSurface     = Enum.SurfaceType.Smooth
    p.BottomSurface  = Enum.SurfaceType.Smooth
    p.Parent         = props.parent or workspace
    return p
end

local function makeMeshPart(props)
    local p = Instance.new("MeshPart")
    p.Anchored           = true
    p.CanCollide         = props.canCollide  ~= nil and props.canCollide  or false
    p.CanTouch           = props.canTouch   ~= nil and props.canTouch   or false
    p.CanQuery           = props.canQuery   ~= nil and props.canQuery   or false
    p.CastShadow         = props.castShadow ~= nil and props.castShadow or false
    p.Transparency       = props.transparency or 0
    p.Size               = props.size or Vector3.new(4, 4, 4)
    p.CFrame             = props.cframe or CFrame.new(0, 0, 0)
    p.Color              = props.color or Color3.fromRGB(30, 28, 35)
    p.Material           = props.material or Enum.Material.SmoothPlastic
    p.Name               = props.name or "MeshPart"
    p.MeshId             = props.meshId or ""
    p.CollisionFidelity  = Enum.CollisionFidelity.Box
    p.RenderFidelity     = Enum.RenderFidelity.Automatic
    p.TopSurface         = Enum.SurfaceType.Smooth
    p.BottomSurface      = Enum.SurfaceType.Smooth
    p.Parent             = props.parent or workspace
    return p
end

local function makeCylinder(props)
    local p = makePart(props)
    p.Shape = Enum.PartType.Cylinder
    -- Roblox cylinders extend along X; rotate so they extend along Y
    p.CFrame = (props.cframe or CFrame.new()) * CFrame.Angles(0, 0, math.pi / 2)
    p.Size   = Vector3.new(props.thickness or 4, props.diameter or 10, props.diameter or 10)
    return p
end

local function makeModel(name, parent)
    local m = Instance.new("Model")
    m.Name   = name
    m.Parent = parent or workspace
    return m
end

local function makeFolder(name, parent)
    local f = Instance.new("Folder")
    f.Name   = name
    f.Parent = parent
    return f
end

local function makeAttachment(name, position, parent)
    local a = Instance.new("Attachment")
    a.Name     = name
    a.Position = position
    a.Parent   = parent
    return a
end

local function makePointLight(props)
    local l = Instance.new("PointLight")
    l.Brightness = props.brightness or 2
    l.Range      = props.range or 20
    l.Color      = props.color or Color3.fromRGB(100, 30, 200)
    l.Enabled    = true
    l.Parent     = props.parent
    return l
end

local function makeParticle(props)
    local e = Instance.new("ParticleEmitter")
    e.Rate          = props.rate or 5
    e.Lifetime      = NumberRange.new(props.lifetimeMin or 1, props.lifetimeMax or 2)
    e.Speed         = NumberRange.new(props.speedMin or 0.5, props.speedMax or 2)
    e.LightEmission = props.lightEmission or 0
    e.Transparency  = NumberSequence.new({
        NumberSequenceKeypoint.new(0, 1),
        NumberSequenceKeypoint.new(0.1, 0),
        NumberSequenceKeypoint.new(0.9, 0),
        NumberSequenceKeypoint.new(1, 1),
    })
    e.Color     = props.color or ColorSequence.new(Color3.fromRGB(100, 30, 200))
    e.Size      = NumberSequence.new({
        NumberSequenceKeypoint.new(0, props.sizeStart or 0.3),
        NumberSequenceKeypoint.new(0.5, props.sizePeak or 0.6),
        NumberSequenceKeypoint.new(1, 0),
    })
    if props.spreadAngle then
        e.SpreadAngle = props.spreadAngle
    end
    if props.drag then
        e.Drag = props.drag
    end
    if props.rotSpeed then
        e.RotSpeed = props.rotSpeed
    end
    e.Enabled = props.enabled ~= nil and props.enabled or true
    e.Parent  = props.parent
    return e
end

-------------------------------------------------
-- COLORS
-------------------------------------------------
local COL_ONYX    = Color3.fromRGB(15,  16,  22)
local COL_MARBLE  = Color3.fromRGB(216, 217, 222)
local COL_GOLD    = Color3.fromRGB(199, 166,  90)
local COL_GUNMTL  = Color3.fromRGB(18,  19,  23)
local COL_VIOLET  = Color3.fromRGB(74,   0, 128)
local COL_PURPLE  = Color3.fromRGB(125,  43, 255)

-------------------------------------------------
-- LOBBY ROOT
-------------------------------------------------
local lobbyRoot = makeModel("TheRoyalAscension_Lobby", workspace)

-------------------------------------------------
-- DISTRICTS
-------------------------------------------------
local DISTRICTS = {
    { name = "RAL_Core_Persistent",           streaming = Enum.ModelStreamingMode.Persistent, lod = Enum.ModelLevelOfDetail.Automatic },
    { name = "RAL_NorthThrone_Atomic",        streaming = Enum.ModelStreamingMode.Atomic,     lod = Enum.ModelLevelOfDetail.StreamingMesh },
    { name = "RAL_EastCommerce_Atomic",       streaming = Enum.ModelStreamingMode.Atomic,     lod = Enum.ModelLevelOfDetail.StreamingMesh },
    { name = "RAL_WestWar_Atomic",            streaming = Enum.ModelStreamingMode.Atomic,     lod = Enum.ModelLevelOfDetail.StreamingMesh },
    { name = "RAL_SouthGate_Atomic",          streaming = Enum.ModelStreamingMode.Atomic,     lod = Enum.ModelLevelOfDetail.StreamingMesh },
    { name = "RAL_SoutheastTraining_Atomic",  streaming = Enum.ModelStreamingMode.Atomic,     lod = Enum.ModelLevelOfDetail.StreamingMesh },
    { name = "RAL_SouthwestProgression_Atomic",streaming= Enum.ModelStreamingMode.Atomic,     lod = Enum.ModelLevelOfDetail.StreamingMesh },
}

local districtModels = {}
for _, d in DISTRICTS do
    local m = makeModel(d.name, lobbyRoot)
    m.ModelStreamingMode = d.streaming
    m.LevelOfDetail      = d.lod
    makeFolder("Collisions", m)
    makeFolder("Visuals",    m)
    districtModels[d.name] = m
end

local function col(districtName) return districtModels[districtName].Collisions end
local function vis(districtName) return districtModels[districtName].Visuals    end

-------------------------------------------------
-- CORE — FLOORS
-------------------------------------------------
-- Main floor collision (invisible cylinder)
local mainFloorCol = makePart({
    name        = "RAL_MainFloor_A_COL",
    size        = Vector3.new(4, 120, 120),
    cframe      = CFrame.new(0, 50, 0) * CFrame.Angles(0, 0, math.pi/2),
    canCollide  = true,
    transparency= 1,
    castShadow  = false,
    parent      = col("RAL_Core_Persistent"),
})
mainFloorCol.Shape = Enum.PartType.Cylinder

-- Main floor visual (marble)
local mainFloorVis = makeMeshPart({
    name        = "RAL_MainFloor_A_MSH",
    size        = Vector3.new(4.02, 120, 120),
    cframe      = CFrame.new(0, 50.01, 0),
    color       = COL_MARBLE,
    material    = Enum.Material.SmoothPlastic,
    parent      = vis("RAL_Core_Persistent"),
})

-- Core socket disc
local socketDisc = makePart({
    name        = "RAL_SocketDisc_A_MSH",
    size        = Vector3.new(0.6, 16, 16),
    cframe      = CFrame.new(0, 52.03, 0) * CFrame.Angles(0, 0, math.pi/2),
    color       = COL_ONYX,
    parent      = vis("RAL_Core_Persistent"),
})
socketDisc.Shape = Enum.PartType.Cylinder

-- Corruption ring (animated placeholder)
local corruptRing = makePart({
    name        = "RAL_CorruptionRing_A_MSH",
    size        = Vector3.new(2, 30, 30),
    cframe      = CFrame.new(0, 52.55, 0) * CFrame.Angles(0, 0, math.pi/2),
    color       = COL_VIOLET,
    material    = Enum.Material.Neon,
    transparency= 0.25,
    castShadow  = false,
    parent      = vis("RAL_Core_Persistent"),
})
corruptRing.Shape = Enum.PartType.Cylinder
CollectionService:AddTag(corruptRing, "RAL_CorruptionRing")

-- Emote circles
for i, pos in ipairs({ Vector3.new(-24, 52.03, 17), Vector3.new(24, 52.03, 17) }) do
    local ec = makePart({
        name        = "RAL_EmoteCircle_" .. i .. "_MSH",
        size        = Vector3.new(0.4, 14, 14),
        cframe      = CFrame.new(pos) * CFrame.Angles(0, 0, math.pi/2),
        color       = COL_GOLD,
        material    = Enum.Material.Neon,
        transparency= 0.5,
        castShadow  = false,
        parent      = vis("RAL_Core_Persistent"),
    })
    ec.Shape = Enum.PartType.Cylinder
end

-------------------------------------------------
-- CORE — FLOATING CROWN
-------------------------------------------------
local crown = makeMeshPart({
    name        = "RAL_Crown_A_MSH",
    size        = Vector3.new(16, 14, 16),
    cframe      = CFrame.new(0, 90, 0),
    color       = COL_GOLD,
    material    = Enum.Material.Neon,
    transparency= 0,
    castShadow  = false,
    parent      = vis("RAL_Core_Persistent"),
})
CollectionService:AddTag(crown, "RAL_Crown")

-- Crown point light
makePointLight({ brightness=2.5, range=38, color=COL_VIOLET, parent=crown })

-- Crown corruption beam (neon cylinder)
local beam = makePart({
    name        = "RAL_CorruptionBeam_A_MSH",
    size        = Vector3.new(180, 2, 2),
    cframe      = CFrame.new(0, 71, 0) * CFrame.Angles(0, 0, math.pi/2),
    color       = COL_VIOLET,
    material    = Enum.Material.Neon,
    transparency= 0.28,
    castShadow  = false,
    parent      = vis("RAL_Core_Persistent"),
})
beam.Shape = Enum.PartType.Cylinder
CollectionService:AddTag(beam, "RAL_BeamPulse")

-------------------------------------------------
-- CORE — PILLARS (8) + ARCHES (8) + CHANDELIERS (4) + BANNERS (8)
-------------------------------------------------
local PILLAR_POSITIONS = {
    Vector3.new( 70,     92,  0     ),
    Vector3.new( 49.497, 92,  49.497),
    Vector3.new( 0,      92,  70    ),
    Vector3.new(-49.497, 92,  49.497),
    Vector3.new(-70,     92,  0     ),
    Vector3.new(-49.497, 92, -49.497),
    Vector3.new( 0,      92, -70    ),
    Vector3.new( 49.497, 92, -49.497),
}

local ARCH_MIDPOINTS = {
    Vector3.new( 59.748, 125,  24.748),
    Vector3.new( 24.748, 125,  59.748),
    Vector3.new(-24.748, 125,  59.748),
    Vector3.new(-59.748, 125,  24.748),
    Vector3.new(-59.748, 125, -24.748),
    Vector3.new(-24.748, 125, -59.748),
    Vector3.new( 24.748, 125, -59.748),
    Vector3.new( 59.748, 125, -24.748),
}

for i, pos in ipairs(PILLAR_POSITIONS) do
    -- Pedestal
    makePart({
        name       = "RAL_PillarPedestal_" .. i .. "_MSH",
        size       = Vector3.new(16, 6, 16),
        cframe     = CFrame.new(pos.X, 49, pos.Z),
        color      = COL_ONYX,
        castShadow = true,
        parent     = vis("RAL_Core_Persistent"),
    })

    -- Shaft
    local shaft = makePart({
        name       = "RAL_PillarShaft_" .. i .. "_MSH",
        size       = Vector3.new(12, 80, 12),
        cframe     = CFrame.new(pos),
        color      = COL_ONYX,
        castShadow = true,
        parent     = vis("RAL_Core_Persistent"),
    })
    -- Invisible collision shaft (simple box)
    makePart({
        name       = "RAL_PillarShaft_" .. i .. "_COL",
        size       = Vector3.new(12, 80, 12),
        cframe     = CFrame.new(pos),
        canCollide = true,
        transparency=1,
        parent     = col("RAL_Core_Persistent"),
    })

    -- Banner (suspended between pillars)
    local bannerX = pos.X * (63 / 70)
    local bannerZ = pos.Z * (63 / 70)
    local banner = makePart({
        name       = "RAL_Banner_" .. i .. "_MSH",
        size       = Vector3.new(0.2, 20, 8),
        cframe     = CFrame.new(bannerX, 100, bannerZ),
        color      = COL_VIOLET,
        material   = Enum.Material.SmoothPlastic,
        parent     = vis("RAL_Core_Persistent"),
    })
    CollectionService:AddTag(banner, "RAL_Banner")
end

-- Arch spans
for i, pos in ipairs(ARCH_MIDPOINTS) do
    local prevPillar = PILLAR_POSITIONS[i]
    local nextPillar = PILLAR_POSITIONS[i == 8 and 1 or i + 1]
    local dir = (nextPillar - prevPillar).Unit
    local angle = math.atan2(dir.X, dir.Z)
    makeMeshPart({
        name       = "RAL_ArchSpan_" .. i .. "_MSH",
        size       = Vector3.new(12, 10, 53.576),
        cframe     = CFrame.new(pos) * CFrame.Angles(0, angle, 0),
        color      = COL_ONYX,
        castShadow = true,
        parent     = vis("RAL_Core_Persistent"),
    })
end

-- Chandeliers
local CHANDELIER_POS = {
    Vector3.new( 26, 118,  26),
    Vector3.new(-26, 118,  26),
    Vector3.new( 26, 118, -26),
    Vector3.new(-26, 118, -26),
}
for i, pos in ipairs(CHANDELIER_POS) do
    makeMeshPart({
        name       = "RAL_Chandelier_" .. i .. "_MSH",
        size       = Vector3.new(12, 18, 12),
        cframe     = CFrame.new(pos),
        color      = COL_GUNMTL,
        castShadow = true,
        parent     = vis("RAL_Core_Persistent"),
    })
    -- Warm gold light per chandelier
    local chanPart = makePart({
        name        = "RAL_LGT_Chandelier_" .. i .. "_PL",
        size        = Vector3.new(0.1, 0.1, 0.1),
        cframe      = CFrame.new(pos + Vector3.new(0, -5, 0)),
        transparency= 1,
        castShadow  = false,
        parent      = vis("RAL_Core_Persistent"),
    })
    makePointLight({ brightness=2.0, range=26, color=Color3.fromRGB(212,164,58), parent=chanPart })
end

-- Ring lights for corruption ring (8 around ring radius 15)
for i = 1, 8 do
    local angle = (i - 1) * (math.pi * 2 / 8)
    local lx = math.cos(angle) * 15
    local lz = math.sin(angle) * 15
    local ringLightPart = makePart({
        name        = "RAL_LGT_Ring_" .. i .. "_PL",
        size        = Vector3.new(0.1, 0.1, 0.1),
        cframe      = CFrame.new(lx, 52.55, lz),
        transparency= 1,
        castShadow  = false,
        parent      = vis("RAL_Core_Persistent"),
    })
    makePointLight({ brightness=1.5, range=18, color=COL_PURPLE, parent=ringLightPart })
end

-------------------------------------------------
-- NORTH/THRONE DISTRICT
-------------------------------------------------

-- Spawn platform (octagon proxy)
makePart({
    name       = "RAL_SpawnOctagon_A_COL",
    size       = Vector3.new(40, 4, 40),
    cframe     = CFrame.new(0, 65, 80),
    canCollide = true,
    canTouch   = true,
    transparency=1,
    parent     = col("RAL_NorthThrone_Atomic"),
})
makeMeshPart({
    name       = "RAL_SpawnOctagon_A_MSH",
    size       = Vector3.new(40, 4, 40),
    cframe     = CFrame.new(0, 65, 80),
    color      = COL_MARBLE,
    castShadow = true,
    parent     = vis("RAL_NorthThrone_Atomic"),
})

-- CrownSpawn anchor (used by CrownService to spawn crown)
local crownSpawnPart = makePart({
    name        = "CrownSpawn",
    size        = Vector3.new(1, 1, 1),
    cframe      = CFrame.new(0, 96, 0),
    transparency= 1,
    castShadow  = false,
    parent      = workspace,
})

-- 22 Ceremonial stair treads
-- Tread 1: (0, 52.25, 18)  Tread 22: (0, 62.75, 60)
local STAIR_COUNT = 22
local stairZStart, stairZEnd = 18, 60
local stairYStart, stairYEnd = 52.25, 62.75
for i = 1, STAIR_COUNT do
    local t  = (i - 1) / (STAIR_COUNT - 1)
    local sz = stairZStart + t * (stairZEnd - stairZStart)
    local sy = stairYStart + t * (stairYEnd - stairYStart)
    makePart({
        name       = "RAL_Stair_" .. i .. "_COL",
        size       = Vector3.new(20, 0.5, 2),
        cframe     = CFrame.new(0, sy, sz),
        canCollide = true,
        canTouch   = true,
        transparency=1,
        parent     = col("RAL_NorthThrone_Atomic"),
    })
    makePart({
        name       = "RAL_Stair_" .. i .. "_MSH",
        size       = Vector3.new(20, 0.5, 2),
        cframe     = CFrame.new(0, sy + 0.01, sz),
        color      = COL_MARBLE,
        castShadow = false,
        parent     = vis("RAL_NorthThrone_Atomic"),
    })
end

-- Throne
local throne = makeMeshPart({
    name       = "RAL_Throne_A_MSH",
    size       = Vector3.new(18, 18, 10),
    cframe     = CFrame.new(0, 73.5, 98),
    color      = COL_GOLD,
    castShadow = true,
    parent     = vis("RAL_NorthThrone_Atomic"),
})
-- Throne backlights
for _, xOff in ipairs({ -6, 6 }) do
    local tl = makePart({
        name        = "RAL_LGT_Throne_PL",
        size        = Vector3.new(0.1, 0.1, 0.1),
        cframe      = CFrame.new(xOff, 76, 100),
        transparency= 1,
        castShadow  = false,
        parent      = vis("RAL_NorthThrone_Atomic"),
    })
    makePointLight({ brightness=1.2, range=14, color=COL_VIOLET, parent=tl })
end

-- Founders Hall pad
makePart({
    name       = "RAL_FoundersHall_A_COL",
    size       = Vector3.new(56, 4, 34),
    cframe     = CFrame.new(-72, 70, 125),
    canCollide = true,
    transparency=1,
    parent     = col("RAL_NorthThrone_Atomic"),
})
makePart({
    name       = "RAL_FoundersHall_A_MSH",
    size       = Vector3.new(56, 4, 34),
    cframe     = CFrame.new(-72, 70.01, 125),
    color      = COL_MARBLE,
    castShadow = true,
    parent     = vis("RAL_NorthThrone_Atomic"),
})

-- Spectator wing pad
makePart({
    name       = "RAL_SpectatorWing_A_COL",
    size       = Vector3.new(56, 4, 34),
    cframe     = CFrame.new(72, 70, 125),
    canCollide = true,
    transparency=1,
    parent     = col("RAL_NorthThrone_Atomic"),
})
makePart({
    name       = "RAL_SpectatorWing_A_MSH",
    size       = Vector3.new(56, 4, 34),
    cframe     = CFrame.new(72, 70.01, 125),
    color      = COL_MARBLE,
    castShadow = true,
    parent     = vis("RAL_NorthThrone_Atomic"),
})

-------------------------------------------------
-- EAST/COMMERCE DISTRICT
-------------------------------------------------
makePart({ name="RAL_EastBridge_A_COL",    size=Vector3.new(74,4,24),  cframe=CFrame.new(97,50,0),     canCollide=true, transparency=1, parent=col("RAL_EastCommerce_Atomic") })
makePart({ name="RAL_EastBridge_A_MSH",    size=Vector3.new(74,4,24),  cframe=CFrame.new(97,50.01,0),  color=COL_MARBLE, castShadow=true, parent=vis("RAL_EastCommerce_Atomic") })

-- Shop Cathedral pad (cylinder)
local shopPad = makePart({ name="RAL_ShopCathedral_A_COL", size=Vector3.new(4,72,72), cframe=CFrame.new(170,50,0)*CFrame.Angles(0,0,math.pi/2), canCollide=true, transparency=1, parent=col("RAL_EastCommerce_Atomic") })
shopPad.Shape = Enum.PartType.Cylinder
local shopVis = makePart({ name="RAL_ShopCathedral_A_MSH", size=Vector3.new(4.02,72,72), cframe=CFrame.new(170,50.01,0)*CFrame.Angles(0,0,math.pi/2), color=COL_MARBLE, castShadow=true, parent=vis("RAL_EastCommerce_Atomic") })
shopVis.Shape = Enum.PartType.Cylinder

makePart({ name="RAL_SkinShowcase_A_COL",  size=Vector3.new(44,4,28),  cframe=CFrame.new(220,50,70),   canCollide=true, transparency=1, parent=col("RAL_EastCommerce_Atomic") })
makePart({ name="RAL_SkinShowcase_A_MSH",  size=Vector3.new(44,4,28),  cframe=CFrame.new(220,50.01,70),color=COL_MARBLE, castShadow=true, parent=vis("RAL_EastCommerce_Atomic") })

-- Reward wheel alcove
local rwCol = makePart({ name="RAL_RewardWheel_A_COL", size=Vector3.new(4,24,24), cframe=CFrame.new(145,50,-55)*CFrame.Angles(0,0,math.pi/2), canCollide=true, transparency=1, parent=col("RAL_EastCommerce_Atomic") })
rwCol.Shape = Enum.PartType.Cylinder
local rwVis = makePart({ name="RAL_RewardWheel_A_MSH", size=Vector3.new(4.02,24,24), cframe=CFrame.new(145,50.01,-55)*CFrame.Angles(0,0,math.pi/2), color=COL_MARBLE, castShadow=true, parent=vis("RAL_EastCommerce_Atomic") })
rwVis.Shape = Enum.PartType.Cylinder
-- Wheel face disc (animated)
local wheelDisc = makePart({
    name        = "RAL_RewardWheelDisc_A_MSH",
    size        = Vector3.new(0.3, 22, 22),
    cframe      = CFrame.new(145, 53, -55) * CFrame.Angles(0, 0, math.pi/2),
    color       = COL_GOLD,
    material    = Enum.Material.Neon,
    transparency= 0.1,
    castShadow  = false,
    parent      = vis("RAL_EastCommerce_Atomic"),
})
wheelDisc.Shape = Enum.PartType.Cylinder
CollectionService:AddTag(wheelDisc, "RAL_RewardWheel")

-------------------------------------------------
-- WEST/WAR DISTRICT
-------------------------------------------------
makePart({ name="RAL_WestBridge_A_COL",    size=Vector3.new(74,4,24),  cframe=CFrame.new(-97,50,0),    canCollide=true, transparency=1, parent=col("RAL_WestWar_Atomic") })
makePart({ name="RAL_WestBridge_A_MSH",    size=Vector3.new(74,4,24),  cframe=CFrame.new(-97,50.01,0), color=COL_MARBLE, castShadow=true, parent=vis("RAL_WestWar_Atomic") })

local guildCol = makePart({ name="RAL_GuildChamber_A_COL", size=Vector3.new(4,72,72), cframe=CFrame.new(-170,50,0)*CFrame.Angles(0,0,math.pi/2), canCollide=true, transparency=1, parent=col("RAL_WestWar_Atomic") })
guildCol.Shape = Enum.PartType.Cylinder
local guildVis = makePart({ name="RAL_GuildChamber_A_MSH", size=Vector3.new(4.02,72,72), cframe=CFrame.new(-170,50.01,0)*CFrame.Angles(0,0,math.pi/2), color=COL_MARBLE, castShadow=true, parent=vis("RAL_WestWar_Atomic") })
guildVis.Shape = Enum.PartType.Cylinder

makePart({ name="RAL_LeaderboardWall_A_MSH", size=Vector3.new(36,18,2), cframe=CFrame.new(-145,59,55), color=COL_ONYX, castShadow=true, parent=vis("RAL_WestWar_Atomic") })
makePart({ name="RAL_EventWall_A_MSH",       size=Vector3.new(28,16,2), cframe=CFrame.new(-145,58,-55), color=COL_ONYX, castShadow=true, parent=vis("RAL_WestWar_Atomic") })

-------------------------------------------------
-- SOUTH/GATE DISTRICT
-------------------------------------------------
makePart({ name="RAL_SouthBridge_A_COL",   size=Vector3.new(80,4,26),  cframe=CFrame.new(0,50,-100),   canCollide=true, transparency=1, parent=col("RAL_SouthGate_Atomic") })
makePart({ name="RAL_SouthBridge_A_MSH",   size=Vector3.new(80,4,26),  cframe=CFrame.new(0,50.01,-100),color=COL_MARBLE, castShadow=true, parent=vis("RAL_SouthGate_Atomic") })

makePart({ name="RAL_SouthGatePad_A_COL",  size=Vector3.new(96,4,56),  cframe=CFrame.new(0,50,-170),   canCollide=true, transparency=1, parent=col("RAL_SouthGate_Atomic") })
makePart({ name="RAL_SouthGatePad_A_MSH",  size=Vector3.new(96,4,56),  cframe=CFrame.new(0,50.01,-170),color=COL_MARBLE, castShadow=true, parent=vis("RAL_SouthGate_Atomic") })

makePart({ name="RAL_EastSouthConn_A_COL", size=Vector3.new(60,4,22),  cframe=CFrame.new(78,50,-170),  canCollide=true, transparency=1, parent=col("RAL_SouthGate_Atomic") })
makePart({ name="RAL_EastSouthConn_A_MSH", size=Vector3.new(60,4,22),  cframe=CFrame.new(78,50.01,-170),color=COL_MARBLE, castShadow=true, parent=vis("RAL_SouthGate_Atomic") })
makePart({ name="RAL_WestSouthConn_A_COL", size=Vector3.new(60,4,22),  cframe=CFrame.new(-78,50,-170), canCollide=true, transparency=1, parent=col("RAL_SouthGate_Atomic") })
makePart({ name="RAL_WestSouthConn_A_MSH", size=Vector3.new(60,4,22),  cframe=CFrame.new(-78,50.01,-170),color=COL_MARBLE, castShadow=true, parent=vis("RAL_SouthGate_Atomic") })

-- Ranked portals
local PORTAL_POS = {
    Vector3.new(-14, 58, -147),
    Vector3.new(  0, 58, -147),
    Vector3.new( 14, 58, -147),
}
for i, pos in ipairs(PORTAL_POS) do
    local pv = makePart({
        name        = "RAL_RankedPortal_" .. i .. "_MSH",
        size        = Vector3.new(10, 16, 4),
        cframe      = CFrame.new(pos),
        color       = COL_VIOLET,
        material    = Enum.Material.Neon,
        transparency= 0.2,
        castShadow  = false,
        parent      = vis("RAL_SouthGate_Atomic"),
    })
    CollectionService:AddTag(pv, "RAL_PortalGlyph")
    local pl = makePart({ name="RAL_LGT_Portal_"..i.."_PL", size=Vector3.new(0.1,0.1,0.1), cframe=CFrame.new(pos), transparency=1, castShadow=false, parent=vis("RAL_SouthGate_Atomic") })
    makePointLight({ brightness=1.8, range=10, color=Color3.fromRGB(125,43,255), parent=pl })
end

-- Arena gate
makeMeshPart({
    name       = "RAL_ArenaGate_A_MSH",
    size       = Vector3.new(64, 48, 12),
    cframe     = CFrame.new(0, 74, -198),
    color      = COL_ONYX,
    castShadow = true,
    parent     = vis("RAL_SouthGate_Atomic"),
})

-------------------------------------------------
-- SOUTHEAST TRAINING
-------------------------------------------------
local trainingCol = makePart({ name="RAL_TrainingArena_A_COL", size=Vector3.new(4,64,64), cframe=CFrame.new(140,47,-170)*CFrame.Angles(0,0,math.pi/2), canCollide=true, transparency=1, parent=col("RAL_SoutheastTraining_Atomic") })
trainingCol.Shape = Enum.PartType.Cylinder
local trainingVis = makePart({ name="RAL_TrainingArena_A_MSH", size=Vector3.new(4.02,64,64), cframe=CFrame.new(140,47.01,-170)*CFrame.Angles(0,0,math.pi/2), color=COL_MARBLE, castShadow=true, parent=vis("RAL_SoutheastTraining_Atomic") })
trainingVis.Shape = Enum.PartType.Cylinder

-------------------------------------------------
-- SOUTHWEST PROGRESSION
-------------------------------------------------
makePart({ name="RAL_BattlePassHall_A_COL", size=Vector3.new(72,4,48), cframe=CFrame.new(-140,47,-170), canCollide=true, transparency=1, parent=col("RAL_SouthwestProgression_Atomic") })
makePart({ name="RAL_BattlePassHall_A_MSH", size=Vector3.new(72,4,48), cframe=CFrame.new(-140,47.01,-170), color=COL_MARBLE, castShadow=true, parent=vis("RAL_SouthwestProgression_Atomic") })

-------------------------------------------------
-- VFX ATTACHMENTS + PARTICLES
-------------------------------------------------
local vfxRoot = makeFolder("VFX_Attachments", lobbyRoot)

-- Helper: place attachment on a small invisible anchor Part
local function makeVFXAnchor(name, position, parent)
    local anchor = makePart({
        name        = name .. "_Anchor",
        size        = Vector3.new(0.1,0.1,0.1),
        cframe      = CFrame.new(position),
        transparency= 1, castShadow=false,
        parent      = parent or vfxRoot,
    })
    return makeAttachment(name, Vector3.new(0,0,0), anchor)
end

-- Corruption mist (4 cardinal attachments at ring radius 13, Y 52.8)
local MIST_ANGLES = {0, math.pi/2, math.pi, math.pi*1.5}
for i, angle in ipairs(MIST_ANGLES) do
    local att = makeVFXAnchor("RAL_VFX_CorruptionMist_0" .. i .. "_ATT",
        Vector3.new(math.cos(angle)*13, 52.8, math.sin(angle)*13))
    makeParticle({
        rate=8, lifetimeMin=2.5, lifetimeMax=4.0, speedMin=0.8, speedMax=1.8,
        spreadAngle=Vector2.new(20,20), lightEmission=0.35, drag=2,
        color=ColorSequence.new(COL_VIOLET),
        sizeStart=0.8, sizePeak=1.8,
        parent=att,
    })
end

-- Rune sparks (16 around radius 15, Y 52.7) — burst pattern
for i = 1, 16 do
    local angle = (i-1) * (math.pi*2/16)
    local att = makeVFXAnchor("RAL_VFX_RuneSparks_" .. string.format("%02d",i) .. "_ATT",
        Vector3.new(math.cos(angle)*15, 52.7, math.sin(angle)*15))
    local sp = makeParticle({
        rate=0, lifetimeMin=0.45, lifetimeMax=0.75, speedMin=3, speedMax=6,
        rotSpeed=NumberRange.new(-120,120),
        lightEmission=0.8,
        color=ColorSequence.new(COL_PURPLE),
        sizeStart=0.15, sizePeak=0.35,
        enabled=false,
        parent=att,
    })
    -- Burst loop
    local delay = (i-1) * 0.1
    task.delay(delay, function()
        while true do
            sp.Enabled = true
            task.wait(0.1)
            sp.Enabled = false
            task.wait(math.random() * 0.4 + 1.8)
        end
    end)
end

-- Crown motes
local crownAtt = makeVFXAnchor("RAL_CrownMote_01_ATT", Vector3.new(0, 90, 0))
makeParticle({
    rate=10, lifetimeMin=1.2, lifetimeMax=2.0, speedMin=0.2, speedMax=0.8,
    lightEmission=0.6,
    color=ColorSequence.new(COL_GOLD),
    sizeStart=0.15, sizePeak=0.35,
    parent=crownAtt,
})

-- Chandelier dust (4)
for i, pos in ipairs(CHANDELIER_POS) do
    local att = makeVFXAnchor("RAL_VFX_ChandelierDust_0" .. i .. "_ATT",
        pos + Vector3.new(0, -8, 0))
    makeParticle({
        rate=2, lifetimeMin=3, lifetimeMax=5, speedMin=0.1, speedMax=0.3,
        lightEmission=0,
        color=ColorSequence.new(Color3.fromRGB(200,190,160)),
        sizeStart=0.1, sizePeak=0.2,
        parent=att,
    })
end

-- Storm streaks (8 outer ring at Y=118)
for i = 1, 8 do
    local angle = (i-1) * (math.pi*2/8)
    local att = makeVFXAnchor("RAL_VFX_StormStreak_0" .. i .. "_ATT",
        Vector3.new(math.cos(angle)*72, 118, math.sin(angle)*72))
    makeParticle({
        rate=2, lifetimeMin=1.8, lifetimeMax=2.4, speedMin=6, speedMax=10,
        spreadAngle=Vector2.new(12,12), lightEmission=0.6,
        color=ColorSequence.new(COL_PURPLE),
        sizeStart=0.1, sizePeak=0.25,
        parent=att,
    })
end

-- Abyss drift (12 around outer edge underside)
for i = 1, 12 do
    local angle = (i-1) * (math.pi*2/12)
    local att = makeVFXAnchor("RAL_VFX_AbyssDrift_" .. string.format("%02d",i) .. "_ATT",
        Vector3.new(math.cos(angle)*58, 48, math.sin(angle)*58))
    makeParticle({
        rate=1.5, lifetimeMin=4, lifetimeMax=7, speedMin=0.2, speedMax=0.6,
        lightEmission=0,
        color=ColorSequence.new(Color3.fromRGB(40,20,60)),
        sizeStart=0.5, sizePeak=1.2,
        parent=att,
    })
end

-------------------------------------------------
-- GLOBAL LIGHTING
-------------------------------------------------
Lighting.Brightness              = 2.2
Lighting.ExposureCompensation    = 0.05
Lighting.GlobalShadows           = true
Lighting.ShadowSoftness          = 0.18
Lighting.ClockTime               = 21.4
Lighting.GeographicLatitude      = 41
Lighting.Ambient                 = Color3.fromRGB(18, 18, 24)
Lighting.OutdoorAmbient          = Color3.fromRGB(38, 42, 52)
Lighting.ColorShift_Top          = Color3.fromRGB(18, 8, 36)
Lighting.ColorShift_Bottom       = Color3.fromRGB(6, 0, 18)
Lighting.EnvironmentDiffuseScale = 0.35
Lighting.EnvironmentSpecularScale= 1.0
Lighting.FogColor                = Color3.fromRGB(112, 104, 144)
Lighting.FogStart                = 200
Lighting.FogEnd                  = 500

-- Remove any existing atmosphere/effects first
for _, child in Lighting:GetChildren() do
    if child:IsA("Atmosphere") or child:IsA("BloomEffect")
       or child:IsA("ColorCorrectionEffect") or child:IsA("DepthOfFieldEffect") then
        child:Destroy()
    end
end

local atmo = Instance.new("Atmosphere")
atmo.Density   = 0.24
atmo.Offset    = 0.15
atmo.Color     = Color3.fromRGB(112, 104, 144)
atmo.Decay     = Color3.fromRGB(76, 68, 112)
atmo.Glare     = 0.05
atmo.Haze      = 1.4
atmo.Parent    = Lighting

local bloom = Instance.new("BloomEffect")
bloom.Intensity  = 0.65
bloom.Size       = 48
bloom.Threshold  = 0.90
bloom.Parent     = Lighting

local cc = Instance.new("ColorCorrectionEffect")
cc.Brightness = 0.01
cc.Contrast   = 0.12
cc.Saturation = -0.02
cc.TintColor  = Color3.fromRGB(230, 225, 255)
cc.Parent     = Lighting

-------------------------------------------------
-- ANIMATIONS (RunService.Heartbeat)
-------------------------------------------------
local t = 0
local crownBaseCFrame = CFrame.new(0, 90, 0)

RunService.Heartbeat:Connect(function(dt)
    t = t + dt

    -- Corruption ring: 8 deg/s clockwise (Y axis)
    for _, part in CollectionService:GetTagged("RAL_CorruptionRing") do
        if part and part.Parent then
            part.CFrame = part.CFrame * CFrame.Angles(0, math.rad(8) * dt, 0)
        end
    end

    -- Crown: counter-rotate 4 deg/s + 0.6 stud bob on 4.5s sine
    for _, part in CollectionService:GetTagged("RAL_Crown") do
        if part and part.Parent then
            local bobY = 0.6 * math.sin((2 * math.pi * t) / 4.5)
            part.CFrame = CFrame.new(0, 90 + bobY, 0)
                * CFrame.Angles(0, math.rad(-4) * dt, 0)
                * CFrame.Angles(0, part.CFrame:ToEulerAnglesXYZ(), 0)
        end
    end

    -- Corruption beam pulse: brightness oscillates on 6s cycle
    for _, part in CollectionService:GetTagged("RAL_BeamPulse") do
        if part and part.Parent then
            part.Transparency = 0.15 + 0.2 * math.abs(math.sin(math.pi * t / 6.0))
        end
    end

    -- Banners: 2.5 deg amplitude, 3.5s period, per-banner phase offsets
    local banners = CollectionService:GetTagged("RAL_Banner")
    for i, part in ipairs(banners) do
        if part and part.Parent then
            local phase = (i - 1) * 0.785  -- ~45 deg phase steps
            local sway  = math.rad(2.5) * math.sin((2 * math.pi * t / 3.5) + phase)
            local orig  = CFrame.new(part.Position)
            part.CFrame = orig * CFrame.Angles(0, sway, 0)
        end
    end

    -- Portal glyphs: 12 deg/s
    for _, part in CollectionService:GetTagged("RAL_PortalGlyph") do
        if part and part.Parent then
            part.CFrame = part.CFrame * CFrame.Angles(0, math.rad(12) * dt, 0)
        end
    end

    -- Reward wheel idle: 3 deg/s
    for _, part in CollectionService:GetTagged("RAL_RewardWheel") do
        if part and part.Parent then
            part.CFrame = part.CFrame * CFrame.Angles(0, math.rad(3) * dt, 0)
        end
    end
end)

-- Announce crown proximity to players (integrates with CrownService)
-- CrownService already looks for workspace.CrownSpawn — now it exists.

print("[CrownChaos] WorkspaceSetup: Royal Ascension Lobby built successfully.")
print("[CrownChaos]   Districts:  " .. #DISTRICTS)
print("[CrownChaos]   Pillars:    8")
print("[CrownChaos]   Stairs:     " .. STAIR_COUNT)
print("[CrownChaos]   Portals:    3")
