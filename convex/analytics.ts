import { v } from "convex/values";
import { query } from "./_generated/server";

// Get dashboard metrics
export const getDashboardMetrics = query({
  args: {
    workspaceId: v.id("workspaces"),
    range: v.optional(v.union(v.literal("7d"), v.literal("30d"))),
  },
  handler: async (ctx, args) => {
    const range = args.range ?? "7d";
    const now = Date.now();
    const rangeMs = range === "7d" ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
    const startTime = now - rangeMs;

    // Get all leads for workspace
    const leads = await ctx.db
      .query("leads")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    // Get pipeline and stages
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

    // Calculate metrics
    const totalLeads = leads.length;
    const newLeadsInRange = leads.filter((l) => l.createdAt >= startTime).length;

    // Count by stage
    const stageMap = new Map(stages.map((s) => [s._id, s]));
    const leadsByStage = stages.map((stage) => ({
      stageId: stage._id,
      stageName: stage.name,
      stageColor: stage.color,
      count: leads.filter((l) => l.stageId === stage._id).length,
      isWon: stage.isWon,
      isLost: stage.isLost,
    }));

    // Won/Lost counts
    const wonStage = stages.find((s) => s.isWon);
    const lostStage = stages.find((s) => s.isLost);

    const wonCount = wonStage
      ? leads.filter((l) => l.stageId === wonStage._id).length
      : 0;
    const lostCount = lostStage
      ? leads.filter((l) => l.stageId === lostStage._id).length
      : 0;
    const openCount = totalLeads - wonCount - lostCount;

    // Calculate values
    const wonValue = wonStage
      ? leads
          .filter((l) => l.stageId === wonStage._id)
          .reduce((sum, l) => sum + (l.value ?? 0), 0)
      : 0;
    const lostValue = lostStage
      ? leads
          .filter((l) => l.stageId === lostStage._id)
          .reduce((sum, l) => sum + (l.value ?? 0), 0)
      : 0;
    // Pipeline value = open leads only (not won or lost)
    const openValue = leads
      .filter((l) => {
        const stage = stageMap.get(l.stageId);
        return !stage?.isWon && !stage?.isLost;
      })
      .reduce((sum, l) => sum + (l.value ?? 0), 0);
    // Total value for reference
    const totalValue = leads.reduce((sum, l) => sum + (l.value ?? 0), 0);

    // Leads created per day in range
    const leadsPerDay: { date: string; count: number }[] = [];
    const days = range === "7d" ? 7 : 30;

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date(now - i * 24 * 60 * 60 * 1000);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const count = leads.filter(
        (l) => l.createdAt >= dayStart.getTime() && l.createdAt <= dayEnd.getTime()
      ).length;

      leadsPerDay.push({
        date: dayStart.toISOString().split("T")[0],
        count,
      });
    }

    // Get recent stage changes to "Won"
    let wonInRange = 0;
    if (wonStage) {
      const activities = await ctx.db.query("leadActivities").collect();
      wonInRange = activities.filter(
        (a) =>
          a.type === "stage_changed" &&
          a.createdAt >= startTime &&
          a.data?.toStageId === wonStage._id
      ).length;
    }

    return {
      totalLeads,
      newLeadsInRange,
      openCount,
      wonCount,
      lostCount,
      totalValue,
      openValue,
      wonValue,
      lostValue,
      wonInRange,
      leadsByStage,
      leadsPerDay,
      pipeline: {
        id: pipeline._id,
        name: pipeline.name,
      },
    };
  },
});

// Get recent activity across workspace
export const getRecentActivity = query({
  args: {
    workspaceId: v.id("workspaces"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    // Get all leads in workspace
    const leads = await ctx.db
      .query("leads")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const leadIds = new Set(leads.map((l) => l._id));

    // Get recent activities for these leads
    const allActivities = await ctx.db.query("leadActivities").collect();

    const relevantActivities = allActivities
      .filter((a) => leadIds.has(a.leadId))
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);

    // Enrich with lead names
    const leadMap = new Map(leads.map((l) => [l._id, l]));

    return relevantActivities.map((activity) => ({
      ...activity,
      leadName: leadMap.get(activity.leadId)?.name ?? "Unknown",
      leadCompany: leadMap.get(activity.leadId)?.company,
    }));
  },
});
