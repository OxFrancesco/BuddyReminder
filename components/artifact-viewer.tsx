import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Share,
} from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface ArtifactViewerProps {
  runId: Id<"agentRuns"> | null;
  onClose: () => void;
}

interface ArtifactItemProps {
  artifact: {
    _id: Id<"artifacts">;
    filename: string;
    fileType: "code" | "image" | "json" | "text" | "other";
    storageId: Id<"_storage">;
    size: number;
  };
  colors: typeof Colors.light;
}

function ArtifactItem({ artifact, colors }: ArtifactItemProps) {
  const url = useQuery(api.artifacts.getArtifactUrl, {
    storageId: artifact.storageId,
  });

  const handleShare = async () => {
    if (!url) return;
    try {
      await Share.share({
        message: `Check out this artifact: ${artifact.filename}`,
        url,
      });
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  return (
    <View
      style={[
        styles.artifactCard,
        { backgroundColor: colors.backgroundSecondary },
      ]}
    >
      <View style={styles.artifactHeader}>
        <IconSymbol
          name={
            artifact.fileType === "image"
              ? "photo"
              : artifact.fileType === "code"
              ? "chevron.left.forwardslash.chevron.right"
              : "doc"
          }
          size={20}
          color={colors.tint}
        />
        <ThemedText
          style={styles.artifactName}
          numberOfLines={1}
        >
          {artifact.filename}
        </ThemedText>
      </View>

      <View style={styles.artifactMeta}>
        <ThemedText style={[styles.metaText, { color: colors.icon }]}>
          {artifact.fileType} • {(artifact.size / 1024).toFixed(1)} KB
        </ThemedText>
        {url && (
          <TouchableOpacity onPress={handleShare}>
            <IconSymbol
              name="square.and.arrow.up"
              size={18}
              color={colors.tint}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function ArtifactViewer({ runId, onClose }: ArtifactViewerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const artifacts = useQuery(
    api.artifacts.getArtifactsForRun,
    runId ? { runId } : "skip"
  );

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
            <ThemedText style={styles.title}>Artifacts</ThemedText>
            <TouchableOpacity onPress={onClose}>
              <ThemedText style={{ color: colors.tint }}>Done</ThemedText>
            </TouchableOpacity>
          </View>

          {artifacts === undefined ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={colors.tint} />
            </View>
          ) : artifacts.length === 0 ? (
            <View style={styles.empty}>
              <IconSymbol name="doc.badge.plus" size={48} color={colors.icon} />
              <ThemedText style={{ color: colors.icon }}>
                No artifacts yet
              </ThemedText>
            </View>
          ) : (
            <ScrollView style={styles.content}>
              {artifacts.map((artifact) => (
                <ArtifactItem
                  key={artifact._id}
                  artifact={artifact}
                  colors={colors}
                />
              ))}
            </ScrollView>
          )}
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
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 16,
  },
  content: {
    padding: 16,
  },
  artifactCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  artifactHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  artifactName: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  artifactMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaText: {
    fontSize: 12,
  },
});
