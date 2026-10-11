# OmniOS — Phase 8: Visual acceptance and release-integrity hardening

**Status:** review branch stacked on Phase 7; no merge to main or live deployment.

## Why this phase is necessary

The Phase 7 pipeline was green (101 source/regression tests, 62 Chrome assertions, 30 screenshots), but an audit of those screenshots showed **every capture was the welcome overlay**. Behind that overlay, routes could be marked active without the actual module being visible to the reviewer. Separately, the committed source-release.json SHA-256 was stale: Phase 7's workflow rewrote it before running tests, which hid the discrepancy.

These are release-blocking **QA instrumentation defects**. They do not demonstrate that the underlying module UI is wrong; they demonstrate that Phase 7 did not prove it was right.

## Fixes

1. Correct source-release.json to the actual assembled app checksum verified in Phase 7 CI and its screenshot JSON report: `5791b2f6d2d34e50be46bb21a562f7b25254b30930e38c356bc52dd36abb9bda` (3,650,246 bytes).
2. Replace the CI manifest rewrite with a **read-only check** in both the regular Pages workflow and the PR-only visual QA workflow. A stale manifest now fails before further tests.
3. In the headless Chrome QA, dismiss the real `#welcome63` welcome dialog by clicking its `[data-w63close]` control, wait for removal, and reject any subsequent capture with the overlay still present.
4. Hash screenshot bytes and require meaningful variation across pages for both the 1440px dark and 390px light batches. This prevents a repeated screenshot or permanent overlay from passing future visual QA.
5. Treat uncaught Chrome runtime exceptions as failures, rather than recording them without affecting the result.
6. Preserve evidence for manual inspection in uploaded GitHub Actions artifacts.

## Acceptance criteria

- `npm test`, `npm run test:runtime`, and `npm run test:browser` succeed **without regenerating the committed manifest**.
- Screenshots actually depict Dashboard, Today, Calendar, Tasks, Habits, Workout, Finance, Nutrition, Notes, Projects, Reminders and Settings.
- No page-wide horizontal overflow on tested mobile/desktop widths; no blocking overlays.
- Restore/rollback branches remain intact. No user data is accessed and no production deployment occurs.
- Manual comparison of the screenshots must still be completed; color, contrast, padding and real-device touch behavior cannot be established solely from automated pass/fail results.

**Pre-Phase-8 source backup:** `backup/omnios-before-phase8-2026-10-11` at `afa196d66cb97f93cd781cdc4993116364cd7562`.

**Safe release:** review and merge PRs #29 → #30 → #31 → #32 → #33 → #34 → #35 → Phase 8 in dependency order, and only after the screenshots and browser workflows are verified. Do not auto-merge or push to production.

## Review evidence required

The prior Phase 7 artifact `omnios-phase7-visual-qa` contained 30 captures of `#welcome63`, making its passing screenshot assertions non-evidence for module design. Phase 8's CI must generate a **new** artifact with visible module content. Examine the Dashboard and Tasks desktop captures and Calendar and Finance mobile captures, not just the numeric CI result. Keep Phase 8 unmerged if captures are still identical, or if Chrome reports any blocking dialog, runtime exception, or stale source manifest.

## Stacked PR verification workflow

The repository's CI trigger may require temporarily targeting `main` for the automated PR-only checks. While checking Phase 8, never merge that temporary PR base or issue a `workflow_dispatch` deployment. Restore its base to `feature/omnios-phase7-qa-release-2026-10-11` immediately after the CI check is visible. Both PR verification jobs are safe because GitHub Pages deployment in `pages.yml` explicitly excludes `pull_request` events.
