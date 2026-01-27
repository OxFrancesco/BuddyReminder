import Foundation
import CoreNFC
import ExpoModulesCore

@available(iOS 13.0, *)
class NfcTagReaderDelegate: NSObject, NFCTagReaderSessionDelegate {
  private let promise: Promise
  private var isResolved = false
  var session: NFCTagReaderSession?

  init(promise: Promise) {
    self.promise = promise
    super.init()
  }

  func invalidateSession() {
    session?.invalidate()
    session = nil
  }

  // MARK: - NFCTagReaderSessionDelegate

  func tagReaderSessionDidBecomeActive(_ session: NFCTagReaderSession) {
    // Session is active, waiting for tags
  }

  func tagReaderSession(_ session: NFCTagReaderSession, didDetect tags: [NFCTag]) {
    guard !isResolved else { return }

    // If multiple tags are detected, ask the user to present only one and continue polling.
    if tags.count > 1 {
      session.alertMessage = "More than one tag detected. Please present only one tag."
      session.restartPolling()
      return
    }

    guard let tag = tags.first else { return }

    session.connect(to: tag) { [weak self] error in
      guard let self = self else { return }

      if let error = error {
        self.resolveOnce {
          session.invalidate(errorMessage: "Connection failed")
          self.promise.reject("NFC_CONNECT_ERROR", error.localizedDescription)
        }
        return
      }

      let uid: Data?

      switch tag {
      case .miFare(let mifareTag):
        uid = mifareTag.identifier
      case .iso7816(let iso7816Tag):
        uid = iso7816Tag.identifier
      case .iso15693(let iso15693Tag):
        uid = iso15693Tag.identifier
      case .feliCa(let feliCaTag):
        uid = feliCaTag.currentIDm
      @unknown default:
        uid = nil
      }

      guard let identifier = uid, !identifier.isEmpty else {
        self.resolveOnce {
          session.invalidate(errorMessage: "Could not read tag UID")
          self.promise.reject("NFC_NO_UID", "Tag did not return a UID")
        }
        return
      }

      let hexString = identifier.map { String(format: "%02X", $0) }.joined()

      self.resolveOnce {
        session.alertMessage = "Tag detected!"
        session.invalidate()
        self.promise.resolve(hexString)
      }
    }
  }

  func tagReaderSession(_ session: NFCTagReaderSession, didInvalidateWithError error: Error) {
    let nfcError = error as? NFCReaderError

    if nfcError?.code == .readerSessionInvalidationErrorUserCanceled {
      resolveOnce {
        self.promise.reject("NFC_CANCELLED", "Scan cancelled by user")
      }
    } else if nfcError?.code == .readerSessionInvalidationErrorFirstNDEFTagRead {
      // Normal completion, do nothing (already resolved in didDetect)
    } else {
      resolveOnce {
        self.promise.reject("NFC_ERROR", error.localizedDescription)
      }
    }
  }

  // MARK: - Helpers

  private func resolveOnce(_ block: () -> Void) {
    guard !isResolved else { return }
    isResolved = true
    block()
  }
}
