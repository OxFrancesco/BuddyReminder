import { useState } from "react";
import {
  Modal,
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as chrono from "chrono-node";
import { ThemedText } from "./themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLocalItemMutations } from "@/hooks/use-local-items";

interface RescheduleModalProps {
  itemId: string | null;
  onClose: () => void;
}

export default function RescheduleModal({
  itemId,
  onClose,
}: RescheduleModalProps) {
  const [input, setInput] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { updateItem } = useLocalItemMutations();

  const handleReschedule = async () => {
    if (!itemId || !input.trim()) return;

    const parsedDates = chrono.parse(input, new Date(), { forwardDate: true });

    if (parsedDates.length === 0) {
      Alert.alert(
        "Invalid Date",
        'Could not understand the date/time. Try "tomorrow at 3pm" or "next Monday"',
      );
      return;
    }

    try {
      const triggerAt = parsedDates[0].start.date().getTime();
      await updateItem(itemId, { triggerAt });
      setInput("");
      onClose();
    } catch {
      Alert.alert("Error", "Failed to reschedule item");
    }
  };

  const handleDatePickerSave = async () => {
    if (!itemId) return;

    try {
      await updateItem(itemId, { triggerAt: selectedDate.getTime() });
      onClose();
    } catch {
      Alert.alert("Error", "Failed to reschedule item");
    }
  };

  const onDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
      if (Platform.OS === "android") {
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
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose}>
            <ThemedText style={{ color: colors.text, fontWeight: "bold" }}>
              Cancel
            </ThemedText>
          </TouchableOpacity>

          <ThemedText type="defaultSemiBold">Reschedule</ThemedText>

          <TouchableOpacity onPress={handleReschedule}>
            <ThemedText style={{ color: colors.primary, fontWeight: "bold" }}>
              Save
            </ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <ThemedText style={styles.sectionTitle}>Natural Language</ThemedText>
          <ThemedText style={styles.label}>
            When should this reminder trigger?
          </ThemedText>

          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: colors.background,
                borderColor: colors.border,
                shadowColor: colors.shadow,
              },
            ]}
            placeholder="e.g., tomorrow at 3pm, next Monday, in 2 hours"
            placeholderTextColor={colors.mutedForeground}
            value={input}
            onChangeText={setInput}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleReschedule}
          />

          <View
            style={[
              styles.hints,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
                borderWidth: 2,
              },
            ]}
          >
            <ThemedText style={styles.hintText}>
              Examples: &ldquo;tomorrow at 3pm&rdquo;,
              &ldquo;next Monday at 9am&rdquo;, &ldquo;in 2 hours&rdquo;,
              &ldquo;tonight&rdquo;
            </ThemedText>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <ThemedText style={styles.sectionTitle}>
            Date & Time Picker
          </ThemedText>

          <View style={styles.pickerButtons}>
            <TouchableOpacity
              style={[
                styles.pickerButton,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  shadowColor: colors.shadow,
                },
              ]}
              onPress={() => setShowDatePicker(true)}
            >
              <ThemedText style={{ fontWeight: "bold" }}>
                Select Date
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.pickerButton,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  shadowColor: colors.shadow,
                },
              ]}
              onPress={() => setShowTimePicker(true)}
            >
              <ThemedText style={{ fontWeight: "bold" }}>
                Select Time
              </ThemedText>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.selectedDateTime,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
                borderWidth: 2,
              },
            ]}
          >
            <ThemedText style={styles.selectedDateTimeText}>
              {selectedDate.toLocaleString()}
            </ThemedText>
          </View>

          <TouchableOpacity
            style={[
              styles.saveButton,
              {
                backgroundColor: colors.primary,
                borderColor: colors.border,
                shadowColor: colors.shadow,
              },
            ]}
            onPress={handleDatePickerSave}
          >
            <ThemedText
              style={[
                styles.saveButtonText,
                { color: colors.primaryForeground },
              ]}
            >
              Save Selected Date & Time
            </ThemedText>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
    marginTop: 8,
    textTransform: "uppercase",
  },
  label: {
    fontSize: 16,
    marginBottom: 12,
    fontWeight: "600",
  },
  input: {
    borderWidth: 2,
    borderRadius: 4,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  hints: {
    padding: 12,
    borderRadius: 4,
  },
  hintText: {
    fontSize: 12,
    fontWeight: "500",
  },
  divider: {
    height: 2,
    marginVertical: 24,
  },
  pickerButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  pickerButton: {
    flex: 1,
    padding: 16,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: "center",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  selectedDateTime: {
    padding: 16,
    borderRadius: 4,
    marginBottom: 16,
    alignItems: "center",
  },
  selectedDateTimeText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  saveButton: {
    padding: 16,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: "center",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
