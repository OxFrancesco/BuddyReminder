import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Share,
} from "react-native";
import { useState } from "react";
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

export default function ArtifactViewer({ runId, onClose }: ArtifactViewerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const artifacts = useQuery(
    api.artifacts.getArtifactsForRun,
    runId ? { runId } : "skip"
  );

  const [selectedArtifact, setSelectedArtifact] = useState<string | null>(null);

  const handleShare = async (url: string, filename: string) => {
    try {
      await Share.share({
        message: `Check out this artifact: ${filename}`,
        url,
      });
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const renderArtifactPreview = (artifact: NonNullable<typeof artifacts>[0], url: string | null) => {
    if (!url) return <ActivityIndicator color={colors.tint} />;

    switch (artifact.fileType) {
      case "image":
        return (
          <Image
            source={{ uri: url }}
            style={styles.imagePreview}
            resizeMode="contain"
          />
        );
      case "code":
      case "text":
      case "json":
        return (
          <ScrollView style={styles.textPreview}>
            <ThemedText style={[styles.codeText, { color: colors.text }]}>
              {/* Would fetch and display content here */}
              Preview for {artifact.filename}
            </ThemedText>
          </ScrollView>
        );
      default:
        return (
          <ThemedView style={styles.fileInfo}>
            <IconSymbol name="doc" size={48} color={colors.icon} />
            <ThemedText style={{ color: colors.text }}>
              {artifact.filename}
            </ThemedText>
            <ThemedText style={{ color: colors.icon, fontSize: 12 }}>
              {(artifact.size / 1024).toFixed(2)} KB
            </ThemedText>
          </ThemedView>
        );
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
              {artifacts.map((artifact) => {
                const url = useQuery(api.artifacts.getArtifactUrl, {
                  storageId: artifact.storageId,
                });

                return (
                  <TouchableOpacity
                    key={artifact._id}
                    style={[
                      styles.artifactCard,
                      { backgroundColor: colors.backgroundSecondary },
                    ]}
                    onPress={() => setSelectedArtifact(artifact._id)}
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
                        <TouchableOpacity
                          onPress={() => handleShare(url, artifact.filename)}
                        >
                          <IconSymbol
                            name="square.and.arrow.up"
                            size={18}
                            color={colors.tint}
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
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
  imagePreview: {
    width: "100%",
    height: 300,
    borderRadius: 8,
  },
  textPreview: {
    maxHeight: 400,
  },
  codeText: {
    fontFamily: "monospace",
    fontSize: 12,
  },
  fileInfo: {
    alignItems: "center",
    gap: 8,
    padding: 32,
  },
});
