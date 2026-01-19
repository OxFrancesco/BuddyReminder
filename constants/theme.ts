/**
 * BuddyReminder color palette - clean, minimal, focused
 */

import { Platform } from 'react-native';

const primary = '#007AFF'; // iOS blue
const primaryDark = '#0A84FF'; // iOS blue (dark mode)

export const Colors = {
  light: {
    text: '#000000',
    textSecondary: '#8E8E93',
    background: '#FFFFFF',
    backgroundSecondary: '#F2F2F7',
    tint: primary,
    border: '#E5E5EA',
    icon: '#8E8E93',
    tabIconDefault: '#8E8E93',
    tabIconSelected: primary,
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
  },
  dark: {
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    background: '#000000',
    backgroundSecondary: '#1C1C1E',
    tint: primaryDark,
    border: '#38383A',
    icon: '#8E8E93',
    tabIconDefault: '#8E8E93',
    tabIconSelected: primaryDark,
    success: '#32D74B',
    warning: '#FF9F0A',
    error: '#FF453A',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
