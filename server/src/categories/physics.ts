import { z } from "zod";
import type { CategoryDef, ToolResult } from "../registry.js";
import type { GodotConnection } from "../connection.js";

export const physicsCategory: CategoryDef = {
  name: "physics",
  description:
    "Collision shapes, physics layers, raycasts, body configuration",
  tools: [
    {
      name: "setup_collision",
      description:
        "Add a CollisionShape2D or CollisionShape3D to a physics body node. Supports rectangle, circle/sphere, capsule, segment, polygon, and world boundary shapes. Automatically creates the appropriate shape resource and collision node as a child.",
      schema: {
        node_path: z
          .string()
          .describe(
            "Path to the physics body node (CharacterBody2D, RigidBody2D, Area2D, etc.)",
          ),
        shape: z
          .string()
          .describe(
            "Shape type: 'rectangle', 'circle', 'capsule', 'segment', 'polygon', 'world_boundary' (2D) or 'box', 'sphere', 'capsule', 'cylinder' (3D)",
          ),
        width: z
          .number()
          .optional()
          .describe("Width for rectangle/box shapes"),
        height: z
          .number()
          .optional()
          .describe("Height for rectangle/box/capsule shapes"),
        depth: z
          .number()
          .optional()
          .describe("Depth for 3D box shapes"),
        radius: z
          .number()
          .optional()
          .describe("Radius for circle/sphere/capsule/cylinder shapes"),
        ax: z
          .number()
          .optional()
          .describe("X coordinate of point A for segment shapes"),
        ay: z
          .number()
          .optional()
          .describe("Y coordinate of point A for segment shapes"),
        bx: z
          .number()
          .optional()
          .describe("X coordinate of point B for segment shapes"),
        by: z
          .number()
          .optional()
          .describe("Y coordinate of point B for segment shapes"),
        points: z
          .array(z.array(z.number()))
          .optional()
          .describe(
            "Array of [x, y] coordinate pairs for polygon shapes",
          ),
        disabled: z
          .boolean()
          .optional()
          .describe("Whether the collision shape starts disabled"),
        one_way_collision: z
          .boolean()
          .optional()
          .describe("Enable one-way collision (2D only)"),
        dimension: z
          .string()
          .optional()
          .describe("Force '2d' or '3d' dimension (auto-detected from parent if omitted)"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("setup_collision", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "set_physics_layers",
      description:
        "Set collision layer and mask on a physics body or area node. Layers define what layer(s) this object exists on. Masks define what layers this object scans/collides with. Pass a single number for a bitmask or an array of layer numbers (1-32).",
      schema: {
        node_path: z
          .string()
          .describe("Path to the physics body or area node"),
        collision_layer: z
          .union([z.number(), z.array(z.number())])
          .optional()
          .describe(
            "Collision layer as bitmask integer or array of layer numbers (1-32)",
          ),
        collision_mask: z
          .union([z.number(), z.array(z.number())])
          .optional()
          .describe(
            "Collision mask as bitmask integer or array of layer numbers (1-32)",
          ),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("set_physics_layers", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "get_physics_layers",
      description:
        "Get the current collision layer and mask values for a physics body or area node. Returns both the raw bitmask values and the individual active layer numbers for easy reading.",
      schema: {
        node_path: z
          .string()
          .describe("Path to the physics body or area node"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("get_physics_layers", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "add_raycast",
      description:
        "Add a RayCast2D or RayCast3D node as a child of the specified node. Raycasts detect collisions along a line from the node's origin to a target point. Useful for ground detection, line-of-sight checks, and projectile aiming.",
      schema: {
        node_path: z
          .string()
          .describe("Path to the parent node for the raycast"),
        name: z
          .string()
          .optional()
          .describe("Name for the raycast node (default: 'RayCast2D' or 'RayCast3D')"),
        target_x: z
          .number()
          .optional()
          .describe("X component of the raycast target position (default: 0)"),
        target_y: z
          .number()
          .optional()
          .describe("Y component of the raycast target position (default: 50 for 2D, -1 for 3D)"),
        target_z: z
          .number()
          .optional()
          .describe("Z component of the raycast target position (3D only, default: 0)"),
        collision_mask: z
          .number()
          .optional()
          .describe("Collision mask bitmask for the raycast"),
        enabled: z
          .boolean()
          .optional()
          .describe("Whether the raycast is enabled (default: true)"),
        collide_with_areas: z
          .boolean()
          .optional()
          .describe("Whether the raycast detects Area nodes (default: false)"),
        collide_with_bodies: z
          .boolean()
          .optional()
          .describe("Whether the raycast detects PhysicsBody nodes (default: true)"),
        hit_from_inside: z
          .boolean()
          .optional()
          .describe("Whether the raycast detects hits from inside shapes (default: false)"),
        dimension: z
          .string()
          .optional()
          .describe("Force '2d' or '3d' dimension (auto-detected from parent if omitted)"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("add_raycast", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "setup_physics_body",
      description:
        "Configure physics properties on a CharacterBody2D/3D or RigidBody2D/3D node. For CharacterBody: floor detection, slope handling, motion mode, slide settings. For RigidBody: mass, gravity, damping, freeze, continuous collision detection, contact monitoring.",
      schema: {
        node_path: z
          .string()
          .describe("Path to the physics body node"),
        floor_stop_on_slope: z
          .boolean()
          .optional()
          .describe("Stop on slopes when on floor (CharacterBody)"),
        floor_max_angle: z
          .number()
          .optional()
          .describe("Maximum floor angle in radians (CharacterBody, default: 0.785398 / 45 degrees)"),
        floor_snap_length: z
          .number()
          .optional()
          .describe("Floor snap distance for sticking to ground (CharacterBody)"),
        wall_min_slide_angle: z
          .number()
          .optional()
          .describe("Minimum angle for wall sliding in radians (CharacterBody)"),
        motion_mode: z
          .string()
          .optional()
          .describe("Motion mode: 'grounded' or 'floating' (CharacterBody)"),
        max_slides: z
          .number()
          .optional()
          .describe("Maximum slide iterations per frame (CharacterBody, default: 6)"),
        slide_on_ceiling: z
          .boolean()
          .optional()
          .describe("Allow sliding on ceiling (CharacterBody)"),
        mass: z
          .number()
          .optional()
          .describe("Body mass in kg (RigidBody, default: 1.0)"),
        gravity_scale: z
          .number()
          .optional()
          .describe("Gravity multiplier (RigidBody, default: 1.0)"),
        linear_damp: z
          .number()
          .optional()
          .describe("Linear velocity damping (RigidBody)"),
        angular_damp: z
          .number()
          .optional()
          .describe("Angular velocity damping (RigidBody)"),
        freeze: z
          .boolean()
          .optional()
          .describe("Freeze the body in place (RigidBody)"),
        freeze_mode: z
          .string()
          .optional()
          .describe("Freeze mode: 'static' or 'kinematic' (RigidBody)"),
        continuous_cd: z
          .union([z.string(), z.boolean()])
          .optional()
          .describe("Continuous collision detection mode (RigidBody). Boolean for 2D, string for 3D: 'disabled', 'cast_ray', 'cast_shape'"),
        contact_monitor: z
          .boolean()
          .optional()
          .describe("Enable contact monitoring for body_entered/exited signals (RigidBody)"),
        max_contacts_reported: z
          .number()
          .optional()
          .describe("Maximum number of contacts to report (RigidBody, requires contact_monitor)"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("setup_physics_body", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "get_collision_info",
      description:
        "Get detailed collision information for a node, including its collision shapes, layers, masks, and shape dimensions. Optionally include collision info for all children. Useful for debugging collision setups.",
      schema: {
        node_path: z
          .string()
          .describe("Path to the node to inspect"),
        include_children: z
          .boolean()
          .optional()
          .describe("Include collision info for child nodes (default: false)"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("get_collision_info", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "setup_area",
      description:
        "Configure properties on an Area2D or Area3D node. Areas detect overlapping bodies and other areas via signals (body_entered, area_entered). Configure monitoring, gravity overrides, and priority for overlapping area resolution.",
      schema: {
        node_path: z
          .string()
          .describe("Path to the Area2D/3D node"),
        monitoring: z
          .boolean()
          .optional()
          .describe("Enable area monitoring (default: true)"),
        monitorable: z
          .boolean()
          .optional()
          .describe("Make this area monitorable by others (default: true)"),
        gravity: z
          .number()
          .optional()
          .describe("Gravity override value"),
        gravity_direction: z
          .string()
          .optional()
          .describe("Gravity direction as Vector2/Vector3 string, e.g. '(0, 1)' or '(0, -1, 0)'"),
        gravity_point: z
          .boolean()
          .optional()
          .describe("Use point gravity (gravity pulls toward area origin)"),
        priority: z
          .number()
          .optional()
          .describe("Area priority for overlapping areas (higher wins)"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand("setup_area", params);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
    {
      name: "get_physics_body_info",
      description:
        "Get complete physics body information including type, properties, collision shapes, layers, masks, and current state. Works with CharacterBody2D/3D, RigidBody2D/3D, StaticBody2D/3D, and AnimatableBody2D/3D.",
      schema: {
        node_path: z
          .string()
          .describe("Path to the physics body node"),
      },
      handler: async (
        params: Record<string, unknown>,
        godot: GodotConnection,
      ): Promise<ToolResult> => {
        const result = await godot.sendCommand(
          "get_physics_body_info",
          params,
        );
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      },
    },
  ],
};
