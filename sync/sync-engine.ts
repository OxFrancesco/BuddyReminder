import { ConvexReactClient } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import {
  getPendingChanges,
  markAsSynced,
  upsertFromRemote,
  hardDeleteItem,
  getItemByConvexId,
  getAllSyncedConvexIds,
  softDeleteByConvexId,
} from '@/db/items-repository';
import { LocalItem } from '@/db/types';
import { logger } from '@/lib/logger';

export interface SyncResult {
  pushed: number;
  pulled: number;
  deleted: number;
  errors: string[];
}

// Check if user exists in Convex, return true if exists
async function ensureUserExists(convex: ConvexReactClient): Promise<boolean> {
  try {
    const user = await convex.query(api.users.getCurrentUser, {});
    return user !== null;
  } catch {
    return false;
  }
}

// Push local changes to Convex
export async function pushChanges(
  convex: ConvexReactClient,
  clerkUserId: string
): Promise<{ pushed: number; errors: string[] }> {
  const pending = await getPendingChanges(clerkUserId);
  let pushed = 0;
  const errors: string[] = [];

  for (const item of pending) {
    try {
      if (item.deletedAt) {
        // Handle deletion
        if (item.convexId) {
          await convex.mutation(api.items.deleteItem, {
            itemId: item.convexId as Id<'items'>,
          });
        }
        // Hard delete from local after successful sync
        await hardDeleteItem(item.id);
        pushed++;
      } else if (!item.convexId) {
        // New item - create in Convex
        const convexId = await convex.mutation(api.items.createItem, {
          type: item.type,
          title: item.title,
          body: item.body || undefined,
          isPinned: item.isPinned || undefined,
          triggerAt: item.triggerAt || undefined,
          timezone: item.timezone || undefined,
          repeatRule: item.repeatRule || undefined,
          taskSpec: item.taskSpec || undefined,
          executionPolicy: item.executionPolicy || undefined,
        });
        await markAsSynced(item.id, convexId, item.updatedAt);
        pushed++;
      } else {
        // Existing item - update in Convex with single mutation
        await convex.mutation(api.items.updateItemFull, {
          itemId: item.convexId as Id<'items'>,
          title: item.title,
          body: item.body || undefined,
          status: item.status,
          isPinned: item.isPinned,
          isDailyHighlight: item.isDailyHighlight,
          triggerAt: item.triggerAt || undefined,
          timezone: item.timezone || undefined,
          repeatRule: item.repeatRule || undefined,
          snoozeState: item.snoozeState || undefined,
          taskSpec: item.taskSpec || undefined,
          executionPolicy: item.executionPolicy || undefined,
        });

        await markAsSynced(item.id, item.convexId, item.updatedAt);
        pushed++;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Failed to sync item ${item.id}: ${message}`);
      logger.error('Sync error for item:', item.id, error);
    }
  }

  return { pushed, errors };
}

// Pull changes from Convex
export async function pullChanges(
  convex: ConvexReactClient,
  clerkUserId: string
): Promise<{ pulled: number; deleted: number; errors: string[] }> {
  let pulled = 0;
  let deleted = 0;
  const errors: string[] = [];

  try {
    // Fetch all items from Convex
    const remoteItems = await convex.query(api.items.getUserItems, {});
    const remoteConvexIds = new Set(remoteItems.map((item) => item._id as string));

    // Get all local items that have been synced (have a convexId)
    const localSyncedIds = await getAllSyncedConvexIds(clerkUserId);

    // Detect remote deletions: items that exist locally but not remotely
    for (const localConvexId of localSyncedIds) {
      if (!remoteConvexIds.has(localConvexId)) {
        try {
          await softDeleteByConvexId(localConvexId);
          deleted++;
          logger.debug('[SyncEngine] Detected remote deletion:', localConvexId);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to delete locally ${localConvexId}: ${message}`);
        }
      }
    }

    // Upsert remote items
    for (const remoteItem of remoteItems) {
      try {
        const remoteUpdatedAt = (remoteItem as { updatedAt?: number }).updatedAt;
        await upsertFromRemote({
          convexId: remoteItem._id,
          clerkUserId: clerkUserId,
          type: remoteItem.type,
          title: remoteItem.title,
          body: remoteItem.body,
          status: remoteItem.status,
          isPinned: remoteItem.isPinned,
          isDailyHighlight: remoteItem.isDailyHighlight,
          triggerAt: remoteItem.triggerAt,
          timezone: remoteItem.timezone,
          repeatRule: remoteItem.repeatRule,
          snoozeState: remoteItem.snoozeState,
          taskSpec: remoteItem.taskSpec,
          executionPolicy: remoteItem.executionPolicy,
          createdAt: remoteItem._creationTime,
          updatedAt: remoteUpdatedAt,
        });
        pulled++;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to pull item ${remoteItem._id}: ${message}`);
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Failed to fetch remote items: ${message}`);
  }

  return { pulled, deleted, errors };
}

// Full sync - push then pull
export async function syncAll(
  convex: ConvexReactClient,
  clerkUserId: string
): Promise<SyncResult> {
  // Ensure user exists in Convex before attempting sync
  const userExists = await ensureUserExists(convex);
  if (!userExists) {
    logger.warn('[SyncEngine] User not found in Convex, skipping sync');
    return {
      pushed: 0,
      pulled: 0,
      deleted: 0,
      errors: ['User not found in Convex - sync skipped'],
    };
  }

  // Push first to ensure local changes don't get overwritten
  const pushResult = await pushChanges(convex, clerkUserId);

  // Then pull remote changes
  const pullResult = await pullChanges(convex, clerkUserId);

  return {
    pushed: pushResult.pushed,
    pulled: pullResult.pulled,
    deleted: pullResult.deleted,
    errors: [...pushResult.errors, ...pullResult.errors],
  };
}
