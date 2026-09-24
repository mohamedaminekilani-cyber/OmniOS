import ManagedSettings
import ManagedSettingsUI
import UIKit

@available(iOS 16.0, *)
final class SecondBrainShieldConfiguration: ShieldConfigurationDataSource {
    override func configuration(shielding application: Application) -> ShieldConfiguration {
        makeConfiguration()
    }

    override func configuration(shielding application: Application, in category: ActivityCategory) -> ShieldConfiguration {
        makeConfiguration()
    }

    override func configuration(shielding webDomain: WebDomain) -> ShieldConfiguration {
        makeConfiguration()
    }

    override func configuration(shielding webDomain: WebDomain, in category: ActivityCategory) -> ShieldConfiguration {
        makeConfiguration()
    }

    private func makeConfiguration() -> ShieldConfiguration {
        let untilText: String = {
            guard let until = FocusGuardShared.until else { return "your focus block ends" }
            let formatter = DateFormatter()
            formatter.timeStyle = .short
            formatter.dateStyle = .none
            return formatter.string(from: until)
        }()

        return ShieldConfiguration(
            backgroundBlurStyle: .systemMaterial,
            backgroundColor: UIColor.systemBackground,
            icon: UIImage(systemName: "brain.head.profile"),
            title: ShieldConfiguration.Label(text: "Stay focused", color: UIColor.label),
            subtitle: ShieldConfiguration.Label(
                text: "You should not be using this app right now. It is blocked until \(untilText).",
                color: UIColor.secondaryLabel
            ),
            primaryButtonLabel: ShieldConfiguration.Label(text: "Return to focus", color: UIColor.white),
            primaryButtonBackgroundColor: UIColor.systemBlue
        )
    }
}
