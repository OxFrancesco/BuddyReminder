import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  ScrollView,
} from "react-native";
import { useState } from "react";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import ArtifactViewer from "@/components/artifact-viewer";
import LogViewer from "@/components/log-viewer";

// Type for agent run
type AgentRunStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

interface AgentRunType {
  _id: Id<"agentRuns">;
  _creationTime: number;
  taskId: Id<"items">;
  userId: Id<"users">;
  status: AgentRunStatus;
  summary?: string;
  logsRef?: string;
  artifactsRef?: string[];
  cost?: number;
  error?: string;
  startedAt?: number;
  endedAt?: number;
  sandboxId?: string;
  previewUrl?: string;
  sessionId?: string;
}

interface AgentModalProps {
  taskId: Id<"items"> | null;
  taskTitle: string;
  taskGoal?: string;
  onClose: () => void;
}

export default function AgentModal({
  taskId,
  taskTitle,
  taskGoal,
  onClose,
}: AgentModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [isSpawning, setIsSpawning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showArtifacts, setShowArtifacts] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  const spawnSandbox = useAction(api.agent.spawnDaytonaSandbox);
  const stopSandbox = useAction(api.agent.stopDaytonaSandbox);

  const agentRuns = useQuery(
    api.agent.getAgentRunsForTask,
    taskId ? { taskId } : "skip"
  );

  const activeRun = agentRuns?.find(
    (run: AgentRunType) => run.status === "running" || run.status === "pending"
  );

  const handleSpawnAgent = async () => {
    if (!taskId) return;

    setIsSpawning(true);
    setError(null);

    try {
      await spawnSandbox({
        taskId,
        taskGoal: taskGoal || taskTitle,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to spawn agent");
    } finally {
      setIsSpawning(false);
    }
  };

  const handleStopAgent = async () => {
    if (!activeRun || !activeRun.sandboxId) return;

    setIsSpawning(true);
    setError(null);

    try {
      await stopSandbox({
        runId: activeRun._id,
        sandboxId: activeRun.sandboxId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to stop agent");
    } finally {
      setIsSpawning(false);
    }
  };

  const handleOpenPreview = () => {
    if (activeRun?.previewUrl) {
      Linking.openURL(activeRun.previewUrl);
    }
  };

  if (!taskId) return null;

  return (
    <>
      <Modal
        visible={true}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <ThemedView
            style={[
              styles.container,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={[styles.header, { borderBottomColor: colors.overlayLight }]}>
              <ThemedText style={styles.title}>Agent Runner</ThemedText>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <ThemedText style={{ color: colors.tint }}>Done</ThemedText>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
              <ThemedView
                style={[
                  styles.taskCard,
                  { backgroundColor: colors.backgroundSecondary },
                ]}
              >
                <View style={styles.taskHeader}>
                  <IconSymbol name="cpu" size={20} color={colors.typeTask} />
                  <ThemedText style={styles.taskTitle} numberOfLines={2}>
                    {taskTitle}
                  </ThemedText>
                </View>
                {taskGoal && (
                  <ThemedText style={[styles.taskGoal, { color: colors.icon }]}>
                    Goal: {taskGoal}
                  </ThemedText>
                )}
              </ThemedView>

              {error && (
                <ThemedView
                  style={[styles.errorCard, { backgroundColor: colors.error }]}
                >
                  <ThemedText style={[styles.errorText, { color: colors.primaryForeground }]}>{error}</ThemedText>
                </ThemedView>
              )}

              {activeRun ? (
                <ThemedView style={styles.activeRunSection}>
                  <View style={styles.statusRow}>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            activeRun.status === "running"
                              ? colors.success
                              : colors.warning,
                        },
                      ]}
                    >
                      <ThemedText style={[styles.statusText, { color: colors.text }]}>
                        {activeRun.status === "running" ? "Running" : "Starting..."}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.actionRow}>
                    {activeRun.previewUrl && (
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          { backgroundColor: colors.tint },
                        ]}
                        onPress={handleOpenPreview}
                      >
                        <IconSymbol
                          name="externaldrive.connected.to.line.below"
                          size={20}
                          color={colors.primaryForeground}
                        />
                        <ThemedText style={[styles.actionButtonText, { color: colors.primaryForeground }]}>
                          Open
                        </ThemedText>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        { backgroundColor: colors.backgroundSecondary },
                      ]}
                      onPress={() => setShowLogs(true)}
                    >
                      <IconSymbol name="text.bubble" size={20} color={colors.tint} />
                      <ThemedText style={[styles.actionButtonText, { color: colors.tint }]}>
                        Logs
                      </ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        { backgroundColor: colors.backgroundSecondary },
                      ]}
                      onPress={() => setShowArtifacts(true)}
                    >
                      <IconSymbol name="doc" size={20} color={colors.tint} />
                      <ThemedText style={[styles.actionButtonText, { color: colors.tint }]}>
                        Artifacts
                      </ThemedText>
                    </TouchableOpacity>
                  </View>

                  {activeRun.summary && (
                    <ThemedText
                      style={[styles.summaryText, { color: colors.icon }]}
                    >
                      {activeRun.summary}
                    </ThemedText>
                  )}

                  {activeRun.cost && (
                    <ThemedView
                      style={[
                        styles.costCard,
                        { backgroundColor: colors.backgroundSecondary },
                      ]}
                    >
                      <View style={styles.costRow}>
                        <ThemedText style={[styles.costLabel, { color: colors.icon }]}>
                          Runtime Cost:
                        </ThemedText>
                        <ThemedText style={styles.costValue}>
                          ${(activeRun.cost.sandboxRuntime / 100).toFixed(2)}
                        </ThemedText>
                      </View>
                      <View style={styles.costRow}>
                        <ThemedText style={[styles.costLabel, { color: colors.icon }]}>
                          Total:
                        </ThemedText>
                        <ThemedText style={[styles.costValue, { fontWeight: "700" }]}>
                          ${(activeRun.cost.total / 100).toFixed(2)}
                        </ThemedText>
                      </View>
                    </ThemedView>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.stopButton,
                      { backgroundColor: colors.error },
                    ]}
                    onPress={handleStopAgent}
                    disabled={isSpawning}
                  >
                    {isSpawning ? (
                      <ActivityIndicator color={colors.primaryForeground} size="small" />
                    ) : (
                      <>
                        <IconSymbol name="stop.fill" size={20} color={colors.primaryForeground} />
                        <ThemedText style={[styles.stopButtonText, { color: colors.primaryForeground }]}>
                          Stop Agent
                        </ThemedText>
                      </>
                    )}
                  </TouchableOpacity>
                </ThemedView>
              ) : (
                <ThemedView style={styles.spawnSection}>
                  <ThemedText
                    style={[styles.infoText, { color: colors.icon }]}
                  >
                    Spawn a Daytona sandbox with OpenCode to work on this task.
                    The agent will have access to a full development environment.
                  </ThemedText>

                  <TouchableOpacity
                    style={[
                      styles.spawnButton,
                      {
                        backgroundColor: colors.tint,
                        opacity: isSpawning ? 0.7 : 1,
                      },
                    ]}
                    onPress={handleSpawnAgent}
                    disabled={isSpawning}
                  >
                    {isSpawning ? (
                      <ActivityIndicator color={colors.primaryForeground} size="small" />
                    ) : (
                      <>
                        <IconSymbol name="play.fill" size={20} color={colors.primaryForeground} />
                        <ThemedText style={[styles.spawnButtonText, { color: colors.primaryForeground }]}>
                          Start Agent
                        </ThemedText>
                      </>
                    )}
                  </TouchableOpacity>
                </ThemedView>
              )}

              {agentRuns && agentRuns.length > 0 && (
                <ThemedView style={styles.historySection}>
                  <ThemedText style={styles.historyTitle}>
                    Previous Runs
                  </ThemedText>
                  {agentRuns
                    .filter((run: AgentRunType) => run.status !== "running" && run.status !== "pending")
                    .slice(0, 5)
                    .map((run: AgentRunType) => (
                      <TouchableOpacity
                        key={run._id}
                        style={[
                          styles.historyItem,
                          { backgroundColor: colors.backgroundSecondary },
                        ]}
                        onPress={() => {
                          // TODO: Show artifacts for this run
                        }}
                      >
                        <View style={styles.historyItemHeader}>
                          <View
                            style={[
                              styles.historyStatusBadge,
                              {
                                backgroundColor:
                                  run.status === "completed"
                                    ? colors.success
                                    : run.status === "failed"
                                    ? colors.error
                                    : colors.icon,
                              },
                            ]}
                          >
                            <ThemedText style={[styles.historyStatusText, { color: colors.primaryForeground }]}>
                              {run.status}
                            </ThemedText>
                          </View>
                          <ThemedText
                            style={[styles.historyDate, { color: colors.icon }]}
                          >
                            {new Date(run._creationTime).toLocaleDateString()}
                          </ThemedText>
                        </View>
                        {run.error && (
                          <ThemedText
                            style={[styles.historyError, { color: colors.error }]}
                            numberOfLines={2}
                          >
                            {run.error}
                          </ThemedText>
                        )}
                      </TouchableOpacity>
                    ))}
                </ThemedView>
              )}
            </ScrollView>
          </ThemedView>
        </View>
      </Modal>

      {showArtifacts && activeRun && (
        <ArtifactViewer
          runId={activeRun._id}
          onClose={() => setShowArtifacts(false)}
        />
      )}

      {showLogs && activeRun && (
        <LogViewer
          runId={activeRun._id}
          onClose={() => setShowLogs(false)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    padding: 8,
  },
  content: {
    padding: 16,
  },
  taskCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  taskHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  taskGoal: {
    fontSize: 14,
    marginTop: 8,
  },
  errorCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
  },
  activeRunSection: {
    gap: 16,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    fontWeight: "600",
    fontSize: 14,
  },
  previewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  previewButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  summaryText: {
    fontSize: 14,
    textAlign: "center",
  },
  costCard: {
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  costLabel: {
    fontSize: 13,
  },
  costValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  stopButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  stopButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  spawnSection: {
    gap: 16,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  spawnButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  spawnButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  historySection: {
    marginTop: 24,
    gap: 12,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  historyItem: {
    padding: 12,
    borderRadius: 8,
  },
  historyItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  historyStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  historyStatusText: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  historyDate: {
    fontSize: 12,
  },
  historyError: {
    fontSize: 12,
    marginTop: 8,
  },
});
