import { requireOptionalNativeModule } from 'expo-modules-core';

interface ExpoNfcReaderInterface {
  isAvailable(): boolean;
  scanTagUid(alertMessage: string): Promise<string>;
  cancelScan(): Promise<void>;
}

export default requireOptionalNativeModule<ExpoNfcReaderInterface>('ExpoNfcReader');
