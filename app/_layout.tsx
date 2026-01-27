import { useEffect } from "react";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import AuthProvider from "@/components/auth-provider";
import { ThemeProvider as CustomThemeProvider } from "@/contexts/theme-context";
import { SyncSettingsProvider } from "@/contexts/sync-settings-context";
import { CalendarSyncProvider } from "@/contexts/calendar-sync-context";
import { DatabaseProvider } from "@/db/provider";
import { SyncProvider } from "@/components/sync-provider";
import {
  setupNotificationChannels,
  setupNotificationResponseHandler,
} from "@/lib/notification-manager";
import { setupAlarmNotificationHandler } from "@/lib/alarm-service";
import { initializeNfc } from "@/lib/nfc-service";

export const unstable_settings = {
  anchor: "(tabs)",
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Setup notification channels (Android)
    setupNotificationChannels();

    // Setup notification tap handler
    const notificationCleanup = setupNotificationResponseHandler();

    // Setup alarm notification handler
    const alarmCleanup = setupAlarmNotificationHandler();

    // Initialize NFC (synchronous check)
    initializeNfc();

    return () => {
      notificationCleanup();
      alarmCleanup();
    };
  }, []);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: "Back" }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Item Details" }}
        />
        <Stack.Screen
          name="alarm"
          options={{
            presentation: "fullScreenModal",
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="nfc-tags"
          options={{
            presentation: "modal",
            title: "NFC Tags",
          }}
        />
        <Stack.Screen
          name="nfc-debug"
          options={{
            presentation: "modal",
            title: "NFC Diagnostics",
          }}
        />
        <Stack.Screen
          name="nfc-register"
          options={{
            presentation: "fullScreenModal",
            title: "Register NFC Tag",
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <CustomThemeProvider>
        <SyncSettingsProvider>
          <CalendarSyncProvider>
            <DatabaseProvider>
              <AuthProvider>
                <SyncProvider>
                  <RootLayoutNav />
                </SyncProvider>
              </AuthProvider>
            </DatabaseProvider>
          </CalendarSyncProvider>
        </SyncSettingsProvider>
      </CustomThemeProvider>
    </GestureHandlerRootView>
  );
}
