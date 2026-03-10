import { z } from "zod";
import type { CategoryDef, ToolResult } from "../registry.js";
import type { GodotConnection } from "../connection.js";

export const animationCategory: CategoryDef = {
  name: "animation",
  description: "AnimationPlayer tracks, keyframes, AnimationTree state machines and blend trees",
  tools: [
    // ── AnimationPlayer tools (6) ──────────────────────────────────────

    {
      name: "list_animations",
      description: "List all animations in an AnimationPlayer node. Returns animation names with their length and loop settings.",
      schema: {
        node_path: z.string().describe("Path to the AnimationPlayer node"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("list_animations", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "create_animation",
      description: "Create a new animation in an AnimationPlayer. Optionally set length and loop mode.",
      schema: {
        node_path: z.string().describe("Path to the AnimationPlayer node"),
        name: z.string().describe("Name for the new animation"),
        length: z.number().optional().describe("Animation length in seconds (default: 1.0)"),
        loop_mode: z.number().optional().describe("Loop mode: 0=none, 1=linear, 2=ping-pong"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("create_animation", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "add_animation_track",
      description: "Add a track to an existing animation. Tracks target a node property path (e.g. ':position', ':modulate').",
      schema: {
        node_path: z.string().describe("Path to the AnimationPlayer node"),
        animation: z.string().describe("Name of the animation to add the track to"),
        track_path: z.string().describe("Property path for the track (e.g. '.:position', 'Sprite2D:modulate')"),
        track_type: z.string().optional().describe("Track type: value, method, bezier, audio, animation (default: value)"),
        update_mode: z.string().optional().describe("Update mode: continuous, discrete, capture (default: continuous)"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("add_animation_track", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "set_animation_keyframe",
      description: "Insert or update a keyframe on an animation track at the specified time.",
      schema: {
        node_path: z.string().describe("Path to the AnimationPlayer node"),
        animation: z.string().describe("Animation name"),
        track_index: z.number().describe("Track index (0-based)"),
        time: z.number().describe("Time in seconds for the keyframe"),
        value: z.union([z.string(), z.number(), z.boolean()]).describe("Keyframe value (type must match the track property)"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("set_animation_keyframe", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "get_animation_info",
      description: "Get detailed information about an animation including all tracks, keyframes, and settings.",
      schema: {
        node_path: z.string().describe("Path to the AnimationPlayer node"),
        animation: z.string().describe("Animation name to inspect"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("get_animation_info", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "remove_animation",
      description: "Remove an animation from an AnimationPlayer by name.",
      schema: {
        node_path: z.string().describe("Path to the AnimationPlayer node"),
        name: z.string().describe("Name of the animation to remove"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("remove_animation", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },

    // ── AnimationTree tools (8) ────────────────────────────────────────

    {
      name: "create_animation_tree",
      description: "Create an AnimationTree node with an AnimationNodeStateMachine as root. Attaches to an AnimationPlayer.",
      schema: {
        node_path: z.string().describe("Path to the parent node where the AnimationTree will be added"),
        anim_player: z.string().optional().describe("Path to the AnimationPlayer (relative to AnimationTree parent)"),
        name: z.string().optional().describe("Name for the AnimationTree node (default: AnimationTree)"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("create_animation_tree", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "get_animation_tree_structure",
      description: "Read the full structure of an AnimationTree including state machines, states, transitions, and blend trees.",
      schema: {
        node_path: z.string().describe("Path to the AnimationTree node"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("get_animation_tree_structure", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "add_state_machine_state",
      description: "Add a state to an AnimationNodeStateMachine. States can be animations, blend trees, or nested state machines.",
      schema: {
        node_path: z.string().describe("Path to the AnimationTree node"),
        state_name: z.string().describe("Name for the new state"),
        state_type: z.enum(["animation", "blend_tree", "state_machine"]).optional().describe("Type of state node (default: animation)"),
        animation: z.string().optional().describe("Animation name (required if state_type is animation)"),
        state_machine_path: z.string().optional().describe("Path to nested state machine (e.g. 'Root/SubStateMachine')"),
        position_x: z.number().optional().describe("X position in the state machine editor graph"),
        position_y: z.number().optional().describe("Y position in the state machine editor graph"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("add_state_machine_state", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "remove_state_machine_state",
      description: "Remove a state from an AnimationNodeStateMachine. Also removes any transitions connected to it.",
      schema: {
        node_path: z.string().describe("Path to the AnimationTree node"),
        state_name: z.string().describe("Name of the state to remove"),
        state_machine_path: z.string().optional().describe("Path to nested state machine"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("remove_state_machine_state", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "add_state_machine_transition",
      description: "Add a transition between two states in an AnimationNodeStateMachine. Configure switch mode, advance conditions, and crossfade.",
      schema: {
        node_path: z.string().describe("Path to the AnimationTree node"),
        from_state: z.string().describe("Source state name"),
        to_state: z.string().describe("Destination state name"),
        switch_mode: z.enum(["at_end", "immediate", "sync"]).optional().describe("When to switch: at_end, immediate, or sync (default: immediate)"),
        advance_mode: z.enum(["disabled", "enabled", "auto"]).optional().describe("Advance mode: disabled, enabled (requires condition), or auto"),
        advance_expression: z.string().optional().describe("Expression that triggers the transition (e.g. 'is_running')"),
        xfade_time: z.number().optional().describe("Crossfade time in seconds (default: 0)"),
        state_machine_path: z.string().optional().describe("Path to nested state machine"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("add_state_machine_transition", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "remove_state_machine_transition",
      description: "Remove a transition between two states in an AnimationNodeStateMachine.",
      schema: {
        node_path: z.string().describe("Path to the AnimationTree node"),
        from_state: z.string().describe("Source state name"),
        to_state: z.string().describe("Destination state name"),
        state_machine_path: z.string().optional().describe("Path to nested state machine"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("remove_state_machine_transition", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "set_blend_tree_node",
      description: "Add or replace a node in a BlendTree state. Supports animation, blend, add, time scale, and other node types.",
      schema: {
        node_path: z.string().describe("Path to the AnimationTree node"),
        blend_tree_state: z.string().describe("Name of the BlendTree state in the state machine"),
        bt_node_name: z.string().describe("Name for the BlendTree node"),
        bt_node_type: z.enum([
          "Animation", "Add2", "Blend2", "Add3", "Blend3",
          "TimeScale", "TimeSeek", "Transition", "OneShot", "Sub2",
        ]).describe("Type of BlendTree node"),
        animation: z.string().optional().describe("Animation name (for Animation node type)"),
        connect_to: z.string().optional().describe("Name of node to connect output to"),
        connect_port: z.number().optional().describe("Input port on the target node (default: 0)"),
        state_machine_path: z.string().optional().describe("Path to nested state machine containing the BlendTree"),
        position_x: z.number().optional().describe("X position in the BlendTree editor graph"),
        position_y: z.number().optional().describe("Y position in the BlendTree editor graph"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("set_blend_tree_node", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: "set_tree_parameter",
      description: "Set a parameter on the AnimationTree (e.g. blend amounts, travel requests, conditions).",
      schema: {
        node_path: z.string().describe("Path to the AnimationTree node"),
        parameter: z.string().describe("Parameter path (e.g. 'parameters/blend_amount', 'parameters/conditions/is_running')"),
        value: z.union([z.string(), z.number(), z.boolean()]).describe("Parameter value"),
      },
      handler: async (params: Record<string, unknown>, godot: GodotConnection): Promise<ToolResult> => {
        const result = await godot.sendCommand("set_tree_parameter", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
  ],
};
