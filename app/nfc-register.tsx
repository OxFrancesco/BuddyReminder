import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function NfcRegisterScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Register NFC Tag',
          presentation: 'fullScreenModal',
        }}
      />
      <ThemedView style={styles.container}>
        <View style={styles.content}>
          <IconSymbol name="wave.3.right" size={64} color={colors.icon} />
          <ThemedText style={styles.title}>Coming Soon</ThemedText>
          <ThemedText style={[styles.description, { color: colors.icon }]}>
            NFC tag registration is coming soon.
          </ThemedText>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.tint }]}
            onPress={() => router.back()}
          >
            <ThemedText style={[styles.closeText, { color: colors.background }]}>
              Close
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
  },
  closeButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  closeText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
