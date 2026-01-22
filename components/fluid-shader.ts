/**
 * SKSL Shader for realistic fluid effect with linear gradient.
 *
 * Creates a liquid-like fill with:
 * - Smooth wavy surface that responds to device tilt
 * - Linear gradient from bottom to top
 * - Subtle highlights and depth
 */
export const fluidShaderSource = `
uniform float2 resolution;
uniform float time;
uniform float fillLevel;
uniform float2 gravity;
uniform float3 color;
uniform float opacity;

// Simplex-like noise for organic wave movement
float noise(float x) {
    float i = floor(x);
    float f = fract(x);
    float u = f * f * (3.0 - 2.0 * f);
    return mix(fract(sin(i) * 43758.5453), fract(sin(i + 1.0) * 43758.5453), u);
}

half4 main(float2 fragCoord) {
    float2 uv = fragCoord / resolution;

    // Flip Y so 0 is bottom, 1 is top
    uv.y = 1.0 - uv.y;

    // Base surface level affected by tilt
    float tiltAmount = gravity.x * 0.18;
    float baseSurface = fillLevel + tiltAmount * (uv.x - 0.5) * 2.0;

    // Add organic wave motion at the surface
    float waveSpeed = time * 1.2;
    float wave1 = sin(uv.x * 6.0 + waveSpeed) * 0.012;
    float wave2 = sin(uv.x * 10.0 - waveSpeed * 0.7) * 0.008;
    float wave3 = noise(uv.x * 15.0 + time * 0.5) * 0.006;

    // Waves are stronger when tilted (sloshing effect)
    float tiltMagnitude = abs(gravity.x) + abs(gravity.y) * 0.5;
    float waveIntensity = 1.0 + tiltMagnitude * 2.0;

    float surfaceY = baseSurface + (wave1 + wave2 + wave3) * waveIntensity;

    // Distance from surface (positive = inside fluid)
    float dist = surfaceY - uv.y;

    // Early exit if clearly above surface
    if (dist < -0.05) {
        return half4(0.0);
    }

    // Smooth edge at surface
    float edge = smoothstep(-0.02, 0.015, dist);

    // Linear gradient: darker at bottom, lighter at top
    float gradientPos = uv.y / max(surfaceY, 0.01);
    gradientPos = clamp(gradientPos, 0.0, 1.0);

    // Color gradient: base color at bottom, lighter at top
    float brightness = 0.25 + gradientPos * 0.25;
    float3 gradientColor = color * brightness;

    // Add subtle highlight at the surface (meniscus effect)
    float surfaceHighlight = smoothstep(0.025, 0.0, abs(dist)) * 0.35;
    gradientColor += float3(surfaceHighlight);

    // Add very subtle caustic-like pattern inside
    float caustic = sin(uv.x * 20.0 + uv.y * 15.0 + time) * 0.02;
    caustic += sin(uv.x * 12.0 - uv.y * 18.0 - time * 0.8) * 0.015;
    gradientColor += float3(caustic * gradientPos);

    // Depth shadow at bottom
    float bottomShadow = smoothstep(0.0, 0.15, uv.y) * 0.15;
    gradientColor *= (0.3 + bottomShadow);

    // Final alpha - quarter opacity
    float alpha = edge * opacity * 0.25;

    return half4(gradientColor, alpha);
}
`;

/**
 * Simplified fluid shader - same linear gradient style but less computation.
 */
export const fluidShaderSimpleSource = `
uniform float2 resolution;
uniform float time;
uniform float fillLevel;
uniform float2 gravity;
uniform float3 color;
uniform float opacity;

half4 main(float2 fragCoord) {
    float2 uv = fragCoord / resolution;

    // Flip Y so 0 is bottom, 1 is top
    uv.y = 1.0 - uv.y;

    // Tilted surface
    float tiltX = gravity.x * 0.15;
    float surfaceY = fillLevel + tiltX * (uv.x - 0.5) * 2.0;

    // Simple wave
    float wave = sin(uv.x * 8.0 + time * 1.5) * 0.01;
    wave += sin(uv.x * 12.0 - time) * 0.006;
    surfaceY += wave * (1.0 + abs(gravity.x) * 2.0);

    float dist = surfaceY - uv.y;

    if (dist < -0.03) {
        return half4(0.0);
    }

    float edge = smoothstep(-0.015, 0.01, dist);

    // Linear gradient
    float gradientPos = clamp(uv.y / max(surfaceY, 0.01), 0.0, 1.0);
    float brightness = 0.9 + gradientPos * 0.2;
    float3 gradientColor = color * brightness;

    // Surface highlight
    float highlight = smoothstep(0.02, 0.0, abs(dist)) * 0.3;
    gradientColor += float3(highlight);

    // Quarter opacity
    float alpha = edge * opacity * 0.25;

    return half4(gradientColor, alpha);
}
`;

/**
 * Parse hex color to RGB values (0-1 range)
 */
export function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return [r, g, b];
}
