import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { setNotificationId, getItemsWithNotifications, getPinnedItems } from '@/db/items-repository';
import { logger } from '@/lib/logger';
import { LocalItem } from '@/db/types';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Request notification permissions
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

// Schedule a sticky notification for a pinned item
export async function scheduleStickyNotification(
  itemId: string,
  title: string
): Promise<string | null> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return null;

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: title,
      body: 'Tap to view or mark as done',
      data: { itemId, type: 'pinned' },
      sticky: Platform.OS === 'android',
      priority: Notifications.AndroidNotificationPriority.HIGH,
      ...(Platform.OS === 'android' && {
        categoryIdentifier: 'pinned-item',
      }),
    },
    trigger: null, // Show immediately
  });

  // Store notification ID in SQLite
  await setNotificationId(itemId, notificationId);

  return notificationId;
}

// Schedule a reminder notification
export async function scheduleReminderNotification(
  itemId: string,
  title: string,
  triggerAt: number
): Promise<string | null> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return null;

  const now = Date.now();
  if (triggerAt <= now) return null; // Don't schedule past notifications

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: title,
      body: 'Tap to view',
      data: { itemId, type: 'reminder' },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(triggerAt),
    },
  });

  await setNotificationId(itemId, notificationId);

  return notificationId;
}

// Cancel a notification by ID
export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

// Cancel notification for an item and clear the stored ID
export async function cancelItemNotification(
  itemId: string,
  notificationId: string | null
): Promise<void> {
  logger.debug('[NotificationManager] Cancelling notification for item:', itemId, 'notificationId:', notificationId);

  // Try to dismiss by stored notification ID
  if (notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      logger.debug('[NotificationManager] Cancelled scheduled notification:', notificationId);
    } catch (error) {
      logger.warn('[NotificationManager] Error cancelling scheduled notification:', error);
    }

    try {
      await Notifications.dismissNotificationAsync(notificationId);
      logger.debug('[NotificationManager] Dismissed notification:', notificationId);
    } catch (error) {
      logger.warn('[NotificationManager] Error dismissing notification:', error);
    }
  }

  // Also check all presented notifications and dismiss any matching this itemId
  try {
    const presented = await Notifications.getPresentedNotificationsAsync();
    logger.debug('[NotificationManager] Presented notifications count:', presented.length);
    logger.debug('[NotificationManager] Presented notifications:', JSON.stringify(presented.map(n => ({
      id: n.request.identifier,
      title: n.request.content.title,
      data: n.request.content.data,
    })), null, 2));

    for (const notification of presented) {
      const data = notification.request.content.data as { itemId?: string };
      logger.debug('[NotificationManager] Checking notification:', notification.request.identifier, 'itemId in data:', data.itemId, 'target itemId:', itemId);
      if (data.itemId === itemId) {
        logger.debug('[NotificationManager] Found matching notification, dismissing:', notification.request.identifier);
        await Notifications.dismissNotificationAsync(notification.request.identifier);
        logger.debug('[NotificationManager] Dismissed presented notification:', notification.request.identifier);
      }
    }
  } catch (error) {
    logger.warn('[NotificationManager] Error dismissing presented notifications:', error);
  }

  await setNotificationId(itemId, null);
  logger.debug('[NotificationManager] Cleared notification ID in database');
}

// Dismiss all presented notifications (for debugging)
export async function dismissAllPresentedNotifications(): Promise<void> {
  try {
    const presented = await Notifications.getPresentedNotificationsAsync();
    logger.debug('[NotificationManager] Dismissing all', presented.length, 'presented notifications');
    for (const notification of presented) {
      await Notifications.dismissNotificationAsync(notification.request.identifier);
    }
    logger.debug('[NotificationManager] All notifications dismissed');
  } catch (error) {
    logger.warn('[NotificationManager] Error dismissing all notifications:', error);
  }
}

// Cancel all notifications
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Restore notifications for all pinned items on app launch
export async function restorePinnedNotifications(clerkUserId: string): Promise<void> {
  const pinnedItems = await getPinnedItems(clerkUserId);

  for (const item of pinnedItems) {
    // Check if notification still exists
    if (item.notificationId) {
      const presented = await Notifications.getPresentedNotificationsAsync();
      const exists = presented.some(
        (n) => n.request.identifier === item.notificationId
      );

      if (!exists) {
        // Re-schedule the notification
        await scheduleStickyNotification(item.id, item.title);
      }
    } else {
      // No notification ID stored, schedule one
      await scheduleStickyNotification(item.id, item.title);
    }
  }
}

// Handle notification response (when user taps)
export function setupNotificationResponseHandler(): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data as {
        itemId?: string;
        type?: string;
      };

      if (data.itemId) {
        // Navigate to the item detail modal
        router.push(`/modal?itemId=${data.itemId}`);
      }
    }
  );

  return () => subscription.remove();
}

// Get all scheduled notifications
export async function getScheduledNotifications(): Promise<
  Notifications.NotificationRequest[]
> {
  return await Notifications.getAllScheduledNotificationsAsync();
}

// Android-specific: Set up notification channel for sticky notifications
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('pinned-items', {
      name: 'Pinned Items',
      importance: Notifications.AndroidImportance.HIGH,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
      sound: null,
    });

    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }
}
