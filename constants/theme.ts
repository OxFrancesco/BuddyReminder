/**
 * BuddyReminder color palette
 * Stone/Indigo Theme
 */

import { Platform } from "react-native";

export const Colors = {
  light: {
    // Core colors
    text: "#1e293b",
    textSecondary: "#4b5563",
    background: "#e7e5e4",
    backgroundSecondary: "#f5f5f4",

    // Primary - Indigo
    primary: "#6366f1",
    primaryForeground: "#ffffff",

    // Secondary - Stone
    secondary: "#d6d3d1",
    secondaryForeground: "#4b5563",

    // Muted
    muted: "#e7e5e4",
    mutedForeground: "#6b7280",

    // Accent - Pink tint
    accent: "#f3e5f5",
    accentForeground: "#374151",

    // Destructive - Red
    destructive: "#ef4444",
    destructiveForeground: "#ffffff",

    // UI Elements
    border: "#d6d3d1",
    input: "#d6d3d1",
    ring: "#6366f1",

    // Card
    card: "#f5f5f4",
    cardForeground: "#1e293b",

    // Popover
    popover: "#f5f5f4",
    popoverForeground: "#1e293b",

    // Legacy aliases
    tint: "#6366f1",
    icon: "#1e293b",
    tabIconDefault: "#6b7280",
    tabIconSelected: "#6366f1",
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#ef4444",

    // Semantic colors
    highlight: "#f59e0b",
    highlightForeground: "#ffffff",

    // Type colors
    typeNote: "#d6d3d1",
    typeReminder: "#f59e0b",
    typeTask: "#6366f1",

    // Chart colors
    chart1: "#6366f1",
    chart2: "#4f46e5",
    chart3: "#4338ca",
    chart4: "#3730a3",
    chart5: "#312e81",

    // Sidebar
    sidebar: "#d6d3d1",
    sidebarForeground: "#1e293b",
    sidebarPrimary: "#6366f1",
    sidebarPrimaryForeground: "#ffffff",
    sidebarAccent: "#f3e5f5",
    sidebarAccentForeground: "#374151",
    sidebarBorder: "#d6d3d1",
    sidebarRing: "#6366f1",

    // Common
    white: "#ffffff",
    black: "#000000",
    shadow: "rgba(156, 163, 175, 0.18)",
    switchThumbActive: "#ffffff",
    switchThumbInactive: "#ffffff",
    switchTrackInactive: "#d6d3d1",

    // Overlay colors
    overlay: "rgba(0, 0, 0, 0.5)",
    overlayLight: "rgba(0, 0, 0, 0.1)",
  },
  dark: {
    // Core colors
    text: "#e2e8f0",
    textSecondary: "#d1d5db",
    background: "#1e1b18",
    backgroundSecondary: "#2c2825",

    // Primary - Indigo (lighter for dark mode)
    primary: "#818cf8",
    primaryForeground: "#1e1b18",

    // Secondary - Dark stone
    secondary: "#3a3633",
    secondaryForeground: "#d1d5db",

    // Muted
    muted: "#1f1c19",
    mutedForeground: "#9ca3af",

    // Accent - Dark brown
    accent: "#484441",
    accentForeground: "#d1d5db",

    // Destructive - Red
    destructive: "#ef4444",
    destructiveForeground: "#1e1b18",

    // UI Elements
    border: "#3a3633",
    input: "#3a3633",
    ring: "#818cf8",

    // Card
    card: "#2c2825",
    cardForeground: "#e2e8f0",

    // Popover
    popover: "#2c2825",
    popoverForeground: "#e2e8f0",

    // Legacy aliases
    tint: "#818cf8",
    icon: "#e2e8f0",
    tabIconDefault: "#9ca3af",
    tabIconSelected: "#818cf8",
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#ef4444",

    // Semantic colors
    highlight: "#f59e0b",
    highlightForeground: "#1e1b18",

    // Type colors
    typeNote: "#3a3633",
    typeReminder: "#f59e0b",
    typeTask: "#818cf8",

    // Chart colors
    chart1: "#818cf8",
    chart2: "#6366f1",
    chart3: "#4f46e5",
    chart4: "#4338ca",
    chart5: "#3730a3",

    // Sidebar
    sidebar: "#3a3633",
    sidebarForeground: "#e2e8f0",
    sidebarPrimary: "#818cf8",
    sidebarPrimaryForeground: "#1e1b18",
    sidebarAccent: "#484441",
    sidebarAccentForeground: "#d1d5db",
    sidebarBorder: "#3a3633",
    sidebarRing: "#818cf8",

    // Common
    white: "#ffffff",
    black: "#000000",
    shadow: "rgba(0, 0, 0, 0.18)",
    switchThumbActive: "#ffffff",
    switchThumbInactive: "#a8a29e",
    switchTrackInactive: "#57534e",

    // Overlay colors
    overlay: "rgba(0, 0, 0, 0.5)",
    overlayLight: "rgba(0, 0, 0, 0.1)",
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
