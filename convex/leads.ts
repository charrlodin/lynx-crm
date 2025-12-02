import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { LIMITS } from "./workspaces";

// Get all leads for a pipeline, with optional filters
export const getLeadsByPipeline = query({
  args: {
    pipelineId: v.id("pipelines"),
    stageId: v.optional(v.id("stages")),
    search: v.optional(v.string()),
    ownerId: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    let leads = await ctx.db
      .query("leads")
      .withIndex("by_pipeline", (q) => q.eq("pipelineId", args.pipelineId))
      .collect();

    // Apply filters
    if (args.stageId) {
      leads = leads.filter((l) => l.stageId === args.stageId);
    }

    if (args.ownerId) {
      leads = leads.filter((l) => l.ownerId === args.ownerId);
    }

    if (args.tags && args.tags.length > 0) {
      leads = leads.filter((l) =>
        args.tags!.some((tag) => l.tags.includes(tag))
      );
    }

    if (args.search) {
      const searchLower = args.search.toLowerCase();
      leads = leads.filter(
        (l) =>
          l.name.toLowerCase().includes(searchLower) ||
          l.company?.toLowerCase().includes(searchLower) ||
          l.email?.toLowerCase().includes(searchLower)
      );
    }

    return leads;
  },
});

// Get all leads for a workspace (for list view)
export const getLeadsByWorkspace = query({
  args: {
    workspaceId: v.id("workspaces"),
    search: v.optional(v.string()),
    stageId: v.optional(v.id("stages")),
    sortBy: v.optional(v.string()),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  handler: async (ctx, args) => {
    let leads = await ctx.db
      .query("leads")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    // Apply stage filter
    if (args.stageId) {
      leads = leads.filter((l) => l.stageId === args.stageId);
    }

    // Apply search
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      leads = leads.filter(
        (l) =>
          l.name.toLowerCase().includes(searchLower) ||
          l.company?.toLowerCase().includes(searchLower) ||
          l.email?.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    const sortBy = args.sortBy ?? "createdAt";
    const sortOrder = args.sortOrder ?? "desc";

    leads.sort((a, b) => {
      const aVal = a[sortBy as keyof typeof a];
      const bVal = b[sortBy as keyof typeof b];

      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });

    return leads;
  },
});

// Get a single lead by ID
export const getLeadById = query({
  args: { leadId: v.id("leads") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.leadId);
  },
});

// Create a new lead
export const createLead = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    pipelineId: v.id("pipelines"),
    stageId: v.id("stages"),
    listId: v.optional(v.id("lists")),
    name: v.string(),
    company: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    value: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check lead limit
    const usage = await ctx.db
      .query("usage")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .first();

    if (usage && usage.leadCount >= LIMITS.MAX_LEADS) {
      throw new Error(
        `Lead limit reached (${LIMITS.MAX_LEADS}/${LIMITS.MAX_LEADS}). Delete leads or upgrade.`
      );
    }

    const now = Date.now();

    const leadId = await ctx.db.insert("leads", {
      workspaceId: args.workspaceId,
      pipelineId: args.pipelineId,
      stageId: args.stageId,
      listId: args.listId,
      name: args.name,
      company: args.company,
      email: args.email,
      phone: args.phone,
      website: args.website,
      value: args.value,
      ownerId: identity.subject,
      tags: args.tags ?? [],
      source: args.source ?? "manual",
      createdAt: now,
      updatedAt: now,
      stageChangedAt: now,
    });

    // Create activity
    await ctx.db.insert("leadActivities", {
      leadId,
      type: "created",
      actorId: identity.subject,
      actorName: identity.name,
      createdAt: now,
    });

    // Update usage count
    if (usage) {
      await ctx.db.patch(usage._id, {
        leadCount: usage.leadCount + 1,
        lastUpdatedAt: now,
      });
    }

    return leadId;
  },
});

// Update a lead
export const updateLead = mutation({
  args: {
    leadId: v.id("leads"),
    name: v.optional(v.string()),
    company: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    value: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    ownerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const lead = await ctx.db.get(args.leadId);
    if (!lead) {
      throw new Error("Lead not found");
    }

    const now = Date.now();
    const { leadId, ...updates } = args;

    // Track value changes
    if (args.value !== undefined && args.value !== lead.value) {
      await ctx.db.insert("leadActivities", {
        leadId,
        type: "value_changed",
        data: { fromValue: lead.value, toValue: args.value },
        actorId: identity.subject,
        actorName: identity.name,
        createdAt: now,
      });
    }

    await ctx.db.patch(leadId, {
      ...updates,
      updatedAt: now,
    });
  },
});

// Move a lead to a different stage (for Kanban drag-drop)
export const moveLead = mutation({
  args: {
    leadId: v.id("leads"),
    toStageId: v.id("stages"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const lead = await ctx.db.get(args.leadId);
    if (!lead) {
      throw new Error("Lead not found");
    }

    if (lead.stageId === args.toStageId) {
      return; // No change needed
    }

    const fromStage = await ctx.db.get(lead.stageId);
    const toStage = await ctx.db.get(args.toStageId);

    const now = Date.now();

    // Update lead
    await ctx.db.patch(args.leadId, {
      stageId: args.toStageId,
      stageChangedAt: now,
      updatedAt: now,
    });

    // Create activity
    await ctx.db.insert("leadActivities", {
      leadId: args.leadId,
      type: "stage_changed",
      data: {
        fromStageId: lead.stageId,
        fromStageName: fromStage?.name,
        toStageId: args.toStageId,
        toStageName: toStage?.name,
      },
      actorId: identity.subject,
      actorName: identity.name,
      createdAt: now,
    });
  },
});

// Delete a lead
export const deleteLead = mutation({
  args: { leadId: v.id("leads") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const lead = await ctx.db.get(args.leadId);
    if (!lead) {
      throw new Error("Lead not found");
    }

    // Delete all notes for this lead
    const notes = await ctx.db
      .query("leadNotes")
      .withIndex("by_lead", (q) => q.eq("leadId", args.leadId))
      .collect();
    for (const note of notes) {
      await ctx.db.delete(note._id);
    }

    // Delete all activities for this lead
    const activities = await ctx.db
      .query("leadActivities")
      .withIndex("by_lead", (q) => q.eq("leadId", args.leadId))
      .collect();
    for (const activity of activities) {
      await ctx.db.delete(activity._id);
    }

    // Delete the lead
    await ctx.db.delete(args.leadId);

    // Update usage count
    const usage = await ctx.db
      .query("usage")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", lead.workspaceId))
      .first();

    if (usage) {
      await ctx.db.patch(usage._id, {
        leadCount: Math.max(0, usage.leadCount - 1),
        lastUpdatedAt: Date.now(),
      });
    }
  },
});

// Bulk move leads to a stage
export const bulkMoveLeads = mutation({
  args: {
    leadIds: v.array(v.id("leads")),
    toStageId: v.id("stages"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const toStage = await ctx.db.get(args.toStageId);
    const now = Date.now();

    for (const leadId of args.leadIds) {
      const lead = await ctx.db.get(leadId);
      if (!lead || lead.stageId === args.toStageId) continue;

      const fromStage = await ctx.db.get(lead.stageId);

      await ctx.db.patch(leadId, {
        stageId: args.toStageId,
        stageChangedAt: now,
        updatedAt: now,
      });

      await ctx.db.insert("leadActivities", {
        leadId,
        type: "stage_changed",
        data: {
          fromStageId: lead.stageId,
          fromStageName: fromStage?.name,
          toStageId: args.toStageId,
          toStageName: toStage?.name,
        },
        actorId: identity.subject,
        actorName: identity.name,
        createdAt: now,
      });
    }

    return { moved: args.leadIds.length };
  },
});

// Bulk delete leads
export const bulkDeleteLeads = mutation({
  args: {
    leadIds: v.array(v.id("leads")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    let workspaceId: string | null = null;
    let deletedCount = 0;

    for (const leadId of args.leadIds) {
      const lead = await ctx.db.get(leadId);
      if (!lead) continue;

      workspaceId = lead.workspaceId;

      // Delete notes
      const notes = await ctx.db
        .query("leadNotes")
        .withIndex("by_lead", (q) => q.eq("leadId", leadId))
        .collect();
      for (const note of notes) {
        await ctx.db.delete(note._id);
      }

      // Delete activities
      const activities = await ctx.db
        .query("leadActivities")
        .withIndex("by_lead", (q) => q.eq("leadId", leadId))
        .collect();
      for (const activity of activities) {
        await ctx.db.delete(activity._id);
      }

      // Delete tasks
      const tasks = await ctx.db
        .query("tasks")
        .withIndex("by_lead", (q) => q.eq("leadId", leadId))
        .collect();
      for (const task of tasks) {
        await ctx.db.delete(task._id);
      }

      await ctx.db.delete(leadId);
      deletedCount++;
    }

    // Update usage
    if (workspaceId) {
      const usage = await ctx.db
        .query("usage")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId as any))
        .first();

      if (usage) {
        await ctx.db.patch(usage._id, {
          leadCount: Math.max(0, usage.leadCount - deletedCount),
          lastUpdatedAt: Date.now(),
        });
      }
    }

    return { deleted: deletedCount };
  },
});

// Bulk import leads
export const importLeads = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    pipelineId: v.id("pipelines"),
    stageId: v.id("stages"),
    leads: v.array(
      v.object({
        name: v.string(),
        company: v.optional(v.string()),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        value: v.optional(v.number()),
        tags: v.optional(v.array(v.string())),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check import limits
    const usage = await ctx.db
      .query("usage")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .first();

    const today = new Date().toISOString().split("T")[0];

    if (usage) {
      // Reset daily import count if new day
      if (usage.lastImportDate !== today) {
        await ctx.db.patch(usage._id, {
          importsToday: 0,
          lastImportDate: today,
        });
      } else if (usage.importsToday >= LIMITS.MAX_IMPORTS_PER_DAY) {
        throw new Error(
          `Daily import limit reached (${LIMITS.MAX_IMPORTS_PER_DAY}/day). Try again tomorrow.`
        );
      }

      // Check total lead limit
      if (usage.leadCount + args.leads.length > LIMITS.MAX_LEADS) {
        throw new Error(
          `This import would exceed your lead limit (${LIMITS.MAX_LEADS}). You can import ${LIMITS.MAX_LEADS - usage.leadCount} more leads.`
        );
      }
    }

    // Check row limit
    if (args.leads.length > LIMITS.MAX_ROWS_PER_IMPORT) {
      throw new Error(
        `Maximum ${LIMITS.MAX_ROWS_PER_IMPORT} leads per import allowed.`
      );
    }

    const now = Date.now();
    let importedCount = 0;

    for (const leadData of args.leads) {
      const leadId = await ctx.db.insert("leads", {
        workspaceId: args.workspaceId,
        pipelineId: args.pipelineId,
        stageId: args.stageId,
        name: leadData.name,
        company: leadData.company,
        email: leadData.email,
        phone: leadData.phone,
        value: leadData.value,
        ownerId: identity.subject,
        tags: leadData.tags ?? [],
        source: "import",
        createdAt: now,
        updatedAt: now,
        stageChangedAt: now,
      });

      await ctx.db.insert("leadActivities", {
        leadId,
        type: "created",
        data: { source: "import" },
        actorId: identity.subject,
        actorName: identity.name,
        createdAt: now,
      });

      importedCount++;
    }

    // Update usage
    if (usage) {
      await ctx.db.patch(usage._id, {
        leadCount: usage.leadCount + importedCount,
        importsToday: (usage.importsToday ?? 0) + 1,
        lastImportDate: today,
        lastUpdatedAt: now,
      });
    }

    return { imported: importedCount };
  },
});
