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
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface QuickCaptureModalProps {
  visible: boolean;
  onClose: () => void;
}

type ItemType = 'note' | 'reminder' | 'task';

interface ParsedInput {
  type: ItemType;
  title: string;
  triggerAt?: number;
  taskSpec?: {
    goal: string;
  };
}

export default function QuickCaptureModal({ visible, onClose }: QuickCaptureModalProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const createItem = useMutation(api.items.createItem);

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
    
    // Reminder detection
    const reminderKeywords = ['remind me', 'reminder', 'at ', 'tomorrow', 'today', 'pm', 'am'];
    const hasReminderKeyword = reminderKeywords.some(keyword => lowerText.includes(keyword));
    
    if (hasReminderKeyword) {
      // Simple time parsing - can be enhanced later
      const timeMatch = text.match(/(\d{1,2})(:\d{2})?\s*(am|pm)/i);
      let triggerAt: number | undefined;
      
      if (timeMatch) {
        const hour = parseInt(timeMatch[1]);
        const minute = timeMatch[2] ? parseInt(timeMatch[2].slice(1)) : 0;
        const isPM = timeMatch[3].toLowerCase() === 'pm';
        
        const now = new Date();
        const reminderTime = new Date();
        reminderTime.setHours(isPM && hour !== 12 ? hour + 12 : hour === 12 && !isPM ? 0 : hour);
        reminderTime.setMinutes(minute);
        reminderTime.setSeconds(0);
        
        // If time has passed today, set for tomorrow
        if (reminderTime <= now) {
          reminderTime.setDate(reminderTime.getDate() + 1);
        }
        
        triggerAt = reminderTime.getTime();
      }
      
      return {
        type: 'reminder',
        title: text.replace(/^remind me to\s*/i, ''),
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
      
      await createItem({
        type: parsed.type,
        title: parsed.title,
        triggerAt: parsed.triggerAt,
        taskSpec: parsed.taskSpec,
      });
      
      setInput('');
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
      case 'note': return '#6B7280';
      case 'reminder': return '#F59E0B';
      case 'task': return '#8B5CF6';
      default: return colors.text;
    }
  };

  const getTypeIcon = (type: ItemType) => {
    switch (type) {
      case 'note': return '📝';
      case 'reminder': return '⏰';
      case 'task': return '🤖';
      default: return '📝';
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
            style={[styles.saveButton, { opacity: input.trim() ? 1 : 0.5 }]}
            disabled={!input.trim() || isLoading}
          >
            <Text style={styles.saveText}>
              {isLoading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.typePreview}>
            <Text style={styles.typeIcon}>{getTypeIcon(getPreviewType())}</Text>
            <Text style={[styles.typeText, { color: getTypeColor(getPreviewType()) }]}>
              {getPreviewType().charAt(0).toUpperCase() + getPreviewType().slice(1)}
            </Text>
          </View>

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

          <View style={styles.hints}>
            <ThemedText style={styles.hintText}>
              💡 Try: "Remind me to call mom at 3pm" or "Agent: summarize this PDF"
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
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveText: {
    color: 'white',
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
    backgroundColor: '#F3F4F6',
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
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  hints: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  hintText: {
    fontSize: 12,
    opacity: 0.7,
  },
});
