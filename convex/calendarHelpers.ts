import { v } from "convex/values";
import { internalQuery, internalMutation } from "./_generated/server";

// Internal query to get item and user data
export const getItemWithUser = internalQuery({
  args: { itemId: v.id("items") },
  handler: async (ctx, { itemId }) => {
    const item = await ctx.db.get(itemId);
    if (!item) return null;

    const user = await ctx.db.get(item.userId);
    if (!user) return null;

    return { item, user };
  },
});

export const getUserByClerkId = internalQuery({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique();
  },
});

export const getItemsForCalendarSync = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("items")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

// Internal mutation to update calendar event ID
export const updateItemCalendarEventId = internalMutation({
  args: {
    itemId: v.id("items"),
    eventId: v.union(v.string(), v.null()),
  },
  handler: async (ctx, { itemId, eventId }) => {
    await ctx.db.patch(itemId, {
      googleCalendarEventId: eventId ?? undefined,
    });
  },
});

export const updateUserCalendarSyncToken = internalMutation({
  args: {
    userId: v.id("users"),
    syncToken: v.union(v.string(), v.null()),
  },
  handler: async (ctx, { userId, syncToken }) => {
    await ctx.db.patch(userId, {
      googleCalendarSyncToken: syncToken ?? undefined,
    });
  },
});

export const createItemFromGoogle = internalMutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.optional(v.string()),
    triggerAt: v.number(),
    endAt: v.number(),
    timezone: v.string(),
    updatedAt: v.number(),
    googleCalendarEventId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("items", {
      userId: args.userId,
      type: "task",
      title: args.title,
      body: args.body,
      status: "open",
      isPinned: false,
      isDailyHighlight: false,
      triggerAt: args.triggerAt,
      endAt: args.endAt,
      timezone: args.timezone,
      googleCalendarEventId: args.googleCalendarEventId,
      updatedAt: args.updatedAt,
    });
  },
});

export const updateItemFromGoogle = internalMutation({
  args: {
    itemId: v.id("items"),
    title: v.string(),
    body: v.optional(v.string()),
    triggerAt: v.number(),
    endAt: v.number(),
    timezone: v.string(),
    updatedAt: v.number(),
    googleCalendarEventId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.itemId, {
      title: args.title,
      body: args.body,
      triggerAt: args.triggerAt,
      endAt: args.endAt,
      timezone: args.timezone,
      googleCalendarEventId: args.googleCalendarEventId,
      status: "open",
      updatedAt: args.updatedAt,
    });
  },
});

export const deleteItemFromGoogle = internalMutation({
  args: { itemId: v.id("items") },
  handler: async (ctx, { itemId }) => {
    await ctx.db.delete(itemId);
  },
});
