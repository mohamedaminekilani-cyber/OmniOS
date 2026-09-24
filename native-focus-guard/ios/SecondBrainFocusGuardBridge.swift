import Foundation
import UIKit
import WebKit
import SwiftUI
import FamilyControls
import ManagedSettings
import DeviceActivity

@available(iOS 16.0, *)
final class SecondBrainFocusGuardBridge: NSObject, WKScriptMessageHandler, ObservableObject {
    weak var webView: WKWebView?
    @Published var selection: FamilyActivitySelection
    private let store = ManagedSettingsStore(named: FocusGuardShared.storeName)
    private let activityCenter = DeviceActivityCenter()
    private weak var pickerController: UIViewController?

    init(webView: WKWebView) {
        self.webView = webView
        self.selection = FocusGuardShared.loadSelection()
        super.init()
        webView.configuration.userContentController.add(self, name: "focusGuard")
    }

    deinit {
        webView?.configuration.userContentController.removeScriptMessageHandler(forName: "focusGuard")
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard
            message.name == "focusGuard",
            let payload = message.body as? [String: Any],
            let requestId = payload["requestId"] as? String,
            let action = payload["action"] as? String
        else { return }

        let body = payload["payload"] as? [String: Any] ?? [:]

        switch action {
        case "status":
            reply(requestId, data: statusPayload())
        case "authorize":
            authorize(requestId: requestId)
        case "chooseApps":
            presentPicker(requestId: requestId)
        case "start":
            startBlocking(requestId: requestId, payload: body)
        case "stop":
            stopBlocking()
            reply(requestId, data: statusPayload())
        default:
            reply(requestId, error: "Unknown Focus Guard action.")
        }
    }

    private func isAuthorized() -> Bool {
        AuthorizationCenter.shared.authorizationStatus == .approved
    }

    private func statusPayload() -> [String: Any] {
        let until = FocusGuardShared.until
        return [
            "platform": "ios",
            "authorized": isAuthorized(),
            "selectionCount": FocusGuardShared.selectionCount,
            "activeUntil": until?.iso8601String as Any
        ]
    }

    private func authorize(requestId: String) {
        Task { @MainActor in
            do {
                try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
                self.reply(requestId, data: self.statusPayload())
            } catch {
                self.reply(requestId, error: error.localizedDescription)
            }
        }
    }

    private func presentPicker(requestId: String) {
        guard isAuthorized() else {
            reply(requestId, error: "Authorize Screen Time first.")
            return
        }
        guard let presenter = topViewController() else {
            reply(requestId, error: "Unable to present the app picker.")
            return
        }

        let binding = Binding<FamilyActivitySelection>(
            get: { [weak self] in self?.selection ?? FamilyActivitySelection() },
            set: { [weak self] newValue in self?.selection = newValue }
        )

        let view = FocusGuardPickerView(selection: binding) { [weak self] in
            guard let self else { return }
            do {
                try FocusGuardShared.save(selection: self.selection)
                self.pickerController?.dismiss(animated: true)
                self.reply(requestId, data: self.statusPayload())
            } catch {
                self.reply(requestId, error: error.localizedDescription)
            }
        }

        let host = UIHostingController(rootView: view)
        pickerController = host
        presenter.present(host, animated: true)
    }

    private func startBlocking(requestId: String, payload: [String: Any]) {
        guard isAuthorized() else {
            reply(requestId, error: "Screen Time authorization is not approved.")
            return
        }
        guard FocusGuardShared.selectionCount > 0 else {
            reply(requestId, error: "Choose at least one iPhone app, category, or website.")
            return
        }
        guard
            let untilISO = payload["untilISO"] as? String,
            let until = ISO8601DateFormatter().date(from: untilISO),
            until > Date()
        else {
            reply(requestId, error: "Invalid unblock time.")
            return
        }

        do {
            try FocusGuardShared.save(selection: selection)
            FocusGuardShared.save(until: until)
            applyShield(selection)

            activityCenter.stopMonitoring([FocusGuardShared.activityName])
            let calendar = Calendar.current
            let start = calendar.dateComponents([.year,.month,.day,.hour,.minute,.second], from: Date())
            let end = calendar.dateComponents([.year,.month,.day,.hour,.minute,.second], from: until)
            let schedule = DeviceActivitySchedule(intervalStart: start, intervalEnd: end, repeats: false)
            try activityCenter.startMonitoring(FocusGuardShared.activityName, during: schedule)

            reply(requestId, data: statusPayload())
        } catch {
            reply(requestId, error: error.localizedDescription)
        }
    }

    private func applyShield(_ selection: FamilyActivitySelection) {
        store.shield.applications = selection.applicationTokens.isEmpty ? nil : selection.applicationTokens
        store.shield.webDomains = selection.webDomainTokens.isEmpty ? nil : selection.webDomainTokens

        if selection.categoryTokens.isEmpty {
            store.shield.applicationCategories = nil
            store.shield.webDomainCategories = nil
        } else {
            store.shield.applicationCategories = .specific(selection.categoryTokens)
            store.shield.webDomainCategories = .specific(selection.categoryTokens)
        }
    }

    private func stopBlocking() {
        activityCenter.stopMonitoring([FocusGuardShared.activityName])
        store.clearAllSettings()
        FocusGuardShared.save(until: nil)
    }

    private func reply(_ requestId: String, data: [String: Any]) {
        sendToWeb(["requestId": requestId, "ok": true, "data": data])
    }

    private func reply(_ requestId: String, error: String) {
        sendToWeb(["requestId": requestId, "ok": false, "error": error])
    }

    private func sendToWeb(_ object: [String: Any]) {
        guard
            let data = try? JSONSerialization.data(withJSONObject: object),
            let json = String(data: data, encoding: .utf8)
        else { return }

        DispatchQueue.main.async { [weak self] in
            self?.webView?.evaluateJavaScript("window.SecondBrainFocusGuardNativeResult(\(json));")
        }
    }

    private func topViewController(base: UIViewController? = nil) -> UIViewController? {
        let root: UIViewController? = {
            if let base { return base }
            return UIApplication.shared.connectedScenes
                .compactMap { $0 as? UIWindowScene }
                .flatMap { $0.windows }
                .first { $0.isKeyWindow }?
                .rootViewController
        }()

        if let nav = root as? UINavigationController { return topViewController(base: nav.visibleViewController) }
        if let tab = root as? UITabBarController { return topViewController(base: tab.selectedViewController) }
        if let presented = root?.presentedViewController { return topViewController(base: presented) }
        return root
    }
}

@available(iOS 16.0, *)
private struct FocusGuardPickerView: View {
    @Binding var selection: FamilyActivitySelection
    let onDone: () -> Void

    var body: some View {
        NavigationStack {
            FamilyActivityPicker(selection: $selection)
                .navigationTitle("Choose apps to block")
                .toolbar {
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Done", action: onDone)
                    }
                }
        }
    }
}

private extension Date {
    var iso8601String: String { ISO8601DateFormatter().string(from: self) }
}
