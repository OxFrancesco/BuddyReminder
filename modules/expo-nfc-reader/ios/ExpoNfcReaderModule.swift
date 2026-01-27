import ExpoModulesCore
import CoreNFC

public class ExpoNfcReaderModule: Module {
  private var readerDelegate: NfcTagReaderDelegate?

  public func definition() -> ModuleDefinition {
    Name("ExpoNfcReader")

    Function("isAvailable") { () -> Bool in
      if #available(iOS 13.0, *) {
        return NFCTagReaderSession.readingAvailable
      }
      return false
    }

    AsyncFunction("scanTagUid") { (alertMessage: String, promise: Promise) in
      guard #available(iOS 13.0, *) else {
        promise.reject("NFC_UNAVAILABLE", "NFC requires iOS 13+")
        return
      }

      guard NFCTagReaderSession.readingAvailable else {
        promise.reject("NFC_UNAVAILABLE", "NFC reading is not available on this device")
        return
      }

      // Cancel any existing session
      self.readerDelegate?.invalidateSession()

      let delegate = NfcTagReaderDelegate(promise: promise)
      self.readerDelegate = delegate

      DispatchQueue.main.async {
        let session = NFCTagReaderSession(
          // Support the most common iOS-readable tag technologies.
          // Restricting to only iso14443 can make many tags appear "not working".
          pollingOption: [.iso14443, .iso15693, .iso18092],
          delegate: delegate
        )
        session?.alertMessage = alertMessage
        delegate.session = session
        session?.begin()
      }
    }

    AsyncFunction("cancelScan") { (promise: Promise) in
      self.readerDelegate?.invalidateSession()
      self.readerDelegate = nil
      promise.resolve(nil)
    }
  }
}
