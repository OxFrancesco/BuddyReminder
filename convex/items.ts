import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all items for the current user
 */
export const getUserItems = query({
  args: {
    type: v.optional(v.union(v.literal("note"), v.literal("reminder"), v.literal("task"))),
    status: v.optional(v.union(v.literal("open"), v.literal("done"), v.literal("archived"))),
  },
  returns: v.array(
    v.object({
      _id: v.id("items"),
      _creationTime: v.number(),
      userId: v.id("users"),
      type: v.union(v.literal("note"), v.literal("reminder"), v.literal("task")),
      title: v.string(),
      body: v.optional(v.string()),
      status: v.union(v.literal("open"), v.literal("done"), v.literal("archived")),
      triggerAt: v.optional(v.number()),
      timezone: v.optional(v.string()),
      repeatRule: v.optional(v.string()),
      snoozeState: v.optional(v.object({
        snoozedUntil: v.number(),
        snoozeCount: v.number(),
      })),
      taskSpec: v.optional(v.object({
        goal: v.string(),
        inputs: v.optional(v.array(v.string())),
        constraints: v.optional(v.array(v.string())),
        allowedTools: v.optional(v.array(v.string())),
        workspacePointers: v.optional(v.array(v.string())),
      })),
      executionPolicy: v.optional(v.union(v.literal("manual"), v.literal("auto"))),
      agentRunIds: v.optional(v.array(v.string())),
    })
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    let items;

    if (args.type && args.status) {
      // If both type and status are provided, we need to filter manually
      const allItems = await ctx.db
        .query("items")
        .withIndex("by_user_and_type", (q) => 
          q.eq("userId", user._id).eq("type", args.type!)
        )
        .order("desc")
        .collect();
      items = allItems.filter(item => item.status === args.status);
    } else if (args.type) {
      items = await ctx.db
        .query("items")
        .withIndex("by_user_and_type", (q) => 
          q.eq("userId", user._id).eq("type", args.type!)
        )
        .order("desc")
        .collect();
    } else if (args.status) {
      items = await ctx.db
        .query("items")
        .withIndex("by_user_and_status", (q) => 
          q.eq("userId", user._id).eq("status", args.status!)
        )
        .order("desc")
        .collect();
    } else {
      items = await ctx.db
        .query("items")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .order("desc")
        .collect();
    }

    return items;
  },
});

/**
 * Create a new item (note, reminder, or task)
 */
export const createItem = mutation({
  args: {
    type: v.union(v.literal("note"), v.literal("reminder"), v.literal("task")),
    title: v.string(),
    body: v.optional(v.string()),
    triggerAt: v.optional(v.number()),
    timezone: v.optional(v.string()),
    repeatRule: v.optional(v.string()),
    taskSpec: v.optional(v.object({
      goal: v.string(),
      inputs: v.optional(v.array(v.string())),
      constraints: v.optional(v.array(v.string())),
      allowedTools: v.optional(v.array(v.string())),
      workspacePointers: v.optional(v.array(v.string())),
    })),
    executionPolicy: v.optional(v.union(v.literal("manual"), v.literal("auto"))),
  },
  returns: v.id("items"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    return await ctx.db.insert("items", {
      userId: user._id,
      type: args.type,
      title: args.title,
      body: args.body,
      status: "open",
      triggerAt: args.triggerAt,
      timezone: args.timezone,
      repeatRule: args.repeatRule,
      taskSpec: args.taskSpec,
      executionPolicy: args.executionPolicy || "manual",
      agentRunIds: [],
    });
  },
});

/**
 * Update an item's status
 */
export const updateItemStatus = mutation({
  args: {
    itemId: v.id("items"),
    status: v.union(v.literal("open"), v.literal("done"), v.literal("archived")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const item = await ctx.db.get(args.itemId);
    if (!item) {
      throw new Error("Item not found");
    }

    if (item.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.itemId, {
      status: args.status,
    });

    return null;
  },
});

/**
 * Delete an item
 */
export const deleteItem = mutation({
  args: {
    itemId: v.id("items"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const item = await ctx.db.get(args.itemId);
    if (!item) {
      throw new Error("Item not found");
    }

    if (item.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.itemId);
    return null;
  },
});
