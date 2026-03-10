import { z } from "zod";
import type { CategoryDef, ToolResult } from "../registry.js";
import type { GodotConnection } from "../connection.js";

export const particlesCategory: CategoryDef = {
  name: "particles",
  description: "GPUParticles2D/3D creation, material config, presets, color gradients",
  tools: [
    // -- Particle system tools (6) ------------------------------------------

    {
      name: "create_particles",
      description: "Add a GPUParticles2D or GPUParticles3D node with a ParticleProcessMaterial.",
      schema: {
        parent_path: z.string().describe("Path to the parent node where the particle system will be added"),
        name: z.string().optional().describe("Name for the particle node (default: GPUParticles2D or GPUParticles3D)"),
        is_3d: z.boolean().optional().describe("Create GPUParticles3D instead of GPUParticles2D (default: false)"),
        amount: z.number().optional().describe("Number of particles to emit (default: 8)"),
        lifetime: z.number().optional().describe("Lifetime of each particle in seconds (default: 1.0)"),
        one_shot: z.boolean().optional().describe("Emit particles only once (default: false)"),
        explosiveness: z.number().optional().describe("Explosiveness ratio 0.0-1.0 (default: 0.0)"),
        randomness: z.number().optional().describe("Randomness ratio 0.0-1.0 (default: 0.0)"),
        emitting: z.boolean().optional().describe("Start emitting immediately (default: true)"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("create_particles", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "set_particle_material",
      description: "Configure ParticleProcessMaterial properties: direction, spread, velocity, gravity, scale, color, emission shape.",
      schema: {
        node_path: z.string().describe("Path to the GPUParticles2D/3D node"),
        direction: z.object({
          x: z.number().describe("X component of emission direction"),
          y: z.number().describe("Y component of emission direction"),
          z: z.number().describe("Z component of emission direction"),
        }).optional().describe("Base emission direction vector"),
        spread: z.number().optional().describe("Spread angle in degrees (default: 45)"),
        initial_velocity_min: z.number().optional().describe("Minimum initial velocity"),
        initial_velocity_max: z.number().optional().describe("Maximum initial velocity"),
        gravity: z.object({
          x: z.number().describe("X component of gravity"),
          y: z.number().describe("Y component of gravity"),
          z: z.number().describe("Z component of gravity"),
        }).optional().describe("Gravity vector applied to particles"),
        scale_min: z.number().optional().describe("Minimum particle scale"),
        scale_max: z.number().optional().describe("Maximum particle scale"),
        color: z.string().optional().describe("Particle color as hex string (e.g. '#ff0000')"),
        emission_shape: z.string().optional().describe("Emission shape: point, sphere, sphere_surface, box, ring"),
        emission_sphere_radius: z.number().optional().describe("Radius for sphere/sphere_surface emission shape"),
        emission_box_extents: z.object({
          x: z.number().describe("X extent of emission box"),
          y: z.number().describe("Y extent of emission box"),
          z: z.number().describe("Z extent of emission box"),
        }).optional().describe("Box extents for box emission shape"),
        emission_ring_radius: z.number().optional().describe("Outer radius for ring emission shape"),
        emission_ring_inner_radius: z.number().optional().describe("Inner radius for ring emission shape"),
        emission_ring_height: z.number().optional().describe("Height for ring emission shape"),
        angular_velocity_min: z.number().optional().describe("Minimum angular velocity in degrees/sec"),
        angular_velocity_max: z.number().optional().describe("Maximum angular velocity in degrees/sec"),
        orbit_velocity_min: z.number().optional().describe("Minimum orbit velocity"),
        orbit_velocity_max: z.number().optional().describe("Maximum orbit velocity"),
        damping_min: z.number().optional().describe("Minimum damping value"),
        damping_max: z.number().optional().describe("Maximum damping value"),
        attractor_interaction_enabled: z.boolean().optional().describe("Enable interaction with particle attractors"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("set_particle_material", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "set_particle_color_gradient",
      description: "Set a color ramp (gradient) on a particle system's material.",
      schema: {
        node_path: z.string().describe("Path to the GPUParticles2D/3D node"),
        stops: z.array(z.object({
          offset: z.number().describe("Gradient stop position from 0.0 to 1.0"),
          color: z.string().describe("Color at this stop as hex string (e.g. '#ff0000')"),
        })).describe("Array of gradient color stops defining the color ramp over particle lifetime"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("set_particle_color_gradient", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "apply_particle_preset",
      description: "Apply a named particle preset: explosion, fire, smoke, sparks, rain, snow, magic, dust.",
      schema: {
        node_path: z.string().describe("Path to the GPUParticles2D/3D node"),
        preset: z.string().describe("Preset name: explosion, fire, smoke, sparks, rain, snow, magic, dust"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("apply_particle_preset", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "get_particle_info",
      description: "Get the full configuration of a particle system.",
      schema: {
        node_path: z.string().describe("Path to the GPUParticles2D/3D node"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("get_particle_info", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "remove_particles",
      description: "Remove a GPUParticles2D/3D node from the scene.",
      schema: {
        node_path: z.string().describe("Path to the GPUParticles2D/3D node to remove"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("remove_particles", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
  ],
};
