import * as SQLite from 'expo-sqlite';
import { logger } from '@/lib/logger';

export async function migrateDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  try {
    // Migration 1: Add googleCalendarEventId column
    const gcResult = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM pragma_table_info('items') WHERE name='googleCalendarEventId'`
    );

    if (gcResult?.count === 0) {
      await db.execAsync(`
        ALTER TABLE items ADD COLUMN googleCalendarEventId TEXT;
      `);
      logger.info('Migration: Added googleCalendarEventId column');
    }

    // Migration 2: Add endAt column for calendar sync duration
    const endAtResult = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM pragma_table_info('items') WHERE name='endAt'`
    );

    if (endAtResult?.count === 0) {
      await db.execAsync(`
        ALTER TABLE items ADD COLUMN endAt INTEGER;
      `);
      logger.info('Migration: Added endAt column');
    }

    // Migration 3: Add alarmConfig column for alarm mode on reminders
    const alarmResult = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM pragma_table_info('items') WHERE name='alarmConfig'`
    );

    if (alarmResult?.count === 0) {
      await db.execAsync(`
        ALTER TABLE items ADD COLUMN alarmConfig TEXT;
      `);
      logger.info('Migration: Added alarmConfig column');
    }

    // Migration 4: Create nfcTags table for registered NFC tags
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS nfcTags (
        id TEXT PRIMARY KEY NOT NULL,
        convexId TEXT,
        clerkUserId TEXT NOT NULL,
        tagId TEXT NOT NULL,
        label TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        syncStatus TEXT NOT NULL DEFAULT 'pending' CHECK (syncStatus IN ('pending', 'synced', 'conflict'))
      );

      CREATE INDEX IF NOT EXISTS idx_nfcTags_clerkUserId ON nfcTags(clerkUserId);
      CREATE INDEX IF NOT EXISTS idx_nfcTags_tagId ON nfcTags(tagId);
    `);
    logger.info('Migration: Ensured nfcTags table exists');
  } catch (error) {
    logger.error('Migration error:', error);
  }
}
