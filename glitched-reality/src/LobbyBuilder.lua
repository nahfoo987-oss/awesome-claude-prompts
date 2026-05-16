-- LobbyBuilder.lua
-- Place: ServerScriptService/LobbyBuilder (ModuleScript)
-- Call LobbyBuilder:Build() from Main.server.lua on game start.

local LobbyBuilder = {}

local Lighting = game:GetService("Lighting")
local Workspace = game:GetService("Workspace")

local TEAL     = Color3.fromRGB(0, 220, 180)
local PURPLE   = Color3.fromRGB(107, 0, 255)
local WHITE    = Color3.fromRGB(255, 255, 255)
local DARK     = Color3.fromRGB(12, 12, 18)
local CHARCOAL = Color3.fromRGB(22, 22, 32)
local MID_DARK = Color3.fromRGB(30, 30, 45)

local lobbyFolder    = nil
local colorCorrection = nil

-- ── HELPERS ──────────────────────────────────────────────────────────────────

local function part(parent, name, size, cf, color, mat, transparency)
	local p = Instance.new("Part")
	p.Name         = name
	p.Size         = size
	p.CFrame       = cf
	p.Color        = color or DARK
	p.Material     = mat or Enum.Material.SmoothPlastic
	p.Anchored     = true
	p.CanCollide   = true
	p.CastShadow   = false
	p.Transparency = transparency or 0
	p.Parent       = parent
	return p
end

local function wedge(parent, name, size, cf, color, mat)
	local p = Instance.new("WedgePart")
	p.Name       = name
	p.Size       = size
	p.CFrame     = cf
	p.Color      = color or DARK
	p.Material   = mat or Enum.Material.SmoothPlastic
	p.Anchored   = true
	p.CanCollide = true
	p.CastShadow = false
	p.Parent     = parent
	return p
end

local function neon(parent, name, size, cf, color)
	return part(parent, name, size, cf, color, Enum.Material.Neon, 0)
end

local function pointLight(host, color, brightness, range)
	local l = Instance.new("PointLight")
	l.Color      = color or TEAL
	l.Brightness = brightness or 5
	l.Range      = range or 20
	l.Parent     = host
	return l
end

local function surfaceLight(host, color, brightness, range, face)
	local l = Instance.new("SurfaceLight")
	l.Color      = color or TEAL
	l.Brightness = brightness or 3
	l.Range      = range or 15
	l.Face       = face or Enum.NormalId.Top
	l.Parent     = host
	return l
end

local function spawn(parent, cf)
	local s = Instance.new("SpawnLocation")
	s.Size        = Vector3.new(6, 1, 6)
	s.CFrame      = cf
	s.Color       = BrickColor.new("Dark indigo")
	s.Material    = Enum.Material.Neon
	s.Transparency = 0.75
	s.Anchored    = true
	s.CanCollide  = true
	s.Neutral     = true
	s.Parent      = parent
	return s
end

-- ── LIGHTING ─────────────────────────────────────────────────────────────────

local function setupLighting()
	Lighting.ClockTime              = 0
	Lighting.Brightness             = 1.5
	Lighting.GlobalShadows          = true
	Lighting.EnvironmentDiffuseScale = 0
	Lighting.EnvironmentSpecularScale = 0
	Lighting.OutdoorAmbient         = Color3.fromRGB(0, 0, 10)
	Lighting.Ambient                = Color3.fromRGB(10, 5, 20)
	Lighting.FogColor               = Color3.fromRGB(5, 0, 15)
	Lighting.FogStart               = 80
	Lighting.FogEnd                 = 300

	-- Stars — use whatever sky is in Lighting, or create one
	local sky = Lighting:FindFirstChildOfClass("Sky")
	if not sky then
		sky = Instance.new("Sky")
		sky.Parent = Lighting
	end
	sky.StarCount       = 3000
	sky.SunAngularSize  = 0
	sky.MoonAngularSize = 0

	-- Reuse existing ColorCorrectionEffect — never create a duplicate
	colorCorrection = Lighting:FindFirstChildOfClass("ColorCorrectionEffect")
	if not colorCorrection then
		colorCorrection = Instance.new("ColorCorrectionEffect")
		colorCorrection.Parent = Lighting
	end
	colorCorrection.Brightness = -0.05
	colorCorrection.Contrast   = 0.10
	colorCorrection.Saturation = 0.20
	colorCorrection.TintColor  = Color3.fromRGB(200, 210, 255)
end

-- ── CENTRAL HUB ──────────────────────────────────────────────────────────────

local function buildCentralHub(root)
	local hub = Instance.new("Folder")
	hub.Name   = "CentralHub"
	hub.Parent = root

	-- Main platform
	local mainPlat = part(hub, "MainPlatform", Vector3.new(80, 2, 80),
		CFrame.new(0, 0, 0), CHARCOAL)
	surfaceLight(mainPlat, TEAL, 1, 40, Enum.NormalId.Top)

	-- Teal edge trim
	neon(hub, "EdgeN", Vector3.new(80, 1.5, 0.4), CFrame.new(0,  1.2, -40), TEAL)
	neon(hub, "EdgeS", Vector3.new(80, 1.5, 0.4), CFrame.new(0,  1.2,  40), TEAL)
	neon(hub, "EdgeE", Vector3.new(0.4, 1.5, 80), CFrame.new( 40, 1.2,  0), TEAL)
	neon(hub, "EdgeW", Vector3.new(0.4, 1.5, 80), CFrame.new(-40, 1.2,  0), TEAL)

	-- Corner glow orbs
	for i, pos in ipairs({
		Vector3.new( 38, 3,  38), Vector3.new(-38, 3,  38),
		Vector3.new( 38, 3, -38), Vector3.new(-38, 3, -38),
	}) do
		pointLight(neon(hub, "CornerOrb"..i, Vector3.new(2,2,2), CFrame.new(pos), TEAL), TEAL, 8, 25)
	end

	-- Support pillars under the platform
	for i, pos in ipairs({
		Vector3.new( 30,-10, 30), Vector3.new(-30,-10, 30),
		Vector3.new( 30,-10,-30), Vector3.new(-30,-10,-30),
		Vector3.new(  0,-10,  0),
	}) do
		part(hub, "Pillar"..i, Vector3.new(4,20,4), CFrame.new(pos), MID_DARK)
		neon(hub, "PillarRing"..i, Vector3.new(4.6,0.3,4.6), CFrame.new(pos.X,-1,pos.Z), TEAL)
	end

	-- Central raised dais
	local dais = part(hub, "Dais", Vector3.new(40,1.5,40), CFrame.new(0,1.75,0), MID_DARK)
	surfaceLight(dais, PURPLE, 0.8, 25, Enum.NormalId.Top)
	neon(hub, "DaisEdgeN", Vector3.new(40,0.5,0.3), CFrame.new( 0, 2.5,-20), PURPLE)
	neon(hub, "DaisEdgeS", Vector3.new(40,0.5,0.3), CFrame.new( 0, 2.5, 20), PURPLE)
	neon(hub, "DaisEdgeE", Vector3.new(0.3,0.5,40), CFrame.new( 20,2.5,  0), PURPLE)
	neon(hub, "DaisEdgeW", Vector3.new(0.3,0.5,40), CFrame.new(-20,2.5,  0), PURPLE)

	-- ── TITLE DISPLAY ────────────────────────────────────────────────────────
	local title = Instance.new("Folder")
	title.Name   = "TitleDisplay"
	title.Parent = hub

	-- Backdrop + arch
	part(title, "Backdrop", Vector3.new(54,18,1), CFrame.new(0,12,-18), DARK)

	for side, sx in ipairs({-26, 26}) do
		part(title, "ArchPillar"..side, Vector3.new(2.5,20,2.5), CFrame.new(sx,11,-18), MID_DARK)
		neon(title, "ArchPillarGlow"..side, Vector3.new(2.8,20.2,0.3), CFrame.new(sx,11,-16.8), TEAL)
		pointLight(
			neon(title, "ArchPillarTop"..side, Vector3.new(2.8,0.4,2.8), CFrame.new(sx,22,-18), TEAL),
			TEAL, 10, 20
		)
	end
	part(title, "ArchTopBeam", Vector3.new(55,2.5,2.5), CFrame.new(0,22,-18), MID_DARK)
	neon(title, "ArchTopGlow",  Vector3.new(55.2,0.4,0.3), CFrame.new(0,23.3,-16.8), TEAL)

	-- "GLITCHED" — each element is a neon block representing a letter region
	local glitchedChars = {
		{4,  -22}, {3, -17}, {1.5,-13}, {3.5,-9.5},
		{3.5,-5.5},{3.5,-1.5},{3.5,2.5},{3.5,6.5},
	}
	for i, c in ipairs(glitchedChars) do
		pointLight(
			neon(title, "G"..i, Vector3.new(c[1],5,0.5), CFrame.new(c[2],17,-17.5), TEAL),
			TEAL, 3, 8
		)
	end

	-- Separator
	neon(title, "TitleSep", Vector3.new(42,0.3,0.3), CFrame.new(0,14.5,-17.5), WHITE)

	-- "REALITY"
	local realityChars = {
		{3.5,-18},{3,-14},{1.5,-10.5},{3,-7},{3,-3.5},{3,0.5},{3.5,4.5},
	}
	for i, c in ipairs(realityChars) do
		pointLight(
			neon(title, "R"..i, Vector3.new(c[1],4,0.5), CFrame.new(c[2],11.5,-17.5), PURPLE),
			PURPLE, 3, 8
		)
	end

	-- Glitch displacement fragments
	for i, f in ipairs({
		{Vector3.new(8,0.8,0.3),  CFrame.new(-28,18.5,-17), TEAL},
		{Vector3.new(3,0.8,0.3),  CFrame.new( 15,16,  -17), PURPLE},
		{Vector3.new(5,0.8,0.3),  CFrame.new( 20,19,  -17), TEAL},
		{Vector3.new(2,0.8,0.3),  CFrame.new(-30,14,  -17), PURPLE},
	}) do
		neon(title, "GlitchFrag"..i, f[1], f[2], f[3])
	end

	-- Flood light facing the title
	pointLight(part(title, "FloodSrc", Vector3.new(1,1,1), CFrame.new(0,5,-10), TEAL,
		Enum.Material.Neon, 1), TEAL, 15, 40)

	-- ── LEADERBOARD STAND ────────────────────────────────────────────────────
	local lb = Instance.new("Folder")
	lb.Name   = "LeaderboardStand"
	lb.Parent = hub

	part(lb, "LBBase",  Vector3.new(8,0.8,4),  CFrame.new(28,1.4,5),  MID_DARK)
	neon(lb,  "LBBaseGlow", Vector3.new(8.3,0.2,4.3), CFrame.new(28,1.9,5), TEAL)
	part(lb, "LBPole",  Vector3.new(1,8,1),    CFrame.new(28,6,5),    MID_DARK)

	local lbPanel = part(lb, "LBPanel", Vector3.new(10,12,0.6), CFrame.new(28,14,5), DARK)
	surfaceLight(lbPanel, TEAL, 2, 12, Enum.NormalId.Front)
	pointLight(lbPanel, TEAL, 5, 18)

	neon(lb, "LBBorderT", Vector3.new(10.4,0.4,0.4), CFrame.new(28,20.2,5), TEAL)
	neon(lb, "LBBorderB", Vector3.new(10.4,0.4,0.4), CFrame.new(28, 7.8,5), TEAL)
	neon(lb, "LBBorderL", Vector3.new(0.4,12.4,0.4), CFrame.new(22.8,14,5), TEAL)
	neon(lb, "LBBorderR", Vector3.new(0.4,12.4,0.4), CFrame.new(33.2,14,5), TEAL)

	local rowColor = Color3.fromRGB(0, 100, 90)
	for row = 1, 5 do
		neon(lb, "LBRow"..row, Vector3.new(9,0.15,0.2), CFrame.new(28, 8.5+(row*2), 4.7), rowColor)
	end

	-- ── SPIN WHEEL STAND ─────────────────────────────────────────────────────
	local sw = Instance.new("Folder")
	sw.Name   = "SpinWheelStand"
	sw.Parent = hub

	part(sw, "WheelBase", Vector3.new(10,0.8,10), CFrame.new(-28,1.4,5), MID_DARK)
	neon(sw, "WheelBaseGlow", Vector3.new(10.3,0.2,10.3), CFrame.new(-28,1.9,5), PURPLE)
	part(sw, "WheelPole", Vector3.new(1.2,9,1.2), CFrame.new(-28,6.5,5), MID_DARK)
	neon(sw, "WheelPoleGlow", Vector3.new(1.4,9.1,0.2), CFrame.new(-28,6.5,4.4), PURPLE)

	-- Wheel spokes (rods through center, rotated to form star pattern)
	local wheelCF = CFrame.new(-28, 13, 5)
	local wheelR  = 5
	for seg = 1, 12 do
		local angle = (seg / 12) * math.pi * 2
		local segColor = (seg % 2 == 0) and TEAL or PURPLE
		neon(sw, "Spoke"..seg, Vector3.new(0.4, wheelR*2, 0.4),
			wheelCF * CFrame.Angles(0, 0, angle), segColor)
	end

	-- Rim nodes
	for r = 1, 24 do
		local angle = (r / 24) * math.pi * 2
		local rx = math.cos(angle) * wheelR
		local ry = math.sin(angle) * wheelR
		neon(sw, "Rim"..r, Vector3.new(1.4,1.4,0.5),
			CFrame.new(-28+rx, 13+ry, 5), r%3==0 and PURPLE or TEAL)
	end

	local hub_orb = neon(sw, "WheelHub", Vector3.new(2.5,2.5,0.8), CFrame.new(-28,13,4.7), TEAL)
	pointLight(hub_orb, TEAL, 12, 22)

	-- ── SPAWN LOCATIONS ──────────────────────────────────────────────────────
	local spawns = Instance.new("Folder")
	spawns.Name   = "Spawns"
	spawns.Parent = hub

	local spawnCFrames = {
		-- Inner dais ring
		CFrame.new( 8, 2.5,  0), CFrame.new(-8, 2.5,  0),
		CFrame.new( 0, 2.5,  8), CFrame.new( 0, 2.5, -8),
		-- Mid ring
		CFrame.new( 14,1.5, 14), CFrame.new(-14,1.5, 14),
		CFrame.new( 14,1.5,-14), CFrame.new(-14,1.5,-14),
		-- Outer ring
		CFrame.new( 25,1.5,  0), CFrame.new(-25,1.5,  0),
		CFrame.new(  0,1.5, 25), CFrame.new(  0,1.5,-25),
		-- Diagonal extras
		CFrame.new( 20,1.5,-20), CFrame.new(-20,1.5,-20),
		CFrame.new( 20,1.5, 20), CFrame.new(-20,1.5, 20),
	}
	for i, cf in ipairs(spawnCFrames) do
		local s = spawn(spawns, cf)
		s.Name = "Spawn"..i
		neon(hub, "SpawnRing"..i, Vector3.new(7,0.15,7),
			cf * CFrame.new(0,-0.58,0), TEAL)
	end
end

-- ── VIEWING PLATFORM (east void walk) ────────────────────────────────────────

local function buildViewingPlatform(root)
	local vp = Instance.new("Folder")
	vp.Name   = "ViewingPlatform"
	vp.Parent = root

	local ox, oz = 90, 0

	-- Walkway from hub
	part(vp, "Walkway", Vector3.new(4,0.8,50), CFrame.new(ox-25,0,oz), CHARCOAL)
	neon(vp, "WalkEdgeL", Vector3.new(0.25,0.5,50), CFrame.new(ox-25-2.1, 0.5, oz), TEAL)
	neon(vp, "WalkEdgeR", Vector3.new(0.25,0.5,50), CFrame.new(ox-25+2.1, 0.5, oz), TEAL)

	for i = 1, 5 do
		local lx = ox - 22 + (i * 8)
		part(vp, "LPost"..i, Vector3.new(0.3,3,0.3), CFrame.new(lx,2,oz-2), MID_DARK)
		pointLight(neon(vp, "LGlow"..i, Vector3.new(0.8,0.8,0.8), CFrame.new(lx,3.8,oz-2), TEAL), TEAL, 6, 15)
	end

	-- Platform
	local plat = part(vp, "Platform", Vector3.new(30,1.5,30), CFrame.new(ox,0,oz), MID_DARK)
	surfaceLight(plat, TEAL, 1.5, 30, Enum.NormalId.Top)

	neon(vp, "PlatN", Vector3.new(30,1,0.3), CFrame.new(ox,0.8,oz-15), TEAL)
	neon(vp, "PlatS", Vector3.new(30,1,0.3), CFrame.new(ox,0.8,oz+15), TEAL)
	neon(vp, "PlatE", Vector3.new(0.3,1,30), CFrame.new(ox+15,0.8,oz), TEAL)
	neon(vp, "PlatW", Vector3.new(0.3,1,30), CFrame.new(ox-15,0.8,oz), TEAL)

	-- Railings (U-shape open toward hub)
	for i, rp in ipairs({
		{ox-14,oz-14},{ox,oz-14},{ox+14,oz-14},
		{ox+14,oz},   {ox+14,oz+14},
		{ox,oz+14},   {ox-14,oz+14},
	}) do
		part(vp, "RailPost"..i, Vector3.new(0.5,5,0.5), CFrame.new(rp[1],3.5,rp[2]), MID_DARK)
		neon(vp, "RailCap"..i, Vector3.new(0.7,0.7,0.7), CFrame.new(rp[1],6.2,rp[2]), TEAL)
	end
	neon(vp, "RailN",  Vector3.new(30,0.3,0.3), CFrame.new(ox,6,oz-14), TEAL)
	neon(vp, "RailE",  Vector3.new(0.3,0.3,30), CFrame.new(ox+14,6,oz), TEAL)
	neon(vp, "RailS2", Vector3.new(18,0.3,0.3), CFrame.new(ox+6,6,oz+14), TEAL)

	-- Void-facing bench
	part(vp, "Bench", Vector3.new(12,1.2,1.5), CFrame.new(ox+10,1.85,oz-12), MID_DARK)
	neon(vp, "BenchGlow", Vector3.new(12.2,0.2,0.2), CFrame.new(ox+10,2.5,oz-12), TEAL)

	-- Floating debris in the void below/beyond
	for i, d in ipairs({
		{Vector3.new( 6,1.5, 6), Vector3.new(ox+25,-12,oz+10)},
		{Vector3.new( 3,  3, 3), Vector3.new(ox+35,-20,oz- 5)},
		{Vector3.new(10,  1, 8), Vector3.new(ox+20,-30,oz+25)},
		{Vector3.new( 4,  4, 4), Vector3.new(ox+40, -8,oz-15)},
		{Vector3.new( 8,  2, 5), Vector3.new(ox+50,-25,oz+ 5)},
		{Vector3.new( 2,  2, 2), Vector3.new(ox+30,-15,oz+30)},
		{Vector3.new(12,1.5,12), Vector3.new(ox+15,-40,oz-20)},
	}) do
		local rot = CFrame.Angles(math.rad(math.random(-20,20)), math.rad(math.random(0,360)), math.rad(math.random(-20,20)))
		local p = part(vp, "Debris"..i, d[1], CFrame.new(d[2]) * rot, CHARCOAL)
		if i % 2 == 0 then
			neon(vp, "DebrisGlow"..i,
				Vector3.new(d[1].X+0.2, 0.2, d[1].Z+0.2),
				CFrame.new(d[2]) * rot * CFrame.new(0, d[1].Y/2, 0),
				i%3==0 and PURPLE or TEAL)
		end
	end
end

-- ── CRYSTAL ZONE (west void walk) ────────────────────────────────────────────

local function buildCrystalZone(root)
	local cz = Instance.new("Folder")
	cz.Name   = "CrystalZone"
	cz.Parent = root

	local ox, oz = -90, 0

	-- Walkway
	part(cz, "Walkway", Vector3.new(4,0.8,50), CFrame.new(ox+25,0,oz), CHARCOAL)
	neon(cz, "WalkEdgeL", Vector3.new(0.25,0.5,50), CFrame.new(ox+25-2.1,0.5,oz), PURPLE)
	neon(cz, "WalkEdgeR", Vector3.new(0.25,0.5,50), CFrame.new(ox+25+2.1,0.5,oz), PURPLE)

	for i = 1, 5 do
		local lx = ox + 48 - (i * 8)
		part(cz, "LPost"..i, Vector3.new(0.3,3,0.3), CFrame.new(lx,2,oz+2), MID_DARK)
		pointLight(neon(cz, "LGlow"..i, Vector3.new(0.8,0.8,0.8), CFrame.new(lx,3.8,oz+2), PURPLE), PURPLE, 6, 15)
	end

	-- Platform
	local plat = part(cz, "Platform", Vector3.new(34,1.5,34), CFrame.new(ox,0,oz), MID_DARK)
	surfaceLight(plat, PURPLE, 1.5, 30, Enum.NormalId.Top)

	neon(cz, "PlatN", Vector3.new(34,1,0.3), CFrame.new(ox,0.8,oz-17), PURPLE)
	neon(cz, "PlatS", Vector3.new(34,1,0.3), CFrame.new(ox,0.8,oz+17), PURPLE)
	neon(cz, "PlatE", Vector3.new(0.3,1,34), CFrame.new(ox+17,0.8,oz), PURPLE)
	neon(cz, "PlatW", Vector3.new(0.3,1,34), CFrame.new(ox-17,0.8,oz), PURPLE)

	-- ── CORRUPTED CRYSTAL FORMATION ──────────────────────────────────────────
	local cf = Instance.new("Folder")
	cf.Name   = "CrystalFormation"
	cf.Parent = cz

	-- Crystal base
	part(cf, "Base1", Vector3.new(14,2,14), CFrame.new(ox,2,oz), DARK)
	part(cf, "Base2", Vector3.new(10,1,10), CFrame.new(ox,3.2,oz), MID_DARK)

	-- Glow pool
	neon(cf, "GlowPool", Vector3.new(12,0.1,12), CFrame.new(ox,1.85,oz), PURPLE)
	pointLight(part(cf,"GlowSrc",Vector3.new(1,1,1),CFrame.new(ox,2,oz),PURPLE,Enum.Material.Neon,1), PURPLE, 20, 35)

	-- Spires (wedge parts leaning at angles)
	local spires = {
		{Vector3.new(3,18,3),    CFrame.new(ox,  10, oz),                                PURPLE, 8},
		{Vector3.new(2,14,2),    CFrame.new(ox,   8, oz) * CFrame.Angles(0, 0.4, 0.15), PURPLE, 6},
		{Vector3.new(2,12,2),    CFrame.new(ox+5, 7, oz+3) * CFrame.Angles(0,0,0.2),    PURPLE, 5},
		{Vector3.new(1.5,10,1.5),CFrame.new(ox-4, 6, oz+5) * CFrame.Angles(0,0,-0.15), PURPLE, 0},
		{Vector3.new(2,9,2),     CFrame.new(ox+6,5.5,oz-4) * CFrame.Angles(0,0.3,0.1), TEAL,   4},
		{Vector3.new(1.5,8,1.5), CFrame.new(ox-6, 5, oz-3) * CFrame.Angles(0,-0.2,0.2),TEAL,   0},
		{Vector3.new(1,7,1),     CFrame.new(ox+3,4.5,oz-7) * CFrame.Angles(0,0,-0.1),  PURPLE, 0},
		{Vector3.new(1,6,1),     CFrame.new(ox-7, 4, oz+2) * CFrame.Angles(0,0,0.25),  TEAL,   0},
		{Vector3.new(0.8,4,0.8), CFrame.new(ox+8, 3, oz+7) * CFrame.Angles(0,0,0.3),   PURPLE, 0},
		{Vector3.new(0.8,3.5,0.8),CFrame.new(ox-8,2.8,oz-6)* CFrame.Angles(0,0,-0.25), TEAL,   0},
		{Vector3.new(0.6,3,0.6), CFrame.new(ox+2,2.5,oz+8),                             PURPLE, 0},
	}
	for i, s in ipairs(spires) do
		local sp = wedge(cf, "Spire"..i, s[1], s[2], s[3], Enum.Material.Neon)
		if s[4] > 0 then pointLight(sp, s[3], s[4], s[4]*3) end
	end

	-- Floating shards above the formation
	for i, fd in ipairs({
		{Vector3.new(1.5,4,1.5), CFrame.new(ox+3,24,oz-2) * CFrame.Angles(0.3,0.5,0.2)},
		{Vector3.new(1,3,1),     CFrame.new(ox-4,28,oz+3) * CFrame.Angles(-0.2,0.3,0.4)},
		{Vector3.new(0.8,2.5,0.8),CFrame.new(ox+6,22,oz+4)* CFrame.Angles(0.1,-0.4,0.3)},
	}) do
		wedge(cf, "FloatShard"..i, fd[1], fd[2], PURPLE, Enum.Material.Neon)
	end
end

-- ── THE RIFT OVERLOOK ─────────────────────────────────────────────────────────

local function buildRiftOverlook(root)
	local rift = Instance.new("Folder")
	rift.Name   = "RiftOverlook"
	rift.Parent = root

	local ox, oy, oz = 0, 40, -120
	local ringR  = 35
	local segs   = 20
	local broken = {[4]=true,[5]=true,[12]=true,[13]=true,[18]=true}

	for seg = 1, segs do
		local angle = (seg / segs) * math.pi * 2
		local rx = math.cos(angle) * ringR
		local ry = math.sin(angle) * ringR
		local segCF = CFrame.new(ox+rx, oy+ry, oz)

		if not broken[seg] then
			-- Intact segment
			part(rift, "Ring"..seg, Vector3.new(4,4,4),
				segCF * CFrame.Angles(0,0,angle), CHARCOAL)
			neon(rift, "RingGlow"..seg, Vector3.new(4.3,4.3,0.2),
				segCF * CFrame.Angles(0,0,angle) * CFrame.new(0,0,-2.2),
				seg%2==0 and TEAL or PURPLE)
		else
			-- Broken / displaced segment
			local drift = CFrame.new(math.random(-3,3), math.random(-3,3), math.random(-2,2))
				* CFrame.Angles(math.rad(math.random(-25,25)), math.rad(math.random(-25,25)), angle + math.rad(math.random(-15,15)))
			part(rift, "Broken"..seg, Vector3.new(3,3,4), segCF * drift, DARK)
			neon(rift, "BrokenGlow"..seg, Vector3.new(2,0.3,0.2),
				CFrame.new(ox+rx+math.random(-2,2), oy+ry+math.random(-2,2), oz-3) * CFrame.Angles(0,0,angle),
				PURPLE)
		end

		-- Point lights every 3 segments
		if seg % 3 == 0 then
			pointLight(
				neon(rift, "RingLight"..seg, Vector3.new(1.5,1.5,1.5), segCF, TEAL),
				seg%2==0 and TEAL or PURPLE, 12, 30
			)
		end
	end

	-- Inner complete ring
	local innerR = 18
	for seg = 1, 16 do
		local angle = (seg / 16) * math.pi * 2
		neon(rift, "InnerRing"..seg, Vector3.new(2.5,2.5,1),
			CFrame.new(ox + math.cos(angle)*innerR, oy + math.sin(angle)*innerR, oz) * CFrame.Angles(0,0,angle),
			seg%2==0 and TEAL or PURPLE)
	end

	-- Portal glow face (semi-transparent neon plane = ambient light source)
	local portalFace = part(rift, "PortalFace", Vector3.new(30,30,1),
		CFrame.new(ox,oy,oz+1), TEAL, Enum.Material.Neon, 0.85)
	pointLight(portalFace, TEAL, 25, 60)

	-- Center orb
	pointLight(
		part(rift, "CenterOrb", Vector3.new(6,6,6), CFrame.new(ox,oy,oz), TEAL, Enum.Material.Neon, 0.3),
		TEAL, 40, 80
	)

	-- Three support arms extending from ring outward/downward
	for i, arm in ipairs({
		{math.rad(210), 25}, {math.rad(330), 20}, {math.rad(90), 30},
	}) do
		local ax = math.cos(arm[1]) * ringR * 0.9
		local ay = math.sin(arm[1]) * ringR * 0.9
		local midCF = CFrame.new(ox + ax/2, oy + ay/2 - 5, oz) * CFrame.Angles(0,0, arm[1]+math.pi/2)
		part(rift, "Arm"..i, Vector3.new(2,arm[2],2), midCF, MID_DARK)
		neon(rift, "ArmGlow"..i, Vector3.new(2.3,arm[2],0.2),
			CFrame.new(ox+ax/2, oy+ay/2-5, oz-1.2) * CFrame.Angles(0,0,arm[1]+math.pi/2),
			i%2==0 and PURPLE or TEAL)
	end

	-- Debris field around rift
	for i, d in ipairs({
		{Vector3.new( 5,2, 5), Vector3.new(ox-50, oy+10, oz+15)},
		{Vector3.new( 3,5, 3), Vector3.new(ox+55, oy- 5, oz+10)},
		{Vector3.new( 8,1.5,6),Vector3.new(ox-45, oy-15, oz- 5)},
		{Vector3.new( 2,2, 2), Vector3.new(ox+40, oy+20, oz   )},
		{Vector3.new( 4,1, 4), Vector3.new(ox-30, oy+30, oz+20)},
		{Vector3.new( 6,2.5,4),Vector3.new(ox+60, oy+ 5, oz-20)},
	}) do
		part(rift, "RiftDebris"..i, d[1],
			CFrame.new(d[2]) * CFrame.Angles(math.rad(math.random(-45,45)), math.rad(math.random(0,360)), math.rad(math.random(-45,45))),
			CHARCOAL)
	end
end

-- ── CONNECTORS ───────────────────────────────────────────────────────────────

local function buildConnectors(root)
	local conn = Instance.new("Folder")
	conn.Name   = "Connectors"
	conn.Parent = root

	-- Light cable: chain of orbs from hub corners toward the rift
	for ci, cable in ipairs({
		{Vector3.new(-35,5,-35), Vector3.new(-20,20,-70)},
		{Vector3.new( 35,5,-35), Vector3.new( 20,20,-70)},
	}) do
		for step = 0, 6 do
			local t   = step / 6
			local pos = cable[1]:Lerp(cable[2], t)
			pointLight(neon(conn, "Cable"..ci.."_"..step, Vector3.new(0.5,0.5,0.5), CFrame.new(pos), TEAL), TEAL, 3, 10)
		end
	end

	-- Anchor blocks at walkway bases
	for side = 1, 2 do
		local sx     = side == 1 and 43 or -43
		local accent = side == 1 and TEAL or PURPLE
		part(conn, "Anchor"..side, Vector3.new(6,3,6), CFrame.new(sx,-0.5,0), CHARCOAL)
		neon(conn, "AnchorGlow"..side, Vector3.new(6.3,0.3,6.3), CFrame.new(sx,1.1,0), accent)
		pointLight(neon(conn, "AnchorLight"..side, Vector3.new(1,1,1), CFrame.new(sx,2,0), accent), accent, 8, 20)
	end
end

-- ── CORRUPTION LEVEL ─────────────────────────────────────────────────────────

function LobbyBuilder:SetCorruptionLevel(level)
	local cc = colorCorrection or Lighting:FindFirstChildOfClass("ColorCorrectionEffect")
	if not cc then return end

	if level == "Clean" then
		Lighting.FogEnd   = 300
		Lighting.FogColor = Color3.fromRGB(5, 0, 15)
		cc.TintColor      = Color3.fromRGB(200, 210, 255)
		cc.Saturation     = 0.20
		cc.Contrast       = 0.10
		cc.Brightness     = -0.05

	elseif level == "Fractured" then
		Lighting.FogEnd   = 220
		Lighting.FogColor = Color3.fromRGB(10, 0, 25)
		cc.TintColor      = Color3.fromRGB(180, 200, 255)
		cc.Saturation     = 0.35
		cc.Contrast       = 0.18
		cc.Brightness     = -0.08

	elseif level == "Critical" then
		Lighting.FogEnd   = 150
		Lighting.FogColor = Color3.fromRGB(20, 0, 40)
		cc.TintColor      = Color3.fromRGB(160, 180, 255)
		cc.Saturation     = 0.50
		cc.Contrast       = 0.28
		cc.Brightness     = -0.12

	elseif level == "Collapse" then
		Lighting.FogEnd   = 100
		Lighting.FogColor = Color3.fromRGB(40, 0, 80)
		cc.TintColor      = Color3.fromRGB(140, 100, 255)
		cc.Saturation     = 0.80
		cc.Contrast       = 0.45
		cc.Brightness     = -0.20
	end
end

-- ── BUILD ─────────────────────────────────────────────────────────────────────

function LobbyBuilder:Build()
	local existing = Workspace:FindFirstChild("LobbyMap")
	if existing then existing:Destroy() end

	lobbyFolder      = Instance.new("Folder")
	lobbyFolder.Name = "LobbyMap"
	lobbyFolder.Parent = Workspace

	setupLighting()
	buildCentralHub(lobbyFolder)
	buildViewingPlatform(lobbyFolder)
	buildCrystalZone(lobbyFolder)
	buildRiftOverlook(lobbyFolder)
	buildConnectors(lobbyFolder)

	self:SetCorruptionLevel("Clean")
end

return LobbyBuilder
