import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
  View,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import RescheduleModal from "@/components/reschedule-modal";
import AgentModal from "@/components/agent-modal";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLocalItem, useLocalItemMutations } from "@/hooks/use-local-items";
import {
  scheduleStickyNotification,
  cancelItemNotification,
} from "@/lib/notification-manager";
import { Id } from "@/convex/_generated/dataModel";

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
    setNotificationId,
  } = useLocalItemMutations();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [isDailyHighlight, setIsDailyHighlight] = useState(false);
  const [showReschedulePicker, setShowReschedulePicker] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);

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
    }
  }, [item]);

  useEffect(() => {
    console.log('[Modal] Title effect', {
      title,
      itemTitle: item?.title,
      willSave: item && title !== item.title && title.trim()
    });
    if (item && title !== item.title && title.trim()) {
      const timeoutId = setTimeout(() => {
        console.log('[Modal] Saving title:', title.trim());
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

  const handlePinToggle = async (value: boolean) => {
    console.log('[Modal] handlePinToggle called with:', value);
    setIsPinned(value);
    if (item) {
      console.log('[Modal] Calling toggleItemPin for item:', item.id);
      const result = await toggleItemPin(item.id, value);
      console.log('[Modal] toggleItemPin result:', result);

      // Handle notification
      if (value && item.type === "note") {
        // Schedule sticky notification when pinning
        const notificationId = await scheduleStickyNotification(
          item.id,
          item.title,
        );
        if (notificationId) {
          await setNotificationId(item.id, notificationId);
        }
      } else if (!value && item.notificationId) {
        // Cancel notification when unpinning
        await cancelItemNotification(item.id, item.notificationId);
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
        <ThemedView style={styles.menuItem}>
          <ThemedText style={styles.menuLabel}>Type</ThemedText>
          <ThemedText
            style={[styles.typeText, { color: getTypeColor(item.type) }]}
          >
            {getTypeIcon(item.type)}
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.menuItem}>
          <ThemedText style={styles.menuLabel}>Pin to notifications</ThemedText>
          <Switch
            value={isPinned}
            onValueChange={handlePinToggle}
            trackColor={{ false: colors.icon, true: colors.tint }}
            thumbColor={
              isPinned ? colors.switchThumbActive : colors.switchThumbInactive
            }
          />
        </ThemedView>

        <ThemedView style={styles.menuItem}>
          <ThemedText style={styles.menuLabel}>Daily Highlight</ThemedText>
          <Switch
            value={isDailyHighlight}
            onValueChange={handleHighlightToggle}
            trackColor={{ false: colors.icon, true: colors.highlight }}
            thumbColor={
              isDailyHighlight
                ? colors.switchThumbActive
                : colors.switchThumbInactive
            }
          />
        </ThemedView>

        {item.type === "reminder" && (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowReschedulePicker(true)}
          >
            <ThemedText style={styles.menuLabel}>Reschedule</ThemedText>
            <IconSymbol name="chevron.right" size={20} color={colors.icon} />
          </TouchableOpacity>
        )}

        {item.type === "task" && (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowAgentModal(true)}
          >
            <ThemedText style={styles.menuLabel}>Run with Agent</ThemedText>
            <View style={styles.agentButtonContent}>
              <IconSymbol name="cpu" size={18} color={colors.typeTask} />
              <IconSymbol name="chevron.right" size={20} color={colors.icon} />
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
          <ThemedText style={styles.menuLabel}>Delete</ThemedText>
          <ThemedText
            style={[styles.deleteButtonText, { color: colors.error }]}
          >
            Delete
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.spacer} />

      <TextInput
        style={[
          styles.bodyInput,
          { color: colors.text, borderColor: colors.icon },
        ]}
        value={body}
        onChangeText={(text) => {
          console.log('[Modal] Body onChangeText:', text);
          setBody(text);
        }}
        placeholder="Add notes..."
        placeholderTextColor={colors.icon}
        multiline
        textAlignVertical="top"
      />

      <ThemedView style={styles.footer}></ThemedView>

      <RescheduleModal
        itemId={showReschedulePicker && item ? item.id : null}
        onClose={() => setShowReschedulePicker(false)}
      />

      {showAgentModal && item && item.convexId && (
        <AgentModal
          taskId={item.convexId as Id<"items">}
          taskTitle={item.title}
          taskGoal={item.taskSpec?.goal}
          onClose={() => setShowAgentModal(false)}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  pinLabel: {
    fontSize: 16,
  },
  menu: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  spacer: {
    flex: 1,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,0,0,0.1)",
    minHeight: 50,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  footer: {
    alignItems: "flex-end",
  },
  typeText: {
    fontSize: 14,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 14,
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "600",
  },
  agentButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
