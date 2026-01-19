import { query, mutation, action, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const DAYTONA_API_URL = "https://app.daytona.io/api/v1";
const OPENCODE_PORT = 3000;

// Helper to make Daytona API calls
async function daytonaFetch(
  endpoint: string,
  apiKey: string,
  options: RequestInit = {}
): Promise<any> {
  const response = await fetch(`${DAYTONA_API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Daytona API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// Type for agent run status
type AgentRunStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

// Type for agent run
interface AgentRun {
  _id: Id<"agentRuns">;
  _creationTime: number;
  taskId: Id<"items">;
  userId: Id<"users">;
  status: AgentRunStatus;
  summary?: string;
  logsRef?: string;
  artifactsRef?: string[];
  cost?: number;
  error?: string;
  startedAt?: number;
  endedAt?: number;
  sandboxId?: string;
  previewUrl?: string;
  sessionId?: string;
}

/**
 * Query to get agent runs for a specific task
 */
export const getAgentRunsForTask = query({
  args: { taskId: v.id("items") },
  handler: async (ctx, args): Promise<AgentRun[]> => {
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

    const runs = await ctx.db
      .query("agentRuns")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .order("desc")
      .collect();

    // Only return runs for this user
    return runs.filter((run) => run.userId === user._id) as AgentRun[];
  },
});

/**
 * Query to get all active agent runs for the current user
 */
export const getActiveAgentRuns = query({
  args: {},
  handler: async (ctx): Promise<Pick<AgentRun, "_id" | "_creationTime" | "taskId" | "userId" | "status" | "summary" | "previewUrl" | "sandboxId">[]> => {
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

    const runs = await ctx.db
      .query("agentRuns")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    // Only return running or pending runs
    return runs
      .filter((run) => run.status === "running" || run.status === "pending")
      .map((run) => ({
        _id: run._id,
        _creationTime: run._creationTime,
        taskId: run.taskId,
        userId: run.userId,
        status: run.status as AgentRunStatus,
        summary: run.summary,
        previewUrl: run.previewUrl,
        sandboxId: run.sandboxId,
      }));
  },
});

/**
 * Public mutation to create an agent run record
 */
export const createAgentRun = mutation({
  args: {
    taskId: v.id("items"),
  },
  handler: async (ctx, args): Promise<Id<"agentRuns">> => {
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

    // Verify the task exists and belongs to the user
    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== user._id) {
      throw new Error("Task not found or unauthorized");
    }

    if (task.type !== "task") {
      throw new Error("Can only run agents on task items");
    }

    const runId = await ctx.db.insert("agentRuns", {
      taskId: args.taskId,
      userId: user._id,
      status: "pending",
      startedAt: Date.now(),
    });

    // Update the task with the new run ID
    const existingRunIds = task.agentRunIds || [];
    await ctx.db.patch(args.taskId, {
      agentRunIds: [...existingRunIds, runId],
    });

    return runId;
  },
});

/**
 * Internal mutation to update an agent run (called from actions)
 */
export const internalUpdateAgentRun = internalMutation({
  args: {
    runId: v.id("agentRuns"),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("running"),
        v.literal("completed"),
        v.literal("failed"),
        v.literal("cancelled")
      )
    ),
    sandboxId: v.optional(v.string()),
    previewUrl: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    summary: v.optional(v.string()),
    error: v.optional(v.string()),
    endedAt: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<null> => {
    const run = await ctx.db.get(args.runId);
    if (!run) {
      throw new Error("Agent run not found");
    }

    const updates: Record<string, unknown> = {};
    if (args.status !== undefined) updates.status = args.status;
    if (args.sandboxId !== undefined) updates.sandboxId = args.sandboxId;
    if (args.previewUrl !== undefined) updates.previewUrl = args.previewUrl;
    if (args.sessionId !== undefined) updates.sessionId = args.sessionId;
    if (args.summary !== undefined) updates.summary = args.summary;
    if (args.error !== undefined) updates.error = args.error;
    if (args.endedAt !== undefined) updates.endedAt = args.endedAt;

    await ctx.db.patch(args.runId, updates);
    return null;
  },
});

/**
 * Public mutation to update an agent run (for client-side calls)
 */
export const updateAgentRun = mutation({
  args: {
    runId: v.id("agentRuns"),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("running"),
        v.literal("completed"),
        v.literal("failed"),
        v.literal("cancelled")
      )
    ),
    sandboxId: v.optional(v.string()),
    previewUrl: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    summary: v.optional(v.string()),
    error: v.optional(v.string()),
    endedAt: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const run = await ctx.db.get(args.runId);
    if (!run) {
      throw new Error("Agent run not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || run.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    const updates: Record<string, unknown> = {};
    if (args.status !== undefined) updates.status = args.status;
    if (args.sandboxId !== undefined) updates.sandboxId = args.sandboxId;
    if (args.previewUrl !== undefined) updates.previewUrl = args.previewUrl;
    if (args.sessionId !== undefined) updates.sessionId = args.sessionId;
    if (args.summary !== undefined) updates.summary = args.summary;
    if (args.error !== undefined) updates.error = args.error;
    if (args.endedAt !== undefined) updates.endedAt = args.endedAt;

    await ctx.db.patch(args.runId, updates);
    return null;
  },
});

/**
 * Internal query to get user ID from Clerk ID
 */
export const internalGetUserByClerkId = internalQuery({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"users"> | null> => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    return user?._id ?? null;
  },
});

/**
 * Internal mutation to create an agent run (called from actions)
 */
export const internalCreateAgentRun = internalMutation({
  args: {
    taskId: v.id("items"),
    userId: v.id("users"),
  },
  handler: async (ctx, args): Promise<Id<"agentRuns">> => {
    // Verify the task exists
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    if (task.type !== "task") {
      throw new Error("Can only run agents on task items");
    }

    const runId = await ctx.db.insert("agentRuns", {
      taskId: args.taskId,
      userId: args.userId,
      status: "pending",
      startedAt: Date.now(),
    });

    // Update the task with the new run ID
    const existingRunIds = task.agentRunIds || [];
    await ctx.db.patch(args.taskId, {
      agentRunIds: [...existingRunIds, runId],
    });

    return runId;
  },
});

/**
 * Action to spawn a Daytona sandbox with OpenCode
 */
export const spawnDaytonaSandbox = action({
  args: {
    taskId: v.id("items"),
    taskGoal: v.string(),
  },
  handler: async (ctx, args): Promise<{
    runId: Id<"agentRuns">;
    previewUrl: string;
    sandboxId: string;
  }> => {
    const apiKey = process.env.DAYTONA_API_KEY;
    if (!apiKey) {
      throw new Error("DAYTONA_API_KEY environment variable is not set");
    }

    // Get the user identity to pass to internal mutation
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get the user ID from Clerk ID
    const userId = await ctx.runQuery(internal.agent.internalGetUserByClerkId, {
      clerkId: identity.subject,
    });

    if (!userId) {
      throw new Error("User not found");
    }

    // Create the agent run
    const runId = await ctx.runMutation(internal.agent.internalCreateAgentRun, {
      taskId: args.taskId,
      userId,
    });

    try {
      // Update status to running
      await ctx.runMutation(internal.agent.internalUpdateAgentRun, {
        runId,
        status: "running",
      });

      // Step 1: Create a sandbox
      const sandbox = await daytonaFetch("/sandboxes", apiKey, {
        method: "POST",
        body: JSON.stringify({}),
      });

      const sandboxId = sandbox.id as string;

      // Update run with sandbox ID
      await ctx.runMutation(internal.agent.internalUpdateAgentRun, {
        runId,
        sandboxId,
      });

      // Step 2: Install OpenCode
      await daytonaFetch(`/sandboxes/${sandboxId}/process/exec`, apiKey, {
        method: "POST",
        body: JSON.stringify({
          command: "npm i -g opencode-ai@1.1.1",
        }),
      });

      // Step 3: Get preview link
      const previewLinkResponse = await daytonaFetch(
        `/sandboxes/${sandboxId}/preview/${OPENCODE_PORT}`,
        apiKey,
        { method: "GET" }
      );
      const previewUrl = previewLinkResponse.url as string;

      // Step 4: Create session and start OpenCode
      const sessionId = `opencode-session-${Date.now()}`;
      await daytonaFetch(`/sandboxes/${sandboxId}/process/sessions`, apiKey, {
        method: "POST",
        body: JSON.stringify({
          sessionId,
        }),
      });

      // Build system prompt with task context
      const systemPrompt = [
        "You are running in a Daytona sandbox.",
        "Use the /home/daytona directory instead of /workspace for file operations.",
        `Your task goal is: ${args.taskGoal}`,
        "When starting a server, start it in the background with & so the command does not block further instructions.",
      ].join(" ");

      const opencodeConfig = {
        $schema: "https://opencode.ai/config.json",
        default_agent: "daytona",
        agent: {
          daytona: {
            description: "Daytona sandbox-aware coding agent",
            mode: "primary",
            prompt: systemPrompt,
          },
        },
      };

      const configJson = JSON.stringify(opencodeConfig);
      const base64Config = Buffer.from(configJson).toString("base64");
      const envVarCommand = `OPENCODE_CONFIG_CONTENT=$(echo '${base64Config}' | base64 -d)`;

      // Start OpenCode web server
      await daytonaFetch(
        `/sandboxes/${sandboxId}/process/sessions/${sessionId}/exec`,
        apiKey,
        {
          method: "POST",
          body: JSON.stringify({
            command: `${envVarCommand} opencode web --port ${OPENCODE_PORT}`,
            runAsync: true,
          }),
        }
      );

      // Update run with preview URL and session ID
      await ctx.runMutation(internal.agent.internalUpdateAgentRun, {
        runId,
        previewUrl,
        sessionId,
        summary: `OpenCode sandbox running for: ${args.taskGoal}`,
      });

      return {
        runId,
        previewUrl,
        sandboxId,
      };
    } catch (error) {
      // Mark the run as failed
      await ctx.runMutation(internal.agent.internalUpdateAgentRun, {
        runId,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        endedAt: Date.now(),
      });
      throw error;
    }
  },
});

/**
 * Action to stop a Daytona sandbox
 */
export const stopDaytonaSandbox = action({
  args: {
    runId: v.id("agentRuns"),
    sandboxId: v.string(),
  },
  handler: async (ctx, args): Promise<null> => {
    const apiKey = process.env.DAYTONA_API_KEY;
    if (!apiKey) {
      throw new Error("DAYTONA_API_KEY environment variable is not set");
    }

    try {
      // Delete the sandbox
      await daytonaFetch(`/sandboxes/${args.sandboxId}`, apiKey, {
        method: "DELETE",
      });

      // Update the run status
      await ctx.runMutation(internal.agent.internalUpdateAgentRun, {
        runId: args.runId,
        status: "completed",
        endedAt: Date.now(),
      });
    } catch (error) {
      await ctx.runMutation(internal.agent.internalUpdateAgentRun, {
        runId: args.runId,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        endedAt: Date.now(),
      });
      throw error;
    }

    return null;
  },
});
