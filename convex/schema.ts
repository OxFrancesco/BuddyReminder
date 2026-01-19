import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  }).index("by_clerk_id", ["clerkId"]),

  items: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("note"), v.literal("reminder"), v.literal("task")),
    title: v.string(),
    body: v.optional(v.string()),
    status: v.union(v.literal("open"), v.literal("done"), v.literal("archived")),
    
    // Reminder fields
    triggerAt: v.optional(v.number()),
    timezone: v.optional(v.string()),
    repeatRule: v.optional(v.string()),
    snoozeState: v.optional(v.object({
      snoozedUntil: v.number(),
      snoozeCount: v.number(),
    })),
    
    // Task fields
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
    .index("by_user", ["userId"])
    .index("by_user_and_type", ["userId", "type"])
    .index("by_user_and_status", ["userId", "status"])
    .index("by_trigger_time", ["triggerAt"]),

  agentRuns: defineTable({
    taskId: v.id("items"),
    userId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    summary: v.optional(v.string()),
    logsRef: v.optional(v.string()),
    artifactsRef: v.optional(v.array(v.string())),
    cost: v.optional(v.number()),
    error: v.optional(v.string()),
    startedAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
  })
    .index("by_task", ["taskId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  attachments: defineTable({
    itemId: v.id("items"),
    userId: v.id("users"),
    type: v.union(v.literal("image"), v.literal("voice"), v.literal("file"), v.literal("link")),
    fileId: v.optional(v.id("_storage")),
    url: v.optional(v.string()),
    metadata: v.optional(v.object({
      filename: v.optional(v.string()),
      size: v.optional(v.number()),
      mimeType: v.optional(v.string()),
    })),
  })
    .index("by_item", ["itemId"])
    .index("by_user", ["userId"]),
});
