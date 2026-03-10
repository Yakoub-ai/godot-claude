import { z } from "zod";
import type { CategoryDef, ToolResult } from "../registry.js";
import type { GodotConnection } from "../connection.js";

export const renderingCategory: CategoryDef = {
  name: "rendering",
  description: "3D meshes, lights, materials, cameras, environment, shaders",
  tools: [
    // ── Scene 3D tools (6) ──────────────────────────────────────────────

    {
      name: "add_mesh_instance",
      description:
        "Add a MeshInstance3D node with a primitive mesh (Box, Sphere, Cylinder, etc.) or load a 3D model file.",
      schema: {
        mesh_type: z
          .string()
          .optional()
          .describe(
            "Primitive mesh type: BoxMesh, SphereMesh, CylinderMesh, CapsuleMesh, PlaneMesh, PrismMesh, TorusMesh, QuadMesh, TubeMesh"
          ),
        mesh_file: z
          .string()
          .optional()
          .describe(
            "Path to a 3D model file to load (res:// path, e.g. res://models/tree.glb)"
          ),
        parent_path: z
          .string()
          .optional()
          .describe("Path to the parent node (default: scene root)"),
        name: z
          .string()
          .optional()
          .describe("Name for the MeshInstance3D node"),
        position: z
          .any()
          .optional()
          .describe(
            "Position as {x, y, z} object or [x, y, z] array"
          ),
        rotation: z
          .any()
          .optional()
          .describe(
            "Rotation in degrees as {x, y, z} object or [x, y, z] array"
          ),
        scale: z
          .any()
          .optional()
          .describe("Scale as {x, y, z} object or [x, y, z] array"),
        mesh_properties: z
          .record(z.string(), z.any())
          .optional()
          .describe(
            "Additional mesh properties to set (e.g. {size: {x:2,y:2,z:2}, radial_segments: 16})"
          ),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("add_mesh_instance", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "setup_lighting",
      description:
        "Add a light node (DirectionalLight3D, OmniLight3D, SpotLight3D). Supports presets: sun, indoor, dramatic.",
      schema: {
        light_type: z
          .string()
          .optional()
          .describe(
            "Light type: DirectionalLight3D, OmniLight3D, SpotLight3D (default: DirectionalLight3D)"
          ),
        preset: z
          .string()
          .optional()
          .describe(
            "Lighting preset: sun, indoor, dramatic (overrides individual settings)"
          ),
        parent_path: z
          .string()
          .optional()
          .describe("Path to the parent node (default: scene root)"),
        name: z.string().optional().describe("Name for the light node"),
        color: z
          .any()
          .optional()
          .describe(
            "Light color as hex string (#RRGGBB), Color name, or {r, g, b, a} object"
          ),
        energy: z
          .number()
          .optional()
          .describe("Light energy/intensity (default: 1.0)"),
        shadows: z
          .boolean()
          .optional()
          .describe("Enable shadow casting (default: false)"),
        range: z
          .number()
          .optional()
          .describe("Light range for OmniLight3D and SpotLight3D"),
        attenuation: z
          .number()
          .optional()
          .describe("Light attenuation curve for OmniLight3D and SpotLight3D"),
        spot_angle: z
          .number()
          .optional()
          .describe("Spot cone angle in degrees for SpotLight3D"),
        spot_angle_attenuation: z
          .number()
          .optional()
          .describe("Spot angle attenuation curve for SpotLight3D"),
        position: z
          .any()
          .optional()
          .describe("Position as {x, y, z} object or [x, y, z] array"),
        rotation: z
          .any()
          .optional()
          .describe(
            "Rotation in degrees as {x, y, z} object or [x, y, z] array"
          ),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("setup_lighting", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "set_material_3d",
      description:
        "Create and apply a StandardMaterial3D to a MeshInstance3D.",
      schema: {
        node_path: z
          .string()
          .describe("Path to the MeshInstance3D node"),
        surface_index: z
          .number()
          .optional()
          .describe("Surface index to apply the material to (default: 0)"),
        albedo_color: z
          .any()
          .optional()
          .describe(
            "Albedo color as hex string (#RRGGBB) or {r, g, b, a} object"
          ),
        albedo_texture: z
          .string()
          .optional()
          .describe("Path to albedo texture file (res:// path)"),
        metallic: z
          .number()
          .optional()
          .describe("Metallic value 0.0 to 1.0"),
        roughness: z
          .number()
          .optional()
          .describe("Roughness value 0.0 to 1.0"),
        metallic_texture: z
          .string()
          .optional()
          .describe("Path to metallic texture file (res:// path)"),
        roughness_texture: z
          .string()
          .optional()
          .describe("Path to roughness texture file (res:// path)"),
        normal_texture: z
          .string()
          .optional()
          .describe("Path to normal map texture file (res:// path)"),
        emission: z
          .any()
          .optional()
          .describe("Enable emission (boolean or emission color)"),
        emission_color: z
          .any()
          .optional()
          .describe(
            "Emission color as hex string (#RRGGBB) or {r, g, b, a} object"
          ),
        emission_energy: z
          .number()
          .optional()
          .describe("Emission energy multiplier"),
        emission_texture: z
          .string()
          .optional()
          .describe("Path to emission texture file (res:// path)"),
        transparency: z
          .string()
          .optional()
          .describe(
            "Transparency mode: disabled, alpha, alpha_scissor, alpha_hash, depth_pre_pass"
          ),
        cull_mode: z
          .string()
          .optional()
          .describe("Cull mode: back, front, disabled"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("set_material_3d", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "setup_environment",
      description:
        "Add or configure a WorldEnvironment node with sky, ambient light, tonemap, fog, glow, SSAO, SSR, SDFGI.",
      schema: {
        parent_path: z
          .string()
          .optional()
          .describe(
            "Path to parent node when creating a new WorldEnvironment (default: scene root)"
          ),
        node_path: z
          .string()
          .optional()
          .describe(
            "Path to an existing WorldEnvironment node to configure"
          ),
        name: z
          .string()
          .optional()
          .describe("Name for the WorldEnvironment node"),
        background_mode: z
          .string()
          .optional()
          .describe(
            "Background mode: clear_color, custom_color, sky, canvas, keep, camera_feed"
          ),
        background_color: z
          .any()
          .optional()
          .describe(
            "Background color as hex string (#RRGGBB) or {r, g, b, a} object"
          ),
        sky: z
          .object({
            sky_top_color: z
              .any()
              .optional()
              .describe("Sky top color"),
            sky_horizon_color: z
              .any()
              .optional()
              .describe("Sky horizon color"),
            ground_bottom_color: z
              .any()
              .optional()
              .describe("Ground bottom color"),
            ground_horizon_color: z
              .any()
              .optional()
              .describe("Ground horizon color"),
            sun_angle_max: z
              .number()
              .optional()
              .describe("Maximum sun angle in degrees"),
            sky_curve: z
              .number()
              .optional()
              .describe("Sky color curve value"),
          })
          .optional()
          .describe("ProceduralSkyMaterial settings"),
        ambient_light_color: z
          .any()
          .optional()
          .describe(
            "Ambient light color as hex string (#RRGGBB) or {r, g, b, a} object"
          ),
        ambient_light_energy: z
          .number()
          .optional()
          .describe("Ambient light energy multiplier"),
        ambient_light_source: z
          .string()
          .optional()
          .describe(
            "Ambient light source: background, disabled, color"
          ),
        tonemap_mode: z
          .string()
          .optional()
          .describe(
            "Tonemap mode: linear, reinhardt, filmic, aces"
          ),
        tonemap_exposure: z
          .number()
          .optional()
          .describe("Tonemap exposure value"),
        tonemap_white: z
          .number()
          .optional()
          .describe("Tonemap white point value"),
        fog_enabled: z
          .boolean()
          .optional()
          .describe("Enable volumetric fog"),
        fog_light_color: z
          .any()
          .optional()
          .describe("Fog light color"),
        fog_density: z
          .number()
          .optional()
          .describe("Fog density value"),
        fog_light_energy: z
          .number()
          .optional()
          .describe("Fog light energy multiplier"),
        glow_enabled: z
          .boolean()
          .optional()
          .describe("Enable glow/bloom effect"),
        glow_intensity: z
          .number()
          .optional()
          .describe("Glow intensity value"),
        glow_strength: z
          .number()
          .optional()
          .describe("Glow strength value"),
        glow_bloom: z
          .number()
          .optional()
          .describe("Glow bloom threshold value"),
        ssao_enabled: z
          .boolean()
          .optional()
          .describe("Enable Screen-Space Ambient Occlusion"),
        ssao_radius: z
          .number()
          .optional()
          .describe("SSAO radius in world units"),
        ssao_intensity: z
          .number()
          .optional()
          .describe("SSAO intensity value"),
        ssr_enabled: z
          .boolean()
          .optional()
          .describe("Enable Screen-Space Reflections"),
        ssr_max_steps: z
          .number()
          .optional()
          .describe("SSR maximum ray-march steps"),
        ssr_fade_in: z
          .number()
          .optional()
          .describe("SSR fade-in distance"),
        ssr_fade_out: z
          .number()
          .optional()
          .describe("SSR fade-out distance"),
        sdfgi_enabled: z
          .boolean()
          .optional()
          .describe("Enable Signed Distance Field Global Illumination"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("setup_environment", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "setup_camera_3d",
      description: "Add or configure a Camera3D node.",
      schema: {
        parent_path: z
          .string()
          .optional()
          .describe(
            "Path to parent node when creating a new Camera3D (default: scene root)"
          ),
        node_path: z
          .string()
          .optional()
          .describe("Path to an existing Camera3D node to configure"),
        name: z
          .string()
          .optional()
          .describe("Name for the Camera3D node"),
        projection: z
          .string()
          .optional()
          .describe("Projection type: perspective, orthogonal, frustum"),
        fov: z
          .number()
          .optional()
          .describe(
            "Field of view in degrees for perspective projection (default: 75)"
          ),
        size: z
          .number()
          .optional()
          .describe("Size for orthogonal projection"),
        near: z
          .number()
          .optional()
          .describe("Near clipping plane distance (default: 0.05)"),
        far: z
          .number()
          .optional()
          .describe("Far clipping plane distance (default: 4000)"),
        cull_mask: z
          .number()
          .optional()
          .describe("Cull mask as a bitmask integer"),
        current: z
          .boolean()
          .optional()
          .describe("Set as the current active camera"),
        position: z
          .any()
          .optional()
          .describe("Position as {x, y, z} object or [x, y, z] array"),
        rotation: z
          .any()
          .optional()
          .describe(
            "Rotation in degrees as {x, y, z} object or [x, y, z] array"
          ),
        look_at: z
          .any()
          .optional()
          .describe(
            "Target point to look at as {x, y, z} object or [x, y, z] array"
          ),
        environment_path: z
          .string()
          .optional()
          .describe(
            "Path to an Environment resource to assign to this camera"
          ),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("setup_camera_3d", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "add_gridmap",
      description:
        "Add or configure a GridMap node with a MeshLibrary.",
      schema: {
        parent_path: z
          .string()
          .optional()
          .describe(
            "Path to parent node when creating a new GridMap (default: scene root)"
          ),
        node_path: z
          .string()
          .optional()
          .describe("Path to an existing GridMap node to configure"),
        name: z
          .string()
          .optional()
          .describe("Name for the GridMap node"),
        mesh_library_path: z
          .string()
          .optional()
          .describe(
            "Path to MeshLibrary resource (res:// path)"
          ),
        cell_size: z
          .any()
          .optional()
          .describe(
            "Cell size as {x, y, z} object or [x, y, z] array"
          ),
        position: z
          .any()
          .optional()
          .describe("Position as {x, y, z} object or [x, y, z] array"),
        cells: z
          .array(
            z.object({
              x: z.number().describe("Cell X coordinate"),
              y: z.number().describe("Cell Y coordinate"),
              z: z.number().describe("Cell Z coordinate"),
              item: z
                .number()
                .optional()
                .describe("MeshLibrary item index"),
              orientation: z
                .number()
                .optional()
                .describe("Cell orientation index"),
            })
          )
          .optional()
          .describe("Array of cells to place in the GridMap"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("add_gridmap", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },

    // ── Shader tools (6) ────────────────────────────────────────────────

    {
      name: "create_shader",
      description:
        "Create a new shader file with a template or custom content.",
      schema: {
        path: z
          .string()
          .describe(
            "Path for the shader file (res:// path, e.g. res://shaders/dissolve.gdshader)"
          ),
        shader_type: z
          .string()
          .optional()
          .describe(
            "Shader type template: spatial, canvas_item, particles, sky, fog (default: spatial)"
          ),
        content: z
          .string()
          .optional()
          .describe(
            "Full shader source code (overrides shader_type template)"
          ),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("create_shader", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "read_shader",
      description: "Read the content of a shader file.",
      schema: {
        path: z
          .string()
          .describe(
            "Path to the shader file (res:// path, e.g. res://shaders/dissolve.gdshader)"
          ),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("read_shader", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "edit_shader",
      description:
        "Edit a shader file using full replacement or search-and-replace.",
      schema: {
        path: z
          .string()
          .describe(
            "Path to the shader file (res:// path, e.g. res://shaders/dissolve.gdshader)"
          ),
        content: z
          .string()
          .optional()
          .describe(
            "Full replacement content for the shader file"
          ),
        replacements: z
          .array(
            z.object({
              search: z
                .string()
                .describe("Text to search for in the shader"),
              replace: z
                .string()
                .describe("Text to replace the search match with"),
            })
          )
          .optional()
          .describe(
            "Array of search-and-replace operations to apply"
          ),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("edit_shader", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "assign_shader_material",
      description:
        "Create a ShaderMaterial from a shader file and assign it to a node.",
      schema: {
        node_path: z
          .string()
          .describe(
            "Path to the node to assign the ShaderMaterial to"
          ),
        shader_path: z
          .string()
          .describe(
            "Path to the shader file (res:// path, e.g. res://shaders/dissolve.gdshader)"
          ),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand(
          "assign_shader_material",
          params
        );
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "set_shader_param",
      description:
        "Set a shader parameter on a node's ShaderMaterial.",
      schema: {
        node_path: z
          .string()
          .describe(
            "Path to the node with a ShaderMaterial"
          ),
        param: z
          .string()
          .describe(
            "Shader parameter name (as declared with 'uniform' in the shader)"
          ),
        value: z
          .union([z.string(), z.number(), z.boolean()])
          .describe(
            "Value to set for the shader parameter"
          ),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("set_shader_param", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "get_shader_params",
      description:
        "Get all shader parameters and their current values from a node's ShaderMaterial.",
      schema: {
        node_path: z
          .string()
          .describe(
            "Path to the node with a ShaderMaterial"
          ),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("get_shader_params", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
  ],
};
