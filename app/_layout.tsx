import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import AuthProvider from '@/components/auth-provider';
import { ThemeProvider as CustomThemeProvider } from '@/contexts/theme-context';
import { SyncSettingsProvider } from '@/contexts/sync-settings-context';
import { DatabaseProvider } from '@/db/provider';
import { SyncProvider } from '@/components/sync-provider';
import {
  setupNotificationChannels,
  setupNotificationResponseHandler,
} from '@/lib/notification-manager';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Setup notification channels (Android)
    setupNotificationChannels();

    // Setup notification tap handler
    const cleanup = setupNotificationResponseHandler();
    return cleanup;
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Item Details' }} />
        <Stack.Screen name="agent" options={{ presentation: 'modal', headerShown: false, title: 'Active Agents' }} />
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
          <DatabaseProvider>
            <AuthProvider>
              <SyncProvider>
                <RootLayoutNav />
              </SyncProvider>
            </AuthProvider>
          </DatabaseProvider>
        </SyncSettingsProvider>
      </CustomThemeProvider>
    </GestureHandlerRootView>
  );
}
