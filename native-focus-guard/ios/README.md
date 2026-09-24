# Second Brain Focus Guard — native iOS bridge

The web/PWA code now knows how to call a native Focus Guard bridge through `window.webkit.messageHandlers.focusGuard`. These Swift files provide that bridge using Apple's Screen Time frameworks.

## Why this native layer is required

Safari and installed PWAs cannot enumerate, suspend, or shield other installed iOS apps. Apple's supported system-wide mechanism is Family Controls + Managed Settings + Device Activity. The native host asks the user for authorization, presents Apple's privacy-preserving Family Activity Picker, applies shields, and schedules automatic removal at the selected end time.

## Xcode targets

Create an iOS host app that loads the existing Second Brain web app in a `WKWebView`, then add:

1. **Main app target**
   - `FocusGuardShared.swift`
   - `SecondBrainFocusGuardBridge.swift`
   - Family Controls capability
   - App Groups capability

2. **Device Activity Monitor extension**
   - `FocusGuardShared.swift`
   - `DeviceActivityMonitorExtension.swift`
   - Family Controls capability
   - App Groups capability

3. **Shield Configuration extension**
   - `FocusGuardShared.swift`
   - `ShieldConfigurationExtension.swift`
   - Family Controls capability
   - App Groups capability

4. **Shield Action extension**
   - `ShieldActionExtension.swift`
   - Family Controls capability

Change `FocusGuardShared.appGroup` from `group.secondbrain.focusguard` to the actual App Group registered for your Apple Developer account, and enable that same App Group on the main app and extensions.

Apple requires the Family Controls entitlement for distribution. Request it for the main app and every Screen Time extension that uses it.

## Hook the bridge into the WKWebView

Keep a strong reference to the bridge for as long as the web view exists:

```swift
final class WebViewController: UIViewController {
    private var webView: WKWebView!
    private var focusGuardBridge: SecondBrainFocusGuardBridge!

    override func viewDidLoad() {
        super.viewDidLoad()

        let config = WKWebViewConfiguration()
        webView = WKWebView(frame: view.bounds, configuration: config)
        view.addSubview(webView)

        if #available(iOS 16.0, *) {
            focusGuardBridge = SecondBrainFocusGuardBridge(webView: webView)
        }

        webView.load(URLRequest(url: URL(string: "https://mohamedaminekilani-cyber.github.io/OmniOS/")!))
    }
}
```

## Runtime flow

- PWA calls **Authorize Screen Time** → native bridge calls `AuthorizationCenter.requestAuthorization(for: .individual)`.
- PWA calls **Choose iPhone apps** → native host presents `FamilyActivityPicker`.
- PWA starts Focus Guard → bridge applies `ManagedSettingsStore.shield` and starts a non-repeating `DeviceActivitySchedule`.
- Opening a shielded app displays the custom system shield.
- The Device Activity Monitor extension clears the Managed Settings store when the focus window ends.
- Ending the guard early clears the shield immediately.

The ordinary GitHub Pages PWA still uses its in-app/link blocker fallback, but system-wide app shielding only activates in the signed iOS native host.
