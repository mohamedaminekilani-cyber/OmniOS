# OmniOS UX Phase 07.1 — Phase 06 / 07 integration

**Branch:** `ux/phase07-1-integration-2026-10-15`. Draft-only. PR #51 targets `main` solely to validate the full stacked UX changes in CI; all source PRs remain untouched. No merge or deployment.

## Inputs and resolution
- Phase 06 PR #50, `ux/phase06-life-hub-2026-10-15` at `6ac3b8e2dc0fd3be95c228c7f5aabc6c8be7ff5f`.
- Phase 07 PR #49, `ux/phase07-modules-2026-10-14` at `0170004825742d173efdfa828406862df0b7c4e3`.
- Conflict: the two branches shipped different Phase 06 JS bridges and different mobile Life Hub shortcut layouts. Both would define `OmniLife06`, so loading both would silently ignore the second initializer.
- Resolution: use PR #50's clearer six-card Life Hub and `openDomain` / `openModule` API, preserving PR #49's accessibility, view rerender handling, and Phase 07 module improvements. Only the new bridge is loaded.
- The earlier `js/omnios-life-phase06.js` is deleted **from the integration branch only**; the original branches remain unchanged.
- The canonical Life Hub V43 owns data, editors, records, and routing. Phase 06/07 layers contain presentation, shortcut navigation, and ARIA decorators only.

## Test and release safety
- The existing V43 app fragments, `source-release.json`, persistence keys and schema remain unchanged.
- Offline cache advances from shell v11 to v12 to cache the canonical Phase 06 asset alongside Phase 07.
- Merge both sets of browser QA: latest Phase 06 domain deep links, keyboard, modules and 1440/390/360 responsiveness; plus all Phase 07 five-module interactions and Notes mobile regression.
- Contract tests verify canonical loader/worker references and unchanged source-release hash.
- Confirm 175+ Node tests, runtime boot, 180+ browser checks, 68+ screenshots, Semgrep, no uncaught exceptions, and inspect final screenshots before approving any release.
- Do not merge, force-push, or deploy. Review source PRs #43–#50 in dependency order before controlled release.

## Rollback
Delete the integration branch / close the draft integration PR. Original source branches and production are unaffected.
