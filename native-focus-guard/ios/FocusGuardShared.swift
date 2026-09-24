import Foundation
import FamilyControls
import ManagedSettings
import DeviceActivity

enum FocusGuardShared {
    static let appGroup = "group.secondbrain.focusguard"
    static let selectionKey = "focusGuard.selection"
    static let untilKey = "focusGuard.until"
    static let storeName = ManagedSettingsStore.Name("SecondBrainFocusGuard")
    static let activityName = DeviceActivityName("SecondBrainFocusGuard")

    static var defaults: UserDefaults {
        UserDefaults(suiteName: appGroup) ?? .standard
    }

    static func save(selection: FamilyActivitySelection) throws {
        defaults.set(try JSONEncoder().encode(selection), forKey: selectionKey)
    }

    static func loadSelection() -> FamilyActivitySelection {
        guard
            let data = defaults.data(forKey: selectionKey),
            let selection = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data)
        else { return FamilyActivitySelection() }
        return selection
    }

    static func save(until: Date?) {
        defaults.set(until?.timeIntervalSince1970, forKey: untilKey)
    }

    static var until: Date? {
        let value = defaults.double(forKey: untilKey)
        return value > 0 ? Date(timeIntervalSince1970: value) : nil
    }

    static var selectionCount: Int {
        let selection = loadSelection()
        return selection.applicationTokens.count + selection.webDomainTokens.count + selection.categoryTokens.count
    }
}
