import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
  View,
  ScrollView,
} from "react-native";
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocalSearchParams, router } from "expo-router";
import * as chrono from "chrono-node";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import RescheduleModal from "@/components/reschedule-modal";
import AlarmSettings from "@/components/alarm-settings";
import { ItemSettingsCard } from "@/components/item-settings-card";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLocalItem, useLocalItemMutations } from "@/hooks/use-local-items";
import {
  scheduleStickyNotification,
  cancelItemNotification,
  scheduleReminderNotification,
} from "@/lib/notification-manager";
import { AlarmConfig } from "@/db/types";
import { scheduleAlarm, cancelAlarm } from "@/lib/alarm-service";
import { logger } from "@/lib/logger";

export default function ModalScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const { item, isLoading } = useLocalItem(itemId ?? null);
  const { updateItem, deleteItem, toggleItemPin, toggleItemDailyHighlight } =
    useLocalItemMutations();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [isDailyHighlight, setIsDailyHighlight] = useState(false);
  const [showReschedulePicker, setShowReschedulePicker] = useState(false);
  // Local copy of notificationId to avoid stale references when unpinning
  const [localNotificationId, setLocalNotificationId] = useState<string | null>(
    null,
  );
  // Alarm configuration for reminders
  const [alarmConfig, setAlarmConfig] = useState<AlarmConfig | null>(null);

  // Track which item we've initialized for - only sync from db once per item
  const initializedForItemId = useRef<string | null>(null);

  useEffect(() => {
    logger.debug("[Modal] Item effect triggered", {
      itemId: item?.id,
      initializedFor: initializedForItemId.current,
      itemBody: item?.body,
      itemHighlight: item?.isDailyHighlight,
    });
    // Only initialize form state once when item first loads
    // This prevents subscription-triggered refetches from resetting user edits
    if (item && initializedForItemId.current !== item.id) {
      logger.debug("[Modal] Initializing form state for item:", item.id);
      initializedForItemId.current = item.id;
      setTitle(item.title);
      setBody(item.body || "");
      setIsPinned(item.isPinned || false);
      setIsDailyHighlight(item.isDailyHighlight || false);
      setLocalNotificationId(item.notificationId || null);
      setAlarmConfig(item.alarmConfig || null);
    }
  }, [item]);

  useEffect(() => {
    const trimmedTitle = title.trim();
    logger.debug("[Modal] Title effect", {
      title,
      itemTitle: item?.title,
      willSave: item && trimmedTitle.length > 0 && trimmedTitle !== item.title,
    });
    if (item && trimmedTitle.length > 0 && trimmedTitle !== item.title) {
      const timeoutId = setTimeout(async () => {
        logger.debug("[Modal] Saving title:", trimmedTitle);

        // Parse for natural language date/time
        const parsedDates = chrono.parse(trimmedTitle, new Date(), {
          forwardDate: true,
        });

        if (parsedDates.length > 0) {
          const parsed = parsedDates[0];
          const triggerAt = parsed.start.date().getTime();

          // Remove date/time text from title
          let cleanTitle =
            trimmedTitle.substring(0, parsed.index) +
            trimmedTitle.substring(parsed.index + parsed.text.length);
          cleanTitle = cleanTitle.trim();

          logger.debug("[Modal] Parsed date from title:", {
            triggerAt,
            cleanTitle,
          });

          // Update local state immediately to prevent reset
          setTitle(cleanTitle);

          // Convert to reminder and update with new trigger time
          await updateItem(item.id, {
            title: cleanTitle,
            triggerAt,
          });

          // Schedule notification
          if (item.notificationId) {
            await cancelItemNotification(item.id, item.notificationId);
          }
          const notificationId = await scheduleReminderNotification(
            item.id,
            cleanTitle,
            triggerAt,
          );
          if (notificationId) {
            await updateItem(item.id, { notificationId });
          }

          return;
        }

        // No date parsed, just update title
        updateItem(item.id, { title: trimmedTitle });
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [title, item, updateItem]);

  useEffect(() => {
    const normalizedBody = body.trim();
    const currentBody = item?.body || "";
    logger.debug("[Modal] Body effect", {
      body,
      itemBody: item?.body,
      willSave: item && normalizedBody !== currentBody,
    });
    if (item && normalizedBody !== currentBody) {
      const timeoutId = setTimeout(() => {
        logger.debug("[Modal] Saving body:", normalizedBody);
        updateItem(item.id, { body: normalizedBody || undefined });
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [body, item, updateItem]);

  // Handle alarm configuration changes
  const handleAlarmConfigChange = useCallback(
    async (newConfig: AlarmConfig | null) => {
      if (!item) return;

      logger.debug("[Modal] handleAlarmConfigChange:", newConfig);
      setAlarmConfig(newConfig);

      // Update the item's alarm config
      await updateItem(item.id, { alarmConfig: newConfig });

      // Schedule or cancel alarm based on config
      if (newConfig?.enabled && item.triggerAt) {
        // Schedule the alarm
        const updatedItem = { ...item, alarmConfig: newConfig };
        await scheduleAlarm(updatedItem);
      } else if (item.notificationId) {
        // Cancel any existing alarm
        await cancelAlarm(item.notificationId);
      }
    },
    [item, updateItem],
  );

  const handlePinToggle = async (value: boolean) => {
    logger.debug("[Modal] handlePinToggle called with:", value);
    setIsPinned(value);
    if (item) {
      logger.debug(
        "[Modal] Calling toggleItemPin for item:",
        item.id,
        "localNotificationId:",
        localNotificationId,
        "item.notificationId:",
        item.notificationId,
      );
      const result = await toggleItemPin(item.id, value);
      logger.debug("[Modal] toggleItemPin result:", result);

      // Handle notification
      if (value) {
        // Schedule sticky notification when pinning
        const notificationId = await scheduleStickyNotification(
          item.id,
          item.title,
        );
        logger.debug("[Modal] Scheduled notification:", notificationId);
        if (notificationId) {
          // Store locally to avoid stale reference when unpinning
          setLocalNotificationId(notificationId);
          await updateItem(item.id, { notificationId });
        }
      } else {
        // Cancel notification when unpinning - use local ID first, fall back to item.notificationId
        const notifId = localNotificationId ?? item.notificationId;
        logger.debug(
          "[Modal] Cancelling notification for item:",
          item.id,
          "using notificationId:",
          notifId,
        );
        await cancelItemNotification(item.id, notifId);
        setLocalNotificationId(null);
      }
    }
  };

  const handleHighlightToggle = async (value: boolean) => {
    logger.debug("[Modal] handleHighlightToggle called with:", value);
    setIsDailyHighlight(value);
    if (item) {
      logger.debug(
        "[Modal] Calling toggleItemDailyHighlight for item:",
        item.id,
      );
      const result = await toggleItemDailyHighlight(item.id, value);
      logger.debug("[Modal] toggleItemDailyHighlight result:", result);
    }
  };

  const handleDelete = async () => {
    if (!item) return;

    Alert.alert("Delete Item", "Are you sure you want to delete this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            // Cancel any notification for this item
            if (item.notificationId) {
              await cancelItemNotification(item.id, item.notificationId);
            }
            await deleteItem(item.id);
            router.back();
          } catch {
            Alert.alert("Error", "Failed to delete item");
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  if (!item) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Item not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TextInput
          style={[
            styles.titleInput,
            {
              color: colors.text,
              borderColor: colors.border,
              backgroundColor: colors.background,
              shadowColor: colors.shadow,
            },
          ]}
          value={title}
          onChangeText={setTitle}
          placeholder="Title"
          placeholderTextColor={colors.icon}
          multiline
        />

        <ItemSettingsCard
          item={item}
          isPinned={isPinned}
          isDailyHighlight={isDailyHighlight}
          onPinToggle={handlePinToggle}
          onHighlightToggle={handleHighlightToggle}
          onReschedule={() => setShowReschedulePicker(true)}
          onDelete={handleDelete}
        />

        {/* Alarm Settings for reminders */}
        {item.type === "reminder" && (
          <AlarmSettings
            alarmConfig={alarmConfig}
            onChange={handleAlarmConfigChange}
          />
        )}

        <TextInput
          style={[
            styles.bodyInput,
            {
              color: colors.text,
              borderColor: colors.border,
              backgroundColor: colors.background,
            },
          ]}
          value={body}
          onChangeText={setBody}
          placeholder="Add notes..."
          placeholderTextColor={colors.tabIconDefault}
          multiline
          textAlignVertical="top"
        />
      </ScrollView>

      <RescheduleModal
        itemId={showReschedulePicker && item ? item.id : null}
        onClose={() => setShowReschedulePicker(false)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: "600",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    minHeight: 60,
  },
  bodyInput: {
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    height: 120,
    marginBottom: 16,
  },
});
