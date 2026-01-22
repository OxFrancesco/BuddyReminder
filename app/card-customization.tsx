import { StyleSheet, View, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCardCustomization, CardType } from '@/hooks/use-card-customization';
import { useState } from 'react';

const AVAILABLE_ICONS = [
  'doc.text', 'note.text', 'pencil', 'text.bubble',
  'bell', 'bell.fill', 'alarm', 'clock',
  'cpu', 'checkmark.circle', 'star', 'flag',
];

const AVAILABLE_COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#06b6d4', '#84cc16',
];

export default function CardCustomizationScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { customizations, updateCustomization, resetToDefaults } = useCardCustomization();
  const [editingType, setEditingType] = useState<CardType | null>(null);

  const renderTypeEditor = (type: CardType, label: string) => {
    const customization = customizations[type];
    const isEditing = editingType === type;

    return (
      <View style={[styles.typeCard, { backgroundColor: colors.backgroundSecondary }]}>
        <TouchableOpacity
          style={styles.typeHeader}
          onPress={() => setEditingType(isEditing ? null : type)}
        >
          <View style={[styles.preview, { backgroundColor: customization.color }]}>
            <IconSymbol name={customization.icon} size={24} color={colors.white} />
          </View>
          <ThemedText type="defaultSemiBold">{label}</ThemedText>
          <IconSymbol
            name={isEditing ? 'chevron.up' : 'chevron.down'}
            size={20}
            color={colors.icon}
          />
        </TouchableOpacity>

        {isEditing && (
          <View style={styles.editorContent}>
            <ThemedText style={styles.sectionLabel}>Icon</ThemedText>
            <View style={styles.iconGrid}>
              {AVAILABLE_ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.iconOption,
                    { borderColor: colors.border },
                    customization.icon === icon && { backgroundColor: colors.tint },
                  ]}
                  onPress={() => updateCustomization(type, { ...customization, icon })}
                >
                  <IconSymbol
                    name={icon}
                    size={20}
                    color={customization.icon === icon ? colors.white : colors.text}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <ThemedText style={styles.sectionLabel}>Color</ThemedText>
            <View style={styles.colorGrid}>
              {AVAILABLE_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    customization.color === color && styles.colorSelected,
                  ]}
                  onPress={() => updateCustomization(type, { ...customization, color })}
                />
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Card Customization', presentation: 'modal' }} />
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <ThemedText type="title" style={styles.title}>Card Customization</ThemedText>
          <ThemedText style={styles.subtitle}>
            Customize the icon and color for each card type
          </ThemedText>

          {renderTypeEditor('note', 'Notes')}
          {renderTypeEditor('reminder', 'Reminders')}
          {renderTypeEditor('task', 'Tasks')}

          <TouchableOpacity
            style={[styles.resetButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
            onPress={resetToDefaults}
          >
            <IconSymbol name="arrow.counterclockwise" size={20} color={colors.text} />
            <ThemedText>Reset to Defaults</ThemedText>
          </TouchableOpacity>
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
  typeCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  typeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  preview: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editorContent: {
    padding: 16,
    paddingTop: 0,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#fff',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginTop: 16,
  },
});
