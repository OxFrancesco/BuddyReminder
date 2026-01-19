import { useState } from 'react';
import {
  Modal,
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as chrono from 'chrono-node';
import { ThemedText } from './themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLocalItemMutations } from '@/hooks/use-local-items';

interface RescheduleModalProps {
  itemId: string | null;
  onClose: () => void;
}

export default function RescheduleModal({ itemId, onClose }: RescheduleModalProps) {
  const [input, setInput] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { updateItem } = useLocalItemMutations();

  const handleReschedule = async () => {
    if (!itemId || !input.trim()) return;

    const parsedDates = chrono.parse(input, new Date(), { forwardDate: true });

    if (parsedDates.length === 0) {
      Alert.alert('Invalid Date', 'Could not understand the date/time. Try "tomorrow at 3pm" or "next Monday"');
      return;
    }

    try {
      const triggerAt = parsedDates[0].start.date().getTime();
      await updateItem(itemId, { triggerAt });
      setInput('');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to reschedule item');
    }
  };

  const handleDatePickerSave = async () => {
    if (!itemId) return;

    try {
      await updateItem(itemId, { triggerAt: selectedDate.getTime() });
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to reschedule item');
    }
  };

  const onDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
      if (Platform.OS === 'android') {
        setShowTimePicker(true);
      }
    }
  };

  const onTimeChange = (event: any, date?: Date) => {
    setShowTimePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  if (!itemId) return null;

  return (
    <Modal
      visible={!!itemId}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <ThemedText style={{ color: colors.text }}>Cancel</ThemedText>
          </TouchableOpacity>
          
          <ThemedText type="defaultSemiBold">Reschedule</ThemedText>
          
          <TouchableOpacity onPress={handleReschedule}>
            <ThemedText style={{ color: colors.tint }}>Save</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <ThemedText style={styles.sectionTitle}>Natural Language</ThemedText>
          <ThemedText style={styles.label}>When should this reminder trigger?</ThemedText>
          
          <TextInput
            style={[styles.input, { 
              color: colors.text,
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
            }]}
            placeholder="e.g., tomorrow at 3pm, next Monday, in 2 hours"
            placeholderTextColor={colors.icon}
            value={input}
            onChangeText={setInput}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleReschedule}
          />

          <View style={[styles.hints, { backgroundColor: colors.backgroundSecondary }]}>
            <ThemedText style={styles.hintText}>
              Examples: "tomorrow at 3pm", "next Monday at 9am", "in 2 hours", "tonight"
            </ThemedText>
          </View>

          <View style={styles.divider} />

          <ThemedText style={styles.sectionTitle}>Date & Time Picker</ThemedText>
          
          <View style={styles.pickerButtons}>
            <TouchableOpacity 
              style={[styles.pickerButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
              onPress={() => setShowDatePicker(true)}
            >
              <ThemedText>Select Date</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.pickerButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
              onPress={() => setShowTimePicker(true)}
            >
              <ThemedText>Select Time</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={[styles.selectedDateTime, { backgroundColor: colors.backgroundSecondary }]}>
            <ThemedText style={styles.selectedDateTimeText}>
              {selectedDate.toLocaleString()}
            </ThemedText>
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: colors.tint }]}
            onPress={handleDatePickerSave}
          >
            <ThemedText style={styles.saveButtonText}>Save Selected Date & Time</ThemedText>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onTimeChange}
            />
          )}
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
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  label: {
    fontSize: 16,
    marginBottom: 12,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  hints: {
    padding: 12,
    borderRadius: 8,
  },
  hintText: {
    fontSize: 12,
    opacity: 0.7,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 24,
  },
  pickerButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  pickerButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  selectedDateTime: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  selectedDateTimeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
