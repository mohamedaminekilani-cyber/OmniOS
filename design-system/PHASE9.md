# OmniOS Phase 9 — Visual refinement and branding consistency

**Status:** feature/review only. Production `main` remains unchanged. Phase 9 is stacked on Phase 8.

**Rollback snapshot:** `backup/omnios-before-phase9-2026-10-11` at `6c43c88e68147e77a4450bf5c3bebbaf1c60e8c6`. This preserves source, not personal browser records.

## Changes

1. **OmniOS identity:** set the new-install branding preset to `OmniOS` / `Personal OS`, update visible boot/PWA labels, and reflect the configured brand in the Welcome page. Legacy `Second Brain / Ultimate Life Planner` presets upgrade only if their editable brand fields remain at the original defaults and no uploaded logo exists. Custom names, typography, icons and logos are preserved.
2. **Mobile dock:** one prominent canonical SVG icon per destination, or the active custom icon, plus a readable text label; flat bordered 6-destination navigation, fixed safe area and focusable buttons.
3. **Finance:** turn the oversized wrapped mobile month selector into a bounded, single-row control with previous, current month, month label, and next.
4. **Remaining screens:** remove inherited minimum heights from selected mobile headers, reduce oversized empty hero areas, and standardize spacing for notes, inbox, projects, reminders, diet and Tasks.
5. **Settings:** condense the interface-style and branding controls without hiding customization options or changing saved values.
6. **Release:** record the exact assembled source hash in `source-release.json`. Keep GitHub Actions as a read-only manifest verification gate and preserve the switchable Classic styling.

## QA and acceptance

- Run `npm test`, `npm run test:runtime` and `npm run test:browser`; do not regenerate the manifest as a substitute for a correct committed checksum.
- Existing checks cover 30 real module screenshots at desktop, mobile and dark/light breakpoints. Phase 9 adds a real DOM visibility check for **exactly one icon plus one nonempty label on each of six mobile destinations**, and the **single-row Finance month navigation**.
- Compare the prior Phase 8 and Phase 9 screenshots on mobile Finance, Settings, Tasks, Notes, Projects and Calendar, plus dark-mode desktop.
- Verify that resetting Branding selects OmniOS. Verify a user-changed brand name and uploaded logo are not overwritten. Confirm switching Flat ↔ Classic does not change stored user records.
- Human visual QA still required at 360, 390, 760, 1024, 1440px before any production release.

**Release policy:** stacked PRs #29 through #36 plus this Phase 9 PR remain subject to manual acceptance and must merge in dependency order. No automatic production deployment or user data migration is authorized.
