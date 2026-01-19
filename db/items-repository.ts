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

// Event emitter for reactivity
type ItemChangeListener = () => void;
const listeners: Set<ItemChangeListener> = new Set();

export function subscribeToItemChanges(listener: ItemChangeListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners() {
  console.log('[Repository] notifyListeners called, listener count:', listeners.size, new Error().stack?.split('\n').slice(1, 4).join('\n'));
  listeners.forEach((listener) => listener());
}

// Create
export async function createItem(input: CreateItemInput): Promise<LocalItem> {
  const db = await getDatabase();
  const now = Date.now();
  const id = Crypto.randomUUID();

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
    timezone: input.timezone || null,
    repeatRule: input.repeatRule || null,
    snoozeState: null,
    taskSpec: input.taskSpec || null,
    executionPolicy: input.executionPolicy || null,
    notificationId: null,
    syncStatus: 'pending',
    createdAt: now,
    updatedAt: now,
    syncedAt: null,
    deletedAt: null,
  };

  await db.runAsync(
    `INSERT INTO items (
      id, convexId, clerkUserId, type, title, body, status,
      isPinned, isDailyHighlight, triggerAt, timezone, repeatRule,
      snoozeState, taskSpec, executionPolicy, notificationId,
      syncStatus, createdAt, updatedAt, syncedAt, deletedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      item.timezone,
      item.repeatRule,
      item.snoozeState ? JSON.stringify(item.snoozeState) : null,
      item.taskSpec ? JSON.stringify(item.taskSpec) : null,
      item.executionPolicy,
      item.notificationId,
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
  console.log('[Repository] getItemById', { id, found: !!item, body: item?.body, isDailyHighlight: item?.isDailyHighlight });
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
  console.log('[Repository] updateItem called', { id, updates });
  const db = await getDatabase();
  const now = Date.now();

  const setClauses: string[] = ['updatedAt = ?', 'syncStatus = ?'];
  const params: (string | number | null)[] = [now, 'pending'];

  if (updates.title !== undefined) {
    setClauses.push('title = ?');
    params.push(updates.title);
  }
  if (updates.body !== undefined) {
    setClauses.push('body = ?');
    params.push(updates.body);
  }
  if (updates.status !== undefined) {
    setClauses.push('status = ?');
    params.push(updates.status);
  }
  if (updates.isPinned !== undefined) {
    setClauses.push('isPinned = ?');
    params.push(updates.isPinned ? 1 : 0);
  }
  if (updates.isDailyHighlight !== undefined) {
    setClauses.push('isDailyHighlight = ?');
    params.push(updates.isDailyHighlight ? 1 : 0);
  }
  if (updates.triggerAt !== undefined) {
    setClauses.push('triggerAt = ?');
    params.push(updates.triggerAt);
  }
  if (updates.snoozeState !== undefined) {
    setClauses.push('snoozeState = ?');
    params.push(updates.snoozeState ? JSON.stringify(updates.snoozeState) : null);
  }
  if (updates.notificationId !== undefined) {
    setClauses.push('notificationId = ?');
    params.push(updates.notificationId);
  }

  params.push(id);

  const query = `UPDATE items SET ${setClauses.join(', ')} WHERE id = ?`;
  console.log('[Repository] Running SQL:', query, 'params:', params);

  try {
    await db.runAsync(query, params);
    console.log('[Repository] SQL executed successfully');
  } catch (error) {
    console.error('[Repository] SQL error:', error);
    throw error;
  }

  notifyListeners();
  const result = await getItemById(id);
  console.log('[Repository] updateItem returning:', { id, body: result?.body, isDailyHighlight: result?.isDailyHighlight });
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
  console.log('[Repository] toggleItemPin called', { id, isPinned });
  return updateItem(id, { isPinned });
}

export async function toggleItemDailyHighlight(
  id: string,
  isDailyHighlight: boolean
): Promise<LocalItem | null> {
  console.log('[Repository] toggleItemDailyHighlight called', { id, isDailyHighlight });
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
    timezone?: string;
    repeatRule?: string;
    snoozeState?: LocalItem['snoozeState'];
    taskSpec?: LocalItem['taskSpec'];
    executionPolicy?: 'manual' | 'auto';
    createdAt: number;
    updatedAt?: number;
  }
): Promise<LocalItem> {
  console.log('[Repository] upsertFromRemote called for:', remoteItem.convexId, { isDailyHighlight: remoteItem.isDailyHighlight });
  const db = await getDatabase();
  const now = Date.now();
  const remoteUpdatedAt = remoteItem.updatedAt ?? remoteItem.createdAt;

  // Check if item exists locally
  const existing = await getItemByConvexId(remoteItem.convexId);
  console.log('[Repository] upsertFromRemote existing:', existing?.id, { syncStatus: existing?.syncStatus, localDailyHighlight: existing?.isDailyHighlight });

  if (existing) {
    // Update existing item (only if not locally modified)
    if (existing.syncStatus === 'synced') {
      if (remoteUpdatedAt <= existing.updatedAt) {
        console.log('[Repository] upsertFromRemote skipping - local is newer');
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
        existing.timezone !== (remoteItem.timezone || null) ||
        existing.repeatRule !== (remoteItem.repeatRule || null);

      if (!hasChanges) {
        console.log('[Repository] upsertFromRemote skipping - no changes');
        return existing;
      }

      console.log('[Repository] upsertFromRemote updating synced item');
      await db.runAsync(
        `UPDATE items SET
          title = ?, body = ?, status = ?, isPinned = ?, isDailyHighlight = ?,
          triggerAt = ?, timezone = ?, repeatRule = ?, snoozeState = ?, taskSpec = ?,
          executionPolicy = ?, updatedAt = ?, syncedAt = ?
        WHERE convexId = ?`,
        [
          remoteItem.title,
          remoteItem.body || null,
          remoteItem.status,
          remoteItem.isPinned ? 1 : 0,
          remoteItem.isDailyHighlight ? 1 : 0,
          remoteItem.triggerAt || null,
          remoteItem.timezone || null,
          remoteItem.repeatRule || null,
          remoteItem.snoozeState ? JSON.stringify(remoteItem.snoozeState) : null,
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
    console.log('[Repository] upsertFromRemote skipping update - local changes pending');
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
    timezone: remoteItem.timezone || null,
    repeatRule: remoteItem.repeatRule || null,
    snoozeState: remoteItem.snoozeState || null,
    taskSpec: remoteItem.taskSpec || null,
    executionPolicy: remoteItem.executionPolicy || null,
    notificationId: null,
    syncStatus: 'synced',
    createdAt: remoteItem.createdAt,
    updatedAt: remoteUpdatedAt,
    syncedAt: now,
    deletedAt: null,
  };

  await db.runAsync(
    `INSERT INTO items (
      id, convexId, clerkUserId, type, title, body, status,
      isPinned, isDailyHighlight, triggerAt, timezone, repeatRule,
      snoozeState, taskSpec, executionPolicy, notificationId,
      syncStatus, createdAt, updatedAt, syncedAt, deletedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      item.timezone,
      item.repeatRule,
      item.snoozeState ? JSON.stringify(item.snoozeState) : null,
      item.taskSpec ? JSON.stringify(item.taskSpec) : null,
      item.executionPolicy,
      item.notificationId,
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
