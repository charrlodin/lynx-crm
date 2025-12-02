import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Limits configuration
export const LIMITS = {
  MAX_LEADS: 1000,
  MAX_PIPELINES: 1,
  MAX_STAGES: 10,
  MAX_IMPORTS_PER_DAY: 3,
  MAX_ROWS_PER_IMPORT: 500,
};

// Default stages for a new pipeline
const DEFAULT_STAGES = [
  { name: "New", position: 0, color: "stone" },
  { name: "Qualified", position: 1, color: "blue" },
  { name: "Proposal", position: 2, color: "amber" },
  { name: "Negotiation", position: 3, color: "purple" },
  { name: "Won", position: 4, color: "emerald", isWon: true },
  { name: "Lost", position: 5, color: "red", isLost: true },
];

// Get or create workspace for authenticated user
export const getOrCreateWorkspace = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;
    const userName = identity.name ?? "My Workspace";

    // Check if workspace already exists
    const existing = await ctx.db
      .query("workspaces")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .first();

    if (existing) {
      return existing._id;
    }

    // Create new workspace
    const now = Date.now();
    const workspaceId = await ctx.db.insert("workspaces", {
      ownerId: userId,
      name: `${userName}'s Workspace`,
      createdAt: now,
    });

    // Create default pipeline
    const pipelineId = await ctx.db.insert("pipelines", {
      workspaceId,
      name: "Sales Pipeline",
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    });

    // Create default stages
    for (const stage of DEFAULT_STAGES) {
      await ctx.db.insert("stages", {
        pipelineId,
        name: stage.name,
        position: stage.position,
        color: stage.color,
        isWon: stage.isWon,
        isLost: stage.isLost,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Initialize usage tracking
    await ctx.db.insert("usage", {
      workspaceId,
      leadCount: 0,
      importsToday: 0,
      lastUpdatedAt: now,
    });

    return workspaceId;
  },
});

// Get current user's workspace
export const getCurrentWorkspace = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))
      .first();

    return workspace;
  },
});

// Update workspace settings
export const updateWorkspaceSettings = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.optional(v.string()),
    settings: v.optional(
      v.object({
        currency: v.optional(v.string()),
        timezone: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace || workspace.ownerId !== identity.subject) {
      throw new Error("Workspace not found or access denied");
    }

    const updates: Record<string, unknown> = {};
    if (args.name) updates.name = args.name;
    if (args.settings) updates.settings = args.settings;

    await ctx.db.patch(args.workspaceId, updates);
  },
});

// Get usage stats for workspace
export const getUsage = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const usage = await ctx.db
      .query("usage")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .first();

    return {
      usage,
      limits: LIMITS,
    };
  },
});
