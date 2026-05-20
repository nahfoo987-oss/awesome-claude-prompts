import math
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parent
BLEND_OUT = ROOT / "crownbound_challenger_v6_face_refine.blend"
FBX_OUT = ROOT / "crownbound_challenger_v6_face_refine.fbx"
OBJ_OUT = ROOT / "crownbound_challenger_v6_face_refine.obj"
PNG_OUT = ROOT / "crownbound_challenger_v6_face_refine_preview.png"
FACE_PNG_OUT = ROOT / "crownbound_challenger_v6_face_closeup.png"


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def material(name, color, metallic=0.0, roughness=0.45, emission=None, strength=0.0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = color
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        if "Base Color" in bsdf.inputs:
            bsdf.inputs["Base Color"].default_value = color
        if "Metallic" in bsdf.inputs:
            bsdf.inputs["Metallic"].default_value = metallic
        if "Roughness" in bsdf.inputs:
            bsdf.inputs["Roughness"].default_value = roughness
        if emission:
            if "Emission Color" in bsdf.inputs:
                bsdf.inputs["Emission Color"].default_value = emission
            if "Emission Strength" in bsdf.inputs:
                bsdf.inputs["Emission Strength"].default_value = strength
    return mat


MAT_ARMOR = material("CC_Black_Satin_Armor", (0.015, 0.015, 0.022, 1), metallic=0.7, roughness=0.36)
MAT_ARMOR_DARK = material("CC_Void_Black_Corrupted_Armor", (0.006, 0.005, 0.009, 1), metallic=0.8, roughness=0.42)
MAT_GOLD = material("CC_Royal_Gold_Trim", (0.78, 0.58, 0.24, 1), metallic=1.0, roughness=0.28)
MAT_PURPLE = material("CC_Corruption_Emission", (0.42, 0.05, 1.0, 1), roughness=0.2, emission=(0.55, 0.12, 1.0, 1), strength=3.5)
MAT_MAGENTA = material("CC_Magenta_Core_Emission", (0.9, 0.18, 1.0, 1), roughness=0.2, emission=(0.95, 0.20, 1.0, 1), strength=5.0)
MAT_CLOTH = material("CC_Royal_Purple_Cloth", (0.095, 0.035, 0.17, 1), roughness=0.72)
MAT_SKIN = material("CC_Warm_Roblox_Skin", (0.82, 0.58, 0.35, 1), roughness=0.55)
MAT_HAIR = material("CC_Shadow_Hair", (0.015, 0.010, 0.012, 1), roughness=0.60)
MAT_FACE_SHADOW = material("CC_Face_Soft_Shadow", (0.34, 0.20, 0.12, 1), roughness=0.68)
MAT_FACE_LINE = material("CC_Face_Expression_Line", (0.045, 0.022, 0.018, 1), roughness=0.65)


def add_cube(name, loc, scale, mat, bevel=0.02):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if mat:
        obj.data.materials.append(mat)
    if bevel > 0:
        mod = obj.modifiers.new("small_bevel", "BEVEL")
        mod.width = bevel
        mod.segments = 1
        mod.affect = "EDGES"
        obj.modifiers.new("weighted_normals", "WEIGHTED_NORMAL")
    return obj


def add_cylinder(name, loc, radius, depth, mat, vertices=18, bevel=0.0, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    if mat:
        obj.data.materials.append(mat)
    if bevel > 0:
        mod = obj.modifiers.new("rim_bevel", "BEVEL")
        mod.width = bevel
        mod.segments = 1
        obj.modifiers.new("weighted_normals", "WEIGHTED_NORMAL")
    return obj


def add_cone(name, loc, radius1, radius2, depth, mat, vertices=5, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=radius1, radius2=radius2, depth=depth, location=loc, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    if mat:
        obj.data.materials.append(mat)
    obj.modifiers.new("weighted_normals", "WEIGHTED_NORMAL")
    return obj


def add_bar_between(name, start, end, thickness, mat):
    start = Vector(start)
    end = Vector(end)
    mid = (start + end) * 0.5
    direction = end - start
    length = direction.length
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=thickness, depth=length, location=mid)
    obj = bpy.context.object
    obj.name = name
    obj.rotation_euler = direction.to_track_quat("Z", "Y").to_euler()
    if mat:
        obj.data.materials.append(mat)
    return obj


def build_character():
    reset_scene()

    # Roblox-ish block body proportions, with strong readable armor silhouette.
    add_cube("Torso", (0, 0, 2.4), (1.45, 0.62, 1.75), MAT_ARMOR, 0.06)
    add_cube("Accessory_ChestFrame_Top", (0, -0.34, 2.98), (1.18, 0.08, 0.10), MAT_GOLD, 0.01)
    add_cube("Accessory_ChestFrame_Bottom", (0, -0.34, 2.06), (1.18, 0.08, 0.10), MAT_GOLD, 0.01)
    add_cube("Accessory_ChestFrame_Left", (-0.63, -0.34, 2.52), (0.10, 0.08, 0.94), MAT_GOLD, 0.01)
    add_cube("Accessory_ChestFrame_Right", (0.63, -0.34, 2.52), (0.10, 0.08, 0.94), MAT_GOLD, 0.01)
    add_cone("Accessory_ChestGem", (0, -0.39, 2.55), 0.115, 0.115, 0.08, MAT_MAGENTA, vertices=4, rotation=(math.radians(90), 0, math.radians(45)))

    # Head, hair, and shadowed crown line.
    add_cylinder("Head", (0, 0, 3.62), 0.43, 0.56, MAT_SKIN, vertices=18, bevel=0.025, rotation=(math.radians(90), 0, 0))
    add_cube("Accessory_Hair_ShadowCap", (0, -0.02, 3.95), (0.98, 0.64, 0.22), MAT_HAIR, 0.05)
    add_cube("Accessory_Hair_FrontFringe", (0, -0.36, 3.79), (0.86, 0.13, 0.23), MAT_HAIR, 0.035)
    add_cube("Accessory_Hair_LeftChunk", (-0.37, -0.34, 3.64), (0.18, 0.14, 0.34), MAT_HAIR, 0.03)
    add_cube("Accessory_Hair_RightChunk", (0.37, -0.34, 3.64), (0.18, 0.14, 0.30), MAT_HAIR, 0.03)
    add_cube("Accessory_Hair_TopLock_A", (-0.24, -0.08, 4.08), (0.24, 0.34, 0.14), MAT_HAIR, 0.035)
    add_cube("Accessory_Hair_TopLock_B", (0.12, -0.11, 4.10), (0.28, 0.30, 0.13), MAT_HAIR, 0.035)

    # Face pass: simple enough for Roblox, but expressive enough to be wearable.
    add_cube("Accessory_Brow_L", (-0.18, -0.482, 3.705), (0.20, 0.030, 0.038), MAT_HAIR, 0.006)
    add_cube("Accessory_Brow_R", (0.18, -0.482, 3.705), (0.20, 0.030, 0.038), MAT_HAIR, 0.006)
    add_cube("Accessory_EyeSocket_L", (-0.17, -0.501, 3.635), (0.18, 0.012, 0.080), MAT_FACE_LINE, 0.004)
    add_cube("Accessory_EyeSocket_R", (0.17, -0.501, 3.635), (0.18, 0.012, 0.080), MAT_FACE_LINE, 0.004)
    add_cube("Accessory_EyeGlow_L", (-0.17, -0.505, 3.63), (0.12, 0.030, 0.050), MAT_PURPLE, 0.008)
    add_cube("Accessory_EyeGlow_R", (0.17, -0.505, 3.63), (0.12, 0.030, 0.050), MAT_PURPLE, 0.008)
    add_cube("Accessory_NoseShadow", (0.015, -0.508, 3.525), (0.045, 0.018, 0.115), MAT_FACE_SHADOW, 0.006)
    add_bar_between("Accessory_Mouth_Smirk", (-0.13, -0.513, 3.398), (0.15, -0.513, 3.405), 0.007, MAT_FACE_LINE)
    add_cube("Accessory_CheekShadow_L", (-0.25, -0.510, 3.49), (0.09, 0.014, 0.035), MAT_FACE_SHADOW, 0.004)
    add_cube("Accessory_CheekShadow_R", (0.25, -0.510, 3.49), (0.09, 0.014, 0.035), MAT_FACE_SHADOW, 0.004)
    add_bar_between("Accessory_Corruption_FaceScar_Main", (0.36, -0.518, 3.78), (0.27, -0.518, 3.48), 0.006, MAT_PURPLE)
    add_bar_between("Accessory_Corruption_FaceScar_Branch", (0.31, -0.520, 3.61), (0.42, -0.520, 3.54), 0.005, MAT_MAGENTA)
    add_bar_between("Accessory_Corruption_FaceScar_Tiny", (0.34, -0.521, 3.70), (0.42, -0.521, 3.73), 0.004, MAT_PURPLE)

    # Crown accessory, deliberately clean and iconic.
    add_cylinder("Accessory_Crown_Circlet", (0, 0, 4.10), 0.55, 0.09, MAT_GOLD, vertices=24, bevel=0.01)
    for i, x in enumerate([-0.42, -0.21, 0, 0.21, 0.42], start=1):
        h = 0.42 if x == 0 else 0.31
        add_cone(f"Accessory_Crown_Spike_{i}", (x, -0.02, 4.31 + h * 0.22), 0.078, 0.012, h, MAT_GOLD, vertices=4)
    add_cone("Accessory_Crown_FrontGem", (0, -0.55, 4.14), 0.050, 0.050, 0.045, MAT_PURPLE, vertices=4, rotation=(math.radians(90), 0, math.radians(45)))

    # Shoulders and arms: right side is the corrupted read.
    add_cube("Accessory_Shoulder_L", (-1.03, 0, 3.05), (0.58, 0.76, 0.36), MAT_ARMOR, 0.05)
    add_cube("Accessory_ShoulderGold_L", (-1.03, -0.42, 3.20), (0.62, 0.08, 0.10), MAT_GOLD, 0.01)
    add_cube("Accessory_Shoulder_R_Corrupted", (1.03, 0, 3.05), (0.64, 0.78, 0.40), MAT_ARMOR_DARK, 0.05)
    add_cube("Accessory_ShoulderGold_R", (1.03, -0.43, 3.22), (0.64, 0.08, 0.10), MAT_GOLD, 0.01)
    add_cube("Left Arm", (-1.10, 0, 2.13), (0.46, 0.46, 1.35), MAT_ARMOR, 0.05)
    add_cube("Right Arm", (1.10, 0, 2.13), (0.48, 0.48, 1.38), MAT_ARMOR_DARK, 0.05)
    add_cube("Accessory_WristGold_L", (-1.10, -0.01, 1.36), (0.52, 0.52, 0.16), MAT_GOLD, 0.015)
    add_cube("Accessory_WristGold_R", (1.10, -0.01, 1.35), (0.54, 0.54, 0.16), MAT_GOLD, 0.015)

    # Corruption lines are separate thin meshes so they can become emission VFX later.
    add_bar_between("Accessory_Corruption_RightArm_Vein_A", (1.34, -0.25, 2.75), (1.34, -0.25, 1.48), 0.018, MAT_PURPLE)
    add_bar_between("Accessory_Corruption_RightArm_Vein_B", (1.20, -0.28, 2.35), (1.42, -0.28, 2.02), 0.014, MAT_MAGENTA)
    add_bar_between("Accessory_Corruption_Chest_Crack_L", (-0.12, -0.425, 2.58), (-0.40, -0.425, 2.78), 0.007, MAT_PURPLE)
    add_bar_between("Accessory_Corruption_Chest_Crack_R", (0.12, -0.425, 2.51), (0.42, -0.425, 2.34), 0.007, MAT_PURPLE)
    add_bar_between("Accessory_RoyalSideScarf_Edge", (-0.68, -0.43, 3.02), (-0.38, -0.43, 2.02), 0.032, MAT_CLOTH)
    add_bar_between("Accessory_RoyalSideScarf_GoldPin", (-0.56, -0.47, 2.88), (-0.44, -0.47, 2.62), 0.018, MAT_GOLD)

    # Legs and waist cloth.
    add_cube("Left Leg", (-0.38, 0, 0.95), (0.50, 0.50, 1.48), MAT_ARMOR, 0.05)
    add_cube("Right Leg", (0.38, 0, 0.95), (0.50, 0.50, 1.48), MAT_ARMOR, 0.05)
    add_cube("Accessory_KneeGold_L", (-0.38, -0.28, 1.30), (0.46, 0.08, 0.18), MAT_GOLD, 0.01)
    add_cube("Accessory_KneeGold_R", (0.38, -0.28, 1.30), (0.46, 0.08, 0.18), MAT_GOLD, 0.01)
    add_cube("Accessory_Boot_L", (-0.38, -0.08, 0.15), (0.58, 0.68, 0.34), MAT_ARMOR_DARK, 0.04)
    add_cube("Accessory_Boot_R", (0.38, -0.08, 0.15), (0.58, 0.68, 0.34), MAT_ARMOR_DARK, 0.04)
    add_cube("Accessory_WaistGoldBelt", (0, -0.34, 1.63), (1.52, 0.10, 0.16), MAT_GOLD, 0.01)
    add_cube("Accessory_RoyalWaistCloth", (0, -0.42, 1.05), (0.45, 0.09, 0.86), MAT_CLOTH, 0.025)

    # Short cape behind the shoulders.
    cape = add_cube("Accessory_ShortRoyalCape", (0, 0.43, 2.10), (1.72, 0.12, 1.72), MAT_CLOTH, 0.035)
    cape.rotation_euler[0] = math.radians(-5)
    add_cube("Accessory_CapeGoldClasp_L", (-0.42, -0.36, 3.06), (0.20, 0.10, 0.18), MAT_GOLD, 0.01)
    add_cube("Accessory_CapeGoldClasp_R", (0.42, -0.36, 3.06), (0.20, 0.10, 0.18), MAT_GOLD, 0.01)

    # Simple ground plate for preview only.
    add_cylinder("Preview_Base_Disc", (0, 0, -0.04), 1.75, 0.08, material("CC_Preview_Dark_Base", (0.035, 0.034, 0.045, 1), roughness=0.8), vertices=48)


def setup_render():
    bpy.context.scene.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in [item.identifier for item in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items] else "BLENDER_EEVEE"
    bpy.context.scene.eevee.taa_render_samples = 64
    bpy.context.scene.view_settings.view_transform = "Filmic"
    bpy.context.scene.view_settings.look = "Medium High Contrast"
    bpy.context.scene.world.color = (0.015, 0.016, 0.024)

    bpy.ops.object.light_add(type="AREA", location=(0, -5, 6))
    key = bpy.context.object
    key.name = "Key_Moon_Area"
    key.data.energy = 480
    key.data.size = 5

    bpy.ops.object.light_add(type="POINT", location=(1.5, -1.8, 3.1))
    gem = bpy.context.object
    gem.name = "Purple_Gem_Rim_Light"
    gem.data.color = (0.55, 0.15, 1.0)
    gem.data.energy = 80
    gem.data.shadow_soft_size = 5

    bpy.ops.object.camera_add(location=(4.4, -6.7, 3.5), rotation=(math.radians(62), 0, math.radians(36)))
    camera = bpy.context.object
    bpy.context.scene.camera = camera
    direction = Vector((0, 0, 2.35)) - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    camera.data.lens = 70
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = 5.0

    bpy.context.scene.render.resolution_x = 1400
    bpy.context.scene.render.resolution_y = 1800
    bpy.context.scene.render.film_transparent = False
    return camera


def main():
    build_character()
    camera = setup_render()
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_OUT))
    bpy.ops.export_scene.fbx(filepath=str(FBX_OUT), use_selection=False, apply_unit_scale=True, bake_space_transform=False)
    if hasattr(bpy.ops.wm, "obj_export"):
        bpy.ops.wm.obj_export(filepath=str(OBJ_OUT), export_selected_objects=False, forward_axis="Z", up_axis="Y", export_materials=True)
    elif hasattr(bpy.ops.export_scene, "obj"):
        bpy.ops.export_scene.obj(filepath=str(OBJ_OUT), use_selection=False, axis_forward="Z", axis_up="Y", use_materials=True)
    bpy.context.scene.render.filepath = str(PNG_OUT)
    bpy.ops.render.render(write_still=True)

    camera.location = (2.05, -4.10, 3.92)
    close_target = Vector((0, -0.05, 3.64))
    direction = close_target - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    camera.data.ortho_scale = 1.55
    bpy.context.scene.render.filepath = str(FACE_PNG_OUT)
    bpy.ops.render.render(write_still=True)

    print(f"Wrote {BLEND_OUT}")
    print(f"Wrote {FBX_OUT}")
    print(f"Wrote {OBJ_OUT}")
    print(f"Wrote {PNG_OUT}")
    print(f"Wrote {FACE_PNG_OUT}")


if __name__ == "__main__":
    main()
