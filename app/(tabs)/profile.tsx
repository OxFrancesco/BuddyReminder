import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUser, useClerk } from "@clerk/clerk-expo";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/contexts/theme-context";
import { useSyncSettings } from "@/contexts/sync-settings-context";
import { useCalendarSync } from "@/contexts/calendar-sync-context";
import { SwipeableTab } from "@/components/swipeable-tab";
import { useOAuth } from "@clerk/clerk-expo";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { logger } from "@/lib/logger";

export default function TabTwoScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { signOut } = useClerk();
  const colorScheme = useColorScheme();
  const { themeMode, setThemeMode } = useTheme();
  const { syncMode, setSyncMode } = useSyncSettings();
  const { calendarSyncEnabled, setCalendarSyncEnabled } = useCalendarSync();
  const { startOAuthFlow } = useOAuth({
    strategy: "oauth_google",
  });
  const checkCalendarScope = useAction(api.calendar.checkCalendarScope);
  const [isRequestingAccess, setIsRequestingAccess] = useState(false);
  const colors = Colors[colorScheme ?? "light"];
  const googleAccount = user?.externalAccounts?.find(
    (account) => account.provider === 'google'
  );

  const handleGoogleReconnect = async () => {
    try {
      setIsRequestingAccess(true);
      const { createdSessionId, setActive } = await startOAuthFlow();
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        setCalendarSyncEnabled(true);
        Alert.alert(
          'Google Reconnected',
          'Calendar access has been refreshed. Your events will now sync both ways.'
        );
      }
    } catch (error) {
      logger.error('Calendar access error:', error);
      Alert.alert('Calendar Access', 'Failed to grant calendar access. Please try again.');
    } finally {
      setIsRequestingAccess(false);
    }
  };

  const handleCalendarToggle = async (value: boolean) => {
    if (!value) {
      setCalendarSyncEnabled(false);
      return;
    }

    if (googleAccount) {
      try {
        const scopeResult = await checkCalendarScope({});
        if (!scopeResult?.hasScope) {
          Alert.alert(
            'Calendar Access Required',
            'Your Google account is connected, but calendar access is missing. Please reconnect to grant permissions.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Reconnect', onPress: handleGoogleReconnect },
            ]
          );
          return;
        }
      } catch (error) {
        logger.warn('Calendar scope check failed:', error);
      }

      setCalendarSyncEnabled(true);
      Alert.alert(
        'Calendar Sync Enabled',
        'Your reminders and timed events will stay in sync with Google Calendar.'
      );
      return;
    }

    await handleGoogleReconnect();
  };

  return (
    <SwipeableTab>
      <ThemedView style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {user?.imageUrl && (
          <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
        )}
        {user?.fullName && (
          <ThemedText style={styles.name}>{user.fullName}</ThemedText>
        )}

        <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.menuItem,
              { backgroundColor: colors.backgroundSecondary },
            ]}
            onPress={() => router.push("/card-customization" as any)}
          >
            <IconSymbol name="paintbrush" size={24} color={colors.tint} />
            <View style={styles.menuText}>
              <ThemedText type="defaultSemiBold">Card Customization</ThemedText>
              <ThemedText style={styles.menuDescription}>
                Customize icons and colors
              </ThemedText>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.menuItem,
              { backgroundColor: colors.backgroundSecondary },
            ]}
            onPress={() => router.push("/gestures-help" as any)}
          >
            <IconSymbol name="hand.draw" size={24} color={colors.tint} />
            <View style={styles.menuText}>
              <ThemedText type="defaultSemiBold">Gestures</ThemedText>
              <ThemedText style={styles.menuDescription}>
                Learn how to use gestures
              </ThemedText>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.icon} />
          </TouchableOpacity>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.icon }]} />

        <ThemedView
          style={[
            styles.settingsSection,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.icon,
            },
          ]}
        >
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Appearance
          </ThemedText>

          <View style={styles.themeOptions}>
            <TouchableOpacity
              style={[
                styles.themeButton,
                { borderColor: colors.icon },
                themeMode === "system" && { backgroundColor: colors.tint },
              ]}
              onPress={() => setThemeMode("system")}
            >
              <ThemedText
                style={[
                  styles.themeButtonText,
                  themeMode === "system" && { color: colors.primaryForeground },
                ]}
              >
                Auto
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.themeButton,
                { borderColor: colors.icon },
                themeMode === "light" && { backgroundColor: colors.tint },
              ]}
              onPress={() => setThemeMode("light")}
            >
              <ThemedText
                style={[
                  styles.themeButtonText,
                  themeMode === "light" && { color: colors.primaryForeground },
                ]}
              >
                Light
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.themeButton,
                { borderColor: colors.icon },
                themeMode === "dark" && { backgroundColor: colors.tint },
              ]}
              onPress={() => setThemeMode("dark")}
            >
              <ThemedText
                style={[
                  styles.themeButtonText,
                  themeMode === "dark" && { color: colors.primaryForeground },
                ]}
              >
                Dark
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>

        <ThemedView
          style={[
            styles.settingsSection,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.icon,
            },
          ]}
        >
          <View style={styles.syncOption}>
            <View style={styles.syncLabelContainer}>
              <ThemedText type="defaultSemiBold">Cloud Sync</ThemedText>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert(
                    "Cloud Sync",
                    "Sync your notes and reminders across all your devices. When enabled, your data is backed up to the cloud and kept in sync in real-time."
                  )
                }
                style={styles.infoButton}
              >
                <IconSymbol name="info.circle" size={18} color={colors.icon} />
              </TouchableOpacity>
            </View>
            <Switch
              value={syncMode === "cloud"}
              onValueChange={(value) => setSyncMode(value ? "cloud" : "local")}
              trackColor={{
                false: colors.switchTrackInactive,
                true: colors.tint,
              }}
              thumbColor={
                syncMode === "cloud"
                  ? colors.switchThumbActive
                  : colors.switchThumbInactive
              }
            />
          </View>
        </ThemedView>

        <ThemedView
          style={[
            styles.settingsSection,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.icon,
            },
          ]}
        >
          <View style={styles.syncOption}>
            <View style={styles.syncLabelContainer}>
              <ThemedText type="defaultSemiBold">Google Calendar Sync</ThemedText>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert(
                    "Google Calendar Sync",
                    "Automatically sync your reminders with Google Calendar. Your reminders will appear as calendar events and stay up-to-date across both apps."
                  )
                }
                style={styles.infoButton}
              >
                <IconSymbol name="info.circle" size={18} color={colors.icon} />
              </TouchableOpacity>
            </View>
            <Switch
              value={calendarSyncEnabled}
              onValueChange={handleCalendarToggle}
              disabled={isRequestingAccess}
              trackColor={{
                false: colors.switchTrackInactive,
                true: colors.tint,
              }}
              thumbColor={
                calendarSyncEnabled
                  ? colors.switchThumbActive
                  : colors.switchThumbInactive
              }
            />
          </View>
          {googleAccount && (
            <TouchableOpacity
              style={styles.reconnectRow}
              onPress={handleGoogleReconnect}
              disabled={isRequestingAccess}
            >
              <IconSymbol name="arrow.clockwise" size={18} color={colors.icon} />
              <ThemedText style={styles.reconnectText}>Reconnect Google Calendar</ThemedText>
            </TouchableOpacity>
          )}
        </ThemedView>

        <View style={[styles.divider, { backgroundColor: colors.icon }]} />

        <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.menuItem,
              { backgroundColor: colors.backgroundSecondary },
            ]}
            onPress={() => signOut()}
          >
            <IconSymbol
              name="rectangle.portrait.and.arrow.right"
              size={24}
              color={colors.error}
            />
            <View style={styles.menuText}>
              <ThemedText
                type="defaultSemiBold"
                style={{ color: colors.error }}
              >
                Sign Out
              </ThemedText>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
    </SwipeableTab>
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
    alignSelf: "center",
  },
  title: {
    textAlign: "center",
  },
  name: {
    marginTop: 8,
    fontSize: 16,
    opacity: 0.7,
    textAlign: "center",
  },
  settingsSection: {
    width: "100%",
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
    flexDirection: "row",
    gap: 8,
  },
  themeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  themeButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  syncOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  syncLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoButton: {
    padding: 2,
  },
  section: {
    marginTop: 24,
    marginBottom: 24,
  },
  divider: {
    height: 1,
    opacity: 0.1,
    marginVertical: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
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
  reconnectRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  reconnectText: {
    fontSize: 13,
    opacity: 0.7,
  },
});
