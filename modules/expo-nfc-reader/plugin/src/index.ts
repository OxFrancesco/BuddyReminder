import { ConfigPlugin, withInfoPlist, withEntitlementsPlist } from 'expo/config-plugins';

const withNfcReader: ConfigPlugin = (config) => {
  // Add NFCReaderUsageDescription to Info.plist
  config = withInfoPlist(config, (config) => {
    config.modResults.NFCReaderUsageDescription =
      config.modResults.NFCReaderUsageDescription ||
      'Scan NFC tag to dismiss alarm';
    return config;
  });

  // Add NFC entitlements
  config = withEntitlementsPlist(config, (config) => {
    config.modResults['com.apple.developer.nfc.readersession.formats'] = [
      'TAG',
    ];
    return config;
  });

  return config;
};

export default withNfcReader;
