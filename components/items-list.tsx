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
import { Swipeable, GestureDetector, Gesture } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { ThemedView } from "./themed-view";
import { ThemedText } from "./themed-text";
import { IconSymbol } from "./ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@clerk/clerk-expo";
import { useState, useMemo } from "react";
import RescheduleModal from "./reschedule-modal";
import QuickCaptureModal from "./quick-capture-modal";
import { useLocalItems, useLocalItemMutations } from "@/hooks/use-local-items";
import { LocalItem } from "@/db/types";
import { cancelItemNotification } from "@/lib/notification-manager";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCardCustomization } from "@/hooks/use-card-customization";
import {
  calculateUrgency,
  getUrgencyColor,
  sortByUrgency,
  useUrgencyRefresh,
} from "@/hooks/use-urgency";
import { UrgencyFill } from "./urgency-fill";

export default function ItemsList() {
  const { isSignedIn, isLoaded } = useAuth();
  const { items, isLoading } = useLocalItems();
  const { updateItemStatus } = useLocalItemMutations();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const [rescheduleItemId, setRescheduleItemId] = useState<string | null>(null);
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  const { customizations } = useCardCustomization();

  // Refresh urgency calculations every 60 seconds
  const urgencyTick = useUrgencyRefresh(60000);

  // Sort items: daily highlights first, then by soonest triggerAt
  const sortedItems = useMemo(() => {
    return sortByUrgency(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, urgencyTick]);

  // Get active agent runs count
  const activeAgentRuns = useQuery(api.agent.getActiveAgentRuns);
  const activeAgentCount = activeAgentRuns?.length ?? 0;

  // Pinch gesture to open quick capture
  const pinchGesture = Gesture.Pinch()
    .onEnd(() => {
      runOnJS(setShowQuickCapture)(true);
    });

  const getTypeIcon = (type: string) => {
    return customizations[type as keyof typeof customizations]?.icon || 'doc.text';
  };

  const getTypeColor = (type: string) => {
    return customizations[type as keyof typeof customizations]?.color || colors.text;
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
    } catch {
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
          { transform: [{ scale }], backgroundColor: colors.success, borderColor: colors.border },
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
          { transform: [{ scale }], backgroundColor: colors.primary, borderColor: colors.border },
        ]}
      >
        <IconSymbol name="calendar" size={28} color={colors.white} />
        <Text style={[styles.swipeActionText, { color: colors.white }]}>
          Reschedule
        </Text>
      </Animated.View>
    );
  };

  const renderItem = ({ item }: { item: LocalItem }) => {
    const urgency = calculateUrgency(item.triggerAt);
    const urgencyColor = getUrgencyColor(urgency.level, colors);

    return (
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
                borderColor: item.isDailyHighlight ? colors.highlight : colors.border,
                borderWidth: 2,
                shadowColor: colors.shadow,
              },
            ]}
          >
            {/* Liquid urgency fill - renders behind content */}
            {item.triggerAt && (
              <UrgencyFill
                percentage={urgency.percentage}
                level={urgency.level}
                color={urgencyColor}
              />
            )}
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
                  <ThemedText
                    type="defaultSemiBold"
                    style={styles.title}
                    numberOfLines={2}
                  >
                    {item.title}
                  </ThemedText>
                  {item.triggerAt && (
                    <Text style={[styles.triggerTime, { color: colors.text }]}>
                      {formatTime(item.triggerAt)}
                    </Text>
                  )}
                </View>
              </View>
              {item.body && (
                <ThemedText style={styles.body} numberOfLines={2}>
                  {item.body}
                </ThemedText>
              )}
            </View>
          </ThemedView>
        </TouchableOpacity>
      </Swipeable>
    );
  };

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

  const renderHeader = () => (
    <View style={styles.header}>
      <ThemedText type="title" style={styles.headerTitle}>
        Inbox
      </ThemedText>
      <TouchableOpacity
        style={[
          styles.agentButton,
          {
            backgroundColor: activeAgentCount > 0 ? colors.typeTask : colors.backgroundSecondary,
            borderColor: colors.border,
          },
        ]}
        onPress={() => router.push("/agent")}
      >
        <IconSymbol
          name="cpu"
          size={20}
          color={activeAgentCount > 0 ? colors.white : colors.icon}
        />
        {activeAgentCount > 0 && (
          <View style={[styles.agentBadge, { backgroundColor: colors.success }]}>
            <Text style={[styles.agentBadgeText, { color: colors.text }]}>{activeAgentCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <GestureDetector gesture={pinchGesture}>
      <View style={{ flex: 1 }}>
        <FlatList
          data={sortedItems}
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
          ListHeaderComponent={renderHeader}
          ListFooterComponent={
            <RescheduleModal
              itemId={rescheduleItemId}
              onClose={() => setRescheduleItemId(null)}
            />
          }
        />
        <QuickCaptureModal
          visible={showQuickCapture}
          onClose={() => setShowQuickCapture(false)}
        />
      </View>
    </GestureDetector>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
  },
  agentButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  agentBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  agentBadgeText: {
    fontSize: 11,
    fontWeight: "700",
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
    elevation: 0,
    marginBottom: 4,
    overflow: 'hidden',
  },
  itemContent: {
    gap: 12,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
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
    minWidth: 0,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    flexShrink: 1,
  },
  triggerTime: {
    fontSize: 12,
    fontWeight: "500",
    flexShrink: 1,
  },
  body: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 18,
    flexShrink: 1,
    marginLeft: 52, // Align with title (icon width 40 + gap 12)
    marginTop: 8,
  },
});
