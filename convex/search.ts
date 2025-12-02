import { v } from "convex/values";
import { query } from "./_generated/server";

// Search leads across workspace
export const searchLeads = query({
  args: {
    workspaceId: v.id("workspaces"),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const searchLower = args.query.toLowerCase();

    const leads = await ctx.db
      .query("leads")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    // Filter and score results
    const results = leads
      .map((lead) => {
        let score = 0;
        const nameLower = lead.name.toLowerCase();
        const companyLower = lead.company?.toLowerCase() ?? "";
        const emailLower = lead.email?.toLowerCase() ?? "";

        // Exact match gets highest score
        if (nameLower === searchLower) score += 100;
        else if (nameLower.startsWith(searchLower)) score += 50;
        else if (nameLower.includes(searchLower)) score += 25;

        if (companyLower === searchLower) score += 80;
        else if (companyLower.startsWith(searchLower)) score += 40;
        else if (companyLower.includes(searchLower)) score += 20;

        if (emailLower.includes(searchLower)) score += 15;

        return { lead, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((r) => r.lead);

    return results;
  },
});

// Get recent leads for command palette
export const getRecentLeads = query({
  args: {
    workspaceId: v.id("workspaces"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 5;

    const leads = await ctx.db
      .query("leads")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .take(limit);

    return leads;
  },
});
