import {
  StyleSheet,
  View,
  TouchableOpacity,
  Vibration,
  BackHandler,
  Platform,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLocalItem, useLocalItemMutations } from '@/hooks/use-local-items';
import { startAlarmSound, stopAlarmSound } from '@/lib/alarm-audio';
import { scanTag, isNfcSupported, cancelScan } from '@/lib/nfc-service';
import CodeEntryPad from '@/components/code-entry-pad';
import { AlarmDismissMethod } from '@/db/types';

type AlarmState = 'ringing' | 'scanning_nfc' | 'entering_code' | 'dismissed';

export default function AlarmScreen() {
  const params = useLocalSearchParams<{
    itemId: string;
    dismissMethod: AlarmDismissMethod;
    registeredNfcTagId: string;
    dismissCode: string;
  }>();

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const { item } = useLocalItem(params.itemId ?? null);
  const { updateItemStatus } = useLocalItemMutations();

  const [alarmState, setAlarmState] = useState<AlarmState>('ringing');
  const [nfcStatus, setNfcStatus] = useState<'checking' | 'scanning' | 'success' | 'error'>('checking');
  const [nfcError, setNfcError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [failedCodeAttempts, setFailedCodeAttempts] = useState(0);

  // Start alarm sound and vibration on mount
  useEffect(() => {
    const startAlarm = async () => {
      await startAlarmSound(item?.alarmConfig?.soundId);
      // Start vibration pattern
      Vibration.vibrate([500, 500], true);
    };

    startAlarm();

    // Cleanup on unmount
    return () => {
      stopAlarmSound();
      Vibration.cancel();
    };
  }, [item?.alarmConfig?.soundId]);

  // Prevent back button from dismissing alarm without proper dismissal
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Don't allow back button to dismiss the alarm
      return true;
    });

    return () => backHandler.remove();
  }, []);

  // Handle alarm dismissal
  const handleDismiss = useCallback(async () => {
    setAlarmState('dismissed');
    await stopAlarmSound();
    Vibration.cancel();

    // Mark the item as done
    if (item) {
      await updateItemStatus(item.id, 'done');
    }

    // Navigate back
    router.back();
  }, [item, updateItemStatus]);

  // Handle NFC scan for dismissal
  const handleNfcScan = useCallback(async () => {
    setAlarmState('scanning_nfc');
    setNfcStatus('checking');
    setNfcError(null);

    // Check NFC support
    if (!isNfcSupported()) {
      setNfcError('NFC is not supported on this device');
      setNfcStatus('error');
      setAlarmState('ringing');
      return;
    }

    setNfcStatus('scanning');

    try {
      const result = await scanTag();

      if (!result) {
        setNfcError('No tag detected. Please try again.');
        setNfcStatus('error');
        setAlarmState('ringing');
        return;
      }

      // Verify the tag matches
      if (result.tagId === params.registeredNfcTagId) {
        setNfcStatus('success');
        await handleDismiss();
      } else {
        setNfcError('Wrong tag! Please scan the correct NFC tag.');
        setNfcStatus('error');
        setAlarmState('ringing');
      }
    } catch {
      setNfcError('Failed to scan tag. Please try again.');
      setNfcStatus('error');
      setAlarmState('ringing');
    }
  }, [params.registeredNfcTagId, handleDismiss]);

  // Cancel NFC scanning session if the user backs out of the scan UI
  const handleCancelNfcScan = useCallback(async () => {
    try {
      await cancelScan();
    } finally {
      setAlarmState('ringing');
    }
  }, []);

  // Handle code entry for dismissal
  const handleCodeSubmit = useCallback(
    async (enteredCode: string) => {
      setCodeError(null);

      if (enteredCode === params.dismissCode) {
        await handleDismiss();
      } else {
        setCodeError('Incorrect code. Please try again.');
        setFailedCodeAttempts((prev) => prev + 1);
      }
    },
    [params.dismissCode, handleDismiss]
  );

  // Show code entry pad
  const handleShowCodeEntry = useCallback(() => {
    setAlarmState('entering_code');
    setCodeError(null);
  }, []);

  // Cancel code entry and go back to main alarm screen
  const handleCancelCodeEntry = useCallback(() => {
    setAlarmState('ringing');
    setCodeError(null);
  }, []);

  // Format time for display
  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Render based on alarm state
  if (alarmState === 'entering_code') {
    const shouldRevealCode =
      failedCodeAttempts >= 5 && Boolean(params.dismissCode);
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.error }]}>
        <View style={styles.content}>
          <ThemedText style={styles.title}>Enter Code to Dismiss</ThemedText>
          <CodeEntryPad
            codeLength={params.dismissCode?.length || 4}
            onSubmit={handleCodeSubmit}
            error={codeError}
            hint={shouldRevealCode ? `Code: ${params.dismissCode}` : null}
            onCancel={handleCancelCodeEntry}
          />
        </View>
      </ThemedView>
    );
  }

  if (alarmState === 'scanning_nfc') {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.error }]}>
        <View style={styles.content}>
          <IconSymbol name="wave.3.right" size={80} color={colors.background} />
          <ThemedText style={[styles.title, { color: colors.background }]}>
            {nfcStatus === 'scanning' ? 'Scanning...' : 'Preparing NFC'}
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.background }]}>
            Hold your NFC tag near the phone
          </ThemedText>
          {nfcError && (
            <ThemedText style={[styles.error, { color: colors.background }]}>
              {nfcError}
            </ThemedText>
          )}
          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: colors.background }]}
            onPress={handleCancelNfcScan}
          >
            <ThemedText style={{ color: colors.error }}>Cancel</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  // Main alarm ringing view
  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.error }]}>
      <View style={styles.content}>
        <ThemedText style={[styles.time, { color: colors.background }]}>
          {formatTime()}
        </ThemedText>

        <IconSymbol name="bell.fill" size={80} color={colors.background} />

        <ThemedText style={[styles.title, { color: colors.background }]}>
          {item?.title || 'Alarm'}
        </ThemedText>

        {nfcError && (
          <ThemedText style={[styles.error, { color: colors.background }]}>
            {nfcError}
          </ThemedText>
        )}

        <View style={styles.buttonContainer}>
          {/* NFC Dismiss Button (iOS only) */}
          {Platform.OS === 'ios' && (params.dismissMethod === 'nfc' || params.dismissMethod === 'either') && (
            <TouchableOpacity
              style={[styles.dismissButton, { backgroundColor: colors.background }]}
              onPress={handleNfcScan}
            >
              <IconSymbol name="wave.3.right" size={32} color={colors.error} />
              <ThemedText style={[styles.buttonText, { color: colors.error }]}>
                Scan NFC Tag
              </ThemedText>
            </TouchableOpacity>
          )}

          {/* Code Dismiss Button */}
          {(params.dismissMethod === 'code' || params.dismissMethod === 'either') && (
            <TouchableOpacity
              style={[styles.dismissButton, { backgroundColor: colors.background }]}
              onPress={handleShowCodeEntry}
            >
              <IconSymbol name="number" size={32} color={colors.error} />
              <ThemedText style={[styles.buttonText, { color: colors.error }]}>
                Enter Code
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 40,
    width: '100%',
  },
  time: {
    fontSize: 64,
    fontWeight: '200',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 24,
    textAlign: 'center',
    opacity: 0.8,
  },
  error: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 16,
    textAlign: 'center',
    opacity: 0.9,
  },
  buttonContainer: {
    marginTop: 48,
    gap: 16,
    width: '100%',
  },
  dismissButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 16,
    gap: 12,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 24,
    padding: 16,
    borderRadius: 8,
  },
});
