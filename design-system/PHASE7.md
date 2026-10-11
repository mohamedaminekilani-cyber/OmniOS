# OmniOS Phase 7 — QA and controlled release

Status: review only. No merge to production before all quality gates.

## Safety and backups

- Pre-Phase-7 GitHub source backup: backup/omnios-before-phase7-2026-10-11 at commit 3501b8a560e98dcf78d5f0a899df186c58559b9d.
- Phase 7 is stacked onto Phase 6 on a separate feature branch.
- Source backups contain code, not private records stored in a user's browser. Never clear or overwrite a live IndexedDB or localStorage profile.

## Automated verification

- Run npm ci, npm run release:source, npm test and npm run test:runtime.
- Run npm run test:browser using real Chrome with an isolated disposable browser profile and an ephemeral localhost HTTP server.
- Test navigation through Dashboard, Today, Calendar, Tasks, Habits, Workout, Finance, Diet, Notes, Projects, Reminders and Settings.
- Check visible active screens and page-wide overflow; capture screenshots at 1440px dark, 390px light and 360px dark for a representative subset.
- Verify reversible Flat/Classic appearance and nonempty Calendar content.
- The new Phase 7 GitHub workflow runs on review PRs, uploads a JSON report and screenshots as omnios-phase7-visual-qa, and never deploys.

## Manual review before release

- Inspect 360, 390, 760, 1024 and 1440px in both themes.
- Verify readable labels, 44px mobile tap targets, accessible focus, no clipping, empty states, active navigation, modal close/escape and reduced motion.
- Exercise Calendar five modes, Tasks create/edit/filter, Inbox triage, Projects editor, Routine check-ins, Habits month history, Gym and Home Workout sets/timers.
- Exercise Finance transaction/budgets, Nutrition plans, Notes editor/search, Reminders, Life Hub, Bible, Settings, and Sync import/export on TEST ONLY records.
- Check legacy Classic rollback, storage persistence, browser console messages and service worker updates. A screenshot alone is not functional or accessibility approval.

## Release and rollback

1. Require green automated tests, passed manual cross-device review, explicit owner approval and a tested data export to a disposable profile.
2. Merge stacked PRs #29, #30, #31, #32, #33, #34, then Phase 7, in dependency order. Retarget/review each after its predecessor merges.
3. Verify the exact built release SHA and commit on GitHub Pages. Test PWA reload and old-client update without erasing saved records.
4. If a serious regression appears, revert the relevant source commits via a reviewed PR, preserve browser data and use Settings > Classic for instant visual rollback.

No production push, user-record migration or automatic merge is part of this QA phase.
