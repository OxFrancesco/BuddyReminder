import { StyleSheet, TextInput, TouchableOpacity, Alert, Switch } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Id } from '../convex/_generated/dataModel';

export default function ModalScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const item = useQuery(api.items.getUserItems, {}).find(i => i._id === itemId);
  const updateItem = useMutation(api.items.updateItem);
  const togglePin = useMutation(api.items.toggleItemPin);
  const deleteItem = useMutation(api.items.deleteItem);
  
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setBody(item.body || '');
      setIsPinned(item.isPinned || false);
    }
  }, [item]);

  useEffect(() => {
    if (item) {
      const titleChanged = title !== item.title;
      const bodyChanged = body !== (item.body || '');
      const pinChanged = isPinned !== (item.isPinned || false);
      setHasChanges(titleChanged || bodyChanged || pinChanged);
    }
  }, [title, body, isPinned, item]);

  const handleSave = async () => {
    if (!item || !hasChanges) return;
    
    try {
      await updateItem({
        itemId: item._id as Id<"items">,
        title: title.trim(),
        body: body.trim() || undefined,
      });
      
      if (isPinned !== (item.isPinned || false)) {
        await togglePin({
          itemId: item._id as Id<"items">,
          isPinned,
        });
      }
      
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save changes');
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteItem({ itemId: item._id as Id<"items"> });
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'note': return '📝';
      case 'reminder': return '⏰';
      case 'task': return '🤖';
      default: return '📝';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'note': return '#6B7280';
      case 'reminder': return '#F59E0B';
      case 'task': return '#8B5CF6';
      default: return colors.text;
    }
  };

  if (!item) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Item not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <TextInput
        style={[styles.titleInput, { color: colors.text, borderColor: colors.icon }]}
        value={title}
        onChangeText={setTitle}
        placeholder="Title"
        placeholderTextColor={colors.icon}
        multiline
      />
      
      <ThemedView style={[styles.menu, { backgroundColor: colors.backgroundSecondary, borderColor: colors.icon }]}>
        <ThemedView style={styles.menuItem}>
          <ThemedText style={styles.menuLabel}>Type</ThemedText>
          <ThemedText style={[styles.typeText, { color: getTypeColor(item.type) }]}>
            {getTypeIcon(item.type)} {item.type}
          </ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.menuItem}>
          <ThemedText style={styles.menuLabel}>Pin to notifications</ThemedText>
          <Switch
            value={isPinned}
            onValueChange={setIsPinned}
            trackColor={{ false: colors.icon, true: colors.tint }}
            thumbColor={isPinned ? '#FFFFFF' : '#f4f3f4'}
          />
        </ThemedView>
        
        <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
          <ThemedText style={styles.menuLabel}>Actions</ThemedText>
          <ThemedText style={styles.deleteButtonText}>🗑️ Delete</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.spacer} />

      <TextInput
        style={[styles.bodyInput, { color: colors.text, borderColor: colors.icon }]}
        value={body}
        onChangeText={setBody}
        placeholder="Add notes..."
        placeholderTextColor={colors.icon}
        multiline
        textAlignVertical="top"
      />

      <ThemedView style={styles.footer}>        
        {hasChanges && (
          <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.tint }]} onPress={handleSave}>
            <ThemedText style={styles.saveButtonText}>Save</ThemedText>
          </TouchableOpacity>
        )}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '600',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    minHeight: 60,
  },
  bodyInput: {
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    height: 120,
    marginBottom: 16,
  },
  pinLabel: {
    fontSize: 16,
  },
  menu: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  spacer: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    minHeight: 50,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'flex-end',
  },
  typeText: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#FF3B30',
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});
