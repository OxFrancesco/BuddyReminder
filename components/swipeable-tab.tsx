import { useRef } from "react";
import { useRouter, usePathname } from "expo-router";
import { StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { logger } from "@/lib/logger";

const TAB_ROUTES = ["/", "/profile"];

// Normalize pathname to match our route definitions
function normalizePathname(pathname: string): string {
  // Remove any (tabs) prefix or similar group notation
  const normalized = pathname.replace(/^\/?(\([^)]+\))?/, "/");
  // Handle /index as /
  if (normalized === "/index") return "/";
  return normalized || "/";
}

interface SwipeableTabProps {
  children: React.ReactNode;
  onPinch?: () => void;
}

export function SwipeableTab({ children, onPinch }: SwipeableTabProps) {
  const router = useRouter();
  const pathname = usePathname();
  const pinchTriggered = useRef(false);

  // Handle swipe navigation - runs on JS thread
  const handleSwipe = (translationX: number) => {
    const normalizedPath = normalizePathname(pathname);
    const currentIndex = TAB_ROUTES.findIndex((route) => normalizedPath === route);
    if (currentIndex === -1) return;

    if (translationX > 80 && currentIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(TAB_ROUTES[currentIndex - 1] as any);
    } else if (translationX < -80 && currentIndex < TAB_ROUTES.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(TAB_ROUTES[currentIndex + 1] as any);
    }
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-30, 30])
    .failOffsetY([-15, 15])
    .onEnd((event) => {
      handleSwipe(event.translationX);
    })
    .runOnJS(true);

  // Pinch gesture for quick capture
  const pinch = Gesture.Pinch()
    .onBegin(() => {
      pinchTriggered.current = false;
      logger.debug("[GESTURE] Pinch began");
    })
    .onUpdate((event) => {
      // Trigger on pinch-in (scale < 0.85) or pinch-out (scale > 1.15)
      if (!pinchTriggered.current && (event.scale < 0.85 || event.scale > 1.15)) {
        pinchTriggered.current = true;
        logger.debug("[GESTURE] Pinch triggered", { scale: event.scale });
        if (onPinch) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPinch();
        }
      }
    })
    .runOnJS(true);

  // Compose gestures - both can work simultaneously
  const composedGesture = Gesture.Simultaneous(pan, pinch);

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={styles.container}>{children}</Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
