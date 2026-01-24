import { Platform } from 'react-native';

// NFC Manager types (when package is installed)
interface NfcTag {
  id: string;
  techTypes?: string[];
  ndefMessage?: Array<{
    tnf: number;
    type: string;
    id: string;
    payload: string;
  }>;
}

// Lazy load NFC manager to avoid crashes on devices without NFC or in Expo Go
let NfcManager: typeof import('react-native-nfc-manager').default | null = null;
let NfcTech: typeof import('react-native-nfc-manager').NfcTech | null = null;
let nfcLoadAttempted = false;
let nfcAvailable = false;

async function loadNfcManager(): Promise<boolean> {
  // Only attempt to load once
  if (nfcLoadAttempted) {
    return nfcAvailable;
  }
  nfcLoadAttempted = true;

  // Web doesn't support NFC
  if (Platform.OS === 'web') {
    console.log('[NFC] NFC not supported on web');
    return false;
  }

  try {
    // Dynamic import to avoid crashes in Expo Go
    const nfcModule = await import('react-native-nfc-manager');
    NfcManager = nfcModule.default;
    NfcTech = nfcModule.NfcTech;

    // Try to start to verify it's actually available
    await NfcManager.start();
    nfcAvailable = true;
    console.log('[NFC] NFC manager loaded successfully');
    return true;
  } catch (error) {
    console.log('[NFC] NFC manager not available (likely Expo Go or missing native module):', error);
    NfcManager = null;
    NfcTech = null;
    nfcAvailable = false;
    return false;
  }
}

/**
 * Check if NFC is supported on the device
 */
export async function isNfcSupported(): Promise<boolean> {
  const loaded = await loadNfcManager();
  if (!loaded || !NfcManager) {
    return false;
  }

  try {
    return await NfcManager.isSupported();
  } catch {
    return false;
  }
}

/**
 * Check if NFC is enabled on the device
 */
export async function isNfcEnabled(): Promise<boolean> {
  const loaded = await loadNfcManager();
  if (!loaded || !NfcManager) {
    return false;
  }

  try {
    return await NfcManager.isEnabled();
  } catch {
    return false;
  }
}

/**
 * Initialize NFC manager - call this on app startup
 * Safe to call in Expo Go - will gracefully fail
 */
export async function initializeNfc(): Promise<boolean> {
  return await loadNfcManager();
}

/**
 * Scan for an NFC tag and return its ID
 * This is used for both registration and verification
 */
export async function scanTag(): Promise<{ tagId: string } | null> {
  const loaded = await loadNfcManager();
  if (!loaded || !NfcManager || !NfcTech) {
    console.log('[NFC] Cannot scan - NFC not available');
    return null;
  }

  try {
    // Request NFC technology
    await NfcManager.requestTechnology(NfcTech.Ndef);

    // Get the tag
    const tag = await NfcManager.getTag();

    if (tag && tag.id) {
      // Convert tag ID to a consistent string format
      const tagId = normalizeTagId(tag.id);
      return { tagId };
    }

    return null;
  } catch (error) {
    console.error('[NFC] Scan failed:', error);
    return null;
  } finally {
    // Always clean up
    try {
      if (NfcManager) {
        await NfcManager.cancelTechnologyRequest();
      }
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Register a new NFC tag - scans and returns the tag ID
 * The caller is responsible for saving the tag to the database
 */
export async function registerTag(): Promise<{ tagId: string } | null> {
  console.log('[NFC] Starting tag registration scan...');
  const result = await scanTag();

  if (result) {
    console.log('[NFC] Tag registered with ID:', result.tagId);
  }

  return result;
}

/**
 * Verify that a scanned tag matches the expected tag ID
 */
export async function verifyTag(expectedTagId: string): Promise<boolean> {
  console.log('[NFC] Starting tag verification scan...');
  const result = await scanTag();

  if (!result) {
    console.log('[NFC] No tag scanned');
    return false;
  }

  const matches = result.tagId === expectedTagId;
  console.log('[NFC] Tag verification:', matches ? 'SUCCESS' : 'FAILED', {
    expected: expectedTagId,
    scanned: result.tagId,
  });

  return matches;
}

/**
 * Cancel any ongoing NFC scan
 */
export async function cancelScan(): Promise<void> {
  if (!nfcAvailable || !NfcManager) {
    return;
  }

  try {
    await NfcManager.cancelTechnologyRequest();
  } catch {
    // Ignore errors during cancellation
  }
}

/**
 * Open device NFC settings (for enabling NFC)
 */
export async function openNfcSettings(): Promise<void> {
  if (!nfcAvailable || !NfcManager) {
    return;
  }

  try {
    await NfcManager.goToNfcSetting();
  } catch (error) {
    console.error('[NFC] Failed to open settings:', error);
  }
}

/**
 * Normalize tag ID to a consistent hex string format
 * Different platforms may return tag IDs in different formats
 */
function normalizeTagId(tagId: string | number[]): string {
  if (typeof tagId === 'string') {
    // Remove any non-hex characters and convert to uppercase
    return tagId.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
  }

  // If it's an array of bytes, convert to hex string
  if (Array.isArray(tagId)) {
    return tagId
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  }

  return String(tagId).toUpperCase();
}

/**
 * Get a friendly display name for the tag ID
 * Shows a shortened version for UI display
 */
export function formatTagIdForDisplay(tagId: string): string {
  if (tagId.length <= 8) {
    return tagId;
  }
  return `${tagId.slice(0, 4)}...${tagId.slice(-4)}`;
}
