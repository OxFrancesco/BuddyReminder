import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import * as chrono from "chrono-node";
import { ThemedText } from "./themed-text";
import { IconSymbol } from "./ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLocalItemMutations } from "@/hooks/use-local-items";
import {
  scheduleStickyNotification,
  scheduleReminderNotification,
} from "@/lib/notification-manager";
import { ItemType, TaskSpec } from "@/db/types";

interface QuickCaptureModalProps {
  visible: boolean;
  onClose: () => void;
}

interface ParsedInput {
  type: ItemType;
  title: string;
  triggerAt?: number;
  taskSpec?: TaskSpec;
}

export default function QuickCaptureModal({
  visible,
  onClose,
}: QuickCaptureModalProps) {
  const [input, setInput] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const { createItem, setNotificationId } = useLocalItemMutations();

  const parseInput = (text: string): ParsedInput => {
    const lowerText = text.toLowerCase().trim();

    // Task detection
    if (lowerText.startsWith("task:")) {
      return {
        type: "task",
        title: text.replace(/^task:\s*/i, ""),
        taskSpec: {
          goal: text.replace(/^task:\s*/i, ""),
        },
      };
    }

    // Try to parse date/time with chrono
    const parsedDates = chrono.parse(text, new Date(), { forwardDate: true });

    // Reminder detection - check for time-related keywords or parsed dates
    const reminderKeywords = [
      "remind me",
      "reminder",
      "at ",
      "tomorrow",
      "today",
      "tonight",
      "morning",
      "afternoon",
      "evening",
      "next",
      "on ",
      "every",
    ];
    const hasReminderKeyword = reminderKeywords.some((keyword) =>
      lowerText.includes(keyword),
    );

    if (hasReminderKeyword || parsedDates.length > 0) {
      let triggerAt: number | undefined;
      let cleanTitle = text;

      if (parsedDates.length > 0) {
        const parsed = parsedDates[0];
        triggerAt = parsed.start.date().getTime();

        // Remove the date/time text from the title
        cleanTitle =
          text.substring(0, parsed.index) +
          text.substring(parsed.index + parsed.text.length);
        cleanTitle = cleanTitle.replace(/^remind me to\s*/i, "").trim();
      } else {
        cleanTitle = text.replace(/^remind me to\s*/i, "");
      }

      return {
        type: "reminder",
        title: cleanTitle || text,
        triggerAt,
      };
    }

    // Default to note
    return {
      type: "note",
      title: text,
    };
  };

  const handleSave = async () => {
    console.log("[QuickCapture] handleSave called");
    console.log("[QuickCapture] input:", input);
    console.log("[QuickCapture] input.trim():", input.trim());

    if (!input.trim()) {
      console.log("[QuickCapture] Empty input, returning early");
      return;
    }

    setIsLoading(true);
    console.log("[QuickCapture] isLoading set to true");

    try {
      const parsed = parseInput(input);
      console.log("[QuickCapture] Parsed input:", JSON.stringify(parsed, null, 2));

      // Create item locally (instant)
      console.log("[QuickCapture] Calling createItem with:", {
        type: parsed.type,
        title: parsed.title,
        isPinned: isPinned,
        triggerAt: parsed.triggerAt,
        taskSpec: parsed.taskSpec,
      });

      const item = await createItem({
        type: parsed.type,
        title: parsed.title,
        isPinned: isPinned,
        triggerAt: parsed.triggerAt,
        taskSpec: parsed.taskSpec,
      });

      console.log("[QuickCapture] Item created:", JSON.stringify(item, null, 2));

      // Schedule notifications based on type
      if (isPinned && parsed.type === "note") {
        console.log("[QuickCapture] Scheduling sticky notification");
        const notificationId = await scheduleStickyNotification(
          item.id,
          parsed.title,
        );
        console.log("[QuickCapture] Sticky notification ID:", notificationId);
        if (notificationId) {
          await setNotificationId(item.id, notificationId);
        }
      } else if (parsed.type === "reminder" && parsed.triggerAt) {
        console.log("[QuickCapture] Scheduling reminder notification");
        const notificationId = await scheduleReminderNotification(
          item.id,
          parsed.title,
          parsed.triggerAt,
        );
        console.log("[QuickCapture] Reminder notification ID:", notificationId);
        if (notificationId) {
          await setNotificationId(item.id, notificationId);
        }
      }

      console.log("[QuickCapture] Save successful, closing modal");
      setInput("");
      setIsPinned(false);
      onClose();
    } catch (error) {
      console.error("[QuickCapture] Error saving item:", error);
      console.error("[QuickCapture] Error stack:", (error as Error).stack);
      Alert.alert("Error", "Failed to save item. Please try again.");
    } finally {
      setIsLoading(false);
      console.log("[QuickCapture] isLoading set to false");
    }
  };

  const getPreviewType = (): ItemType => {
    if (!input.trim()) return "note";
    return parseInput(input).type;
  };

  const getTypeColor = (type: ItemType) => {
    switch (type) {
      case "note":
        return colors.textSecondary;
      case "reminder":
        return colors.warning;
      case "task":
        return colors.tint;
      default:
        return colors.text;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={[styles.cancelText, { color: colors.text }]}>
              Cancel
            </Text>
          </TouchableOpacity>

          <ThemedText type="defaultSemiBold">Quick Capture</ThemedText>

          <TouchableOpacity
            onPress={handleSave}
            style={[
              styles.saveButton,
              {
                backgroundColor: input.trim() ? colors.primary : colors.muted,
                borderColor: colors.border,
                borderWidth: 2,
                shadowColor: colors.shadow,
                opacity: 1, // Override opacity change
              },
            ]}
            disabled={!input.trim() || isLoading}
          >
            <Text
              style={[
                styles.saveText,
                {
                  color: colors.white,
                },
              ]}
            >
              {isLoading ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.typeRow}>
            <View
              style={[
                styles.typePreview,
                {
                  backgroundColor: getTypeColor(getPreviewType()),
                  borderColor: colors.border,
                  borderWidth: 2,
                },
              ]}
            >
              <Text
                style={[
                  styles.typeText,
                  { color: colors.black },
                ]}
              >
                {getPreviewType().charAt(0).toUpperCase() +
                  getPreviewType().slice(1)}
              </Text>
            </View>

            {getPreviewType() === "note" && (
              <TouchableOpacity
                style={[
                  styles.pinToggle,
                  {
                    backgroundColor: isPinned
                      ? colors.tint
                      : colors.backgroundSecondary,
                    borderColor: colors.border,
                    borderWidth: 2,
                    shadowColor: colors.shadow,
                  },
                ]}
                onPress={() => setIsPinned(!isPinned)}
              >
                <IconSymbol
                  name={isPinned ? "pin.fill" : "pin"}
                  size={16}
                  color={isPinned ? colors.primaryForeground : colors.text}
                />
                <Text
                  style={[
                    styles.pinText,
                    {
                      color: isPinned ? colors.primaryForeground : colors.text,
                    },
                  ]}
                >
                  {isPinned ? "Pinned" : "Pin"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.background,
                shadowColor: colors.shadow,
              },
            ]}
            placeholder="What's on your mind?"
            placeholderTextColor={colors.mutedForeground}
            value={input}
            onChangeText={setInput}
            multiline
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />

          <View
            style={[
              styles.hints,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
                borderWidth: 2,
              },
            ]}
          >
            <ThemedText style={styles.hintText}>
              Try: &ldquo;Remind me tomorrow at 3pm to call mom&rdquo; or
              &ldquo;Meeting next Monday at 2:30pm&rdquo; or
              &ldquo;Task: summarize this PDF&rdquo;
            </ThemedText>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 2,
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  saveText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  typeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  typePreview: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    alignSelf: "flex-start",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  typeIcon: {
    fontSize: 16,
    marginRight: 8,
    fontWeight: "bold",
  },
  typeText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  pinToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    gap: 6,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  pinText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 2,
    borderRadius: 4,
    padding: 12,
    fontSize: 18,
    minHeight: 100,
    textAlignVertical: "top",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    marginBottom: 20,
  },
  hints: {
    marginTop: 16,
    padding: 12,
    borderRadius: 4,
  },
  hintText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
