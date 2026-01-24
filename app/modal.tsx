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

export default function ModalScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const { item, isLoading } = useLocalItem(itemId ?? null);
  const {
    updateItem,
    deleteItem,
    toggleItemPin,
    toggleItemDailyHighlight,
  } = useLocalItemMutations();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [isDailyHighlight, setIsDailyHighlight] = useState(false);
  const [showReschedulePicker, setShowReschedulePicker] = useState(false);
  // Local copy of notificationId to avoid stale references when unpinning
  const [localNotificationId, setLocalNotificationId] = useState<string | null>(null);
  // Alarm configuration for reminders
  const [alarmConfig, setAlarmConfig] = useState<AlarmConfig | null>(null);

  // Track which item we've initialized for - only sync from db once per item
  const initializedForItemId = useRef<string | null>(null);

  useEffect(() => {
    console.log('[Modal] Item effect triggered', {
      itemId: item?.id,
      initializedFor: initializedForItemId.current,
      itemBody: item?.body,
      itemHighlight: item?.isDailyHighlight,
    });
    // Only initialize form state once when item first loads
    // This prevents subscription-triggered refetches from resetting user edits
    if (item && initializedForItemId.current !== item.id) {
      console.log('[Modal] Initializing form state for item:', item.id);
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
    console.log('[Modal] Title effect', {
      title,
      itemTitle: item?.title,
      willSave: item && title !== item.title && title.trim()
    });
    if (item && title !== item.title && title.trim()) {
      const timeoutId = setTimeout(async () => {
        console.log('[Modal] Saving title:', title.trim());
        
        // Parse for natural language date/time
        const parsedDates = chrono.parse(title, new Date(), { forwardDate: true });
        
        if (parsedDates.length > 0) {
          const parsed = parsedDates[0];
          const triggerAt = parsed.start.date().getTime();
          
          // Remove date/time text from title
          let cleanTitle = title.substring(0, parsed.index) + title.substring(parsed.index + parsed.text.length);
          cleanTitle = cleanTitle.trim();
          
          console.log('[Modal] Parsed date from title:', { triggerAt, cleanTitle });
          
          // Update local state immediately to prevent reset
          setTitle(cleanTitle);
          
          // Convert to reminder and update with new trigger time
          await updateItem(item.id, { 
            title: cleanTitle,
            triggerAt 
          });
          
          // Schedule notification
          if (item.notificationId) {
            await cancelItemNotification(item.id, item.notificationId);
          }
          const notificationId = await scheduleReminderNotification(item.id, cleanTitle, triggerAt);
          if (notificationId) {
            await updateItem(item.id, { notificationId });
          }
          
          return;
        }
        
        // No date parsed, just update title
        updateItem(item.id, { title: title.trim() });
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [title, item, updateItem]);

  useEffect(() => {
    console.log('[Modal] Body effect', {
      body,
      itemBody: item?.body,
      willSave: item && body !== (item.body || "")
    });
    if (item && body !== (item.body || "")) {
      const timeoutId = setTimeout(() => {
        console.log('[Modal] Saving body:', body.trim());
        updateItem(item.id, { body: body.trim() || undefined });
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [body, item, updateItem]);

  // Handle alarm configuration changes
  const handleAlarmConfigChange = useCallback(
    async (newConfig: AlarmConfig | null) => {
      if (!item) return;

      console.log('[Modal] handleAlarmConfigChange:', newConfig);
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
    [item, updateItem]
  );

  const handlePinToggle = async (value: boolean) => {
    console.log('[Modal] handlePinToggle called with:', value);
    setIsPinned(value);
    if (item) {
      console.log('[Modal] Calling toggleItemPin for item:', item.id, 'localNotificationId:', localNotificationId, 'item.notificationId:', item.notificationId);
      const result = await toggleItemPin(item.id, value);
      console.log('[Modal] toggleItemPin result:', result);

      // Handle notification
      if (value) {
        // Schedule sticky notification when pinning
        const notificationId = await scheduleStickyNotification(
          item.id,
          item.title,
        );
        console.log('[Modal] Scheduled notification:', notificationId);
        if (notificationId) {
          // Store locally to avoid stale reference when unpinning
          setLocalNotificationId(notificationId);
          await updateItem(item.id, { notificationId });
        }
      } else {
        // Cancel notification when unpinning - use local ID first, fall back to item.notificationId
        const notifId = localNotificationId ?? item.notificationId;
        console.log('[Modal] Cancelling notification for item:', item.id, 'using notificationId:', notifId);
        await cancelItemNotification(item.id, notifId);
        setLocalNotificationId(null);
      }
    }
  };

  const handleHighlightToggle = async (value: boolean) => {
    console.log('[Modal] handleHighlightToggle called with:', value);
    setIsDailyHighlight(value);
    if (item) {
      console.log('[Modal] Calling toggleItemDailyHighlight for item:', item.id);
      const result = await toggleItemDailyHighlight(item.id, value);
      console.log('[Modal] toggleItemDailyHighlight result:', result);
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "note":
        return "Note";
      case "reminder":
        return "Reminder";
      case "task":
        return "Task";
      default:
        return "Note";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "note":
        return colors.typeNote;
      case "reminder":
        return colors.typeReminder;
      case "task":
        return colors.typeTask;
      default:
        return colors.text;
    }
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

        <ThemedView
          style={[
            styles.menu,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.icon,
            },
          ]}
        >
          <ThemedView style={[styles.menuItem, { borderBottomColor: colors.overlayLight }]}>
            <ThemedText style={styles.menuLabel}>Type</ThemedText>
            <ThemedText
              style={[styles.typeText, { color: getTypeColor(item.type) }]}
            >
              {getTypeIcon(item.type)}
            </ThemedText>
          </ThemedView>

          <ThemedView style={[styles.menuItem, { borderBottomColor: colors.overlayLight }]}>
            <ThemedText style={styles.menuLabel}>Pin to notifications</ThemedText>
            <Switch
              value={isPinned}
              onValueChange={handlePinToggle}
              trackColor={{ false: colors.switchTrackInactive, true: colors.tint }}
              thumbColor={
                isPinned ? colors.switchThumbActive : colors.switchThumbInactive
              }
            />
          </ThemedView>

          <ThemedView style={[styles.menuItem, { borderBottomColor: colors.overlayLight }]}>
            <ThemedText style={styles.menuLabel}>Daily Highlight</ThemedText>
            <Switch
              value={isDailyHighlight}
              onValueChange={handleHighlightToggle}
              trackColor={{ false: colors.switchTrackInactive, true: colors.highlight }}
              thumbColor={
                isDailyHighlight
                  ? colors.switchThumbActive
                  : colors.switchThumbInactive
              }
            />
          </ThemedView>

          {item.type === "reminder" && (
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.overlayLight }]}
              onPress={() => setShowReschedulePicker(true)}
            >
              <ThemedText style={styles.menuLabel}>Reschedule</ThemedText>
              <IconSymbol name="chevron.right" size={20} color={colors.icon} />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.overlayLight }]} onPress={handleDelete}>
            <ThemedText style={styles.menuLabel}>Delete</ThemedText>
            <ThemedText
              style={[styles.deleteButtonText, { color: colors.error }]}
            >
              Delete
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

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
          onChangeText={(text) => {
            console.log('[Modal] Body onChangeText:', text);
            setBody(text);
          }}
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
  menu: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    minHeight: 50,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  typeText: {
    fontSize: 14,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  deleteButtonText: {
    fontSize: 14,
  },
});
