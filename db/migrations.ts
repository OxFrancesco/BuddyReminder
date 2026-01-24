import * as SQLite from 'expo-sqlite';

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
      console.log('Migration: Added googleCalendarEventId column');
    }

    // Migration 2: Add alarmConfig column for alarm mode on reminders
    const alarmResult = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM pragma_table_info('items') WHERE name='alarmConfig'`
    );

    if (alarmResult?.count === 0) {
      await db.execAsync(`
        ALTER TABLE items ADD COLUMN alarmConfig TEXT;
      `);
      console.log('Migration: Added alarmConfig column');
    }

    // Migration 3: Create nfcTags table for registered NFC tags
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
    console.log('Migration: Ensured nfcTags table exists');
  } catch (error) {
    console.error('Migration error:', error);
  }
}
