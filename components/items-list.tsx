import {
  FlatList,
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Alert,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Swipeable } from "react-native-gesture-handler";
import { ThemedView } from "./themed-view";
import { ThemedText } from "./themed-text";
import { IconSymbol } from "./ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@clerk/clerk-expo";
import { useState } from "react";
import RescheduleModal from "./reschedule-modal";
import { useLocalItems, useLocalItemMutations } from "@/hooks/use-local-items";
import { LocalItem } from "@/db/types";
import { cancelItemNotification } from "@/lib/notification-manager";

export default function ItemsList() {
  const { isSignedIn, isLoaded } = useAuth();
  const { items, isLoading } = useLocalItems();
  const { updateItemStatus } = useLocalItemMutations();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const [rescheduleItemId, setRescheduleItemId] = useState<string | null>(null);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "note":
        return "doc.text";
      case "reminder":
        return "bell";
      case "task":
        return "cpu";
      default:
        return "doc.text";
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

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const handleComplete = async (item: LocalItem) => {
    try {
      // Cancel any notification for this item
      if (item.notificationId) {
        await cancelItemNotification(item.id, item.notificationId);
      }
      await updateItemStatus(item.id, "archived");
    } catch (error) {
      Alert.alert("Error", "Failed to archive item");
    }
  };

  const handleReschedule = (itemId: string) => {
    setRescheduleItemId(itemId);
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        style={[
          styles.swipeAction,
          styles.completeAction,
          { transform: [{ scale }], backgroundColor: colors.success },
        ]}
      >
        <IconSymbol
          name="checkmark.circle.fill"
          size={28}
          color={colors.white}
        />
        <Text style={[styles.swipeActionText, { color: colors.white }]}>
          Done
        </Text>
      </Animated.View>
    );
  };

  const renderLeftActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
    item: LocalItem,
  ) => {
    if (item.type !== "reminder") return null;

    const scale = dragX.interpolate({
      inputRange: [0, 100],
      outputRange: [0, 1],
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        style={[
          styles.swipeAction,
          styles.rescheduleAction,
          { transform: [{ scale }], backgroundColor: colors.primary },
        ]}
      >
        <IconSymbol name="calendar" size={28} color={colors.white} />
        <Text style={[styles.swipeActionText, { color: colors.white }]}>
          Reschedule
        </Text>
      </Animated.View>
    );
  };

  const renderItem = ({ item }: { item: LocalItem }) => (
    <Swipeable
      renderRightActions={(progress, dragX) =>
        renderRightActions(progress, dragX)
      }
      renderLeftActions={(progress, dragX) =>
        renderLeftActions(progress, dragX, item)
      }
      onSwipeableRightOpen={() => handleComplete(item)}
      onSwipeableLeftOpen={() =>
        item.type === "reminder" && handleReschedule(item.id)
      }
      overshootRight={false}
      overshootLeft={false}
    >
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => router.push(`/modal?itemId=${item.id}`)}
        activeOpacity={0.9}
      >
        <ThemedView
          style={[
            styles.neobrutalistCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 2,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <View style={styles.itemContent}>
            <View style={styles.itemHeader}>
              <View
                style={[
                  styles.typeIndicator,
                  {
                    backgroundColor: getTypeColor(item.type),
                    borderColor: colors.border,
                    borderWidth: 2,
                  },
                ]}
              >
                <IconSymbol
                  name={getTypeIcon(item.type)}
                  size={20}
                  color={colors.white}
                />
              </View>
              <View style={styles.titleContainer}>
                <View style={styles.titleRow}>
                  <ThemedText
                    type="defaultSemiBold"
                    style={styles.title}
                    numberOfLines={2}
                  >
                    {item.title}
                  </ThemedText>
                  {item.isDailyHighlight && (
                    <IconSymbol
                      name="sparkles"
                      size={16}
                      color={colors.highlight}
                    />
                  )}
                </View>
                {item.triggerAt && (
                  <Text style={[styles.triggerTime, { color: colors.text }]}>
                    {formatTime(item.triggerAt)}
                  </Text>
                )}
                {item.body && (
                  <ThemedText style={styles.body} numberOfLines={1}>
                    {item.body}
                  </ThemedText>
                )}
              </View>
            </View>
          </View>
        </ThemedView>
      </TouchableOpacity>
    </Swipeable>
  );

  if (!isLoaded || isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  if (!isSignedIn) {
    return (
      <ThemedView style={styles.emptyContainer}>
        <ThemedText>Please sign in to see your items</ThemedText>
      </ThemedView>
    );
  }

  if (items.length === 0) {
    return (
      <ThemedView style={styles.emptyContainer}>
        <IconSymbol
          name="doc.text"
          size={48}
          color={colors.icon}
          style={styles.emptyIcon}
        />
        <ThemedText type="subtitle" style={styles.emptyTitle}>
          No items yet
        </ThemedText>
        <ThemedText style={styles.emptyText}>
          Tap the + button to create your first note, reminder, or task
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[
        styles.listContainer,
        { paddingTop: insets.top + 16 },
      ]}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
      ListFooterComponent={
        <RescheduleModal
          itemId={rescheduleItemId}
          onClose={() => setRescheduleItemId(null)}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
    opacity: 0.7,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 120, // Space for FAB
  },
  itemContainer: {
    marginBottom: 12,
  },
  swipeAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#000000",
  },
  completeAction: {
    marginLeft: 8,
  },
  rescheduleAction: {
    marginRight: 8,
  },
  swipeActionText: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 4,
  },
  neobrutalistCard: {
    borderRadius: 4,
    padding: 16,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0, // Elevation has blur, so we might skip it or accept it on Android
    marginBottom: 4, // Space for shadow
  },
  itemContent: {
    gap: 12,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  typeIndicator: {
    width: 40,
    height: 40,
    borderRadius: 4, // Square-ish
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  typeIcon: {
    fontSize: 18,
  },
  titleContainer: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
  },
  triggerTime: {
    fontSize: 12,
    fontWeight: "500",
  },
  body: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 18,
  },
});
