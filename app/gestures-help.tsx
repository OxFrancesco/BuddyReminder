import { StyleSheet, ScrollView, View } from 'react-native';
import { Stack } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function GesturesHelpScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <>
      <Stack.Screen options={{ title: 'Gestures', presentation: 'modal' }} />
      <ThemedView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <ThemedText type="title" style={styles.title}>Gestures</ThemedText>
          <ThemedText style={styles.subtitle}>
            Quickly manage your items with simple gestures
          </ThemedText>

          <View style={[styles.gestureCard, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={styles.gestureHeader}>
              <View style={[styles.iconContainer, { backgroundColor: colors.tint }]}>
                <IconSymbol name="plus.circle.fill" size={32} color={colors.white} />
              </View>
              <ThemedText type="subtitle">Pinch</ThemedText>
            </View>
            <ThemedText style={styles.gestureDescription}>
              Pinch anywhere on the inbox to quickly add a new task, note, or reminder.
            </ThemedText>
            <View style={[styles.demoBox, { borderColor: colors.border }]}>
              <ThemedText style={styles.demoText}>Pinch to zoom</ThemedText>
              <ThemedText style={styles.demoAction}>Add Task</ThemedText>
            </View>
          </View>

          <View style={[styles.gestureCard, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={styles.gestureHeader}>
              <View style={[styles.iconContainer, { backgroundColor: colors.success }]}>
                <IconSymbol name="checkmark.circle.fill" size={32} color={colors.white} />
              </View>
              <ThemedText type="subtitle">Swipe Right</ThemedText>
            </View>
            <ThemedText style={styles.gestureDescription}>
              Swipe an item to the right to mark it as done. The item will be archived and removed from your inbox.
            </ThemedText>
            <View style={[styles.demoBox, { borderColor: colors.border }]}>
              <ThemedText style={styles.demoText}>Swipe right →</ThemedText>
              <ThemedText style={styles.demoAction}>Done</ThemedText>
            </View>
          </View>

          <View style={[styles.gestureCard, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={styles.gestureHeader}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
                <IconSymbol name="calendar" size={32} color={colors.white} />
              </View>
              <ThemedText type="subtitle">Swipe Left</ThemedText>
            </View>
            <ThemedText style={styles.gestureDescription}>
              Swipe a reminder to the left to snooze it. You&apos;ll be able to set a new date and time using natural language.
            </ThemedText>
            <View style={[styles.demoBox, { borderColor: colors.border }]}>
              <ThemedText style={styles.demoText}>Swipe left ←</ThemedText>
              <ThemedText style={styles.demoAction}>Snooze</ThemedText>
            </View>
            <ThemedText style={[styles.note, { color: colors.textSecondary }]}>
              Note: Only available for reminders
            </ThemedText>
          </View>

          <View style={[styles.tipCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.tint }]}>
            <IconSymbol name="lightbulb" size={24} color={colors.tint} />
            <View style={styles.tipContent}>
              <ThemedText type="defaultSemiBold">Pro Tip</ThemedText>
              <ThemedText style={styles.tipText}>
                Tap on any item to view full details, edit content, or access more options.
              </ThemedText>
            </View>
          </View>
        </ScrollView>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 32,
  },
  gestureCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  gestureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gestureDescription: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
    opacity: 0.8,
  },
  demoBox: {
    borderWidth: 2,
    borderRadius: 12,
    borderStyle: 'dashed',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  demoText: {
    fontSize: 14,
    fontWeight: '500',
  },
  demoAction: {
    fontSize: 14,
    fontWeight: '600',
  },
  note: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
  },
  tipCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipText: {
    fontSize: 13,
    marginTop: 4,
    opacity: 0.8,
  },
});
