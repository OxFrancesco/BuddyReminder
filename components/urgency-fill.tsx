import { useEffect, useState, useCallback, useMemo } from "react";
import { StyleSheet, View, LayoutChangeEvent, Platform } from "react-native";
import {
  Canvas,
  Skia,
  Shader,
  Fill,
  useClock,
} from "@shopify/react-native-skia";
import {
  useSharedValue,
  useDerivedValue,
  withSpring,
} from "react-native-reanimated";
import { UrgencyLevel } from "@/hooks/use-urgency";
import { useDeviceTilt, useStaticTilt } from "@/hooks/use-device-tilt";
import { fluidShaderSource, fluidShaderSimpleSource, hexToRgb } from "./fluid-shader";
import { logger } from "@/lib/logger";

interface UrgencyFillProps {
  percentage: number; // 0-100, inverted (0 = full, 100 = empty)
  level: UrgencyLevel;
  color: string;
}

// Try to compile shaders at module load
let fluidShader: ReturnType<typeof Skia.RuntimeEffect.Make> | null = null;
let simpleShader: ReturnType<typeof Skia.RuntimeEffect.Make> | null = null;

try {
  fluidShader = Skia.RuntimeEffect.Make(fluidShaderSource);
  if (!fluidShader) {
    logger.warn("Failed to compile fluid shader");
  }
} catch (e) {
  logger.warn("Error compiling fluid shader:", e);
}

try {
  simpleShader = Skia.RuntimeEffect.Make(fluidShaderSimpleSource);
  if (!simpleShader) {
    logger.warn("Failed to compile simple shader");
  }
} catch (e) {
  logger.warn("Error compiling simple shader:", e);
}

export function UrgencyFill({ percentage, level, color }: UrgencyFillProps) {
  // Convert percentage to fill height (100% time remaining = 0% fill, 0% time = 100% fill)
  const fillPercentage = 100 - percentage;

  // Don't show if no urgency
  if (level === "none" || fillPercentage <= 0) {
    return null;
  }

  // Use fallback if no shader is available
  if (!fluidShader && !simpleShader) {
    return (
      <FallbackFill fillPercentage={fillPercentage} color={color} level={level} />
    );
  }

  return (
    <UrgencyFillInner
      fillPercentage={fillPercentage}
      color={color}
      level={level}
    />
  );
}

function UrgencyFillInner({
  fillPercentage,
  color,
  level,
}: {
  fillPercentage: number;
  color: string;
  level: UrgencyLevel;
}) {
  // Dimensions of the container
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Animated fill level (0-1)
  const fillLevel = useSharedValue(fillPercentage / 100);

  // Device tilt data
  const deviceTilt = useDeviceTilt(Platform.OS !== "web");
  const staticTilt = useStaticTilt();
  const tilt = Platform.OS === "web" ? staticTilt : deviceTilt;

  // Time for animation (Skia clock returns shared value)
  const clock = useClock();

  // Animate fill level when it changes
  useEffect(() => {
    fillLevel.value = withSpring(fillPercentage / 100, {
      damping: 15,
      stiffness: 100,
      mass: 1,
    });
  }, [fillPercentage, fillLevel]);

  // Handle layout
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setDimensions({ width, height });
    }
  }, []);

  // Calculate opacity based on urgency level
  const opacity = level === "critical" ? 0.4
    : level === "high" ? 0.35
    : level === "medium" ? 0.3
    : 0.25;

  // Convert color to RGB - memoize to avoid recalculation
  const rgb = useMemo(() => hexToRgb(color), [color]);

  // Choose shader
  const shader = fluidShader || simpleShader;

  // Create uniforms as a derived value
  const uniforms = useDerivedValue(() => {
    return {
      resolution: [dimensions.width, dimensions.height],
      time: clock.value / 1000,
      fillLevel: fillLevel.value,
      gravity: [tilt.x.value, tilt.y.value],
      color: rgb,
      opacity: opacity,
    };
  });

  // Don't render canvas until we have dimensions and shader
  if (dimensions.width === 0 || dimensions.height === 0) {
    return (
      <View style={styles.container} pointerEvents="none" onLayout={onLayout} />
    );
  }

  if (!shader) {
    return (
      <View style={styles.container} pointerEvents="none" onLayout={onLayout}>
        <FallbackFill fillPercentage={fillPercentage} color={color} level={level} />
      </View>
    );
  }

  return (
    <View style={styles.container} pointerEvents="none" onLayout={onLayout}>
      <Canvas style={styles.canvas}>
        <Fill>
          <Shader source={shader} uniforms={uniforms} />
        </Fill>
      </Canvas>
    </View>
  );
}

/**
 * Fallback fill using basic React Native Views (no shader).
 */
function FallbackFill({
  fillPercentage,
  color,
  level,
}: {
  fillPercentage: number;
  color: string;
  level: UrgencyLevel;
}) {
  const opacity = level === "critical" ? 0.4 : level === "high" ? 0.35 : 0.3;
  const bgColor = `${color}${Math.round(opacity * 255).toString(16).padStart(2, "0")}`;

  return (
    <View style={styles.fallbackContainer}>
      <View
        style={[
          styles.fallbackFill,
          {
            height: `${fillPercentage}%`,
            backgroundColor: bgColor,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    borderRadius: 4,
  },
  canvas: {
    flex: 1,
  },
  fallbackContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  fallbackFill: {
    width: "100%",
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
  },
});
