import { StyleSheet, View, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser, useClerk } from '@clerk/clerk-expo';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/contexts/theme-context';
import { useSyncSettings } from '@/contexts/sync-settings-context';

export default function TabTwoScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { signOut } = useClerk();
  const colorScheme = useColorScheme();
  const { themeMode, setThemeMode } = useTheme();
  const { syncMode, setSyncMode } = useSyncSettings();
  const colors = Colors[colorScheme ?? 'light'];
  
  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {user?.imageUrl && (
          <Image 
            source={{ uri: user.imageUrl }} 
            style={styles.avatar}
          />
        )}
        <ThemedText type="title" style={styles.title}>Profile</ThemedText>
        {user?.fullName && (
          <ThemedText style={styles.name}>{user.fullName}</ThemedText>
        )}

        <ThemedView style={[styles.settingsSection, { backgroundColor: colors.backgroundSecondary, borderColor: colors.icon }]}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Appearance</ThemedText>
          
          <View style={styles.themeOptions}>
            <TouchableOpacity 
              style={[styles.themeButton, { borderColor: colors.icon }, themeMode === 'system' && { backgroundColor: colors.tint }]}
              onPress={() => setThemeMode('system')}
            >
              <ThemedText style={[styles.themeButtonText, themeMode === 'system' && { color: 'white' }]}>
                Auto
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.themeButton, { borderColor: colors.icon }, themeMode === 'light' && { backgroundColor: colors.tint }]}
              onPress={() => setThemeMode('light')}
            >
              <ThemedText style={[styles.themeButtonText, themeMode === 'light' && { color: 'white' }]}>
                Light
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.themeButton, { borderColor: colors.icon }, themeMode === 'dark' && { backgroundColor: colors.tint }]}
              onPress={() => setThemeMode('dark')}
            >
              <ThemedText style={[styles.themeButtonText, themeMode === 'dark' && { color: 'white' }]}>
                Dark
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>

        <ThemedView style={[styles.settingsSection, { backgroundColor: colors.backgroundSecondary, borderColor: colors.icon }]}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Data Sync</ThemedText>
          
          <View style={styles.syncOption}>
            <View style={styles.syncInfo}>
              <ThemedText type="defaultSemiBold">Cloud Sync</ThemedText>
              <ThemedText style={[styles.syncDescription, { color: colors.icon }]}>
                {syncMode === 'cloud' ? 'Syncing with Convex' : 'Local storage only'}
              </ThemedText>
            </View>
            <Switch
              value={syncMode === 'cloud'}
              onValueChange={(value) => setSyncMode(value ? 'cloud' : 'local')}
              trackColor={{ false: colors.muted, true: colors.tint }}
              thumbColor="#fff"
            />
          </View>
        </ThemedView>

        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: colors.backgroundSecondary }]}
            onPress={() => router.push('/gestures-help' as any)}
          >
            <IconSymbol name="hand.draw" size={24} color={colors.tint} />
            <View style={styles.menuText}>
              <ThemedText type="defaultSemiBold">Swipe Gestures</ThemedText>
              <ThemedText style={styles.menuDescription}>Learn how to use swipe actions</ThemedText>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: colors.backgroundSecondary }]}
            onPress={() => signOut()}
          >
            <IconSymbol name="rectangle.portrait.and.arrow.right" size={24} color={colors.error} />
            <View style={styles.menuText}>
              <ThemedText type="defaultSemiBold" style={{ color: colors.error }}>Sign Out</ThemedText>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scroll: {
    flex: 1,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
    alignSelf: 'center',
  },
  title: {
    textAlign: 'center',
  },
  name: {
    marginTop: 8,
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  settingsSection: {
    width: '100%',
    marginTop: 32,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  themeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  themeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  syncOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  syncInfo: {
    flex: 1,
  },
  syncDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  section: {
    marginTop: 24,
    marginBottom: 32,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 8,
  },
  menuText: {
    flex: 1,
  },
  menuDescription: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
});
