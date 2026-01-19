/**
 * BuddyReminder color palette
 * Neobrutalist Style
 */

import { Platform } from "react-native";

export const Colors = {
  light: {
    // Core colors
    text: "#000000",
    textSecondary: "#000000",
    background: "#FFFFFF",
    backgroundSecondary: "#F3F4F6",

    // Primary - Purple/Violet
    primary: "#a388ee",
    primaryForeground: "#000000",

    // Secondary - Cyan
    secondary: "#67e8f9",
    secondaryForeground: "#000000",

    // Muted
    muted: "#e5e7eb",
    mutedForeground: "#000000",

    // Accent - Lime
    accent: "#bef264",
    accentForeground: "#000000",

    // Destructive - Red
    destructive: "#f87171",
    destructiveForeground: "#000000",

    // UI Elements
    border: "#000000",
    input: "#FFFFFF",
    ring: "#000000",

    // Card
    card: "#FFFFFF",
    cardForeground: "#000000",

    // Popover
    popover: "#FFFFFF",
    popoverForeground: "#000000",

    // Legacy aliases
    tint: "#a388ee",
    icon: "#000000",
    tabIconDefault: "#6b7280",
    tabIconSelected: "#000000",
    success: "#bef264",
    warning: "#fcd34d",
    error: "#f87171",

    // Semantic colors
    highlight: "#fcd34d",
    highlightForeground: "#000000",

    // Type colors
    typeNote: "#e5e7eb",
    typeReminder: "#fcd34d",
    typeTask: "#a388ee",

    // Chart colors
    chart1: "#a388ee",
    chart2: "#67e8f9",
    chart3: "#bef264",
    chart4: "#fcd34d",
    chart5: "#f87171",

    // Sidebar
    sidebar: "#FFFFFF",
    sidebarForeground: "#000000",
    sidebarPrimary: "#a388ee",
    sidebarPrimaryForeground: "#000000",
    sidebarAccent: "#bef264",
    sidebarAccentForeground: "#000000",
    sidebarBorder: "#000000",
    sidebarRing: "#000000",

    // Common
    white: "#FFFFFF",
    black: "#000000",
    shadow: "#000000",
    switchThumbActive: "#000000",
    switchThumbInactive: "#000000",
  },
  dark: {
    // Core colors
    text: "#FFFFFF",
    textSecondary: "#FFFFFF",
    background: "#0f172a",
    backgroundSecondary: "#1e293b",

    // Primary - Purple/Violet
    primary: "#a388ee",
    primaryForeground: "#000000",

    // Secondary - Cyan
    secondary: "#67e8f9",
    secondaryForeground: "#000000",

    // Muted
    muted: "#374151",
    mutedForeground: "#FFFFFF",

    // Accent - Lime
    accent: "#bef264",
    accentForeground: "#000000",

    // Destructive - Red
    destructive: "#f87171",
    destructiveForeground: "#000000",

    // UI Elements
    border: "#FFFFFF",
    input: "#1e293b",
    ring: "#FFFFFF",

    // Card
    card: "#1e293b",
    cardForeground: "#FFFFFF",

    // Popover
    popover: "#1e293b",
    popoverForeground: "#FFFFFF",

    // Legacy aliases
    tint: "#a388ee",
    icon: "#FFFFFF",
    tabIconDefault: "#9ca3af",
    tabIconSelected: "#FFFFFF",
    success: "#bef264",
    warning: "#fcd34d",
    error: "#f87171",

    // Semantic colors
    highlight: "#fcd34d",
    highlightForeground: "#000000",

    // Type colors
    typeNote: "#374151",
    typeReminder: "#fcd34d",
    typeTask: "#a388ee",

    // Chart colors
    chart1: "#a388ee",
    chart2: "#67e8f9",
    chart3: "#bef264",
    chart4: "#fcd34d",
    chart5: "#f87171",

    // Sidebar
    sidebar: "#0f172a",
    sidebarForeground: "#FFFFFF",
    sidebarPrimary: "#a388ee",
    sidebarPrimaryForeground: "#000000",
    sidebarAccent: "#bef264",
    sidebarAccentForeground: "#000000",
    sidebarBorder: "#FFFFFF",
    sidebarRing: "#FFFFFF",

    // Common
    white: "#FFFFFF",
    black: "#000000",
    shadow: "#000000",
    switchThumbActive: "#FFFFFF",
    switchThumbInactive: "#9ca3af",
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "Courier New",
    serif: "ui-serif",
    rounded: "Courier New",
    mono: "Courier New",
  },
  default: {
    sans: "monospace",
    serif: "serif",
    rounded: "monospace",
    mono: "monospace",
  },
  web: {
    sans: "Courier New, monospace",
    serif: "Courier New, monospace",
    rounded: "Courier New, monospace",
    mono: "Courier New, monospace",
  },
});

// Design system spacing (8pt grid)
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 40,
  "3xl": 48,
} as const;

// Border radius - Sharp for Neobrutalism
export const Radius = {
  sm: 0,
  md: 4,
  lg: 8,
  xl: 12,
} as const;
