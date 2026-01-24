import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useCalendarSync } from '@/contexts/calendar-sync-context';
import { LocalItem } from '@/db/types';
import { logger } from '@/lib/logger';

export function useCalendarSyncForItem() {
  const syncAction = useAction(api.calendar.syncItemToCalendar);
  const deleteAction = useAction(api.calendar.deleteItemFromCalendar);
  const { calendarSyncEnabled } = useCalendarSync();

  const syncItem = async (item: LocalItem) => {
    if (!calendarSyncEnabled) return;
    if (!item.convexId) {
      logger.debug('Skipping calendar sync: item not synced to Convex yet');
      return;
    }
    if (!item.triggerAt) {
      logger.debug('Skipping calendar sync: item has no trigger time');
      return;
    }

    try {
      const result = await syncAction({
        itemId: item.convexId as Id<'items'>,
      });

      if (!result.success) {
        logger.warn('Calendar sync failed for item:', item.id);
      }
    } catch (error) {
      logger.error('Calendar sync error:', error);
    }
  };

  const deleteItem = async (item: LocalItem) => {
    if (!calendarSyncEnabled) return;
    if (!item.convexId) return;
    if (!item.googleCalendarEventId) return;

    try {
      const result = await deleteAction({
        itemId: item.convexId as Id<'items'>,
      });

      if (!result.success) {
        logger.warn('Calendar delete failed for item:', item.id);
      }
    } catch (error) {
      logger.error('Calendar delete error:', error);
    }
  };

  return { syncItem, deleteItem };
}
