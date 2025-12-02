import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all lists for workspace
export const getListsForWorkspace = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const lists = await ctx.db
      .query("lists")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    // Get counts for each list
    const listsWithCounts = await Promise.all(
      lists.map(async (list) => {
        const leads = await ctx.db
          .query("leads")
          .withIndex("by_list", (q) => q.eq("listId", list._id))
          .collect();
        const tasks = await ctx.db
          .query("tasks")
          .withIndex("by_list", (q) => q.eq("listId", list._id))
          .collect();

        return {
          ...list,
          leadCount: leads.length,
          taskCount: tasks.filter((t) => t.status !== "done").length,
        };
      })
    );

    return listsWithCounts.sort((a, b) => a.name.localeCompare(b.name));
  },
});

// Get a single list with its leads and tasks
export const getListById = query({
  args: { listId: v.id("lists") },
  handler: async (ctx, args) => {
    const list = await ctx.db.get(args.listId);
    if (!list) return null;

    const leads = await ctx.db
      .query("leads")
      .withIndex("by_list", (q) => q.eq("listId", args.listId))
      .collect();

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_list", (q) => q.eq("listId", args.listId))
      .collect();

    // Get stages for leads
    const stageIds = [...new Set(leads.map((l) => l.stageId))];
    const stages = await Promise.all(stageIds.map((id) => ctx.db.get(id)));
    const stageMap = new Map(stages.filter(Boolean).map((s) => [s!._id, s!]));

    return {
      ...list,
      leads: leads.map((l) => ({
        ...l,
        stage: stageMap.get(l.stageId),
      })),
      tasks: tasks.sort((a, b) => {
        const statusOrder = { todo: 0, in_progress: 1, done: 2 };
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status];
        }
        return b.createdAt - a.createdAt;
      }),
    };
  },
});

// Create a list
export const createList = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    const listId = await ctx.db.insert("lists", {
      workspaceId: args.workspaceId,
      name: args.name,
      description: args.description,
      color: args.color,
      createdBy: identity.subject,
      createdAt: now,
      updatedAt: now,
    });

    return listId;
  },
});

// Update a list
export const updateList = mutation({
  args: {
    listId: v.id("lists"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.color !== undefined) updates.color = args.color;

    await ctx.db.patch(args.listId, updates);
  },
});

// Delete a list (removes list association from leads/tasks, doesn't delete them)
export const deleteList = mutation({
  args: { listId: v.id("lists") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Remove list association from leads
    const leads = await ctx.db
      .query("leads")
      .withIndex("by_list", (q) => q.eq("listId", args.listId))
      .collect();
    for (const lead of leads) {
      await ctx.db.patch(lead._id, { listId: undefined });
    }

    // Remove list association from tasks
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_list", (q) => q.eq("listId", args.listId))
      .collect();
    for (const task of tasks) {
      await ctx.db.patch(task._id, { listId: undefined });
    }

    await ctx.db.delete(args.listId);
  },
});

// Add lead to list
export const addLeadToList = mutation({
  args: {
    leadId: v.id("leads"),
    listId: v.id("lists"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    await ctx.db.patch(args.leadId, {
      listId: args.listId,
      updatedAt: Date.now(),
    });
  },
});

// Remove lead from list
export const removeLeadFromList = mutation({
  args: { leadId: v.id("leads") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    await ctx.db.patch(args.leadId, {
      listId: undefined,
      updatedAt: Date.now(),
    });
  },
});

// Search lists (for command palette)
export const searchLists = query({
  args: {
    workspaceId: v.id("workspaces"),
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const lists = await ctx.db
      .query("lists")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const queryLower = args.query.toLowerCase();
    return lists
      .filter((l) => l.name.toLowerCase().includes(queryLower))
      .slice(0, 5);
  },
});
