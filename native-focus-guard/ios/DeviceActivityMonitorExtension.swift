import DeviceActivity
import ManagedSettings

@available(iOS 16.0, *)
final class SecondBrainFocusGuardMonitor: DeviceActivityMonitor {
    private let store = ManagedSettingsStore(named: FocusGuardShared.storeName)

    override func intervalDidStart(for activity: DeviceActivityName) {
        super.intervalDidStart(for: activity)
        guard activity == FocusGuardShared.activityName else { return }
        let selection = FocusGuardShared.loadSelection()

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

    override func intervalDidEnd(for activity: DeviceActivityName) {
        super.intervalDidEnd(for: activity)
        guard activity == FocusGuardShared.activityName else { return }
        store.clearAllSettings()
        FocusGuardShared.save(until: nil)
    }
}
