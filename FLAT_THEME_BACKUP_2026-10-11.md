# OmniOS flat Tech SaaS design — safety and palette

## Safe restore points

- **Immediately before this flat redesign:** [`backup/omnios-before-flat-palette-2026-10-11`](https://github.com/mohamedaminekilani-cyber/OmniOS/tree/backup/omnios-before-flat-palette-2026-10-11) at `d103544944cfc9ff1426b1474ccb94fde91f918e`.
- **Before the previous wider UI refresh:** [`backup/omnios-pre-2026-10-11-ui-refresh`](https://github.com/mohamedaminekilani-cyber/OmniOS/tree/backup/omnios-pre-2026-10-11-ui-refresh) at `51c269205ca0b2b4de7e50c26cdaa901a1638654`.

The baseline is saved in dedicated GitHub branches; these branches preserve app source and assets, **not** private browser-local user data. Never overwrite the branches. To revert the entire flat redesign after a merge, revert its squash-merge commit in a new PR, regenerate `source-release.json`, and let the existing verify/build/deploy workflow publish the exact restored application. This leaves browser-local data intact.

## Exact user-provided palette

| Role | Name | Hex | Use |
|---|---|---|---|
| Background / high-contrast text | Carbon | `#101114` | Dark canvas; dark text on Mist and Lime |
| Light background | Mist | `#EEF0F2` | Light canvas and near-white text on saturated accents |
| Primary action | Electric | `#2547E8` | Buttons with white text |
| Brand / alternative action | Violet | `#5F31C4` | White-on-violet emphasis and readable accent on Mist |
| Positive progress | Lime | `#C6F04A` | Checked habits, progress, positive state with Carbon text |
| Secondary text on Mist | Steel | `#55606D` | Secondary body text |

Contrast ratios use WCAG 2.2 relative luminance: Electric/white **6.68:1**, Violet/Mist **6.75:1**, Carbon/Lime **14.35:1**, Carbon/Mist **16.53:1**, Steel/Mist **5.60:1**. Lime/Mist is **not accessible** for text and must never be used for small foreground content.

Dark surfaces use accessible derived neutral tones and lighter violet-blue accents when accent text sits on Carbon; a vivid blue/violet is still used when paired with white text on a solid button.

## Flat appearance / reversibility

The palette, flat no-shadow surfaces, desktop and mobile layout tweaks are located at the end of the single switchable `<style id="omnios-unified-design-2026">` in `app-parts/part-028.html`. There is no new network dependency and no changes to tasks, passwords, storage, calendars or workouts. The prior Home Workout image removal is preserved.

In **Settings → Interface style**, select **Use Classic appearance** to disable that stylesheet instantly. Selecting **Use Flat design** restores it. This is a browser-local visual preference, not a backup or a data migration. A full-source rollback restores the previous build when explicitly requested.
