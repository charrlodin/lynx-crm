import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Workspaces - one per user for v1
  workspaces: defineTable({
    ownerId: v.string(), // Clerk user ID
    name: v.string(),
    settings: v.optional(
      v.object({
        currency: v.optional(v.string()),
        timezone: v.optional(v.string()),
      })
    ),
    createdAt: v.number(),
  }).index("by_owner", ["ownerId"]),

  // Pipelines - one default pipeline per workspace for v1
  pipelines: defineTable({
    workspaceId: v.id("workspaces"),
    name: v.string(),
    isDefault: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_workspace", ["workspaceId"]),

  // Stages - columns in the Kanban board
  stages: defineTable({
    pipelineId: v.id("pipelines"),
    name: v.string(),
    position: v.number(), // For ordering left-to-right
    color: v.optional(v.string()), // Optional color for the stage
    isWon: v.optional(v.boolean()), // Mark as "won" stage
    isLost: v.optional(v.boolean()), // Mark as "lost" stage
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_pipeline", ["pipelineId"]),

  // Lists - for grouping leads and tasks
  lists: defineTable({
    workspaceId: v.id("workspaces"),
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()), // For visual identification
    createdBy: v.string(), // Clerk user ID
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"]),

  // Leads - the core CRM data
  leads: defineTable({
    workspaceId: v.id("workspaces"),
    pipelineId: v.id("pipelines"),
    stageId: v.id("stages"),
    listId: v.optional(v.id("lists")), // Optional list assignment
    name: v.string(),
    company: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    value: v.optional(v.number()),
    ownerId: v.optional(v.string()), // Clerk user ID
    tags: v.array(v.string()),
    source: v.optional(v.string()), // "manual", "import"
    createdAt: v.number(),
    updatedAt: v.number(),
    stageChangedAt: v.number(), // For "time in stage" calculations
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_pipeline", ["pipelineId"])
    .index("by_stage", ["stageId"])
    .index("by_list", ["listId"])
    .index("by_workspace_created", ["workspaceId", "createdAt"]),

  // Lead Notes
  leadNotes: defineTable({
    leadId: v.id("leads"),
    authorId: v.string(), // Clerk user ID
    authorName: v.optional(v.string()),
    body: v.string(),
    createdAt: v.number(),
  }).index("by_lead", ["leadId"]),

  // Lead Activities (audit log)
  leadActivities: defineTable({
    leadId: v.id("leads"),
    type: v.union(
      v.literal("created"),
      v.literal("stage_changed"),
      v.literal("value_changed"),
      v.literal("note_added"),
      v.literal("updated"),
      v.literal("deleted")
    ),
    data: v.optional(v.any()), // JSON with details (fromStage, toStage, etc.)
    actorId: v.optional(v.string()), // Clerk user ID
    actorName: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_lead", ["leadId"]),

  // Usage tracking for limits
  usage: defineTable({
    workspaceId: v.id("workspaces"),
    leadCount: v.number(),
    importsToday: v.number(),
    lastImportDate: v.optional(v.string()), // ISO date string
    lastUpdatedAt: v.number(),
  }).index("by_workspace", ["workspaceId"]),

  // Tasks/Reminders
  tasks: defineTable({
    workspaceId: v.id("workspaces"),
    leadId: v.optional(v.id("leads")), // Optional - can be linked to lead
    listId: v.optional(v.id("lists")), // Optional - can be linked to list
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
    status: v.union(v.literal("todo"), v.literal("in_progress"), v.literal("done")),
    dueDate: v.optional(v.number()), // Unix timestamp
    completedAt: v.optional(v.number()),
    createdBy: v.string(), // Clerk user ID
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_lead", ["leadId"])
    .index("by_list", ["listId"])
    .index("by_workspace_status", ["workspaceId", "status"])
    .index("by_workspace_due", ["workspaceId", "dueDate"]),
});
