import { useState, useEffect, useCallback } from "react";

export type UrgencyLevel = "none" | "low" | "medium" | "high" | "critical";

export interface UrgencyInfo {
  level: UrgencyLevel;
  percentage: number; // 0-100, how much of the bar is "remaining"
  minutesRemaining: number | null;
}

// Time thresholds in milliseconds
const THRESHOLDS = {
  critical: 60 * 60 * 1000,      // < 1 hour
  high: 6 * 60 * 60 * 1000,      // 1-6 hours
  medium: 12 * 60 * 60 * 1000,   // 6-12 hours
  low: 24 * 60 * 60 * 1000,      // 12-24 hours
};

export function calculateUrgency(triggerAt: number | undefined | null): UrgencyInfo {
  if (!triggerAt) {
    return { level: "none", percentage: 100, minutesRemaining: null };
  }

  const now = Date.now();
  const timeRemaining = triggerAt - now;

  // Already passed
  if (timeRemaining <= 0) {
    return { level: "critical", percentage: 0, minutesRemaining: 0 };
  }

  const minutesRemaining = Math.floor(timeRemaining / (60 * 1000));

  // Calculate percentage based on 24-hour window
  // 100% = 24+ hours remaining, 0% = time's up
  const maxWindow = THRESHOLDS.low; // 24 hours
  const percentage = Math.min(100, Math.max(0, (timeRemaining / maxWindow) * 100));

  let level: UrgencyLevel;
  if (timeRemaining <= THRESHOLDS.critical) {
    level = "critical";
  } else if (timeRemaining <= THRESHOLDS.high) {
    level = "high";
  } else if (timeRemaining <= THRESHOLDS.medium) {
    level = "medium";
  } else if (timeRemaining <= THRESHOLDS.low) {
    level = "low";
  } else {
    level = "none";
  }

  return { level, percentage, minutesRemaining };
}

export function getUrgencyColor(level: UrgencyLevel, colors: {
  success: string;
  warning: string;
  error: string;
  primary: string;
  text: string;
}): string {
  switch (level) {
    case "critical":
      return colors.error;
    case "high":
      return "#F97316"; // orange
    case "medium":
      return colors.warning;
    case "low":
      return colors.primary;
    case "none":
    default:
      return colors.success;
  }
}

// Hook that triggers re-renders periodically to update urgency
export function useUrgencyRefresh(intervalMs: number = 60000): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);

  return tick;
}

// Sort items by urgency: daily highlights first, then by soonest triggerAt
export function sortByUrgency<T extends { isDailyHighlight?: boolean; triggerAt?: number | null }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => {
    // Daily highlights first
    if (a.isDailyHighlight && !b.isDailyHighlight) return -1;
    if (!a.isDailyHighlight && b.isDailyHighlight) return 1;

    // Then by triggerAt (soonest first)
    const aTime = a.triggerAt ?? Infinity;
    const bTime = b.triggerAt ?? Infinity;

    // Items with triggerAt come before those without
    if (aTime !== Infinity && bTime === Infinity) return -1;
    if (aTime === Infinity && bTime !== Infinity) return 1;

    return aTime - bTime;
  });
}
