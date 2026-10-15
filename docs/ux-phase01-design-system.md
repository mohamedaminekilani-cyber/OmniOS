# OmniOS Phase 01 — design system contract

Status: **foundation integrated via UX-branch shell; legacy page migration incomplete**.

This document and `styles/omnios-ux-foundation.css` are standalone source assets.
The stylesheet is linked from the UX-branch index and copied to dist by the build script.
Existing assembled app-parts and source-release.json remain byte-identical: their
content-addressed checksum does not change. The new selectors are opt-in (.ux-*),
with a few narrowly scoped compatibility fixes. No main-branch deployment occurs.

## Rules
1. Preserve the current flat palette and user-selected accent.
2. Reuse existing design variables through `--ux-*` aliases; no new competing palette.
3. One page structure: heading, subtitle, primary action, optional view controls, content.
4. Prefer plain content to nested cards. A card represents an independent region.
5. Touch targets at least 44 px for primary interactive controls.
6. Visible keyboard focus, semantic labels, status announcements and adequate contrast.
7. Responsive layout must be reviewed at 360, 390, 768, 1024, 1280 and 1440 px.
8. Avoid additional global `!important` and obsolete version-prefixed overrides.
9. Respect reduced-motion preferences.
10. Migrate views incrementally, with a stable reference screenshot before and after.

## Inventory / migration order
- Shared shell, sidebar, mobile dock: normalize first.
- Today and Dashboard: reduce duplicate summary structures.
- Calendar and Tasks: reduce toolbar and filter density.
- Habits, Routine, Workout, Nutrition: common page and entry controls.
- Finance: common filters, cards, charts and empty states.
- Life Hub, People, Notes, Bible: consistent navigation and headings.
- System, Data Center, Sync: consistent form and feedback semantics.

## Acceptance gate
- On-branch `npm run release:source`, `npm test`, `npm run test:runtime`, `npm run test:browser`.
- Before/after desktop and mobile screenshots and manual keyboard walkthrough.
- Check light/dark modes, localization, zoom, contrast and touch targets.
- Confirm no user data migration occurs as part of visual work.
- No push to `main` and no production deployment during Phase 01.

## Phase 01 continued — compatible cleanup
- Removed redundant `.form-row,.form-grid` min-width compatibility duplication.
- Removed bridge rules that could compete with active theme background and border-color ownership.
- Kept canonical legacy renderers and required CSS IDs intact; no unsafe blanket deletion.
- Added `tests/ux-phase01-foundation.test.js` to existing Node test-glob.
- Full `npm test`, runtime and browser validation remains pending until execution against a complete checkout.
- Activation changes remain isolated to the UX branch; no app data schema changes.

## Phase 01 visual QA continuation (2026-10-13)
- Added low-specificity compatibility rules for actual v35/v38/v58 and Bible headings, action rows and tabs.
- Preserved legacy declarations and existing renderer IDs; no global display/hide changes.
- Added a regression assertion guarding real selectors and destructive hiding.
- The existing `scripts/phase7-browser-qa.mjs` generates screenshots at 1440, 1024, 760, 390 and 360 px in selected views. It opens the content-addressed app HTML directly, not `index.html`, so those screenshots alone DO NOT prove the loader-injected UX stylesheet is present.
- Required follow-up: run the browser suite against a built checkout and add a separate index-loader launch check verifying computed style and an attached stylesheet before accepting visual QA.
- The connected GitHub tool does not execute arbitrary Node/Chromium commands; browser screenshots, `npm test`, `npm run test:runtime` and `npm run test:browser` have not been executed in this session.

## Phase 01 real-loader visual QA gate
- Browser QA now loads `dist/index.html` after the legacy assembled-release checks, checking that the stylesheet survives document replacement.
- It asserts the external CSS is parsed, `--ux-space-4` resolves to `16px`, and Today renders without document-level overflow at 1440, 390, and 360 pixels.
- It saves `qa-artifacts/phase01-loader-{1440,390,360}-today.jpg` for visual review.
- **Not yet executed:** the added QA script requires a checkout, built `dist/`, Node, and Chrome/Chromium. Screenshots and final browser acceptance remain pending.

## Final mobile cleanup (2026-10-13)
- Identified the overlapping '+' as `#v55-capture-fab`, the global Quick Capture FAB (original v55 module).
- Today already has a primary `+ Add` header action, so hide the redundant FAB **only while Today is active on mobile**. Other views and the user's FAB setting remain unchanged.
- The v58 Attention section shows its two original navigation actions in two equal columns under 420px; handlers and the underlying data remain unchanged.
- Browser QA explicitly checks the Today FAB is hidden, the All tasks link is hit-testable and the two Attention buttons align in one row at 360px.
- Before closing Phase 01, review all generated screenshots and confirm GitHub Actions regression, browser and Semgrep checks on the exact final commit. No release should occur from the draft PR.
