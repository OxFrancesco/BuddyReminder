import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useState, useCallback } from 'react';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface CodeEntryPadProps {
  codeLength: number;
  onSubmit: (code: string) => void;
  onCancel?: () => void;
  error?: string | null;
  hint?: string | null;
}

export default function CodeEntryPad({
  codeLength,
  onSubmit,
  onCancel,
  error,
  hint,
}: CodeEntryPadProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [code, setCode] = useState('');

  const handleDigitPress = useCallback(
    (digit: string) => {
      if (code.length < codeLength) {
        const newCode = code + digit;
        setCode(newCode);

        // Auto-submit when code is complete
        if (newCode.length === codeLength) {
          onSubmit(newCode);
          setCode('');
        }
      }
    },
    [code, codeLength, onSubmit]
  );

  const handleBackspace = useCallback(() => {
    setCode((prev) => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setCode('');
  }, []);

  // Render code dots
  const renderCodeDots = () => {
    const dots = [];
    for (let i = 0; i < codeLength; i++) {
      const filled = i < code.length;
      dots.push(
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor: filled ? colors.background : 'transparent',
              borderColor: colors.background,
            },
          ]}
        />
      );
    }
    return dots;
  };

  // Render digit button
  const renderDigitButton = (digit: string) => (
    <TouchableOpacity
      key={digit}
      style={[styles.digitButton, { borderColor: colors.background }]}
      onPress={() => handleDigitPress(digit)}
    >
      <ThemedText style={[styles.digitText, { color: colors.background }]}>
        {digit}
      </ThemedText>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Code dots display */}
      <View style={styles.dotsContainer}>{renderCodeDots()}</View>

      {/* Error message */}
      {error && (
        <ThemedText style={[styles.error, { color: colors.background }]}>
          {error}
        </ThemedText>
      )}

      {hint && (
        <ThemedText style={[styles.hint, { color: colors.background }]}>
          {hint}
        </ThemedText>
      )}

      {/* Number pad */}
      <View style={styles.padContainer}>
        <View style={styles.row}>
          {renderDigitButton('1')}
          {renderDigitButton('2')}
          {renderDigitButton('3')}
        </View>
        <View style={styles.row}>
          {renderDigitButton('4')}
          {renderDigitButton('5')}
          {renderDigitButton('6')}
        </View>
        <View style={styles.row}>
          {renderDigitButton('7')}
          {renderDigitButton('8')}
          {renderDigitButton('9')}
        </View>
        <View style={styles.row}>
          {/* Clear button */}
          <TouchableOpacity
            style={[styles.digitButton, { borderColor: colors.background }]}
            onPress={handleClear}
          >
            <ThemedText style={[styles.actionText, { color: colors.background }]}>
              Clear
            </ThemedText>
          </TouchableOpacity>

          {renderDigitButton('0')}

          {/* Backspace button */}
          <TouchableOpacity
            style={[styles.digitButton, { borderColor: colors.background }]}
            onPress={handleBackspace}
          >
            <ThemedText style={[styles.actionText, { color: colors.background }]}>
              Del
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Cancel button */}
      {onCancel && (
        <TouchableOpacity
          style={[styles.cancelButton, { backgroundColor: colors.background }]}
          onPress={onCancel}
        >
          <ThemedText style={[styles.cancelText, { color: colors.error }]}>
            Cancel
          </ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  error: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  hint: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  padContainer: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  digitButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitText: {
    fontSize: 32,
    fontWeight: '400',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButton: {
    marginTop: 32,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  cancelText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
