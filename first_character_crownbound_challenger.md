# First Character: Crownbound Challenger

## Role

This is the first serious hero skin for Crown Chaos: the character players should see in the menu, trailers, thumbnails, and early gameplay tests.

The character should feel like a royal arena survivor, not a generic knight. He has already fought for the crown, lost pieces of himself to corruption, and still keeps walking toward the throne.

## Visual Identity

Name: Crownbound Challenger

Tone:
- royal
- battle-worn
- readable from far away
- clean silhouette
- premium but not overdesigned
- corruption controlled, not particle spam

Main silhouette:
- blocky Roblox proportions
- wide shoulders
- short torn royal cape or scarf
- crown-shaped shoulder armor
- dark torso with gold trim
- glowing purple chest gem
- asymmetric corrupted right arm
- clean crown/helmet line visible from distance

## Materials

Black armor:
- color: #111116
- material direction: satin black steel
- use subtle bevels so edges catch light

Gold trim:
- color: #C6A04E
- material direction: worn royal metal
- use on chest border, belt, shoulder edges, crown, wrist guards

Corruption:
- primary: #8D2EFF
- secondary: #D146FF
- use only in controlled cracks, gem, eyes, and right-arm veins

Cloth:
- deep royal purple: #2B143F
- use for scarf/cape and small waist cloth

## Armor Layout

Head:
- Roblox-friendly head shape
- black crown circlet floating slightly above hair/helmet
- 5 main crown spikes, center spike tallest
- small purple gem at front center
- optional shadowed face with simple glowing eyes for menu version

Torso:
- black armored tunic
- gold outline around chest plate
- central purple gem, diamond-shaped
- two thin corruption cracks spreading outward from gem
- no noisy texture spam

Shoulders:
- left shoulder clean gold-edged plate
- right shoulder corrupted plate with purple fracture lines
- shoulder shape should make the character recognizable even in thumbnail size

Arms:
- left arm mostly clean black armor
- right arm has purple corruption veins and darker metal
- wrist guards with gold edge strips

Legs:
- dark armored greaves
- gold knee trim
- one hanging purple waist cloth strip in front
- boots heavy but simple

Cape / scarf:
- short torn royal cape behind shoulders or side scarf over one shoulder
- should not cover the silhouette too much
- cloth movement should be subtle

## Animations

Idle:
- slow breathing
- slight cape movement
- right hand twitches with corruption pulse

Walk:
- controlled and heavy
- no silly bounce
- cape trails slightly

Victory:
- looks up at the crown
- chest gem pulses once
- raises sword or fist slowly

Defeat:
- drops to one knee
- crown flickers and dims
- corruption cracks fade

Crown holder state:
- crown floats slightly higher
- eyes glow faint purple
- chest gem becomes brighter
- right-arm veins pulse slowly

## Blender Build Plan

Start from a Roblox R6 block rig export as scale reference.

Modeling order:
1. Import/export reference rig from Roblox Studio.
2. Trace clean armor blocks over torso, arms, and legs with simple cubes.
3. Use Mirror modifier for symmetric base armor.
4. Break symmetry only on the corrupted right arm and right shoulder.
5. Add bevels to all armor edges.
6. Separate material groups by selection:
   - black armor
   - gold trim
   - purple cloth
   - corruption emissive
   - skin/face
7. Keep each exported MeshPart under Roblox-friendly triangle budgets.
8. Export as FBX with selected objects only and no embedded textures.

## Roblox Import Notes

Use separate mesh objects for material groups so Studio can tint and tune them quickly.

Suggested mesh parts:
- HeadAccessory_Crown
- TorsoArmor
- Shoulder_L
- Shoulder_R_Corrupted
- ArmArmor_L
- ArmArmor_R_Corrupted
- LegArmor_L
- LegArmor_R
- CapeShort
- ChestGem

Keep VFX separate from the mesh:
- chest gem PointLight
- right-arm corruption pulse
- faint crown spark

Do not bake the aura into the character model. The aura system should attach later based on king stage.

## First Pass Goal

The first pass should be a clean, readable 3D model with:
- strong silhouette
- black/gold/purple palette
- one iconic chest gem
- one corrupted arm
- one short cape/scarf
- a crown that reads instantly

This character becomes the visual benchmark before we make variants, founder rewards, meme skins, or battle pass skins.
