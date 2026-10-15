# OmniOS UX Phase 05 — Calendar

Status: staged on `ux/phase05-calendar-2026-10-14`. Do not release until CI/browser QA and screenshots pass.

## Existing functionality retained
The legacy v36/v60.3 calendar engine is the single source of truth for events and views. This phase does not replace its renderers, persistent state, or drag/drop code. Existing Workspace / Week / Month / Day / Agenda screens and event editing remain available. Calendar data and source-release manifest remain unchanged.

## Improvements
- Fix month navigation from dates such as January 31: clamped date arithmetic prevents skipping February. The main prev/next controls in Month mode and sidebar mini-calendar navigation share this fix.
- Make the five-mode toolbar navigable at narrow widths with scrollable tabs, usable focus indicators and wrap-safe header controls.
- Ensure seven equal-width month columns with compact event indicators on mobile (detailed event buttons remain in desktop month view; mobile day date opens Day view).
- Add an explicit empty-month hint without hiding date cells, and grid accessibility annotations after every render.
- Add Alt+Left, Alt+Right and Alt+T keyboard shortcuts to calendar prev/next/Today.
- Non-destructive integration: a single child-list observer on the Calendar host redecorates rebuilt views; no new persistence or event creation path.

## Acceptance
1. Run Node tests and runtime checks, Semgrep, and real-loader browser QA at 1440, 390 and 360px.
2. Verify Month has visible date cells for every calendar month, including empty ones. Verify Week and Agenda remain functional.
3. Verify navigation from Jan 31, Feb 28/29, and cross-year boundaries.
4. Verify New event, task and time-block editors open through existing controls and no data is lost.
5. Verify offline caching and no horizontal document overflow.
6. Screenshot-review desktop/mobile. No merge or deploy.

## Rollback
Remove the Phase 05 CSS/JS links from `index.html`, its assets from the shell cache and return to the previous shell cache version. No stored data migrations to roll back.

PR #46 for Phase 04 is a prerequisite. This branch is stacked on it.
