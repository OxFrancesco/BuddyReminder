import { StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import ItemsList from '@/components/items-list';
import QuickCaptureFAB from '@/components/quick-capture-fab';

export default function SimpleHomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">BuddyReminder</ThemedText>
        <ThemedText style={styles.subtitle}>Quick Capture Demo</ThemedText>
      </ThemedView>
      <ItemsList />
      <QuickCaptureFAB />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  subtitle: {
    opacity: 0.7,
    marginTop: 4,
  },
});
