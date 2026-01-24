import { useAuth } from '@clerk/clerk-expo';
import { useCalendarSync } from '@/contexts/calendar-sync-context';
import { LocalItem } from '@/db/types';
import {
  syncToGoogleCalendar,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  CalendarEvent,
} from '@/lib/calendar-sync';
import { getDatabase } from '@/db/database';

export async function syncItemToCalendar(
  item: LocalItem,
  getToken: () => Promise<string | null>,
  calendarSyncEnabled: boolean
): Promise<void> {
  if (!calendarSyncEnabled || !item.triggerAt) return;

  const event: CalendarEvent = {
    summary: item.title,
    description: item.body || undefined,
    start: {
      dateTime: new Date(item.triggerAt).toISOString(),
      timeZone: item.timezone || 'UTC',
    },
    end: {
      dateTime: new Date(item.triggerAt + 3600000).toISOString(), // +1 hour
      timeZone: item.timezone || 'UTC',
    },
  };

  const db = await getDatabase();

  if (item.googleCalendarEventId) {
    // Update or delete existing event
    if (item.status === 'done' || item.deletedAt) {
      await deleteGoogleCalendarEvent(getToken, item.googleCalendarEventId);
      await db.runAsync(
        'UPDATE items SET googleCalendarEventId = NULL WHERE id = ?',
        [item.id]
      );
    } else {
      await updateGoogleCalendarEvent(getToken, item.googleCalendarEventId, event);
    }
  } else if (item.status === 'open' && !item.deletedAt) {
    // Create new event
    const eventId = await syncToGoogleCalendar(getToken, event);
    if (eventId) {
      await db.runAsync(
        'UPDATE items SET googleCalendarEventId = ? WHERE id = ?',
        [eventId, item.id]
      );
    }
  }
}

export function useCalendarSyncForItem() {
  const { getToken } = useAuth();
  const { calendarSyncEnabled } = useCalendarSync();

  return async (item: LocalItem) => {
    await syncItemToCalendar(item, getToken, calendarSyncEnabled);
  };
}
