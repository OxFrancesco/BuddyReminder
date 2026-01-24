import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Alarm configuration validator (reusable)
const alarmConfigValidator = v.object({
  enabled: v.boolean(),
  dismissMethod: v.union(v.literal("nfc"), v.literal("code"), v.literal("either")),
  registeredNfcTagId: v.optional(v.string()),
  dismissCode: v.optional(v.string()),
  soundId: v.optional(v.string()),
});

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
    isPinned: v.optional(v.boolean()),
    isDailyHighlight: v.optional(v.boolean()),

    // Reminder fields
    triggerAt: v.optional(v.number()),
    timezone: v.optional(v.string()),
    repeatRule: v.optional(v.string()),
    snoozeState: v.optional(v.object({
      snoozedUntil: v.number(),
      snoozeCount: v.number(),
    })),

    // Alarm configuration (for reminders with alarm mode)
    alarmConfig: v.optional(alarmConfigValidator),

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

    // Calendar sync
    googleCalendarEventId: v.optional(v.string()),

    updatedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_type", ["userId", "type"])
    .index("by_user_and_status", ["userId", "status"])
    .index("by_trigger_time", ["triggerAt"]),

  // NFC tags registered by users for alarm dismissal
  nfcTags: defineTable({
    userId: v.id("users"),
    tagId: v.string(),
    label: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_tag_id", ["tagId"]),

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
