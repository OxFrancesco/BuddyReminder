import * as Crypto from 'expo-crypto';
import { getDatabase, rowToItem } from './database';
import {
  LocalItem,
  CreateItemInput,
  UpdateItemInput,
  ItemType,
  ItemStatus,
  SyncStatus,
} from './types';
import { logger } from '@/lib/logger';

// Event emitter for reactivity
type ItemChangeListener = () => void;
const listeners: Set<ItemChangeListener> = new Set();

export function subscribeToItemChanges(listener: ItemChangeListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners() {
  logger.debug('[Repository] notifyListeners called', { listenerCount: listeners.size });
  listeners.forEach((listener) => listener());
}

const areJsonEqual = (left: unknown, right: unknown) => {
  if (left === right) return true;
  if (left == null || right == null) return false;
  try {
    return JSON.stringify(left) === JSON.stringify(right);
  } catch {
    return false;
  }
};

// Create
export async function createItem(input: CreateItemInput): Promise<LocalItem> {
  const db = await getDatabase();
  const now = Date.now();
  const id = Crypto.randomUUID();
  const endAt =
    input.endAt ??
    (input.triggerAt !== undefined ? input.triggerAt + 3600000 : null);

  const item: LocalItem = {
    id,
    convexId: null,
    clerkUserId: input.clerkUserId,
    type: input.type,
    title: input.title,
    body: input.body || null,
    status: 'open',
    isPinned: input.isPinned || false,
    isDailyHighlight: input.isDailyHighlight || false,
    triggerAt: input.triggerAt || null,
    endAt,
    timezone: input.timezone || null,
    repeatRule: input.repeatRule || null,
    snoozeState: null,
    alarmConfig: input.alarmConfig || null,
    taskSpec: input.taskSpec || null,
    executionPolicy: input.executionPolicy || null,
    notificationId: null,
    googleCalendarEventId: null,
    syncStatus: 'pending',
    createdAt: now,
    updatedAt: now,
    syncedAt: null,
    deletedAt: null,
  };

  await db.runAsync(
    `INSERT INTO items (
      id, convexId, clerkUserId, type, title, body, status,
      isPinned, isDailyHighlight, triggerAt, endAt, timezone, repeatRule,
      snoozeState, alarmConfig, taskSpec, executionPolicy, notificationId, googleCalendarEventId,
      syncStatus, createdAt, updatedAt, syncedAt, deletedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item.id,
      item.convexId,
      item.clerkUserId,
      item.type,
      item.title,
      item.body,
      item.status,
      item.isPinned ? 1 : 0,
      item.isDailyHighlight ? 1 : 0,
      item.triggerAt,
      item.endAt,
      item.timezone,
      item.repeatRule,
      item.snoozeState ? JSON.stringify(item.snoozeState) : null,
      item.alarmConfig ? JSON.stringify(item.alarmConfig) : null,
      item.taskSpec ? JSON.stringify(item.taskSpec) : null,
      item.executionPolicy,
      item.notificationId,
      item.googleCalendarEventId,
      item.syncStatus,
      item.createdAt,
      item.updatedAt,
      item.syncedAt,
      item.deletedAt,
    ]
  );

  notifyListeners();
  return item;
}

// Read
export async function getItemById(id: string): Promise<LocalItem | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM items WHERE id = ? AND deletedAt IS NULL',
    [id]
  );
  const item = row ? rowToItem(row) : null;
  logger.debug('[Repository] getItemById', { id, found: !!item, body: item?.body, isDailyHighlight: item?.isDailyHighlight });
  return item;
}

export async function getItemByConvexId(convexId: string): Promise<LocalItem | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM items WHERE convexId = ? AND deletedAt IS NULL',
    [convexId]
  );
  return row ? rowToItem(row) : null;
}

export async function getItemsByUser(
  clerkUserId: string,
  options?: {
    type?: ItemType;
    status?: ItemStatus;
    includeArchived?: boolean;
  }
): Promise<LocalItem[]> {
  const db = await getDatabase();

  let query = 'SELECT * FROM items WHERE clerkUserId = ? AND deletedAt IS NULL';
  const params: (string | number)[] = [clerkUserId];

  if (options?.type) {
    query += ' AND type = ?';
    params.push(options.type);
  }

  if (options?.status) {
    query += ' AND status = ?';
    params.push(options.status);
  } else if (!options?.includeArchived) {
    query += ' AND status != ?';
    params.push('archived');
  }

  query += ' ORDER BY createdAt DESC';

  const rows = await db.getAllAsync<Record<string, unknown>>(query, params);
  return rows.map(rowToItem);
}

export async function getPinnedItems(clerkUserId: string): Promise<LocalItem[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM items WHERE clerkUserId = ? AND isPinned = 1 AND deletedAt IS NULL AND status = ?',
    [clerkUserId, 'open']
  );
  return rows.map(rowToItem);
}

// Update
export async function updateItem(
  id: string,
  updates: UpdateItemInput
): Promise<LocalItem | null> {
  logger.debug('[Repository] updateItem called', { id, updates });
  const db = await getDatabase();
  const existing = await getItemById(id);
  if (!existing) {
    return null;
  }

  const setClauses: string[] = [];
  const params: (string | number | null)[] = [];

  let computedEndAt: number | null | undefined;
  if (updates.triggerAt !== undefined && updates.endAt === undefined) {
    if (updates.triggerAt === null) {
      computedEndAt = null;
    } else if (
      existing.endAt !== null &&
      existing.triggerAt !== null &&
      existing.endAt > existing.triggerAt
    ) {
      const duration = existing.endAt - existing.triggerAt;
      computedEndAt = updates.triggerAt + duration;
    } else {
      computedEndAt = updates.triggerAt + 3600000;
    }
  }

  if (updates.title !== undefined && updates.title !== existing.title) {
    setClauses.push('title = ?');
    params.push(updates.title);
  }
  if (updates.body !== undefined && updates.body !== existing.body) {
    setClauses.push('body = ?');
    params.push(updates.body);
  }
  if (updates.status !== undefined && updates.status !== existing.status) {
    setClauses.push('status = ?');
    params.push(updates.status);
  }
  if (updates.isPinned !== undefined && updates.isPinned !== existing.isPinned) {
    setClauses.push('isPinned = ?');
    params.push(updates.isPinned ? 1 : 0);
  }
  if (updates.isDailyHighlight !== undefined && updates.isDailyHighlight !== existing.isDailyHighlight) {
    setClauses.push('isDailyHighlight = ?');
    params.push(updates.isDailyHighlight ? 1 : 0);
  }
  if (updates.triggerAt !== undefined && updates.triggerAt !== existing.triggerAt) {
    setClauses.push('triggerAt = ?');
    params.push(updates.triggerAt);
  }
  if (updates.endAt !== undefined && updates.endAt !== existing.endAt) {
    setClauses.push('endAt = ?');
    params.push(updates.endAt);
  } else if (computedEndAt !== undefined && computedEndAt !== existing.endAt) {
    setClauses.push('endAt = ?');
    params.push(computedEndAt);
  }
  if (updates.snoozeState !== undefined && !areJsonEqual(updates.snoozeState, existing.snoozeState)) {
    setClauses.push('snoozeState = ?');
    params.push(updates.snoozeState ? JSON.stringify(updates.snoozeState) : null);
  }
  if (updates.alarmConfig !== undefined && !areJsonEqual(updates.alarmConfig, existing.alarmConfig)) {
    setClauses.push('alarmConfig = ?');
    params.push(updates.alarmConfig ? JSON.stringify(updates.alarmConfig) : null);
  }
  if (updates.notificationId !== undefined && updates.notificationId !== existing.notificationId) {
    setClauses.push('notificationId = ?');
    params.push(updates.notificationId);
  }

  if (setClauses.length === 0) {
    logger.debug('[Repository] updateItem skipped - no changes', { id });
    return existing;
  }

  const now = Date.now();
  setClauses.push('updatedAt = ?', 'syncStatus = ?');
  params.push(now, 'pending');
  params.push(id);

  const query = `UPDATE items SET ${setClauses.join(', ')} WHERE id = ?`;
  logger.debug('[Repository] Running SQL:', query, 'params:', params);

  try {
    await db.runAsync(query, params);
    logger.debug('[Repository] SQL executed successfully');
  } catch (error) {
    logger.error('[Repository] SQL error:', error);
    throw error;
  }

  notifyListeners();
  const result = await getItemById(id);
  logger.debug('[Repository] updateItem returning:', { id, body: result?.body, isDailyHighlight: result?.isDailyHighlight });
  return result;
}

export async function updateItemStatus(
  id: string,
  status: ItemStatus
): Promise<LocalItem | null> {
  return updateItem(id, { status });
}

export async function toggleItemPin(
  id: string,
  isPinned: boolean
): Promise<LocalItem | null> {
  logger.debug('[Repository] toggleItemPin called', { id, isPinned });
  return updateItem(id, { isPinned });
}

export async function toggleItemDailyHighlight(
  id: string,
  isDailyHighlight: boolean
): Promise<LocalItem | null> {
  logger.debug('[Repository] toggleItemDailyHighlight called', { id, isDailyHighlight });
  return updateItem(id, { isDailyHighlight });
}

export async function setNotificationId(
  id: string,
  notificationId: string | null
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE items SET notificationId = ?, updatedAt = ?, syncStatus = ? WHERE id = ?',
    [notificationId, Date.now(), 'pending', id]
  );
  notifyListeners();
}

// Delete (soft delete for sync)
export async function deleteItem(id: string): Promise<void> {
  const db = await getDatabase();
  const now = Date.now();
  await db.runAsync(
    'UPDATE items SET deletedAt = ?, updatedAt = ?, syncStatus = ? WHERE id = ?',
    [now, now, 'pending', id]
  );
  notifyListeners();
}

// Hard delete (after sync confirms deletion)
export async function hardDeleteItem(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM items WHERE id = ?', [id]);
  notifyListeners();
}

// Sync-related operations
export async function getPendingChanges(clerkUserId: string): Promise<LocalItem[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM items WHERE clerkUserId = ? AND syncStatus = ?',
    [clerkUserId, 'pending']
  );
  return rows.map(rowToItem);
}

export async function markAsSynced(
  id: string,
  convexId: string,
  expectedUpdatedAt: number
): Promise<void> {
  const db = await getDatabase();
  const now = Date.now();
  await db.runAsync(
    `UPDATE items
     SET convexId = ?,
         syncStatus = CASE WHEN updatedAt = ? THEN ? ELSE syncStatus END,
         syncedAt = CASE WHEN updatedAt = ? THEN ? ELSE syncedAt END
     WHERE id = ?`,
    [convexId, expectedUpdatedAt, 'synced', expectedUpdatedAt, now, id]
  );
  notifyListeners();
}

export async function markSyncConflict(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE items SET syncStatus = ? WHERE id = ?',
    ['conflict', id]
  );
  notifyListeners();
}

export async function upsertFromRemote(
  remoteItem: {
    convexId: string;
    clerkUserId: string;
    type: ItemType;
    title: string;
    body?: string;
    status: ItemStatus;
    isPinned?: boolean;
    isDailyHighlight?: boolean;
    triggerAt?: number;
    endAt?: number;
    timezone?: string;
    repeatRule?: string;
    snoozeState?: LocalItem['snoozeState'];
    alarmConfig?: LocalItem['alarmConfig'];
    taskSpec?: LocalItem['taskSpec'];
    executionPolicy?: 'manual' | 'auto';
    googleCalendarEventId?: string | null;
    createdAt: number;
    updatedAt?: number;
  }
): Promise<LocalItem> {
  logger.debug('[Repository] upsertFromRemote called for:', remoteItem.convexId, { isDailyHighlight: remoteItem.isDailyHighlight });
  const db = await getDatabase();
  const now = Date.now();
  const remoteUpdatedAt = remoteItem.updatedAt ?? remoteItem.createdAt;

  // Check if item exists locally
  const existing = await getItemByConvexId(remoteItem.convexId);
  logger.debug('[Repository] upsertFromRemote existing:', existing?.id, { syncStatus: existing?.syncStatus, localDailyHighlight: existing?.isDailyHighlight });

  if (existing) {
    // Update existing item (only if not locally modified)
    if (existing.syncStatus === 'synced') {
      if (remoteUpdatedAt <= existing.updatedAt) {
        logger.debug('[Repository] upsertFromRemote skipping - local is newer');
        return existing;
      }
      // Check if data actually changed to avoid infinite sync loops
      const hasChanges =
        existing.title !== remoteItem.title ||
        existing.body !== (remoteItem.body || null) ||
        existing.status !== remoteItem.status ||
        existing.isPinned !== (remoteItem.isPinned || false) ||
        existing.isDailyHighlight !== (remoteItem.isDailyHighlight || false) ||
        existing.triggerAt !== (remoteItem.triggerAt || null) ||
        existing.endAt !== (remoteItem.endAt || null) ||
        existing.timezone !== (remoteItem.timezone || null) ||
        existing.repeatRule !== (remoteItem.repeatRule || null) ||
        existing.googleCalendarEventId !== (remoteItem.googleCalendarEventId || null);

      if (!hasChanges) {
        logger.debug('[Repository] upsertFromRemote skipping - no changes');
        return existing;
      }

      logger.debug('[Repository] upsertFromRemote updating synced item');
      await db.runAsync(
        `UPDATE items SET
          title = ?, body = ?, status = ?, isPinned = ?, isDailyHighlight = ?,
          triggerAt = ?, endAt = ?, timezone = ?, repeatRule = ?, googleCalendarEventId = ?, snoozeState = ?, alarmConfig = ?,
          taskSpec = ?, executionPolicy = ?, updatedAt = ?, syncedAt = ?
        WHERE convexId = ?`,
        [
          remoteItem.title,
          remoteItem.body || null,
          remoteItem.status,
          remoteItem.isPinned ? 1 : 0,
          remoteItem.isDailyHighlight ? 1 : 0,
          remoteItem.triggerAt || null,
          remoteItem.endAt || null,
          remoteItem.timezone || null,
          remoteItem.repeatRule || null,
          remoteItem.googleCalendarEventId || null,
          remoteItem.snoozeState ? JSON.stringify(remoteItem.snoozeState) : null,
          remoteItem.alarmConfig ? JSON.stringify(remoteItem.alarmConfig) : null,
          remoteItem.taskSpec ? JSON.stringify(remoteItem.taskSpec) : null,
          remoteItem.executionPolicy || null,
          remoteUpdatedAt,
          now,
          remoteItem.convexId,
        ]
      );
      notifyListeners();
      return (await getItemByConvexId(remoteItem.convexId))!;
    }
    logger.debug('[Repository] upsertFromRemote skipping update - local changes pending');
    return existing; // Local changes take precedence
  }

  // Create new item from remote
  const id = Crypto.randomUUID();
  const item: LocalItem = {
    id,
    convexId: remoteItem.convexId,
    clerkUserId: remoteItem.clerkUserId,
    type: remoteItem.type,
    title: remoteItem.title,
    body: remoteItem.body || null,
    status: remoteItem.status,
    isPinned: remoteItem.isPinned || false,
    isDailyHighlight: remoteItem.isDailyHighlight || false,
    triggerAt: remoteItem.triggerAt || null,
    endAt: remoteItem.endAt || null,
    timezone: remoteItem.timezone || null,
    repeatRule: remoteItem.repeatRule || null,
    snoozeState: remoteItem.snoozeState || null,
    alarmConfig: remoteItem.alarmConfig || null,
    taskSpec: remoteItem.taskSpec || null,
    executionPolicy: remoteItem.executionPolicy || null,
    notificationId: null,
    googleCalendarEventId: remoteItem.googleCalendarEventId || null,
    syncStatus: 'synced',
    createdAt: remoteItem.createdAt,
    updatedAt: remoteUpdatedAt,
    syncedAt: now,
    deletedAt: null,
  };

  await db.runAsync(
    `INSERT INTO items (
      id, convexId, clerkUserId, type, title, body, status,
      isPinned, isDailyHighlight, triggerAt, endAt, timezone, repeatRule,
      snoozeState, alarmConfig, taskSpec, executionPolicy, notificationId, googleCalendarEventId,
      syncStatus, createdAt, updatedAt, syncedAt, deletedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item.id,
      item.convexId,
      item.clerkUserId,
      item.type,
      item.title,
      item.body,
      item.status,
      item.isPinned ? 1 : 0,
      item.isDailyHighlight ? 1 : 0,
      item.triggerAt,
      item.endAt,
      item.timezone,
      item.repeatRule,
      item.snoozeState ? JSON.stringify(item.snoozeState) : null,
      item.alarmConfig ? JSON.stringify(item.alarmConfig) : null,
      item.taskSpec ? JSON.stringify(item.taskSpec) : null,
      item.executionPolicy,
      item.notificationId,
      item.googleCalendarEventId,
      item.syncStatus,
      item.createdAt,
      item.updatedAt,
      item.syncedAt,
      item.deletedAt,
    ]
  );

  notifyListeners();
  return item;
}

// Get all items with notification IDs (for restoring notifications on app launch)
export async function getItemsWithNotifications(clerkUserId: string): Promise<LocalItem[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM items WHERE clerkUserId = ? AND notificationId IS NOT NULL AND deletedAt IS NULL AND status = ?',
    [clerkUserId, 'open']
  );
  return rows.map(rowToItem);
}

// Get all convexIds for synced items (used to detect remote deletions)
export async function getAllSyncedConvexIds(clerkUserId: string): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ convexId: string }>(
    'SELECT convexId FROM items WHERE clerkUserId = ? AND convexId IS NOT NULL AND deletedAt IS NULL',
    [clerkUserId]
  );
  return rows.map((row) => row.convexId);
}

// Soft delete an item by its convexId (used when remote deletion detected)
export async function softDeleteByConvexId(convexId: string): Promise<void> {
  const db = await getDatabase();
  const now = Date.now();
  await db.runAsync(
    'UPDATE items SET deletedAt = ?, updatedAt = ?, syncStatus = ? WHERE convexId = ?',
    [now, now, 'synced', convexId]
  );
  notifyListeners();
}
