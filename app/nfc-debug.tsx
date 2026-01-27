import { useCallback, useMemo, useState } from 'react';
import { Alert, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Stack } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  cancelScan,
  formatTagIdForDisplay,
  isNfcSupported,
  scanTagWithDiagnostics,
} from '@/lib/nfc-service';
import { ExpoNfcReader } from '@/modules/expo-nfc-reader';

export default function NfcDebugScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [availability, setAvailability] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastTagId, setLastTagId] = useState<string | null>(null);
  const [lastErrorCode, setLastErrorCode] = useState<string | null>(null);
  const [lastErrorMessage, setLastErrorMessage] = useState<string | null>(null);

  const modulePresent = Boolean(ExpoNfcReader);
  const platformLabel = Platform.OS;

  const currentAvailability = useMemo(() => {
    if (!modulePresent || Platform.OS !== 'ios') {
      return false;
    }
    try {
      return ExpoNfcReader?.isAvailable?.() ?? false;
    } catch {
      return false;
    }
  }, [modulePresent]);

  const handleCheckAvailability = useCallback(() => {
    const supported = isNfcSupported();
    setAvailabilityChecked(true);
    setAvailability(supported);
    setLastErrorCode(null);
    setLastErrorMessage(null);
  }, []);

  const handleScan = useCallback(async () => {
    if (!isNfcSupported()) {
      Alert.alert('NFC Not Available', 'NFC is not supported on this device/build.');
      return;
    }

    setIsScanning(true);
    setLastErrorCode(null);
    setLastErrorMessage(null);

    try {
      const diagnostics = await scanTagWithDiagnostics();
      setLastTagId(diagnostics.tagId);
      setLastErrorCode(diagnostics.errorCode);
      setLastErrorMessage(diagnostics.errorMessage);

      if (!diagnostics.tagId && diagnostics.cancelled) {
        setLastErrorMessage('Scan cancelled by user.');
      }
    } catch (error) {
      setLastErrorCode('NFC_DIAGNOSTICS_ERROR');
      setLastErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsScanning(false);
    }
  }, []);

  const handleCancel = useCallback(async () => {
    try {
      await cancelScan();
    } finally {
      setIsScanning(false);
    }
  }, []);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'NFC Diagnostics' }} />

      <View style={styles.section}>
        <ThemedText style={styles.title}>Environment</ThemedText>
        <View style={styles.row}>
          <ThemedText style={[styles.label, { color: colors.icon }]}>Platform</ThemedText>
          <ThemedText style={styles.value}>{platformLabel}</ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText style={[styles.label, { color: colors.icon }]}>Native module</ThemedText>
          <ThemedText style={styles.value}>{modulePresent ? 'present' : 'missing'}</ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText style={[styles.label, { color: colors.icon }]}>CoreNFC available</ThemedText>
          <ThemedText style={styles.value}>{currentAvailability ? 'yes' : 'no'}</ThemedText>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.title}>Actions</ThemedText>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.tint }]}
            onPress={handleCheckAvailability}
          >
            <ThemedText style={[styles.buttonText, { color: colors.background }]}>
              Check Support
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.success }]}
            onPress={handleScan}
            disabled={isScanning}
          >
            <ThemedText style={[styles.buttonText, { color: colors.background }]}>
              {isScanning ? 'Scanning…' : 'Scan Tag'}
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.error }]}
            onPress={handleCancel}
          >
            <ThemedText style={[styles.buttonText, { color: colors.background }]}>
              Cancel Scan
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.title}>Results</ThemedText>
        {availabilityChecked && (
          <View style={styles.row}>
            <ThemedText style={[styles.label, { color: colors.icon }]}>Supported</ThemedText>
            <ThemedText style={styles.value}>{availability ? 'yes' : 'no'}</ThemedText>
          </View>
        )}
        {lastTagId && (
          <View style={styles.row}>
            <ThemedText style={[styles.label, { color: colors.icon }]}>Last tag</ThemedText>
            <ThemedText style={styles.value}>{formatTagIdForDisplay(lastTagId)}</ThemedText>
          </View>
        )}
        {lastErrorCode && (
          <View style={styles.row}>
            <ThemedText style={[styles.label, { color: colors.icon }]}>Last error code</ThemedText>
            <ThemedText style={styles.value}>{lastErrorCode}</ThemedText>
          </View>
        )}
        {lastErrorMessage && (
          <ThemedText style={[styles.errorText, { color: colors.error }]}>
            {lastErrorMessage}
          </ThemedText>
        )}
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.hintTitle}>If support is no</ThemedText>
        <ThemedText style={[styles.hintText, { color: colors.icon }]}>
          Use a dev client or EAS build on a real iPhone with the NFC capability enabled in
          Apple Developer.
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 20,
  },
  section: {
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  buttonText: {
    fontWeight: '700',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
  },
  hintTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  hintText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
