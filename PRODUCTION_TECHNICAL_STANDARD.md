# Crown Chaos Production Technical Standard

This is the working standard for Crown Chaos from this point forward. Use it for loading screens, lobby work, arena work, combat systems, UI, Blender assets, and Roblox Studio implementation.

The goal is simple: build like a real Roblox production, not like a pile of scripts and pretty screenshots.

## 1. Core Development Philosophy

Do not start with detail.

Build order:

1. 2D layout and emotional intent.
2. Roblox scale blockout with a 5-stud player dummy.
3. Gameplay route test.
4. Silhouette pass.
5. Lighting pass.
6. Material pass.
7. Damage/detail pass.
8. Atmosphere/VFX pass.
9. Optimization and QA.

Every environment must answer:

- What does the player see first?
- Where do they move?
- Where can they escape?
- What landmark tells them where they are?
- Does the scene still read if you squint?

## 2. Roblox Code Architecture

Use service-oriented architecture.

Server code lives in `ServerScriptService`.
Client code lives in `StarterPlayerScripts`, `StarterGui`, or shared client modules in `ReplicatedStorage`.
Shared assets and shared modules live in `ReplicatedStorage`.

Services are singletons. Do not create random global scripts that all own each other.

Service rules:

- Each service owns one feature slice.
- Each service exposes an explicit `Init()` or `Start()` function.
- Startup scripts initialize services in a controlled order.
- Server services never trust the client.
- Client services handle visuals, input, prediction, UI, and local camera work.

Suggested service folders:

```text
ReplicatedStorage
  Assets
  Shared
    Classes
    Config
    Packages
    Services
    UI
    Util

ServerScriptService
  Server
    Services
    Classes
    Startup.server.lua

StarterPlayer
  StarterPlayerScripts
    Client
      Services
      Startup.client.lua
```

## 3. Secure Networking

Clients request. Servers decide.

Wrong:

```text
Client tells server: "I hit this player."
```

Right:

```text
Client asks server: "Can I attack now?"
Server validates cooldown, range, character state, hitbox, team rules, and damage.
```

Networking rules:

- Remotes should be code-driven and versioned, not manually scattered through Explorer.
- All combat, currency, rewards, founder rewards, purchases, and progression must validate server-side.
- Never accept client-provided damage, currency, ownership, cooldown, or final hit results.
- Use cleanup helpers for temporary connections and instances.

## 4. Combat System Standard

Client responsibilities:

- Read input.
- Respect chat/game-processed input.
- Play local animation quickly.
- Send attack intent to server.
- Show predicted effects only when safe.

Server responsibilities:

- Validate attack cooldown.
- Create authoritative hitbox.
- Check range and target validity.
- Apply damage and knockback.
- Replicate hit VFX and SFX.
- Clean temporary hitboxes using `Debris` or a cleanup utility.

Combat structure:

- Use combo state for M1/M2/M3.
- Give finishers a longer cooldown.
- Do not let animation spam reset the combo unfairly.
- Use server-created temporary hitboxes in front of the attacker.
- Avoid `.Touched` as the only final truth for important combat unless validated carefully.

## 5. UI Architecture

UI should be modular.

Top-level UI initializer:

```text
ReplicatedStorage
  Shared
    UI
      UIController.lua
      HUD
      Menus
      Components
```

Rules:

- Each UI feature gets its own module.
- Each UI module has `Init()` or `Mount()`.
- Keep loading screen, HUD, shop, inventory, battle pass, and lobby UI separate.
- UI should be readable on desktop, controller, and mobile.
- Avoid simulator clutter.

## 6. Loading Screen Standard

The loading screen is a promise. It must sell the game in 3 seconds.

Focal hierarchy:

1. Crown.
2. Beam.
3. Arena silhouette.
4. Sky.

Composition:

- Use a low-angle cinematic shot.
- Camera height: 15-25 studs above arena floor in real scenes.
- Camera distance: 120-180 studs from center in real scenes.
- Tilt upward 20-35 degrees.
- Put title lower-left or lower-center, never dead-center over the hero object.

Color rule:

- 85% dark neutrals.
- 10% royal gold.
- 5% corruption purple.

Loading screen colors:

```text
Sky: #12141F
Clouds: #2A2D3A
Stone: #2B2B31
Gold: #C6A04E
Purple: #8D2EFF
Magenta: #D146FF
Fog: #4B3B63
```

Motion:

- Slow crown rotation.
- Beam pulse.
- Moving fog.
- Drifting ash.
- Subtle chain sway.
- Occasional lightning flash.

Do not spam particles. Atmosphere supports the shot; it does not become the shot.

## 7. Blender Asset Standard

Blender is for final hero geometry and clean modular MeshParts. Roblox Studio parts are for blockout, collision, and simple modular structures.

Required habits:

- Split meshes by material/color group before export.
- Keep each imported MeshPart under Roblox triangle limits.
- Prefer low-poly cylinders with 10-16 sides for repeated pieces.
- Use bevels on visible hard edges.
- Use shade smooth/auto smooth where it helps.
- Use decimate on heavy assets.
- Use reference images for important silhouettes.
- Export selected objects only.
- Keep scale consistent with Roblox studs.

Color/material separation:

- Crown gold pieces separate from void insets.
- Purple emissive pieces separate from metal.
- Stone separate from trim.
- Collision separate from visuals.

## 8. Roblox Asset Import Standard

When importing Blender assets:

- Import as separate MeshParts when material control matters.
- Anchor static environment pieces.
- Set decorative visuals to `CanCollide = false`.
- Use hidden simple colliders for player movement.
- Assign materials in Studio or via SurfaceAppearance/MaterialVariant.
- Avoid massive single meshes that are hard to optimize.

Roblox Studio material workflow:

- Use built-in materials for fast stylized iteration.
- Use MaterialVariants/PBR for final important surfaces.
- Prefer 1K texture maps unless there is a clear reason to go larger.
- Use OpenGL normal maps.
- Use normal maps for depth instead of wasting triangles.

Core PBR maps:

- Color Map.
- Metalness Map.
- Normal Map.
- Roughness Map.

## 9. Environment Building Standard

Always start with borders and scale.

Rules:

- Put a 5-stud character dummy in the scene immediately.
- Lock the playable boundary first.
- Block out routes before adding props.
- Test stairs, jumps, doors, and sightlines before detail.
- Build modular segments for repeat architecture.
- Avoid off-grid drift.
- Avoid z-fighting by not stacking faces on the same plane.
- Overlap hidden geometry only where needed to avoid visible gaps.

For colosseum/lobby work:

- Big shapes first.
- Landmarks second.
- Lighting third.
- Materials fourth.
- Damage and debris fifth.
- Atmosphere last.

## 10. VFX Standard

Use particles, beams, trails, and tweens with restraint.

Particle rules:

- Attach emitters to Attachments when origin matters.
- Use lifetime, transparency, and size curves so particles fade naturally.
- Preview effects in Play Mode.
- Use fewer stronger particles instead of noisy spam.

Beam rules:

- Beams require `Attachment0` and `Attachment1`.
- Use beams for crown energy, lightning, waterfalls, laser-like effects, and magical links.
- Lower `LightInfluence` when the effect must glow through darkness.

Trail rules:

- Trails need two attachments.
- Use trails for sword slashes, dash streaks, teleport residue, and fast relic effects.
- Keep lifetime short for combat readability.

## 11. Cutscene and 3D Menu Standard

For opening cinematic or 3D menu work:

- Use transparent camera parts.
- Put camera parts in a named `Cameras` folder.
- Set camera to `Scriptable`.
- Use TweenService for pans and fades.
- Return camera to `Custom` when player control begins.
- For parallax menus, move camera and 3D UI with clamped mouse offsets and lerp.

Loading screen and main menu can share the same cinematic principles:

- One dominant focal point.
- Low-angle scale.
- Minimal UI.
- Dark atmosphere.
- Slow motion.

## 12. Optimization Standard

Optimization starts during modeling, not after the game lags.

Rules:

- Use modular assets.
- Combine or package repeated assets carefully.
- Keep collision simple.
- Disable collision/query/touch on decorative visuals.
- Avoid unnecessary transparent overdraw.
- Avoid huge texture counts.
- Avoid high-poly repeated assets.
- Keep VFX emission controlled.

Use cleanup utilities or patterns for:

- Connections.
- Temporary hitboxes.
- VFX attachments.
- Sounds.
- Tweened objects.

## 13. Approved Plugin/Tool Use

Roblox Studio:

- Archimedes: arcs, circular walls, seating rings, curved trims.
- Brush Tool: rubble, debris, organic scatter.
- Add Easy Textures: fast texture iteration.
- Color Tools: bulk recolor passes.
- Particle/VFX libraries: temporary iteration, not final spam.

Blender:

- HardOps / BoxCutter: hard-surface architecture.
- DecalMachine: cracks, bolts, engravings, labels, surface detail.
- MACHIN3tools: alignment and cleanup.
- Kit Ops: mechanical kitbash.
- Geo-Scatter: rubble/debris.
- UVPackmaster: UV efficiency.
- Pure Sky / Physical Stars: cinematic sky/HDRI references.

If a plugin creates messy geometry, use it for blockout only and rebuild clean final meshes.

## 14. Crown Chaos Quality Bar

Everything must feel:

- Cinematic.
- Readable.
- Dangerous.
- Premium.
- Built to scale.
- Optimized enough for Roblox.

Everything must avoid:

- Random clutter.
- Flat geometry.
- Neon spam.
- Simulator UI.
- Unvalidated client authority.
- Unorganized scripts.
- Details before blockout.

If a design does not improve gameplay readability, emotion, or identity, cut it.

## 15. Central Module Loader Standard

As the game grows, do not scatter independent scripts across parts, buttons, hazards, and workspace folders.

The production goal is:

- One server bootstrap.
- One client bootstrap.
- Feature systems written as ModuleScripts.
- Deterministic load order.
- Explicit lifecycle functions.
- Cleanup for every temporary connection, instance, tween, and effect.

Why this matters:

- Roblox starts ordinary `Script` and `LocalScript` instances asynchronously.
- Random script startup order creates race conditions.
- Hundreds of duplicated scripts create unnecessary runtime overhead.
- ModuleScripts remain dormant until required.
- Required modules cache their returned table, making them a single source of truth.
- Plain-text module trees are much easier to maintain in source control and external editors.

Lifecycle pipeline:

1. Require shared utility modules and packages.
2. Require shared services.
3. Require server-only or client-only services.
4. Call `Init()` for non-yielding setup.
5. Call `Start()` for runtime loops, events, UI, cameras, and gameplay connections.

Loader rule:

```lua
-- Services must return tables.
-- Services may expose Init and Start.
return {
    Init = function() end,
    Start = function() end,
}
```

Do not put heavy runtime logic in the module body. Requiring a module should not secretly start the whole game.

Recommended project tree:

```text
src
  Client
    init.client.lua
    Services
      MenuParallax.lua
      UIService.lua
      LoadingScreenService.lua
  Server
    init.server.lua
    Services
      DataService.lua
      CrownService.lua
      CombatService.lua
  Shared
    Assets
      Models
      Meshes
      Sounds
    Classes
      Spike.lua
      Relic.lua
    GlobalLoaderSystem
      MainLoader.lua
    Modules
      Core
      Math
      Game
      Platform
    Packages
      Signal.lua
      Janitor.lua
      Sift.lua
    UI
      init.lua
      HUD
      Menus
```

Minimal loader pattern:

```lua
local MainLoader = {}

local RunService = game:GetService("RunService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerScriptService = game:GetService("ServerScriptService")
local Players = game:GetService("Players")

local function requireServices(folder, services)
	if not folder then
		return
	end

	for _, child in ipairs(folder:GetChildren()) do
		if child:IsA("ModuleScript") then
			local ok, module = pcall(require, child)
			if ok and type(module) == "table" then
				table.insert(services, module)
			else
				warn("[Loader] Failed to require", child:GetFullName(), module)
			end
		end
	end
end

function MainLoader.LoadAll()
	local shared = ReplicatedStorage:WaitForChild("Shared")
	local services = {}

	requireServices(shared:WaitForChild("Services"), services)

	if RunService:IsServer() then
		requireServices(ServerScriptService:WaitForChild("Server"):WaitForChild("Services"), services)
	else
		local playerScripts = Players.LocalPlayer:WaitForChild("PlayerScripts")
		requireServices(playerScripts:WaitForChild("Client"):WaitForChild("Services"), services)
	end

	for _, service in ipairs(services) do
		if type(service.Init) == "function" then
			service:Init()
		end
	end

	for _, service in ipairs(services) do
		if type(service.Start) == "function" then
			task.spawn(function()
				service:Start()
			end)
		end
	end
end

return MainLoader
```

Server bootstrap:

```lua
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local MainLoader = require(ReplicatedStorage.Shared.GlobalLoaderSystem.MainLoader)

print("[Server] Booting Crown Chaos server systems")
MainLoader.LoadAll()
```

Client bootstrap:

```lua
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local MainLoader = require(ReplicatedStorage.Shared.GlobalLoaderSystem.MainLoader)

print("[Client] Booting Crown Chaos client systems")
MainLoader.LoadAll()
```

## 16. 3D Main Menu Standard

The main menu should feel like the player is standing in the lobby, not looking at a flat website.

Required composition:

- The lobby/castle sits behind everything.
- The player/avatar stands centered in front.
- UI panels are arranged around the character.
- `Battle Pass` sits upper-left.
- `Shop` sits lower-left.
- `Game Modes` sits right. Do not label this card `Index`.
- `Enter Arena` sits bottom-center.
- The crown, palace, beam, torches, banners, and purple corruption establish identity.

Menu transition rule:

- The menu should preload behind the loading screen.
- When loading finishes, the menu must already be ready.
- Avoid a dead black pause between loading and menu.

3D menu interaction pattern:

```lua
camera.CameraType = Enum.CameraType.Scriptable

RunService.RenderStepped:Connect(function()
	local mouse = UserInputService:GetMouseLocation()
	local center = camera.ViewportSize / 2
	local offset = Vector2.new(mouse.X - center.X, mouse.Y - center.Y)
	local clamped = Vector2.new(
		math.clamp(offset.X / center.X, -1, 1),
		math.clamp(offset.Y / center.Y, -1, 1)
	)

	-- Camera moves slightly.
	-- Menu panels move slightly less.
	-- This creates controlled parallax.
end)
```

SurfaceGui rule:

- Use `SurfaceGui` on physical 3D panels only when true 3D placement matters.
- Use normal `ScreenGui` cards when readability is more important than depth.
- For Crown Chaos, use a hybrid: 3D lobby and character behind, readable premium cards in screen space on top.

Audio standard:

- Put `Music` and `SFX` SoundGroups under `SoundService`.
- Route UI clicks through `SFX`.
- Route lobby ambience through `Music` or an `Ambience` group.
- Use volume as: final output = `Sound.Volume * SoundGroup.Volume`.

Asset optimization reminders:

- Keep custom audio under platform upload limits.
- Keep mesh pieces under triangle limits.
- Split meshes by color/material group.
- Use low-poly cylinders with 10-16 sides for repeated pieces.
- Use mirror modifiers and mesh separation in Blender to keep character/armor assets efficient.
