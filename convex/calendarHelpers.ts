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
