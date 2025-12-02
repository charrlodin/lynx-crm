import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { LIMITS } from "./workspaces";

// Get pipeline with all stages
export const getPipelineWithStages = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const pipeline = await ctx.db
      .query("pipelines")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("isDefault"), true))
      .first();

    if (!pipeline) {
      return null;
    }

    const stages = await ctx.db
      .query("stages")
      .withIndex("by_pipeline", (q) => q.eq("pipelineId", pipeline._id))
      .collect();

    // Sort by position
    stages.sort((a, b) => a.position - b.position);

    return {
      ...pipeline,
      stages,
    };
  },
});

// Get all stages for a pipeline
export const getStages = query({
  args: { pipelineId: v.id("pipelines") },
  handler: async (ctx, args) => {
    const stages = await ctx.db
      .query("stages")
      .withIndex("by_pipeline", (q) => q.eq("pipelineId", args.pipelineId))
      .collect();

    return stages.sort((a, b) => a.position - b.position);
  },
});

// Create a new stage
export const createStage = mutation({
  args: {
    pipelineId: v.id("pipelines"),
    name: v.string(),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get existing stages to determine position
    const existingStages = await ctx.db
      .query("stages")
      .withIndex("by_pipeline", (q) => q.eq("pipelineId", args.pipelineId))
      .collect();

    if (existingStages.length >= LIMITS.MAX_STAGES) {
      throw new Error(`Maximum of ${LIMITS.MAX_STAGES} stages allowed`);
    }

    const maxPosition = Math.max(...existingStages.map((s) => s.position), -1);
    const now = Date.now();

    const stageId = await ctx.db.insert("stages", {
      pipelineId: args.pipelineId,
      name: args.name,
      position: maxPosition + 1,
      color: args.color ?? "stone",
      createdAt: now,
      updatedAt: now,
    });

    return stageId;
  },
});

// Update a stage
export const updateStage = mutation({
  args: {
    stageId: v.id("stages"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
    isWon: v.optional(v.boolean()),
    isLost: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const { stageId, ...updates } = args;
    await ctx.db.patch(stageId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Delete a stage and reassign leads
export const deleteStage = mutation({
  args: {
    stageId: v.id("stages"),
    reassignToStageId: v.id("stages"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get all leads in this stage
    const leads = await ctx.db
      .query("leads")
      .withIndex("by_stage", (q) => q.eq("stageId", args.stageId))
      .collect();

    const now = Date.now();

    // Reassign leads to the new stage
    for (const lead of leads) {
      await ctx.db.patch(lead._id, {
        stageId: args.reassignToStageId,
        stageChangedAt: now,
        updatedAt: now,
      });
    }

    // Delete the stage
    await ctx.db.delete(args.stageId);
  },
});

// Reorder stages
export const reorderStages = mutation({
  args: {
    pipelineId: v.id("pipelines"),
    stageOrder: v.array(v.id("stages")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();

    // Update positions based on array order
    for (let i = 0; i < args.stageOrder.length; i++) {
      await ctx.db.patch(args.stageOrder[i], {
        position: i,
        updatedAt: now,
      });
    }

    // Update pipeline timestamp
    await ctx.db.patch(args.pipelineId, {
      updatedAt: now,
    });
  },
});
