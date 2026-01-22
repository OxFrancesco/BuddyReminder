import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Query to get artifacts for a specific agent run
 */
export const getArtifactsForRun = query({
  args: { runId: v.id("agentRuns") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const run = await ctx.db.get(args.runId);
    if (!run || run.userId !== user._id) throw new Error("Unauthorized");

    return await ctx.db
      .query("artifacts")
      .withIndex("by_run", (q) => q.eq("runId", args.runId))
      .collect();
  },
});

/**
 * Mutation to create an artifact record
 */
export const createArtifact = mutation({
  args: {
    runId: v.id("agentRuns"),
    filename: v.string(),
    fileType: v.union(
      v.literal("code"),
      v.literal("image"),
      v.literal("json"),
      v.literal("text"),
      v.literal("other")
    ),
    storageId: v.id("_storage"),
    size: v.number(),
    mimeType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const run = await ctx.db.get(args.runId);
    if (!run || run.userId !== user._id) throw new Error("Unauthorized");

    return await ctx.db.insert("artifacts", {
      runId: args.runId,
      userId: user._id,
      filename: args.filename,
      fileType: args.fileType,
      storageId: args.storageId,
      size: args.size,
      mimeType: args.mimeType,
    });
  },
});

/**
 * Mutation to generate upload URL for artifact
 */
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Query to get download URL for artifact
 */
export const getArtifactUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

/**
 * Helper to detect file type from filename
 */
export function detectFileType(filename: string): "code" | "image" | "json" | "text" | "other" {
  const ext = filename.split(".").pop()?.toLowerCase();
  
  const codeExts = ["js", "ts", "tsx", "jsx", "py", "java", "cpp", "c", "go", "rs", "rb", "php", "swift", "kt"];
  const imageExts = ["png", "jpg", "jpeg", "gif", "svg", "webp"];
  const textExts = ["txt", "md", "log"];
  
  if (ext === "json") return "json";
  if (codeExts.includes(ext || "")) return "code";
  if (imageExts.includes(ext || "")) return "image";
  if (textExts.includes(ext || "")) return "text";
  
  return "other";
}
