import { Platform } from 'react-native';
import { logger } from '@/lib/logger';
import { ExpoNfcReader } from '@/modules/expo-nfc-reader';

// Debug: log module load state
console.log('[NFC-DEBUG] ExpoNfcReader module:', ExpoNfcReader);
console.log('[NFC-DEBUG] Platform.OS:', Platform.OS);

/**
 * Check if NFC is supported on the device.
 * iOS: uses CoreNFC NFCTagReaderSession.readingAvailable
 * Android/Web: always false (coming soon)
 */
export function isNfcSupported(): boolean {
  if (Platform.OS !== 'ios' || !ExpoNfcReader) {
    console.log('[NFC-DEBUG] isNfcSupported: false (platform or module null)', { platform: Platform.OS, module: ExpoNfcReader });
    return false;
  }
  try {
    const result = ExpoNfcReader.isAvailable();
    console.log('[NFC-DEBUG] isAvailable():', result);
    return result;
  } catch (e) {
    console.log('[NFC-DEBUG] isAvailable() threw:', e);
    return false;
  }
}

/**
 * Check if NFC is enabled on the device.
 * CoreNFC has no separate "enabled" check — availability implies enabled.
 */
export function isNfcEnabled(): boolean {
  return isNfcSupported();
}

/**
 * Initialize NFC — lightweight check, no heavy loading needed.
 */
export function initializeNfc(): boolean {
  const available = isNfcSupported();
  logger.debug('[NFC] Initialize:', available ? 'available' : 'not available');
  return available;
}

export interface NfcScanDiagnostics {
  tagId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  cancelled: boolean;
}

function extractErrorInfo(error: unknown): { code: string | null; message: string } {
  const anyError = error as { code?: string; message?: string } | null;
  const code = anyError?.code ?? null;
  const message = error instanceof Error ? error.message : String(error);
  return { code, message };
}

export async function scanTagWithDiagnostics(): Promise<NfcScanDiagnostics> {
  if (Platform.OS !== 'ios' || !ExpoNfcReader) {
    return {
      tagId: null,
      errorCode: 'NFC_UNAVAILABLE',
      errorMessage: 'NFC is not available on this platform or build.',
      cancelled: false,
    };
  }

  try {
    const uid = await ExpoNfcReader.scanTagUid('Hold your NFC tag near the back of your phone');
    logger.debug('[NFC] Scanned tag UID:', uid);
    return {
      tagId: uid,
      errorCode: null,
      errorMessage: null,
      cancelled: false,
    };
  } catch (error: unknown) {
    const { code, message } = extractErrorInfo(error);
    const cancelled = code === 'NFC_CANCELLED' || message.includes('NFC_CANCELLED');
    const errorCode = cancelled ? 'NFC_CANCELLED' : code;

    if (cancelled) {
      logger.debug('[NFC] Scan cancelled by user');
    } else {
      logger.error('[NFC] Scan failed:', { code, message, raw: error });
    }

    return {
      tagId: null,
      errorCode: errorCode ?? null,
      errorMessage: message,
      cancelled,
    };
  }
}

/**
 * Scan for an NFC tag and return its UID.
 * Returns null if cancelled or unavailable.
 */
export async function scanTag(): Promise<{ tagId: string } | null> {
  const diagnostics = await scanTagWithDiagnostics();
  if (diagnostics.tagId) {
    return { tagId: diagnostics.tagId };
  }
  return null;
}

/**
 * Register a new NFC tag — scans and returns the tag ID.
 * The caller is responsible for saving the tag to the database.
 */
export async function registerTag(): Promise<{ tagId: string } | null> {
  logger.debug('[NFC] Starting tag registration scan...');
  const result = await scanTag();

  if (result) {
    logger.debug('[NFC] Tag registered with ID:', result.tagId);
  }

  return result;
}

/**
 * Verify that a scanned tag matches the expected tag ID.
 */
export async function verifyTag(expectedTagId: string): Promise<boolean> {
  logger.debug('[NFC] Starting tag verification scan...');
  const result = await scanTag();

  if (!result) {
    logger.debug('[NFC] No tag scanned');
    return false;
  }

  const matches = result.tagId === expectedTagId;
  logger.debug('[NFC] Tag verification:', matches ? 'SUCCESS' : 'FAILED', {
    expected: expectedTagId,
    scanned: result.tagId,
  });

  return matches;
}

/**
 * Cancel any ongoing NFC scan.
 */
export async function cancelScan(): Promise<void> {
  if (Platform.OS !== 'ios' || !ExpoNfcReader) {
    return;
  }

  try {
    await ExpoNfcReader.cancelScan();
  } catch {
    // Ignore errors during cancellation
  }
}

/**
 * Get a friendly display name for the tag ID.
 * Shows a shortened version for UI display.
 */
export function formatTagIdForDisplay(tagId: string): string {
  if (tagId.length <= 8) {
    return tagId;
  }
  return `${tagId.slice(0, 4)}...${tagId.slice(-4)}`;
}
