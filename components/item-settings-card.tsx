import React from "react";
import {
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
  Pressable,
} from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol, IconSymbolName } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { LocalItem } from "@/db/types";

interface ItemSettingsCardProps {
  item: LocalItem;
  isPinned: boolean;
  isDailyHighlight: boolean;
  onPinToggle: (value: boolean) => void;
  onHighlightToggle: (value: boolean) => void;
  onReschedule: () => void;
  onDelete: () => void;
}

export function ItemSettingsCard({
  item,
  isPinned,
  isDailyHighlight,
  onPinToggle,
  onHighlightToggle,
  onReschedule,
  onDelete,
}: ItemSettingsCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

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

  return (
    <ThemedView
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
      ]}
    >
      <View style={styles.header}>
        <ThemedText
          style={[styles.headerTitle, { color: colors.textSecondary }]}
        >
          SETTINGS
        </ThemedText>
      </View>

      <SettingsRow label="Type" icon="tag.fill" isLast={false}>
        <ThemedText
          style={[styles.typeText, { color: getTypeColor(item.type) }]}
        >
          {getTypeIcon(item.type)}
        </ThemedText>
      </SettingsRow>

      <SettingsRow label="Pin to notifications" icon="pin.fill" isLast={false}>
        <Switch
          value={isPinned}
          onValueChange={onPinToggle}
          trackColor={{ false: colors.switchTrackInactive, true: colors.tint }}
          thumbColor={
            isPinned ? colors.switchThumbActive : colors.switchThumbInactive
          }
        />
      </SettingsRow>

      <SettingsRow
        label="Daily Highlight"
        icon="star.fill"
        isLast={item.type !== "reminder"}
      >
        <Switch
          value={isDailyHighlight}
          onValueChange={onHighlightToggle}
          trackColor={{
            false: colors.switchTrackInactive,
            true: colors.highlight,
          }}
          thumbColor={
            isDailyHighlight
              ? colors.switchThumbActive
              : colors.switchThumbInactive
          }
        />
      </SettingsRow>

      {item.type === "reminder" && (
        <SettingsRow
          label="Reschedule"
          icon="clock.fill"
          isLast={true}
          onPress={onReschedule}
          showChevron
        />
      )}

      <TouchableOpacity
        style={[
          styles.deleteButton,
          {
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.error,
          },
        ]}
        onPress={onDelete}
        activeOpacity={0.7}
      >
        <IconSymbol name="trash.fill" size={20} color={colors.error} />
        <ThemedText style={[styles.deleteButtonText, { color: colors.error }]}>
          DELETE ITEM
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

interface SettingsRowProps {
  label: string;
  icon: IconSymbolName;
  children?: React.ReactNode;
  isLast?: boolean;
  onPress?: () => void;
  showChevron?: boolean;
}

function SettingsRow({
  label,
  icon,
  children,
  isLast,
  onPress,
  showChevron,
}: SettingsRowProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const Content = (
    <View
      style={[
        styles.rowContent,
        {
          borderBottomColor: isLast ? "transparent" : colors.border,
          borderBottomWidth: isLast ? 0 : 1,
        },
      ]}
    >
      <View style={styles.labelContainer}>
        <IconSymbol
          name={icon}
          size={18}
          color={colors.icon}
          style={styles.rowIcon}
        />
        <ThemedText style={styles.rowLabel}>{label}</ThemedText>
      </View>
      <View style={styles.rightContent}>
        {children}
        {showChevron && (
          <IconSymbol name="chevron.right" size={20} color={colors.icon} />
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.rowContainer,
          pressed && { backgroundColor: colors.backgroundSecondary },
        ]}
      >
        {Content}
      </Pressable>
    );
  }

  return <View style={styles.rowContainer}>{Content}</View>;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 2,
    marginTop: 8,
    marginBottom: 24,
    overflow: "hidden",
    elevation: 4,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#e5e5e5", // Will be overridden by theme in runtime if needed, but using border color from props is better
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  rowContainer: {
    minHeight: 56,
    justifyContent: "center",
  },
  rowContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    paddingVertical: 16,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowIcon: {
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  rightContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  typeText: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    marginTop: 8,
    borderTopWidth: 2,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
