import * as SQLite from 'expo-sqlite';
import { LocalItem, SyncStatus } from './types';
import { migrateDatabase } from './migrations';

const DB_NAME = 'buddyreminder.db';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync(DB_NAME);
  await initializeSchema(db);
  await migrateDatabase(db);
  return db;
}

async function initializeSchema(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY NOT NULL,
      convexId TEXT,
      clerkUserId TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('note', 'reminder', 'task')),
      title TEXT NOT NULL,
      body TEXT,
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done', 'archived')),
      isPinned INTEGER NOT NULL DEFAULT 0,
      isDailyHighlight INTEGER NOT NULL DEFAULT 0,
      triggerAt INTEGER,
      timezone TEXT,
      repeatRule TEXT,
      snoozeState TEXT,
      taskSpec TEXT,
      executionPolicy TEXT CHECK (executionPolicy IS NULL OR executionPolicy IN ('manual', 'auto')),
      notificationId TEXT,
      googleCalendarEventId TEXT,
      syncStatus TEXT NOT NULL DEFAULT 'pending' CHECK (syncStatus IN ('pending', 'synced', 'conflict')),
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      syncedAt INTEGER,
      deletedAt INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_items_clerkUserId ON items(clerkUserId);
    CREATE INDEX IF NOT EXISTS idx_items_syncStatus ON items(syncStatus);
    CREATE INDEX IF NOT EXISTS idx_items_convexId ON items(convexId);
    CREATE INDEX IF NOT EXISTS idx_items_type ON items(clerkUserId, type);
    CREATE INDEX IF NOT EXISTS idx_items_status ON items(clerkUserId, status);
    CREATE INDEX IF NOT EXISTS idx_items_triggerAt ON items(triggerAt);
  `);
}

// Row to LocalItem converter
export function rowToItem(row: Record<string, unknown>): LocalItem {
  return {
    id: row.id as string,
    convexId: row.convexId as string | null,
    clerkUserId: row.clerkUserId as string,
    type: row.type as LocalItem['type'],
    title: row.title as string,
    body: row.body as string | null,
    status: row.status as LocalItem['status'],
    isPinned: Boolean(row.isPinned),
    isDailyHighlight: Boolean(row.isDailyHighlight),
    triggerAt: row.triggerAt as number | null,
    timezone: row.timezone as string | null,
    repeatRule: row.repeatRule as string | null,
    snoozeState: row.snoozeState ? JSON.parse(row.snoozeState as string) : null,
    alarmConfig: row.alarmConfig ? JSON.parse(row.alarmConfig as string) : null,
    taskSpec: row.taskSpec ? JSON.parse(row.taskSpec as string) : null,
    executionPolicy: row.executionPolicy as LocalItem['executionPolicy'],
    notificationId: row.notificationId as string | null,
    googleCalendarEventId: row.googleCalendarEventId as string | null,
    syncStatus: row.syncStatus as SyncStatus,
    createdAt: row.createdAt as number,
    updatedAt: row.updatedAt as number,
    syncedAt: row.syncedAt as number | null,
    deletedAt: row.deletedAt as number | null,
  };
}

// Close database connection (useful for cleanup)
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
