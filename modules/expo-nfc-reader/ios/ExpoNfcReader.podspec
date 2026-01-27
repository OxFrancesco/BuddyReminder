Pod::Spec.new do |s|
  s.name           = 'ExpoNfcReader'
  s.version        = '1.0.0'
  s.summary        = 'Expo module for reading NFC tag UIDs using CoreNFC'
  s.description    = 'A native Expo module that wraps Apple CoreNFC NFCTagReaderSession to scan NFC tag UIDs'
  s.author         = ''
  s.homepage       = 'https://github.com/placeholder'
  s.platforms      = { :ios => '13.0' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.frameworks = 'CoreNFC'

  s.source_files = "**/*.{h,m,mm,swift,cpp}"
end
