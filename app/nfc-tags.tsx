import {
  StyleSheet,
  View,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
} from 'react-native';
import { useState, useCallback } from 'react';
import { Stack, router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import NfcTagRegistration from '@/components/nfc-tag-registration';
import { formatTagIdForDisplay, scanTag, isNfcSupported } from '@/lib/nfc-service';

interface NfcTagItem {
  _id: Id<'nfcTags'>;
  _creationTime: number;
  userId: Id<'users'>;
  tagId: string;
  label: string;
  createdAt: number;
}

export default function NfcTagsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [showRegistration, setShowRegistration] = useState(false);
  const [editingTagId, setEditingTagId] = useState<Id<'nfcTags'> | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [testingTagId, setTestingTagId] = useState<string | null>(null);

  // Fetch user's NFC tags
  const userTags = useQuery(api.nfcTags.getUserTags);

  // Mutations
  const updateTagLabel = useMutation(api.nfcTags.updateTagLabel);
  const deleteTag = useMutation(api.nfcTags.deleteTag);

  // Handle tag registered
  const handleTagRegistered = useCallback(() => {
    setShowRegistration(false);
  }, []);

  // Handle edit tag label
  const handleEditTag = useCallback((tag: NfcTagItem) => {
    setEditingTagId(tag._id);
    setEditLabel(tag.label);
  }, []);

  // Save edited label
  const handleSaveLabel = useCallback(async () => {
    if (!editingTagId || !editLabel.trim()) return;

    try {
      await updateTagLabel({
        tagDocId: editingTagId,
        label: editLabel.trim(),
      });
      setEditingTagId(null);
      setEditLabel('');
    } catch {
      Alert.alert('Error', 'Failed to update tag label');
    }
  }, [editingTagId, editLabel, updateTagLabel]);

  // Cancel edit
  const handleCancelEdit = useCallback(() => {
    setEditingTagId(null);
    setEditLabel('');
  }, []);

  // Handle delete tag
  const handleDeleteTag = useCallback(
    (tag: NfcTagItem) => {
      Alert.alert(
        'Delete Tag',
        `Are you sure you want to delete "${tag.label}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteTag({ tagDocId: tag._id });
              } catch {
                Alert.alert('Error', 'Failed to delete tag');
              }
            },
          },
        ]
      );
    },
    [deleteTag]
  );

  // Test tag scan
  const handleTestTag = useCallback(async (tag: NfcTagItem) => {
    const supported = await isNfcSupported();
    if (!supported) {
      Alert.alert('NFC Not Available', 'NFC is not supported on this device');
      return;
    }

    setTestingTagId(tag.tagId);

    try {
      const result = await scanTag();

      if (!result) {
        Alert.alert('No Tag Detected', 'No NFC tag was detected. Please try again.');
        setTestingTagId(null);
        return;
      }

      if (result.tagId === tag.tagId) {
        Alert.alert('Success!', `Scanned tag matches "${tag.label}"!`);
      } else {
        Alert.alert(
          'Wrong Tag',
          `The scanned tag does not match "${tag.label}". Expected: ${formatTagIdForDisplay(tag.tagId)}, Got: ${formatTagIdForDisplay(result.tagId)}`
        );
      }
    } catch {
      Alert.alert('Scan Failed', 'Failed to scan tag. Please try again.');
    }

    setTestingTagId(null);
  }, []);

  // Render tag item
  const renderTagItem = ({ item: tag }: { item: NfcTagItem }) => {
    const isEditing = editingTagId === tag._id;
    const isTesting = testingTagId === tag.tagId;

    return (
      <View
        style={[
          styles.tagCard,
          {
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.tagHeader}>
          <IconSymbol name="wave.3.right" size={32} color={colors.tint} />
          <View style={styles.tagInfo}>
            {isEditing ? (
              <TextInput
                style={[styles.editInput, { color: colors.text, borderColor: colors.border }]}
                value={editLabel}
                onChangeText={setEditLabel}
                autoFocus
                onBlur={handleSaveLabel}
                onSubmitEditing={handleSaveLabel}
              />
            ) : (
              <ThemedText style={styles.tagLabel}>{tag.label}</ThemedText>
            )}
            <ThemedText style={[styles.tagId, { color: colors.icon }]}>
              {formatTagIdForDisplay(tag.tagId)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.tagActions}>
          {isEditing ? (
            <>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.tint }]}
                onPress={handleSaveLabel}
              >
                <IconSymbol name="checkmark" size={20} color={colors.background} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.icon }]}
                onPress={handleCancelEdit}
              >
                <IconSymbol name="xmark" size={20} color={colors.background} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.success }]}
                onPress={() => handleTestTag(tag)}
                disabled={isTesting}
              >
                {isTesting ? (
                  <ThemedText style={{ color: colors.background, fontSize: 12 }}>...</ThemedText>
                ) : (
                  <IconSymbol name="wave.3.right" size={20} color={colors.background} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.tint }]}
                onPress={() => handleEditTag(tag)}
              >
                <IconSymbol name="pencil" size={20} color={colors.background} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.error }]}
                onPress={() => handleDeleteTag(tag)}
              >
                <IconSymbol name="trash" size={20} color={colors.background} />
              </TouchableOpacity>
            </>
          )}
        </View>

        <ThemedText style={[styles.createdAt, { color: colors.icon }]}>
          Added {new Date(tag.createdAt).toLocaleDateString()}
        </ThemedText>
      </View>
    );
  };

  // Empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <IconSymbol name="wave.3.right" size={80} color={colors.icon} />
      <ThemedText style={styles.emptyTitle}>No NFC Tags</ThemedText>
      <ThemedText style={[styles.emptyDescription, { color: colors.icon }]}>
        Register NFC tags to use them for dismissing alarms. Place tags in locations
        you need to physically visit to wake up!
      </ThemedText>
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.tint }]}
        onPress={() => setShowRegistration(true)}
      >
        <IconSymbol name="plus" size={20} color={colors.background} />
        <ThemedText style={[styles.addButtonText, { color: colors.background }]}>
          Register First Tag
        </ThemedText>
      </TouchableOpacity>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'NFC Tags',
          headerRight: () => (
            <TouchableOpacity onPress={() => setShowRegistration(true)}>
              <IconSymbol name="plus" size={24} color={colors.tint} />
            </TouchableOpacity>
          ),
        }}
      />

      <FlatList
        data={userTags}
        keyExtractor={(item) => item._id}
        renderItem={renderTagItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
      />

      <NfcTagRegistration
        visible={showRegistration}
        onClose={() => setShowRegistration(false)}
        onTagRegistered={handleTagRegistered}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    gap: 16,
    flexGrow: 1,
  },
  tagCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  tagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  tagInfo: {
    flex: 1,
  },
  tagLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  tagId: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginTop: 4,
  },
  editInput: {
    fontSize: 18,
    fontWeight: '600',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tagActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createdAt: {
    fontSize: 12,
    textAlign: 'right',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
