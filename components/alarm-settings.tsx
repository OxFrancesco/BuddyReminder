import {
  StyleSheet,
  View,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AlarmConfig, AlarmDismissMethod } from '@/db/types';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { isNfcSupported } from '@/lib/nfc-service';

interface AlarmSettingsProps {
  alarmConfig: AlarmConfig | null;
  onChange: (config: AlarmConfig | null) => void;
}

export default function AlarmSettings({
  alarmConfig,
  onChange,
}: AlarmSettingsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [isEnabled, setIsEnabled] = useState(alarmConfig?.enabled ?? false);
  const [dismissMethod, setDismissMethod] = useState<AlarmDismissMethod>(
    alarmConfig?.dismissMethod ?? 'either'
  );
  const [selectedTagId, setSelectedTagId] = useState<string | undefined>(
    alarmConfig?.registeredNfcTagId
  );
  const [dismissCode, setDismissCode] = useState(
    alarmConfig?.dismissCode ?? ''
  );
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [nfcAvailable, setNfcAvailable] = useState(false);

  // Fetch user's registered NFC tags
  const userTags = useQuery(api.nfcTags.getUserTags);

  // Check NFC availability on mount
  useEffect(() => {
    setNfcAvailable(isNfcSupported());
  }, []);

  // Build config from current state
  const buildConfig = useCallback(
    (
      enabled: boolean,
      method: AlarmDismissMethod,
      tagId: string | undefined,
      code: string
    ): AlarmConfig | null => {
      if (!enabled) {
        return null;
      }
      return {
        enabled: true,
        dismissMethod: method,
        registeredNfcTagId: tagId,
        dismissCode: code.length >= 4 ? code : undefined,
        soundId: alarmConfig?.soundId,
      };
    },
    [alarmConfig?.soundId]
  );

  // Handle toggle
  const handleToggle = (value: boolean) => {
    setIsEnabled(value);
    onChange(buildConfig(value, dismissMethod, selectedTagId, dismissCode));
  };

  // Handle dismiss method change
  const handleDismissMethodChange = (method: AlarmDismissMethod) => {
    let finalMethod = method;
    if (Platform.OS === 'android' && (method === 'nfc' || method === 'either')) {
      Alert.alert(
        'Coming Soon',
        'NFC dismiss is coming soon on Android. Using code dismiss instead.'
      );
      finalMethod = 'code';
    } else if (method === 'nfc' && !nfcAvailable) {
      Alert.alert(
        'NFC Not Available',
        'NFC is not supported on this device. Please choose a different dismiss method.'
      );
      finalMethod = 'code';
    }
    setDismissMethod(finalMethod);
    onChange(buildConfig(isEnabled, finalMethod, selectedTagId, dismissCode));
  };

  // Handle tag selection
  const handleTagSelect = (tagId: string) => {
    setSelectedTagId(tagId);
    setShowTagPicker(false);
    onChange(buildConfig(isEnabled, dismissMethod, tagId, dismissCode));
  };

  const showRegistrationComingSoon = useCallback(() => {
    Alert.alert('Coming Soon', 'NFC tag registration is coming soon.');
  }, []);

  // Handle dismiss code change
  const handleDismissCodeChange = (code: string) => {
    setDismissCode(code);
    onChange(buildConfig(isEnabled, dismissMethod, selectedTagId, code));
  };

  // Get selected tag label
  const getSelectedTagLabel = () => {
    if (!selectedTagId) return 'Select tag';
    const tag = userTags?.find((t) => t.tagId === selectedTagId);
    return tag?.label ?? 'Unknown tag';
  };

  if (!isEnabled) {
    return (
      <ThemedView
        style={[
          styles.container,
          {
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.icon,
          },
        ]}
      >
        <View style={[styles.menuItem, { borderBottomColor: 'transparent' }]}>
          <View style={styles.labelContainer}>
            <IconSymbol name="bell.fill" size={20} color={colors.typeReminder} />
            <ThemedText style={styles.menuLabel}>Alarm Mode</ThemedText>
          </View>
          <Switch
            value={isEnabled}
            onValueChange={handleToggle}
            trackColor={{ false: colors.switchTrackInactive, true: colors.typeReminder }}
            thumbColor={isEnabled ? colors.switchThumbActive : colors.switchThumbInactive}
          />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView
      style={[
        styles.container,
        {
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.icon,
        },
      ]}
    >
      {/* Enable/Disable Toggle */}
      <View style={[styles.menuItem, { borderBottomColor: colors.overlayLight }]}>
        <View style={styles.labelContainer}>
          <IconSymbol name="bell.fill" size={20} color={colors.typeReminder} />
          <ThemedText style={styles.menuLabel}>Alarm Mode</ThemedText>
        </View>
        <Switch
          value={isEnabled}
          onValueChange={handleToggle}
          trackColor={{ false: colors.switchTrackInactive, true: colors.typeReminder }}
          thumbColor={isEnabled ? colors.switchThumbActive : colors.switchThumbInactive}
        />
      </View>

      {/* Dismiss Method Selector */}
      <View style={[styles.menuItem, { borderBottomColor: colors.overlayLight }]}>
        <ThemedText style={styles.menuLabel}>Dismiss Method</ThemedText>
      </View>
      <View style={[styles.methodSelector, { borderBottomColor: colors.overlayLight }]}>
        <TouchableOpacity
          style={[
            styles.methodOption,
            dismissMethod === 'nfc' && { backgroundColor: colors.tint + '20' },
          ]}
          onPress={() => handleDismissMethodChange('nfc')}
        >
          <IconSymbol
            name="wave.3.right"
            size={20}
            color={dismissMethod === 'nfc' ? colors.tint : colors.icon}
          />
          <ThemedText
            style={[
              styles.methodText,
              dismissMethod === 'nfc' && { color: colors.tint },
            ]}
          >
            NFC Only
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.methodOption,
            dismissMethod === 'code' && { backgroundColor: colors.tint + '20' },
          ]}
          onPress={() => handleDismissMethodChange('code')}
        >
          <IconSymbol
            name="number"
            size={20}
            color={dismissMethod === 'code' ? colors.tint : colors.icon}
          />
          <ThemedText
            style={[
              styles.methodText,
              dismissMethod === 'code' && { color: colors.tint },
            ]}
          >
            Code Only
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.methodOption,
            dismissMethod === 'either' && { backgroundColor: colors.tint + '20' },
          ]}
          onPress={() => handleDismissMethodChange('either')}
        >
          <IconSymbol
            name="checkmark.circle"
            size={20}
            color={dismissMethod === 'either' ? colors.tint : colors.icon}
          />
          <ThemedText
            style={[
              styles.methodText,
              dismissMethod === 'either' && { color: colors.tint },
            ]}
          >
            Either
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* NFC Tag Selector (shown for NFC or Either methods) */}
      {(dismissMethod === 'nfc' || dismissMethod === 'either') && (
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: colors.overlayLight }]}
          onPress={() => setShowTagPicker(true)}
        >
          <View style={styles.labelContainer}>
            <IconSymbol name="wave.3.right" size={20} color={colors.icon} />
            <ThemedText style={styles.menuLabel}>NFC Tag</ThemedText>
          </View>
          <View style={styles.valueContainer}>
            <ThemedText style={[styles.valueText, { color: colors.icon }]}>
              {getSelectedTagLabel()}
            </ThemedText>
            <IconSymbol name="chevron.right" size={16} color={colors.icon} />
          </View>
        </TouchableOpacity>
      )}

      {/* Code Input (shown for Code or Either methods) */}
      {(dismissMethod === 'code' || dismissMethod === 'either') && (
        <View style={[styles.menuItem, { borderBottomColor: colors.overlayLight }]}>
          <View style={styles.labelContainer}>
            <IconSymbol name="number" size={20} color={colors.icon} />
            <ThemedText style={styles.menuLabel}>Dismiss Code</ThemedText>
          </View>
          <TextInput
            style={[
              styles.codeInput,
              { color: colors.text, borderColor: colors.border },
            ]}
            value={dismissCode}
            onChangeText={handleDismissCodeChange}
            placeholder="4+ digits"
            placeholderTextColor={colors.icon}
            keyboardType="number-pad"
            maxLength={8}
            secureTextEntry
          />
        </View>
      )}

      {/* Tag Picker Modal */}
      <Modal
        visible={showTagPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTagPicker(false)}
      >
        <ThemedView style={styles.modalContainer}>
          <>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowTagPicker(false)}>
                <ThemedText style={{ color: colors.tint }}>Cancel</ThemedText>
              </TouchableOpacity>
              <ThemedText style={styles.modalTitle}>Select NFC Tag</ThemedText>
              <TouchableOpacity onPress={showRegistrationComingSoon}>
                <ThemedText style={{ color: colors.tint }}>Add New</ThemedText>
              </TouchableOpacity>
            </View>

            {/* Tag List */}
            {userTags && userTags.length > 0 ? (
              <View style={styles.tagList}>
                {userTags.map((tag) => (
                  <TouchableOpacity
                    key={tag._id}
                    style={[
                      styles.tagItem,
                      {
                        borderColor: colors.border,
                        backgroundColor:
                          tag.tagId === selectedTagId
                            ? colors.tint + '20'
                            : colors.backgroundSecondary,
                      },
                    ]}
                    onPress={() => handleTagSelect(tag.tagId)}
                  >
                    <IconSymbol
                      name="wave.3.right"
                      size={24}
                      color={tag.tagId === selectedTagId ? colors.tint : colors.icon}
                    />
                    <View style={styles.tagInfo}>
                      <ThemedText style={styles.tagLabel}>{tag.label}</ThemedText>
                      <ThemedText style={[styles.tagId, { color: colors.icon }]}>
                        {tag.tagId.slice(0, 8)}...
                      </ThemedText>
                    </View>
                    {tag.tagId === selectedTagId && (
                      <IconSymbol name="checkmark" size={24} color={colors.tint} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <IconSymbol name="wave.3.right" size={48} color={colors.icon} />
                <ThemedText style={[styles.emptyText, { color: colors.icon }]}>
                  NFC tag registration is coming soon.
                </ThemedText>
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: colors.tint }]}
                  onPress={showRegistrationComingSoon}
                >
                  <ThemedText style={{ color: colors.background }}>
                    Register Your First Tag
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    minHeight: 50,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  valueText: {
    fontSize: 16,
  },
  methodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 0.5,
  },
  methodOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  methodText: {
    fontSize: 12,
    fontWeight: '500',
  },
  codeInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    width: 100,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  tagList: {
    padding: 20,
    gap: 12,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  tagInfo: {
    flex: 1,
  },
  tagLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  tagId: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  addButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
});
