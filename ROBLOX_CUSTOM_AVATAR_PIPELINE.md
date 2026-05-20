# Roblox Custom Avatar Pipeline

This is the Crown Chaos standard for custom characters from Blender to Roblox Studio.

## Target

Build characters that are:
- Roblox-scale accurate
- R6 rig-friendly
- cleanly separated by body part
- easy to texture
- easy to animate
- ready to become `StarterCharacter`

## Reference Rig Setup

In Roblox Studio:
1. Open a blank Baseplate.
2. Go to `Avatar`.
3. Open `Rig Builder`.
4. Select `R6`, `Masculine`, `Block Avatar`.
5. Set the rig position to `0, 0, 0`.
6. Right-click the rig model.
7. Export Selection as `.obj`.

That exported R6 OBJ is the scale framework for Blender.

## Blender Modeling Rules

Use the Roblox R6 OBJ as the reference.

Core body object names must be exactly:
- `Head`
- `Torso`
- `Left Arm`
- `Right Arm`
- `Left Leg`
- `Right Leg`

Accessories should be separate objects:
- `Accessory_Crown`
- `Accessory_Helmet`
- `Accessory_Cape`
- `Accessory_Shoulder_L`
- `Accessory_Shoulder_R`
- `Accessory_ChestGem`
- `Accessory_Corruption_*`

Keep these separate so Roblox can assign materials quickly and so rigging does not become a mess.

## Geometry Workflow

Use this order:
1. Import R6 reference OBJ.
2. Block out body shape with cubes/cylinders.
3. Build armor over the body parts.
4. Use Mirror modifier for clean symmetry.
5. Break symmetry only for corruption, scars, accessories, and special skin identity.
6. Bevel hard edges.
7. Shade smooth or weighted-normal only where it improves the model.
8. Separate material groups by selection.
9. Export selected final objects only.

## Export Settings

Preferred:
- OBJ for RigEdit / Studio body-part setup
- FBX for backup and asset archive

OBJ settings:
- Selection Only: on
- Forward Axis: Z Forward
- Up Axis: Y Up
- Object Groups: on

FBX settings:
- Selected Objects: on
- Apply modifiers: on
- Embed textures: off

## Roblox Studio Import

After import:
1. Confirm `Head`, `Torso`, `Left Arm`, `Right Arm`, `Left Leg`, `Right Leg` imported separately.
2. Duplicate `Torso`.
3. Rename duplicate to `HumanoidRootPart`.
4. Set `HumanoidRootPart.Transparency = 1`.
5. Insert `Humanoid` into the model.
6. Rename model to `StarterCharacter`.

## Motor6D Setup

Use RigEdit Light or equivalent.

Selection order matters:
1. `HumanoidRootPart` to `Torso`
2. `Torso` to `Right Leg`
3. `Torso` to `Right Arm`
4. `Torso` to `Left Leg`
5. `Torso` to `Left Arm`
6. `Torso` to `Head`

Accessory welding:
- Crown to Head
- Helmet to Head
- Cape to Torso
- Shoulder armor to matching arm or torso
- Chest gem to Torso

## Animation

After rigging:
1. Open Animation Editor.
2. Select `StarterCharacter`.
3. Create idle and walk animations first.
4. Publish animation IDs.
5. Use a `StarterCharacterScripts` LocalScript to override default R6 animations.

## First Character Standard

The first character, `Crownbound Challenger`, should prove the pipeline:
- six R6 body objects named correctly
- accessories separate
- black/gold/purple material groups
- crown readable from far away
- one corrupted arm
- one chest gem
- short cape/scarf

Do not move to meme skins or battle pass variants until this first character imports, rigs, and animates cleanly.
