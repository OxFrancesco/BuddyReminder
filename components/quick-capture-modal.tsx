import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import * as chrono from 'chrono-node';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';
import { IconSymbol } from './ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLocalItemMutations } from '@/hooks/use-local-items';
import { scheduleStickyNotification, scheduleReminderNotification } from '@/lib/notification-manager';
import { ItemType, TaskSpec } from '@/db/types';

interface QuickCaptureModalProps {
  visible: boolean;
  onClose: () => void;
}

interface ParsedInput {
  type: ItemType;
  title: string;
  triggerAt?: number;
  taskSpec?: TaskSpec;
}

export default function QuickCaptureModal({ visible, onClose }: QuickCaptureModalProps) {
  const [input, setInput] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const { createItem, setNotificationId } = useLocalItemMutations();

  const parseInput = (text: string): ParsedInput => {
    const lowerText = text.toLowerCase().trim();
    
    // Task detection
    if (lowerText.startsWith('agent:') || lowerText.startsWith('task:')) {
      return {
        type: 'task',
        title: text.replace(/^(agent:|task:)\s*/i, ''),
        taskSpec: {
          goal: text.replace(/^(agent:|task:)\s*/i, ''),
        },
      };
    }
    
    // Try to parse date/time with chrono
    const parsedDates = chrono.parse(text, new Date(), { forwardDate: true });
    
    // Reminder detection - check for time-related keywords or parsed dates
    const reminderKeywords = ['remind me', 'reminder', 'at ', 'tomorrow', 'today', 'tonight', 'morning', 'afternoon', 'evening', 'next', 'on ', 'every'];
    const hasReminderKeyword = reminderKeywords.some(keyword => lowerText.includes(keyword));
    
    if (hasReminderKeyword || parsedDates.length > 0) {
      let triggerAt: number | undefined;
      let cleanTitle = text;
      
      if (parsedDates.length > 0) {
        const parsed = parsedDates[0];
        triggerAt = parsed.start.date().getTime();
        
        // Remove the date/time text from the title
        cleanTitle = text.substring(0, parsed.index) + text.substring(parsed.index + parsed.text.length);
        cleanTitle = cleanTitle.replace(/^remind me to\s*/i, '').trim();
      } else {
        cleanTitle = text.replace(/^remind me to\s*/i, '');
      }
      
      return {
        type: 'reminder',
        title: cleanTitle || text,
        triggerAt,
      };
    }
    
    // Default to note
    return {
      type: 'note',
      title: text,
    };
  };

  const handleSave = async () => {
    if (!input.trim()) return;

    setIsLoading(true);
    try {
      const parsed = parseInput(input);

      // Create item locally (instant)
      const item = await createItem({
        type: parsed.type,
        title: parsed.title,
        isPinned: isPinned,
        triggerAt: parsed.triggerAt,
        taskSpec: parsed.taskSpec,
      });

      // Schedule notifications based on type
      if (isPinned && parsed.type === 'note') {
        // Sticky notification for pinned notes
        const notificationId = await scheduleStickyNotification(item.id, parsed.title);
        if (notificationId) {
          await setNotificationId(item.id, notificationId);
        }
      } else if (parsed.type === 'reminder' && parsed.triggerAt) {
        // Scheduled notification for reminders
        const notificationId = await scheduleReminderNotification(item.id, parsed.title, parsed.triggerAt);
        if (notificationId) {
          await setNotificationId(item.id, notificationId);
        }
      }

      setInput('');
      setIsPinned(false);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save item. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPreviewType = (): ItemType => {
    if (!input.trim()) return 'note';
    return parseInput(input).type;
  };

  const getTypeColor = (type: ItemType) => {
    switch (type) {
      case 'note': return colors.textSecondary;
      case 'reminder': return colors.warning;
      case 'task': return colors.tint;
      default: return colors.text;
    }
  };

  const getTypeIcon = (type: ItemType) => {
    switch (type) {
      case 'note': return 'Note';
      case 'reminder': return 'Reminder';
      case 'task': return 'Task';
      default: return 'Note';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
          
          <ThemedText type="defaultSemiBold">Quick Capture</ThemedText>
          
          <TouchableOpacity 
            onPress={handleSave} 
            style={styles.saveButton}
            disabled={!input.trim() || isLoading}
          >
            <Text style={[styles.saveText, { 
              color: colors.tint,
              opacity: input.trim() ? 1 : 0.5 
            }]}>
              {isLoading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={[styles.typePreview, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={styles.typeIcon}>{getTypeIcon(getPreviewType())}</Text>
            <Text style={[styles.typeText, { color: getTypeColor(getPreviewType()) }]}>
              {getPreviewType().charAt(0).toUpperCase() + getPreviewType().slice(1)}
            </Text>
          </View>

          {getPreviewType() === 'note' && (
            <TouchableOpacity 
              style={[styles.pinToggle, { 
                backgroundColor: isPinned ? colors.tint : colors.backgroundSecondary,
                borderColor: colors.border,
              }]}
              onPress={() => setIsPinned(!isPinned)}
            >
              <IconSymbol name={isPinned ? 'pin.fill' : 'pin'} size={16} color={isPinned ? '#FFFFFF' : colors.text} />
              <Text style={[styles.pinText, { 
                color: isPinned ? '#FFFFFF' : colors.text 
              }]}>
                {isPinned ? 'Pinned to notifications' : 'Pin to notifications'}
              </Text>
            </TouchableOpacity>
          )}

          <TextInput
            style={[styles.input, { 
              color: colors.text, 
              borderColor: colors.icon,
              backgroundColor: colors.background,
            }]}
            placeholder="What's on your mind?"
            placeholderTextColor={colors.icon}
            value={input}
            onChangeText={setInput}
            multiline
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />

          <View style={[styles.hints, { backgroundColor: colors.backgroundSecondary }]}>
            <ThemedText style={styles.hintText}>
              Try: "Remind me tomorrow at 3pm to call mom" or "Meeting next Monday at 2:30pm" or "Agent: summarize this PDF"
            </ThemedText>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    paddingTop: 60,
    paddingBottom: 20,
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    fontSize: 16,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  typePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  typeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  pinToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  pinText: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    fontSize: 16,
    height: 40,
    textAlignVertical: 'top',
  },
  hints: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  hintText: {
    fontSize: 12,
    opacity: 0.7,
  },
});
