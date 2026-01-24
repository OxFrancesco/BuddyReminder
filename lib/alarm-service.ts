import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { LocalItem, AlarmConfig } from '@/db/types';
import { logger } from '@/lib/logger';

// Type declarations for AlarmKit
type AlarmKitModule = {
  scheduleAlarm: (config: any) => Promise<string>;
  cancelAlarm: (alarmId: string) => Promise<void>;
  cancelAllAlarms: () => Promise<void>;
};

// AlarmKit is only available on iOS 26+
// We'll lazy load it to avoid crashes on older devices
let AlarmKit: AlarmKitModule | null = null;

async function loadAlarmKit(): Promise<boolean> {
  if (Platform.OS !== 'ios') {
    return false;
  }

  // Check iOS version (iOS 26+ required for AlarmKit)
  const majorVersion = parseInt(Platform.Version.toString().split('.')[0], 10);
  if (majorVersion < 26) {
    return false;
  }

  if (AlarmKit === null) {
    try {
      // @ts-ignore - Dynamic import for optional native module
      AlarmKit = await import('@raphckrman/react-native-alarm-kit') as AlarmKitModule;
      return true;
    } catch {
      logger.debug('[AlarmService] AlarmKit not available');
      return false;
    }
  }

  return true;
}

/**
 * Check if AlarmKit is available on this device
 */
export async function isAlarmKitAvailable(): Promise<boolean> {
  return await loadAlarmKit();
}

/**
 * Schedule an alarm for a reminder item
 * Uses AlarmKit on iOS 26+, falls back to notification-based approach otherwise
 */
export async function scheduleAlarm(item: LocalItem): Promise<string | null> {
  if (!item.alarmConfig?.enabled || !item.triggerAt) {
    return null;
  }

  // Don't schedule alarms in the past
  if (item.triggerAt <= Date.now()) {
    return null;
  }

  const useAlarmKit = await loadAlarmKit();

  if (useAlarmKit && AlarmKit) {
    return scheduleAlarmKitAlarm(item);
  }

  return scheduleInAppAlarm(item);
}

/**
 * Schedule an alarm using iOS AlarmKit (iOS 26+)
 */
async function scheduleAlarmKitAlarm(item: LocalItem): Promise<string | null> {
  if (!AlarmKit || !item.triggerAt || !item.alarmConfig) {
    return null;
  }

  try {
    // Create the alarm with AlarmKit
    const alarmId = await AlarmKit.scheduleAlarm({
      date: new Date(item.triggerAt),
      title: item.title,
      message: 'Tap to dismiss alarm',
      // AlarmKit allows custom actions via App Intents
      // The user will need to open the app to scan NFC or enter code
    });

    logger.debug('[AlarmService] AlarmKit alarm scheduled:', alarmId);
    return alarmId;
  } catch (error) {
    logger.error('[AlarmService] Failed to schedule AlarmKit alarm:', error);
    // Fall back to in-app alarm
    return scheduleInAppAlarm(item);
  }
}

/**
 * Schedule an in-app alarm using notifications
 * This works on iOS <26 and Android
 */
async function scheduleInAppAlarm(item: LocalItem): Promise<string | null> {
  if (!item.triggerAt || !item.alarmConfig) {
    return null;
  }

  try {
    // Request notification permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      logger.warn('[AlarmService] Notification permission not granted');
      return null;
    }

    // Schedule a notification that will trigger the alarm screen
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: item.title,
        body: 'Alarm - Tap to dismiss',
        data: {
          itemId: item.id,
          type: 'alarm',
          alarmConfig: item.alarmConfig,
        },
        sound: item.alarmConfig.soundId || 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        // Critical alert for iOS (requires entitlement)
        ...(Platform.OS === 'ios' && {
          interruptionLevel: 'critical',
        }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(item.triggerAt),
      },
    });

    logger.debug('[AlarmService] In-app alarm scheduled:', notificationId);
    return notificationId;
  } catch (error) {
    logger.error('[AlarmService] Failed to schedule in-app alarm:', error);
    return null;
  }
}

/**
 * Cancel a scheduled alarm
 */
export async function cancelAlarm(alarmId: string): Promise<void> {
  const useAlarmKit = await loadAlarmKit();

  if (useAlarmKit && AlarmKit) {
    try {
      await AlarmKit.cancelAlarm(alarmId);
      logger.debug('[AlarmService] AlarmKit alarm cancelled:', alarmId);
      return;
    } catch (error) {
      logger.error('[AlarmService] Failed to cancel AlarmKit alarm:', error);
    }
  }

  // Cancel notification-based alarm
  try {
    await Notifications.cancelScheduledNotificationAsync(alarmId);
    logger.debug('[AlarmService] Notification alarm cancelled:', alarmId);
  } catch (error) {
    logger.error('[AlarmService] Failed to cancel notification alarm:', error);
  }
}

/**
 * Handle an alarm trigger - navigate to the alarm screen
 * This is called when a notification is received for an alarm item
 */
export function handleAlarmTrigger(
  itemId: string,
  alarmConfig: AlarmConfig
): void {
  logger.debug('[AlarmService] Alarm triggered for item:', itemId);

  // Navigate to the full-screen alarm view
  router.push({
    pathname: '/alarm',
    params: {
      itemId,
      dismissMethod: alarmConfig.dismissMethod,
      registeredNfcTagId: alarmConfig.registeredNfcTagId || '',
      dismissCode: alarmConfig.dismissCode || '',
    },
  });
}

/**
 * Setup notification handler for alarm notifications
 * This should be called once during app initialization
 */
export function setupAlarmNotificationHandler(): () => void {
  // Handle notification when app is in foreground
  const foregroundSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      const data = notification.request.content.data as {
        type?: string;
        itemId?: string;
        alarmConfig?: AlarmConfig;
      };

      if (data.type === 'alarm' && data.itemId && data.alarmConfig) {
        handleAlarmTrigger(data.itemId, data.alarmConfig);
      }
    }
  );

  // Handle notification tap (app in background or killed)
  const responseSubscription =
    Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as {
        type?: string;
        itemId?: string;
        alarmConfig?: AlarmConfig;
      };

      if (data.type === 'alarm' && data.itemId && data.alarmConfig) {
        handleAlarmTrigger(data.itemId, data.alarmConfig);
      }
    });

  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
}

/**
 * Get all pending alarms for a user
 */
export async function getPendingAlarms(): Promise<
  Notifications.NotificationRequest[]
> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.filter((notification) => {
    const data = notification.content.data as { type?: string };
    return data.type === 'alarm';
  });
}

/**
 * Check if an item has an active alarm scheduled
 */
export async function hasScheduledAlarm(itemId: string): Promise<boolean> {
  const pending = await getPendingAlarms();
  return pending.some((notification) => {
    const data = notification.content.data as { itemId?: string };
    return data.itemId === itemId;
  });
}
