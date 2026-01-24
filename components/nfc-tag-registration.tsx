import {
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useState, useCallback } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
  registerTag,
  cancelScan,
  isNfcSupported,
  isNfcEnabled,
  openNfcSettings,
  formatTagIdForDisplay,
} from '@/lib/nfc-service';

interface NfcTagRegistrationProps {
  visible: boolean;
  onClose: () => void;
  onTagRegistered: (tagId: string) => void;
}

type RegistrationStep = 'intro' | 'scanning' | 'naming' | 'success' | 'error';

export default function NfcTagRegistration({
  visible,
  onClose,
  onTagRegistered,
}: NfcTagRegistrationProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [step, setStep] = useState<RegistrationStep>('intro');
  const [scannedTagId, setScannedTagId] = useState<string | null>(null);
  const [tagLabel, setTagLabel] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const registerTagMutation = useMutation(api.nfcTags.registerTag);

  // Reset state when modal closes
  const handleClose = useCallback(() => {
    setStep('intro');
    setScannedTagId(null);
    setTagLabel('');
    setErrorMessage(null);
    onClose();
  }, [onClose]);

  // Start the scanning process
  const handleStartScan = useCallback(async () => {
    setErrorMessage(null);

    // Check NFC support
    const supported = await isNfcSupported();
    if (!supported) {
      setErrorMessage('NFC is not supported on this device');
      setStep('error');
      return;
    }

    // Check if NFC is enabled
    const enabled = await isNfcEnabled();
    if (!enabled) {
      Alert.alert(
        'NFC Disabled',
        'Please enable NFC in your device settings to register a tag.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: openNfcSettings },
        ]
      );
      return;
    }

    setStep('scanning');

    try {
      const result = await registerTag();

      if (result) {
        setScannedTagId(result.tagId);
        setStep('naming');
      } else {
        setErrorMessage('No tag detected. Please try again.');
        setStep('error');
      }
    } catch {
      setErrorMessage('Failed to scan tag. Please try again.');
      setStep('error');
    }
  }, []);

  // Cancel scanning
  const handleCancelScan = useCallback(async () => {
    await cancelScan();
    setStep('intro');
  }, []);

  // Save the tag
  const handleSaveTag = useCallback(async () => {
    if (!scannedTagId) return;

    const label = tagLabel.trim() || 'My NFC Tag';

    try {
      await registerTagMutation({
        tagId: scannedTagId,
        label,
      });

      setStep('success');

      // Notify parent after a brief delay to show success state
      setTimeout(() => {
        onTagRegistered(scannedTagId);
        handleClose();
      }, 1500);
    } catch (error) {
      if (error instanceof Error && error.message.includes('already registered')) {
        setErrorMessage('This tag is already registered');
      } else {
        setErrorMessage('Failed to save tag. Please try again.');
      }
      setStep('error');
    }
  }, [scannedTagId, tagLabel, registerTagMutation, onTagRegistered, handleClose]);

  // Retry after error
  const handleRetry = useCallback(() => {
    setErrorMessage(null);
    setStep('intro');
  }, []);

  // Render content based on step
  const renderContent = () => {
    switch (step) {
      case 'intro':
        return (
          <View style={styles.stepContent}>
            <IconSymbol name="wave.3.right" size={80} color={colors.tint} />
            <ThemedText style={styles.stepTitle}>Register NFC Tag</ThemedText>
            <ThemedText style={[styles.stepDescription, { color: colors.icon }]}>
              You can use any NFC tag (like a sticker or card) to dismiss your
              alarm. Place it somewhere you need to physically get up to reach.
            </ThemedText>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.tint }]}
              onPress={handleStartScan}
            >
              <IconSymbol name="wave.3.right" size={24} color={colors.background} />
              <ThemedText style={[styles.buttonText, { color: colors.background }]}>
                Scan NFC Tag
              </ThemedText>
            </TouchableOpacity>
          </View>
        );

      case 'scanning':
        return (
          <View style={styles.stepContent}>
            <ActivityIndicator size="large" color={colors.tint} />
            <ThemedText style={styles.stepTitle}>Scanning...</ThemedText>
            <ThemedText style={[styles.stepDescription, { color: colors.icon }]}>
              Hold your NFC tag near the back of your phone
            </ThemedText>
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.icon }]}
              onPress={handleCancelScan}
            >
              <ThemedText style={{ color: colors.icon }}>Cancel</ThemedText>
            </TouchableOpacity>
          </View>
        );

      case 'naming':
        return (
          <View style={styles.stepContent}>
            <IconSymbol name="checkmark.circle.fill" size={80} color={colors.success} />
            <ThemedText style={styles.stepTitle}>Tag Detected!</ThemedText>
            <ThemedText style={[styles.tagIdText, { color: colors.icon }]}>
              ID: {scannedTagId ? formatTagIdForDisplay(scannedTagId) : ''}
            </ThemedText>
            <ThemedText style={[styles.stepDescription, { color: colors.icon }]}>
              Give this tag a name to help you identify it:
            </ThemedText>
            <TextInput
              style={[
                styles.labelInput,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.backgroundSecondary,
                },
              ]}
              value={tagLabel}
              onChangeText={setTagLabel}
              placeholder="e.g., Bathroom, Kitchen, Office"
              placeholderTextColor={colors.icon}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.tint }]}
              onPress={handleSaveTag}
            >
              <ThemedText style={[styles.buttonText, { color: colors.background }]}>
                Save Tag
              </ThemedText>
            </TouchableOpacity>
          </View>
        );

      case 'success':
        return (
          <View style={styles.stepContent}>
            <IconSymbol name="checkmark.circle.fill" size={80} color={colors.success} />
            <ThemedText style={styles.stepTitle}>Tag Registered!</ThemedText>
            <ThemedText style={[styles.stepDescription, { color: colors.icon }]}>
              You can now use this tag to dismiss alarms.
            </ThemedText>
          </View>
        );

      case 'error':
        return (
          <View style={styles.stepContent}>
            <IconSymbol name="xmark.circle.fill" size={80} color={colors.error} />
            <ThemedText style={styles.stepTitle}>Something went wrong</ThemedText>
            <ThemedText style={[styles.stepDescription, { color: colors.icon }]}>
              {errorMessage}
            </ThemedText>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.tint }]}
              onPress={handleRetry}
            >
              <ThemedText style={[styles.buttonText, { color: colors.background }]}>
                Try Again
              </ThemedText>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <ThemedText style={{ color: colors.tint }}>Cancel</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Register NFC Tag</ThemedText>
          <View style={{ width: 50 }} />
        </View>

        <View style={styles.content}>{renderContent()}</View>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  stepContent: {
    alignItems: 'center',
    width: '100%',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  tagIdText: {
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 16,
  },
  labelInput: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
    width: '100%',
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
