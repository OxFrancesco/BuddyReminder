import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useEffect, useRef } from "react";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface LogViewerProps {
  runId: Id<"agentRuns"> | null;
  onClose: () => void;
}

export default function LogViewer({ runId, onClose }: LogViewerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const scrollViewRef = useRef<ScrollView>(null);

  const agentRun = useQuery(
    api.agent.getAgentRunById,
    runId ? { runId } : "skip"
  );

  const logs = agentRun?.logs || [];

  useEffect(() => {
    // Auto-scroll to bottom when new logs arrive
    if (logs.length > 0) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [logs.length]);

  const getLevelColor = (level: "info" | "error" | "warning") => {
    switch (level) {
      case "error":
        return colors.error;
      case "warning":
        return colors.warning;
      case "info":
      default:
        return colors.tint;
    }
  };

  if (!runId) return null;

  return (
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
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <View style={[styles.header, { borderBottomColor: colors.overlayLight }]}>
            <ThemedText style={styles.title}>Execution Logs</ThemedText>
            <TouchableOpacity onPress={onClose}>
              <ThemedText style={{ color: colors.tint }}>Done</ThemedText>
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={[styles.logsContainer, { backgroundColor: colors.backgroundSecondary }]}
            contentContainerStyle={styles.logsContent}
          >
            {logs.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol name="text.bubble" size={32} color={colors.mutedForeground} />
                <ThemedText style={{ color: colors.mutedForeground, fontSize: 14 }}>
                  No logs yet
                </ThemedText>
              </View>
            ) : (
              logs.map((log, index) => (
                <View key={index} style={styles.logEntry}>
                  <View style={styles.logHeader}>
                    <View
                      style={[
                        styles.levelBadge,
                        { backgroundColor: getLevelColor(log.level) },
                      ]}
                    >
                      <ThemedText style={[styles.levelText, { color: colors.primaryForeground }]}>
                        {log.level.toUpperCase()}
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.timestamp, { color: colors.mutedForeground }]}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.logMessage, { color: colors.text }]}>
                    {log.message}
                  </ThemedText>
                </View>
              ))
            )}
          </ScrollView>
        </ThemedView>
      </View>
    </Modal>
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
  logsContainer: {
    flex: 1,
  },
  logsContent: {
    padding: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 48,
    gap: 12,
  },
  logEntry: {
    marginBottom: 12,
    gap: 6,
  },
  logHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  levelText: {
    fontSize: 10,
    fontWeight: "700",
  },
  timestamp: {
    fontSize: 11,
    fontFamily: "monospace",
  },
  logMessage: {
    fontSize: 13,
    fontFamily: "monospace",
    lineHeight: 18,
  },
});
