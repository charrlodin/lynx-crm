import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all tasks for workspace
export const getTasksForWorkspace = query({
  args: {
    workspaceId: v.id("workspaces"),
    status: v.optional(v.union(v.literal("todo"), v.literal("in_progress"), v.literal("done"))),
    priority: v.optional(v.union(v.literal("high"), v.literal("medium"), v.literal("low"))),
  },
  handler: async (ctx, args) => {
    let tasks = await ctx.db
      .query("tasks")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    // Apply filters
    if (args.status) {
      tasks = tasks.filter((t) => t.status === args.status);
    }
    if (args.priority) {
      tasks = tasks.filter((t) => t.priority === args.priority);
    }

    // Get lead names
    const leadIds = [...new Set(tasks.map((t) => t.leadId).filter(Boolean))];
    const leads = await Promise.all(leadIds.map((id) => ctx.db.get(id!)));
    const leadMap = new Map(
      leads.filter(Boolean).map((l) => [l!._id, { name: l!.name, company: l!.company }])
    );

    // Sort: by status (todo first, then in_progress, then done), then by priority, then by due date
    const statusOrder = { todo: 0, in_progress: 1, done: 2 };
    const priorityOrder = { high: 0, medium: 1, low: 2 };

    return tasks
      .sort((a, b) => {
        // Status first
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status];
        }
        // Then priority
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        // Then due date
        if (a.dueDate && b.dueDate) return a.dueDate - b.dueDate;
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return b.createdAt - a.createdAt;
      })
      .map((t) => ({
        ...t,
        lead: t.leadId ? leadMap.get(t.leadId) : undefined,
      }));
  },
});

// Get tasks for a lead
export const getTasksForLead = query({
  args: { leadId: v.id("leads") },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_lead", (q) => q.eq("leadId", args.leadId))
      .collect();

    const statusOrder = { todo: 0, in_progress: 1, done: 2 };

    return tasks.sort((a, b) => {
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      if (a.dueDate && b.dueDate) return a.dueDate - b.dueDate;
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return b.createdAt - a.createdAt;
    });
  },
});

// Get task summary for workspace (dashboard)
export const getTasksSummary = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const incomplete = tasks.filter((t) => t.status !== "done");
    const todo = tasks.filter((t) => t.status === "todo");
    const inProgress = tasks.filter((t) => t.status === "in_progress");
    const done = tasks.filter((t) => t.status === "done");

    const overdue = incomplete.filter(
      (t) => t.dueDate && t.dueDate < todayStart.getTime()
    );

    const dueToday = incomplete.filter(
      (t) =>
        t.dueDate &&
        t.dueDate >= todayStart.getTime() &&
        t.dueDate <= todayEnd.getTime()
    );

    const highPriority = incomplete.filter((t) => t.priority === "high");

    // Get lead names for recent tasks
    const leadIds = [...new Set(incomplete.map((t) => t.leadId).filter(Boolean))];
    const leads = await Promise.all(leadIds.map((id) => ctx.db.get(id!)));
    const leadMap = new Map(leads.filter(Boolean).map((l) => [l!._id, l!.name]));

    return {
      total: tasks.length,
      todo: todo.length,
      inProgress: inProgress.length,
      done: done.length,
      overdue: overdue.length,
      dueToday: dueToday.length,
      highPriority: highPriority.length,
      recentTasks: incomplete
        .sort((a, b) => {
          // High priority first
          if (a.priority === "high" && b.priority !== "high") return -1;
          if (a.priority !== "high" && b.priority === "high") return 1;
          // Then overdue
          const aOverdue = a.dueDate && a.dueDate < now;
          const bOverdue = b.dueDate && b.dueDate < now;
          if (aOverdue && !bOverdue) return -1;
          if (!aOverdue && bOverdue) return 1;
          // Then by due date
          if (a.dueDate && b.dueDate) return a.dueDate - b.dueDate;
          return 0;
        })
        .slice(0, 5)
        .map((t) => ({
          ...t,
          leadName: t.leadId ? leadMap.get(t.leadId) : undefined,
        })),
    };
  },
});

// Create a task
export const createTask = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    leadId: v.optional(v.id("leads")),
    listId: v.optional(v.id("lists")),
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    const taskId = await ctx.db.insert("tasks", {
      workspaceId: args.workspaceId,
      leadId: args.leadId,
      listId: args.listId,
      title: args.title,
      description: args.description,
      priority: args.priority,
      status: "todo",
      dueDate: args.dueDate,
      createdBy: identity.subject,
      createdAt: now,
      updatedAt: now,
    });

    return taskId;
  },
});

// Update task
export const updateTask = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("high"), v.literal("medium"), v.literal("low"))),
    status: v.optional(v.union(v.literal("todo"), v.literal("in_progress"), v.literal("done"))),
    dueDate: v.optional(v.number()),
    leadId: v.optional(v.id("leads")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };

    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.priority !== undefined) updates.priority = args.priority;
    if (args.dueDate !== undefined) updates.dueDate = args.dueDate;
    if (args.leadId !== undefined) updates.leadId = args.leadId;

    if (args.status !== undefined) {
      updates.status = args.status;
      if (args.status === "done" && task.status !== "done") {
        updates.completedAt = Date.now();
      } else if (args.status !== "done") {
        updates.completedAt = undefined;
      }
    }

    await ctx.db.patch(args.taskId, updates);
  },
});

// Toggle task status (cycle through: todo -> in_progress -> done -> todo)
export const cycleTaskStatus = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    const nextStatus = {
      todo: "in_progress" as const,
      in_progress: "done" as const,
      done: "todo" as const,
    };

    const newStatus = nextStatus[task.status];

    await ctx.db.patch(args.taskId, {
      status: newStatus,
      completedAt: newStatus === "done" ? Date.now() : undefined,
      updatedAt: Date.now(),
    });
  },
});

// Delete a task
export const deleteTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    await ctx.db.delete(args.taskId);
  },
});

// Get all leads for task assignment dropdown
export const getLeadsForTaskAssignment = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const leads = await ctx.db
      .query("leads")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    return leads
      .map((l) => ({ _id: l._id, name: l.name, company: l.company }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },
});
