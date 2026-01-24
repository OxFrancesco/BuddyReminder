import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all NFC tags for the current user
 */
export const getUserTags = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("nfcTags"),
      _creationTime: v.number(),
      userId: v.id("users"),
      tagId: v.string(),
      label: v.string(),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx) => {
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

    const tags = await ctx.db
      .query("nfcTags")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return tags;
  },
});

/**
 * Get a single NFC tag by its tag ID
 */
export const getTagByTagId = query({
  args: {
    tagId: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("nfcTags"),
      _creationTime: v.number(),
      userId: v.id("users"),
      tagId: v.string(),
      label: v.string(),
      createdAt: v.number(),
    }),
    v.null()
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

    const tag = await ctx.db
      .query("nfcTags")
      .withIndex("by_tag_id", (q) => q.eq("tagId", args.tagId))
      .first();

    // Only return if the tag belongs to the current user
    if (tag && tag.userId === user._id) {
      return tag;
    }

    return null;
  },
});

/**
 * Register a new NFC tag
 */
export const registerTag = mutation({
  args: {
    tagId: v.string(),
    label: v.string(),
  },
  returns: v.id("nfcTags"),
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

    // Check if tag is already registered by this user
    const existingTag = await ctx.db
      .query("nfcTags")
      .withIndex("by_tag_id", (q) => q.eq("tagId", args.tagId))
      .first();

    if (existingTag && existingTag.userId === user._id) {
      throw new Error("This tag is already registered");
    }

    const now = Date.now();
    return await ctx.db.insert("nfcTags", {
      userId: user._id,
      tagId: args.tagId,
      label: args.label,
      createdAt: now,
    });
  },
});

/**
 * Update an NFC tag's label
 */
export const updateTagLabel = mutation({
  args: {
    tagDocId: v.id("nfcTags"),
    label: v.string(),
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

    const tag = await ctx.db.get(args.tagDocId);
    if (!tag) {
      throw new Error("Tag not found");
    }

    if (tag.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.tagDocId, {
      label: args.label,
    });

    return null;
  },
});

/**
 * Delete an NFC tag
 */
export const deleteTag = mutation({
  args: {
    tagDocId: v.id("nfcTags"),
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

    const tag = await ctx.db.get(args.tagDocId);
    if (!tag) {
      throw new Error("Tag not found");
    }

    if (tag.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.tagDocId);
    return null;
  },
});

/**
 * Verify that a scanned tag ID matches the expected tag for alarm dismissal
 */
export const verifyTag = query({
  args: {
    scannedTagId: v.string(),
    expectedTagId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Simple comparison - the scanned tag ID should match the expected tag ID
    return args.scannedTagId === args.expectedTagId;
  },
});
