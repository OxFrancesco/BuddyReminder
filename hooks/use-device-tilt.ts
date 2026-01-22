import { useEffect } from "react";
import {
  useSharedValue,
  useAnimatedReaction,
  runOnJS,
  SensorType,
  useAnimatedSensor,
  SharedValue,
} from "react-native-reanimated";

export interface TiltData {
  x: SharedValue<number>; // Roll: -1 (left) to 1 (right)
  y: SharedValue<number>; // Pitch: -1 (forward) to 1 (backward)
  z: SharedValue<number>; // Yaw (usually not needed for fluid)
}

/**
 * Hook that provides device tilt data from the gravity sensor.
 * Uses Reanimated's useAnimatedSensor for 60fps UI thread updates.
 *
 * Returns normalized values:
 * - x: Roll (-1 = tilted left, 1 = tilted right)
 * - y: Pitch (-1 = tilted forward/down, 1 = tilted backward/up)
 * - z: Gravity Z component (mostly for vertical orientation detection)
 *
 * When phone is flat on table face-up:
 * - x ≈ 0, y ≈ 0, z ≈ -1
 *
 * When phone is tilted right:
 * - x > 0 (positive)
 *
 * When phone is tilted toward user (top of phone down):
 * - y < 0 (negative)
 */
export function useDeviceTilt(enabled: boolean = true): TiltData {
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const tiltZ = useSharedValue(-1);

  const animatedSensor = useAnimatedSensor(SensorType.GRAVITY, {
    interval: 16, // ~60fps
  });

  // Smooth the sensor data to avoid jittery fluid
  const smoothingFactor = 0.15; // Lower = smoother but slower response

  useAnimatedReaction(
    () => animatedSensor.sensor.value,
    (currentValue, previousValue) => {
      if (!enabled) return;

      // Gravity sensor returns values in m/s² (typically ~9.8 when still)
      // Normalize to -1 to 1 range by dividing by ~10
      const normalizedX = currentValue.x / 10;
      const normalizedY = currentValue.y / 10;
      const normalizedZ = currentValue.z / 10;

      // Apply smoothing (exponential moving average)
      tiltX.value = tiltX.value + (normalizedX - tiltX.value) * smoothingFactor;
      tiltY.value = tiltY.value + (normalizedY - tiltY.value) * smoothingFactor;
      tiltZ.value = tiltZ.value + (normalizedZ - tiltZ.value) * smoothingFactor;
    },
    [enabled]
  );

  return {
    x: tiltX,
    y: tiltY,
    z: tiltZ,
  };
}

/**
 * Hook that provides a simple fallback when device sensors aren't available.
 * Returns static values that represent a phone held vertically.
 */
export function useStaticTilt(): TiltData {
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const tiltZ = useSharedValue(-1);

  return {
    x: tiltX,
    y: tiltY,
    z: tiltZ,
  };
}
