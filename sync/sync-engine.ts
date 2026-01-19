import { ConvexReactClient } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import {
  getPendingChanges,
  markAsSynced,
  upsertFromRemote,
  hardDeleteItem,
  getItemByConvexId,
} from '@/db/items-repository';
import { LocalItem } from '@/db/types';

export interface SyncResult {
  pushed: number;
  pulled: number;
  errors: string[];
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
        await markAsSynced(item.id, convexId);
        pushed++;
      } else {
        // Existing item - update in Convex
        await convex.mutation(api.items.updateItem, {
          itemId: item.convexId as Id<'items'>,
          title: item.title,
          body: item.body || undefined,
          triggerAt: item.triggerAt || undefined,
        });

        // Update status if changed
        await convex.mutation(api.items.updateItemStatus, {
          itemId: item.convexId as Id<'items'>,
          status: item.status,
        });

        // Update pin status
        await convex.mutation(api.items.toggleItemPin, {
          itemId: item.convexId as Id<'items'>,
          isPinned: item.isPinned,
        });

        // Update daily highlight
        await convex.mutation(api.items.toggleItemDailyHighlight, {
          itemId: item.convexId as Id<'items'>,
          isDailyHighlight: item.isDailyHighlight,
        });

        await markAsSynced(item.id, item.convexId);
        pushed++;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Failed to sync item ${item.id}: ${message}`);
      console.error('Sync error for item:', item.id, error);
    }
  }

  return { pushed, errors };
}

// Pull changes from Convex
export async function pullChanges(
  convex: ConvexReactClient,
  clerkUserId: string
): Promise<{ pulled: number; errors: string[] }> {
  let pulled = 0;
  const errors: string[] = [];

  try {
    // Fetch all items from Convex
    const remoteItems = await convex.query(api.items.getUserItems, {});

    for (const remoteItem of remoteItems) {
      try {
        await upsertFromRemote({
          convexId: remoteItem._id,
          clerkUserId: clerkUserId,
          type: remoteItem.type,
          title: remoteItem.title,
          body: remoteItem.body,
          status: remoteItem.status,
          isPinned: remoteItem.isPinned,
          isDailyHighlight: undefined, // Add if exists in remote
          triggerAt: remoteItem.triggerAt,
          timezone: remoteItem.timezone,
          repeatRule: remoteItem.repeatRule,
          snoozeState: remoteItem.snoozeState,
          taskSpec: remoteItem.taskSpec,
          executionPolicy: remoteItem.executionPolicy,
          createdAt: remoteItem._creationTime,
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

  return { pulled, errors };
}

// Full sync - push then pull
export async function syncAll(
  convex: ConvexReactClient,
  clerkUserId: string
): Promise<SyncResult> {
  // Push first to ensure local changes don't get overwritten
  const pushResult = await pushChanges(convex, clerkUserId);

  // Then pull remote changes
  const pullResult = await pullChanges(convex, clerkUserId);

  return {
    pushed: pushResult.pushed,
    pulled: pullResult.pulled,
    errors: [...pushResult.errors, ...pullResult.errors],
  };
}
