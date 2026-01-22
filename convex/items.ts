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
      isPinned: v.optional(v.boolean()),
      isDailyHighlight: v.optional(v.boolean()),
      triggerAt: v.optional(v.number()),
      timezone: v.optional(v.string()),
      repeatRule: v.optional(v.string()),
      updatedAt: v.optional(v.number()),
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
    isPinned: v.optional(v.boolean()),
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

    const now = Date.now();
    return await ctx.db.insert("items", {
      userId: user._id,
      type: args.type,
      title: args.title,
      body: args.body,
      status: "open",
      isPinned: args.isPinned,
      triggerAt: args.triggerAt,
      timezone: args.timezone,
      repeatRule: args.repeatRule,
      taskSpec: args.taskSpec,
      executionPolicy: args.executionPolicy || "manual",
      agentRunIds: [],
      updatedAt: now,
    });
  },
});

/**
 * Update an item (basic fields only - for backwards compatibility)
 */
export const updateItem = mutation({
  args: {
    itemId: v.id("items"),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
    triggerAt: v.optional(v.number()),
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

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.title !== undefined) updates.title = args.title;
    if (args.body !== undefined) updates.body = args.body;
    if (args.triggerAt !== undefined) updates.triggerAt = args.triggerAt;

    await ctx.db.patch(args.itemId, updates);
    return null;
  },
});

/**
 * Update an item with all fields (used by sync engine)
 */
export const updateItemFull = mutation({
  args: {
    itemId: v.id("items"),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
    status: v.optional(v.union(v.literal("open"), v.literal("done"), v.literal("archived"))),
    isPinned: v.optional(v.boolean()),
    isDailyHighlight: v.optional(v.boolean()),
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

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.title !== undefined) updates.title = args.title;
    if (args.body !== undefined) updates.body = args.body;
    if (args.status !== undefined) updates.status = args.status;
    if (args.isPinned !== undefined) updates.isPinned = args.isPinned;
    if (args.isDailyHighlight !== undefined) updates.isDailyHighlight = args.isDailyHighlight;
    if (args.triggerAt !== undefined) updates.triggerAt = args.triggerAt;
    if (args.timezone !== undefined) updates.timezone = args.timezone;
    if (args.repeatRule !== undefined) updates.repeatRule = args.repeatRule;
    if (args.snoozeState !== undefined) updates.snoozeState = args.snoozeState;
    if (args.taskSpec !== undefined) updates.taskSpec = args.taskSpec;
    if (args.executionPolicy !== undefined) updates.executionPolicy = args.executionPolicy;

    await ctx.db.patch(args.itemId, updates);
    return null;
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
      updatedAt: Date.now(),
    });

    return null;
  },
});

/**
 * Toggle item pin status
 */
export const toggleItemPin = mutation({
  args: {
    itemId: v.id("items"),
    isPinned: v.boolean(),
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
      isPinned: args.isPinned,
      updatedAt: Date.now(),
    });

    return null;
  },
});

/**
 * Toggle item daily highlight status
 */
export const toggleItemDailyHighlight = mutation({
  args: {
    itemId: v.id("items"),
    isDailyHighlight: v.boolean(),
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
      isDailyHighlight: args.isDailyHighlight,
      updatedAt: Date.now(),
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
