import {
  FlatList,
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Alert,
  Animated as RNAnimated,
  Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Swipeable } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { ThemedView } from "./themed-view";
import { ThemedText } from "./themed-text";
import { IconSymbol } from "./ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@clerk/clerk-expo";
import { useState, useMemo, useCallback } from "react";
import RescheduleModal from "./reschedule-modal";
import { useLocalItems, useLocalItemMutations } from "@/hooks/use-local-items";
import { LocalItem } from "@/db/types";
import { cancelItemNotification } from "@/lib/notification-manager";
import { useCardCustomization } from "@/hooks/use-card-customization";
import {
  calculateUrgency,
  getUrgencyColor,
  sortByUrgency,
  useUrgencyRefresh,
} from "@/hooks/use-urgency";
import { UrgencyFill } from "./urgency-fill";
import { formatItemAsMarkdown } from "@/lib/share-utils";

export default function ItemsList() {
  const { isSignedIn, isLoaded } = useAuth();
  const { items, isLoading } = useLocalItems();
  const { updateItemStatus } = useLocalItemMutations();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const [rescheduleItemId, setRescheduleItemId] = useState<string | null>(null);
  const { customizations } = useCardCustomization();

  // Refresh urgency calculations every 60 seconds
  const urgencyTick = useUrgencyRefresh(60000);

  // Sort items: daily highlights first, then by soonest triggerAt
  const sortedItems = useMemo(() => {
    return sortByUrgency(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, urgencyTick]);

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

  const handleShare = async (item: LocalItem, event: any) => {
    event.stopPropagation();
    try {
      const markdown = formatItemAsMarkdown(item);
      await Share.share({
        message: markdown,
        title: item.title,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to share item");
    }
  };

  // Haptic feedback on swipe trigger
  const triggerHapticFeedback = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  // Animated swipe action for Done (right swipe) - slides in from right with rotation
  const renderRightActions = useCallback(
    (progress: RNAnimated.AnimatedInterpolation<number>, dragX: RNAnimated.AnimatedInterpolation<number>) => {
      // Slide in from right
      const translateX = dragX.interpolate({
        inputRange: [-120, -80, -40, 0],
        outputRange: [0, 0, 20, 60],
        extrapolate: "clamp",
      });

      // Scale up as user swipes
      const scale = dragX.interpolate({
        inputRange: [-120, -60, -20, 0],
        outputRange: [1, 1, 0.6, 0.2],
        extrapolate: "clamp",
      });

      // Fade in
      const opacity = dragX.interpolate({
        inputRange: [-80, -40, 0],
        outputRange: [1, 0.8, 0],
        extrapolate: "clamp",
      });

      // Rotate checkmark icon
      const iconRotate = dragX.interpolate({
        inputRange: [-100, -60, 0],
        outputRange: ["0deg", "-20deg", "-90deg"],
        extrapolate: "clamp",
      });

      // Icon scale bounce when triggered
      const iconScale = dragX.interpolate({
        inputRange: [-120, -80, -60, 0],
        outputRange: [1.3, 1.1, 1, 0.5],
        extrapolate: "clamp",
      });

      return (
        <RNAnimated.View
          style={[
            styles.swipeActionContainer,
            styles.completeActionContainer,
            {
              opacity,
              transform: [{ translateX }],
            },
          ]}
        >
          <RNAnimated.View
            style={[
              styles.swipeAction,
              styles.completeAction,
              {
                backgroundColor: colors.success,
                borderColor: colors.border,
                transform: [{ scale }],
              },
            ]}
          >
            <RNAnimated.View
              style={{
                transform: [{ rotate: iconRotate }, { scale: iconScale }],
              }}
            >
              <IconSymbol
                name="checkmark.circle.fill"
                size={28}
                color={colors.white}
              />
            </RNAnimated.View>
            <Text style={[styles.swipeActionText, { color: colors.white }]}>
              Done
            </Text>
          </RNAnimated.View>
        </RNAnimated.View>
      );
    },
    [colors]
  );

  // Animated swipe action for Reschedule (left swipe) - slides in from left with bounce
  const renderLeftActions = useCallback(
    (progress: RNAnimated.AnimatedInterpolation<number>, dragX: RNAnimated.AnimatedInterpolation<number>, item: LocalItem) => {
      if (item.type !== "reminder") return null;

      // Slide in from left
      const translateX = dragX.interpolate({
        inputRange: [0, 40, 80, 120],
        outputRange: [-60, -20, 0, 0],
        extrapolate: "clamp",
      });

      // Scale up as user swipes
      const scale = dragX.interpolate({
        inputRange: [0, 20, 60, 120],
        outputRange: [0.2, 0.6, 1, 1],
        extrapolate: "clamp",
      });

      // Fade in
      const opacity = dragX.interpolate({
        inputRange: [0, 40, 80],
        outputRange: [0, 0.8, 1],
        extrapolate: "clamp",
      });

      // Calendar icon pulse/scale
      const iconScale = dragX.interpolate({
        inputRange: [0, 60, 80, 120],
        outputRange: [0.5, 1, 1.1, 1.3],
        extrapolate: "clamp",
      });

      // Subtle rotation for calendar
      const iconRotate = dragX.interpolate({
        inputRange: [0, 60, 100],
        outputRange: ["10deg", "0deg", "-5deg"],
        extrapolate: "clamp",
      });

      return (
        <RNAnimated.View
          style={[
            styles.swipeActionContainer,
            styles.rescheduleActionContainer,
            {
              opacity,
              transform: [{ translateX }],
            },
          ]}
        >
          <RNAnimated.View
            style={[
              styles.swipeAction,
              styles.rescheduleAction,
              {
                backgroundColor: colors.primary,
                borderColor: colors.border,
                transform: [{ scale }],
              },
            ]}
          >
            <RNAnimated.View
              style={{
                transform: [{ scale: iconScale }, { rotate: iconRotate }],
              }}
            >
              <IconSymbol name="calendar" size={28} color={colors.white} />
            </RNAnimated.View>
            <Text style={[styles.swipeActionText, { color: colors.white }]}>
              Snooze
            </Text>
          </RNAnimated.View>
        </RNAnimated.View>
      );
    },
    [colors]
  );

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
        onSwipeableWillOpen={(direction) => {
          triggerHapticFeedback();
        }}
        onSwipeableRightOpen={() => handleComplete(item)}
        onSwipeableLeftOpen={() =>
          item.type === "reminder" && handleReschedule(item.id)
        }
        overshootRight={false}
        overshootLeft={false}
        friction={2}
        rightThreshold={60}
        leftThreshold={60}
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
                    name={getTypeIcon(item.type) as any}
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
                <TouchableOpacity
                  style={[styles.shareButton, { backgroundColor: colors.tint, borderColor: colors.border }]}
                  onPress={(e) => handleShare(item, e)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <IconSymbol
                    name="square.and.arrow.up"
                    size={22}
                    color={colors.white}
                  />
                </TouchableOpacity>
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
          size={64}
          color={colors.icon}
          style={styles.emptyIcon}
        />
        <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
          No items yet
        </ThemedText>
        <ThemedText style={[styles.emptyText, { color: colors.icon }]}>
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
    </View>
  );

  return (
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
    </View>
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
    padding: 32,
    gap: 16,
  },
  emptyIcon: {
    // Spacing handled by gap in container
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    maxWidth: 280,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 120, // Space for FAB
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
  },
  itemContainer: {
    marginBottom: 12,
  },
  swipeActionContainer: {
    justifyContent: "center",
    alignItems: "center",
    minWidth: 72,
    paddingHorizontal: 4,
  },
  completeActionContainer: {
    marginLeft: 4,
  },
  rescheduleActionContainer: {
    marginRight: 4,
  },
  swipeAction: {
    justifyContent: "center",
    alignItems: "center",
    minWidth: 64,
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 2,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  completeAction: {},
  rescheduleAction: {},
  swipeActionText: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
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
    position: 'relative',
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
  shareButton: {
    width: 38,
    height: 38,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
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
