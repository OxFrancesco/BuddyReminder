import { useQuery } from 'convex/react';
import { FlatList, StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { api } from '../convex/_generated/api';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@clerk/clerk-expo';

interface Item {
  _id: string;
  _creationTime: number;
  type: 'note' | 'reminder' | 'task';
  title: string;
  body?: string;
  status: 'open' | 'done' | 'archived';
  triggerAt?: number;
}

export default function ItemsList() {
  const { isSignedIn, isLoaded } = useAuth();
  const items = useQuery(api.items.getUserItems, isSignedIn ? {} : "skip");
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

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

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const renderItem = ({ item }: { item: Item }) => (
    <TouchableOpacity 
      style={[styles.itemContainer, { borderColor: colors.icon }]}
      onPress={() => router.push(`/modal?itemId=${item._id}`)}
    >
      <ThemedText type="defaultSemiBold" style={styles.title}>
        {item.title}
      </ThemedText>
      
      {item.body && (
        <ThemedText style={styles.body} numberOfLines={2}>
          {item.body}
        </ThemedText>
      )}
      
      {item.triggerAt && (
        <Text style={[styles.triggerTime, { color: getTypeColor(item.type) }]}>
          ⏰ {formatTime(item.triggerAt)}
        </Text>
      )}
      
      <View style={styles.itemFooter}>
        <Text style={[styles.createdTime, { color: colors.icon }]}>
          Created {new Date(item._creationTime).toLocaleDateString()}
        </Text>
        <View style={styles.typeIndicator}>
          <Text style={styles.typeIcon}>{getTypeIcon(item.type)}</Text>
          <Text style={[styles.typeText, { color: getTypeColor(item.type) }]}>
            {item.type}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (!isLoaded || items === undefined) {
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
        <Text style={styles.emptyIcon}>📝</Text>
        <ThemedText type="subtitle" style={styles.emptyTitle}>
          No items yet
        </ThemedText>
        <ThemedText style={styles.emptyText}>
          Tap the + button to create your first note, reminder, or task
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item._id}
      contentContainerStyle={[styles.listContainer, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 120, // Space for FAB
  },
  itemContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  typeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  statusText: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  title: {
    marginBottom: 4,
  },
  body: {
    marginBottom: 8,
    opacity: 0.8,
  },
  triggerTime: {
    fontSize: 12,
    marginBottom: 4,
  },
  createdTime: {
    fontSize: 11,
  },
});
