import {
  StyleSheet,
  TouchableOpacity,
  View,
  FlatList,
  Linking,
  ActivityIndicator,
} from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { router } from "expo-router";

export default function AgentScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [stoppingId, setStoppingId] = useState<string | null>(null);

  const activeRuns = useQuery(api.agent.getActiveAgentRuns);
  const stopSandbox = useAction(api.agent.stopDaytonaSandbox);

  const handleOpenPreview = (previewUrl: string) => {
    Linking.openURL(previewUrl);
  };

  const handleStop = async (runId: string, sandboxId: string) => {
    setStoppingId(runId);
    try {
      await stopSandbox({ runId: runId as any, sandboxId });
    } catch (error) {
      console.error("Failed to stop sandbox:", error);
    } finally {
      setStoppingId(null);
    }
  };

  const renderEmptyState = () => (
    <ThemedView style={styles.emptyState}>
      <IconSymbol name="cpu" size={48} color={colors.icon} />
      <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
        No Active Agents
      </ThemedText>
      <ThemedText style={[styles.emptySubtitle, { color: colors.icon }]}>
        Start an agent from a task item to see it here
      </ThemedText>
      <TouchableOpacity
        style={[styles.backButton, { backgroundColor: colors.tint }]}
        onPress={() => router.back()}
      >
        <ThemedText style={[styles.backButtonText, { color: colors.primaryForeground }]}>Go Back</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );

  const renderItem = ({ item }: { item: NonNullable<typeof activeRuns>[0] }) => (
    <ThemedView
      style={[styles.card, { backgroundColor: colors.backgroundSecondary }]}
    >
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === "running" ? colors.success : colors.warning,
            },
          ]}
        >
          <ThemedText style={[styles.statusText, { color: colors.text }]}>
            {item.status === "running" ? "Running" : "Starting..."}
          </ThemedText>
        </View>
        <ThemedText style={[styles.timestamp, { color: colors.icon }]}>
          {new Date(item._creationTime).toLocaleTimeString()}
        </ThemedText>
      </View>

      {item.summary && (
        <ThemedText style={[styles.summary, { color: colors.text }]}>
          {item.summary}
        </ThemedText>
      )}

      <View style={styles.cardActions}>
        {item.previewUrl && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.tint }]}
            onPress={() => handleOpenPreview(item.previewUrl!)}
          >
            <IconSymbol
              name="externaldrive.connected.to.line.below"
              size={18}
              color={colors.primaryForeground}
            />
            <ThemedText style={[styles.actionButtonText, { color: colors.primaryForeground }]}>Open</ThemedText>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.error }]}
          onPress={() => handleStop(item._id, item.sandboxId!)}
          disabled={stoppingId === item._id || !item.sandboxId}
        >
          {stoppingId === item._id ? (
            <ActivityIndicator color={colors.primaryForeground} size="small" />
          ) : (
            <>
              <IconSymbol name="stop.fill" size={18} color={colors.primaryForeground} />
              <ThemedText style={[styles.actionButtonText, { color: colors.primaryForeground }]}>Stop</ThemedText>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { borderBottomColor: colors.overlayLight }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backArrow}>
          <IconSymbol name="chevron.right" size={24} color={colors.text} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <ThemedText style={styles.title}>Active Agents</ThemedText>
        <View style={styles.placeholder} />
      </View>

      {activeRuns === undefined ? (
        <ThemedView style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.tint} />
        </ThemedView>
      ) : activeRuns.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={activeRuns}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  backArrow: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  placeholder: {
    width: 40,
  },
  loadingState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  backButtonText: {
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  timestamp: {
    fontSize: 12,
  },
  summary: {
    fontSize: 14,
  },
  cardActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonText: {
    fontWeight: "600",
    fontSize: 14,
  },
});
