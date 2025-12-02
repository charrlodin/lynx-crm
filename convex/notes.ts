import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all notes for a lead
export const getNotesForLead = query({
  args: { leadId: v.id("leads") },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query("leadNotes")
      .withIndex("by_lead", (q) => q.eq("leadId", args.leadId))
      .collect();

    // Sort by most recent first
    return notes.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Get all activities for a lead
export const getActivitiesForLead = query({
  args: { leadId: v.id("leads") },
  handler: async (ctx, args) => {
    const activities = await ctx.db
      .query("leadActivities")
      .withIndex("by_lead", (q) => q.eq("leadId", args.leadId))
      .collect();

    // Sort by most recent first
    return activities.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Add a note to a lead
export const addNote = mutation({
  args: {
    leadId: v.id("leads"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();

    // Create the note
    const noteId = await ctx.db.insert("leadNotes", {
      leadId: args.leadId,
      authorId: identity.subject,
      authorName: identity.name,
      body: args.body,
      createdAt: now,
    });

    // Create activity
    await ctx.db.insert("leadActivities", {
      leadId: args.leadId,
      type: "note_added",
      data: { noteId },
      actorId: identity.subject,
      actorName: identity.name,
      createdAt: now,
    });

    // Update lead's updatedAt
    await ctx.db.patch(args.leadId, {
      updatedAt: now,
    });

    return noteId;
  },
});

// Delete a note
export const deleteNote = mutation({
  args: { noteId: v.id("leadNotes") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const note = await ctx.db.get(args.noteId);
    if (!note) {
      throw new Error("Note not found");
    }

    // Only allow author to delete
    if (note.authorId !== identity.subject) {
      throw new Error("You can only delete your own notes");
    }

    await ctx.db.delete(args.noteId);
  },
});
