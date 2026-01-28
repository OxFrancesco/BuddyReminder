const { withInfoPlist, withEntitlementsPlist } = require('expo/config-plugins');

function withNfcReader(config) {
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
}

module.exports = withNfcReader;
