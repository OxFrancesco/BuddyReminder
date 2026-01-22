import {
  StyleSheet,
  TouchableOpacity,
  View,
  FlatList,
  Linking,
  ActivityIndicator,
  SectionList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { router } from "expo-router";
import { Id } from "@/convex/_generated/dataModel";
import LogViewer from "@/components/log-viewer";
import ArtifactViewer from "@/components/artifact-viewer";

type AgentRunStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

interface AgentRun {
  _id: Id<"agentRuns">;
  _creationTime: number;
  taskId: Id<"items">;
  userId: Id<"users">;
  status: AgentRunStatus;
  summary?: string;
  cost?: {
    sandboxRuntime: number;
    llmTokens?: number;
    total: number;
  };
  error?: string;
  startedAt?: number;
  endedAt?: number;
  sandboxId?: string;
  previewUrl?: string;
  sessionId?: string;
}

export default function AgentNotebook() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();

  const [stoppingId, setStoppingId] = useState<string | null>(null);
  const [selectedRunForLogs, setSelectedRunForLogs] = useState<Id<"agentRuns"> | null>(null);
  const [selectedRunForArtifacts, setSelectedRunForArtifacts] = useState<Id<"agentRuns"> | null>(null);

  const activeRuns = useQuery(api.agent.getActiveAgentRuns);
  const allRuns = useQuery(api.agent.getAllAgentRuns);
  const stopSandbox = useAction(api.agent.stopDaytonaSandbox);

  const handleOpenPreview = (previewUrl: string) => {
    Linking.openURL(previewUrl);
  };

  const handleStop = async (runId: string, sandboxId: string) => {
    setStoppingId(runId);
    try {
      await stopSandbox({ runId: runId as Id<"agentRuns">, sandboxId });
    } catch (error) {
      console.error("Failed to stop sandbox:", error);
    } finally {
      setStoppingId(null);
    }
  };

  const getStatusColor = (status: AgentRunStatus) => {
    switch (status) {
      case "running":
        return colors.success;
      case "pending":
        return colors.warning;
      case "completed":
        return colors.tint;
      case "failed":
        return colors.error;
      case "cancelled":
        return colors.icon;
      default:
        return colors.icon;
    }
  };

  const getStatusIcon = (status: AgentRunStatus) => {
    switch (status) {
      case "running":
        return "play.circle.fill";
      case "pending":
        return "clock.fill";
      case "completed":
        return "checkmark.circle.fill";
      case "failed":
        return "xmark.circle.fill";
      case "cancelled":
        return "stop.circle.fill";
      default:
        return "circle";
    }
  };

  const formatDuration = (startedAt?: number, endedAt?: number) => {
    if (!startedAt) return null;
    const end = endedAt || Date.now();
    const duration = Math.floor((end - startedAt) / 1000);
    if (duration < 60) return `${duration}s`;
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}m ${seconds}s`;
  };

  const formatCost = (cost?: { total: number }) => {
    if (!cost) return null;
    return `$${(cost.total / 100).toFixed(2)}`;
  };

  const renderActiveRun = ({ item }: { item: AgentRun }) => (
    <ThemedView
      style={[
        styles.card,
        styles.activeCard,
        { backgroundColor: colors.card, borderColor: colors.success },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.statusContainer}>
          <IconSymbol
            name={getStatusIcon(item.status)}
            size={16}
            color={getStatusColor(item.status)}
          />
          <ThemedText style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status === "running" ? "Running" : "Starting..."}
          </ThemedText>
        </View>
        <ThemedText style={[styles.timestamp, { color: colors.icon }]}>
          {formatDuration(item.startedAt)}
        </ThemedText>
      </View>

      {item.summary && (
        <ThemedText style={[styles.summary, { color: colors.text }]} numberOfLines={2}>
          {item.summary}
        </ThemedText>
      )}

      <View style={styles.cardActions}>
        {item.previewUrl && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.tint }]}
            onPress={() => handleOpenPreview(item.previewUrl!)}
          >
            <IconSymbol name="safari" size={16} color={colors.primaryForeground} />
            <ThemedText style={[styles.actionText, { color: colors.primaryForeground }]}>
              Open
            </ThemedText>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.backgroundSecondary }]}
          onPress={() => setSelectedRunForLogs(item._id)}
        >
          <IconSymbol name="text.bubble" size={16} color={colors.tint} />
          <ThemedText style={[styles.actionText, { color: colors.tint }]}>Logs</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.error }]}
          onPress={() => handleStop(item._id, item.sandboxId!)}
          disabled={stoppingId === item._id || !item.sandboxId}
        >
          {stoppingId === item._id ? (
            <ActivityIndicator color={colors.primaryForeground} size="small" />
          ) : (
            <>
              <IconSymbol name="stop.fill" size={16} color={colors.primaryForeground} />
              <ThemedText style={[styles.actionText, { color: colors.primaryForeground }]}>
                Stop
              </ThemedText>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ThemedView>
  );

  const renderHistoryRun = ({ item }: { item: AgentRun }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => setSelectedRunForLogs(item._id)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.statusContainer}>
          <IconSymbol
            name={getStatusIcon(item.status)}
            size={16}
            color={getStatusColor(item.status)}
          />
          <ThemedText style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </ThemedText>
        </View>
        <View style={styles.metaContainer}>
          {formatCost(item.cost) && (
            <ThemedText style={[styles.cost, { color: colors.icon }]}>
              {formatCost(item.cost)}
            </ThemedText>
          )}
          <ThemedText style={[styles.timestamp, { color: colors.icon }]}>
            {new Date(item._creationTime).toLocaleDateString()}
          </ThemedText>
        </View>
      </View>

      {item.summary && (
        <ThemedText style={[styles.summary, { color: colors.text }]} numberOfLines={2}>
          {item.summary}
        </ThemedText>
      )}

      {item.error && (
        <ThemedText style={[styles.error, { color: colors.error }]} numberOfLines={1}>
          {item.error}
        </ThemedText>
      )}

      <View style={styles.cardFooter}>
        {formatDuration(item.startedAt, item.endedAt) && (
          <ThemedText style={[styles.duration, { color: colors.icon }]}>
            Duration: {formatDuration(item.startedAt, item.endedAt)}
          </ThemedText>
        )}
        <View style={styles.footerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={(e) => {
              e.stopPropagation();
              setSelectedRunForLogs(item._id);
            }}
          >
            <IconSymbol name="text.bubble" size={18} color={colors.tint} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={(e) => {
              e.stopPropagation();
              setSelectedRunForArtifacts(item._id);
            }}
          >
            <IconSymbol name="doc" size={18} color={colors.tint} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <ThemedView style={styles.emptyState}>
      <IconSymbol name="cpu" size={64} color={colors.icon} />
      <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
        Agent Notebook
      </ThemedText>
      <ThemedText style={[styles.emptySubtitle, { color: colors.icon }]}>
        Your agent runs will appear here. Tap the agent icon on any card to start.
      </ThemedText>
    </ThemedView>
  );

  const isLoading = activeRuns === undefined || allRuns === undefined;
  const hasNoRuns = !isLoading && (activeRuns?.length === 0) && (allRuns?.length === 0);
  const historyRuns = allRuns?.filter(
    (run) => run.status !== "running" && run.status !== "pending"
  ) || [];

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <ThemedText type="title" style={styles.headerTitle}>
          Agent Notebook
        </ThemedText>
        <View style={[styles.headerIcon, { backgroundColor: colors.typeTask }]}>
          <IconSymbol name="cpu" size={20} color={colors.white} />
        </View>
      </View>

      {isLoading ? (
        <ThemedView style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.tint} />
        </ThemedView>
      ) : hasNoRuns ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={[
            ...(activeRuns || []).map((run) => ({ ...run, isActive: true })),
            ...historyRuns.map((run) => ({ ...run, isActive: false })),
          ]}
          renderItem={({ item }) =>
            item.isActive ? renderActiveRun({ item }) : renderHistoryRun({ item })
          }
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            activeRuns && activeRuns.length > 0 ? (
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                Active Runs ({activeRuns.length})
              </ThemedText>
            ) : null
          }
          stickyHeaderIndices={activeRuns && activeRuns.length > 0 ? [0] : undefined}
        />
      )}

      {selectedRunForLogs && (
        <LogViewer
          runId={selectedRunForLogs}
          onClose={() => setSelectedRunForLogs(null)}
        />
      )}

      {selectedRunForArtifacts && (
        <ArtifactViewer
          runId={selectedRunForArtifacts}
          onClose={() => setSelectedRunForArtifacts(null)}
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
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
    fontSize: 24,
    fontWeight: "600",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    maxWidth: 280,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  card: {
    borderRadius: 8,
    padding: 16,
    borderWidth: 2,
    gap: 12,
  },
  activeCard: {
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  metaContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timestamp: {
    fontSize: 12,
  },
  cost: {
    fontSize: 12,
    fontWeight: "600",
  },
  summary: {
    fontSize: 14,
    lineHeight: 20,
  },
  error: {
    fontSize: 13,
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 6,
  },
  actionText: {
    fontWeight: "600",
    fontSize: 13,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  duration: {
    fontSize: 12,
  },
  footerActions: {
    flexDirection: "row",
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
});
