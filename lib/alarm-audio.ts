import { Audio, AVPlaybackStatus } from 'expo-av';
import { Platform } from 'react-native';

// Keep track of the current alarm sound
let alarmSound: Audio.Sound | null = null;
let isPlaying = false;

// Available alarm sounds (can be expanded)
export const ALARM_SOUNDS = {
  default: 'Default',
  gentle: 'Gentle',
  urgent: 'Urgent',
} as const;

export type AlarmSoundId = keyof typeof ALARM_SOUNDS;

/**
 * Configure audio session for alarm playback
 * This sets up the audio to play even in silent mode (iOS)
 */
export async function configureAudioSession(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
      // Allow audio to mix with other apps
      interruptionModeIOS: 1, // INTERRUPTION_MODE_IOS_DO_NOT_MIX
      interruptionModeAndroid: 1, // INTERRUPTION_MODE_ANDROID_DO_NOT_MIX
    });
    console.log('[AlarmAudio] Audio session configured');
  } catch (error) {
    console.error('[AlarmAudio] Failed to configure audio session:', error);
  }
}

/**
 * Start playing the alarm sound in a loop
 */
export async function startAlarmSound(soundId?: string): Promise<void> {
  if (isPlaying) {
    console.log('[AlarmAudio] Alarm is already playing');
    return;
  }

  try {
    // Configure audio session first
    await configureAudioSession();

    // Load the appropriate sound
    // For now, we use a simple approach - in production, you'd bundle actual sound files
    const soundSource = getSoundSource(soundId);

    const { sound } = await Audio.Sound.createAsync(
      soundSource,
      {
        isLooping: true,
        volume: 1.0,
        shouldPlay: true,
      },
      onPlaybackStatusUpdate
    );

    alarmSound = sound;
    isPlaying = true;

    console.log('[AlarmAudio] Alarm sound started');
  } catch (error) {
    console.error('[AlarmAudio] Failed to start alarm sound:', error);
    // Try playing system sound as fallback
    await playSystemAlarmFallback();
  }
}

/**
 * Stop the alarm sound
 */
export async function stopAlarmSound(): Promise<void> {
  if (!alarmSound) {
    console.log('[AlarmAudio] No alarm sound to stop');
    return;
  }

  try {
    await alarmSound.stopAsync();
    await alarmSound.unloadAsync();
    alarmSound = null;
    isPlaying = false;
    console.log('[AlarmAudio] Alarm sound stopped');
  } catch (error) {
    console.error('[AlarmAudio] Failed to stop alarm sound:', error);
    alarmSound = null;
    isPlaying = false;
  }
}

/**
 * Check if alarm sound is currently playing
 */
export function isAlarmPlaying(): boolean {
  return isPlaying;
}

/**
 * Callback for playback status updates
 */
function onPlaybackStatusUpdate(status: AVPlaybackStatus): void {
  if (!status.isLoaded) {
    // Sound was unloaded or failed to load
    if ('error' in status) {
      console.error('[AlarmAudio] Playback error:', status.error);
    }
    isPlaying = false;
  } else if (status.didJustFinish && !status.isLooping) {
    // Sound finished playing (shouldn't happen with looping)
    isPlaying = false;
  }
}

/**
 * Get the sound source for a given sound ID
 * In a real app, you'd have actual bundled audio files
 */
function getSoundSource(soundId?: string): { uri: string } | number {
  // For now, we'll use a placeholder
  // In production, you would:
  // 1. Bundle actual .mp3/.wav files in assets
  // 2. Return require() statements for bundled sounds
  // 3. Or use remote URLs for downloadable sounds

  // Example with bundled sounds (uncomment when you have actual files):
  // switch (soundId) {
  //   case 'gentle':
  //     return require('@/assets/sounds/alarm-gentle.mp3');
  //   case 'urgent':
  //     return require('@/assets/sounds/alarm-urgent.mp3');
  //   default:
  //     return require('@/assets/sounds/alarm-default.mp3');
  // }

  // For now, use a system sound URI or a default beep
  // This is a placeholder - you should add actual sound files
  if (Platform.OS === 'ios') {
    // iOS system sound for alarm (will need actual file in production)
    return { uri: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg' };
  }

  // Android
  return { uri: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg' };
}

/**
 * Fallback to play a simple beep if sound loading fails
 */
async function playSystemAlarmFallback(): Promise<void> {
  try {
    // Try to play a simple beep sound
    const { sound } = await Audio.Sound.createAsync(
      { uri: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg' },
      {
        isLooping: true,
        volume: 1.0,
        shouldPlay: true,
      }
    );

    alarmSound = sound;
    isPlaying = true;
    console.log('[AlarmAudio] Fallback alarm sound started');
  } catch (error) {
    console.error('[AlarmAudio] Fallback alarm sound also failed:', error);
  }
}

/**
 * Pause the alarm temporarily (e.g., during code entry)
 */
export async function pauseAlarmSound(): Promise<void> {
  if (!alarmSound || !isPlaying) {
    return;
  }

  try {
    await alarmSound.pauseAsync();
    console.log('[AlarmAudio] Alarm sound paused');
  } catch (error) {
    console.error('[AlarmAudio] Failed to pause alarm sound:', error);
  }
}

/**
 * Resume the alarm after pause
 */
export async function resumeAlarmSound(): Promise<void> {
  if (!alarmSound || !isPlaying) {
    return;
  }

  try {
    await alarmSound.playAsync();
    console.log('[AlarmAudio] Alarm sound resumed');
  } catch (error) {
    console.error('[AlarmAudio] Failed to resume alarm sound:', error);
  }
}

/**
 * Set the alarm volume (0.0 to 1.0)
 */
export async function setAlarmVolume(volume: number): Promise<void> {
  if (!alarmSound) {
    return;
  }

  try {
    await alarmSound.setVolumeAsync(Math.max(0, Math.min(1, volume)));
    console.log('[AlarmAudio] Volume set to:', volume);
  } catch (error) {
    console.error('[AlarmAudio] Failed to set volume:', error);
  }
}
