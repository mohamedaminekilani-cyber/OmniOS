# OmniOS Phase 10 — App-wide UI consistency

This phase responds to the supplied October 11 screenshots showing oversized square switches, a detached Save Profile footer, cramped Finance and page headings, an over-large daily welcome, dense dashboard metrics, visual collisions between life-area rows, oversized empty planner day cards, and inconsistent spacing in Inbox and Projects.

## Design contract

- Keep the **flat** appearance style scoped to `#omnios-unified-design-2026`. Classic disables that layer, and all saved browser data, records and existing event handlers remain unchanged.
- Use common 6/10/16/22 px spacing tokens, 11 px eyebrow labels, 13 px explanations, 21–29 px page titles, 12 px edge rounding and accessible contrast.
- Keep page-cover tools available but stop them from creating disconnected blank banner space.
- Fix global switch regression: 50 × 30 px control, centered 20 px thumb, distinguishable off/on states and keyboard focus outline.
- Render all major page headings with actual measured 20/22 px desktop and 16 px mobile insets; preserve action click handlers and UI routes.
- Contain month actions within a 46 px-high, one-row Finance picker; mobile stretches to available width without overflow.
- Render Finance and Wellness KPI cells using consistent elevated surfaces and clear grouping; Life areas use discrete bordered rows with a 6 px progress track, no overlapping borders.
- Inline Settings Profile's Save action footer with no inherited giant modal height. Keep it keyboard accessible and functional.
- Reduce empty Planner columns from 230+ px to 176 px (desktop), 94 px (mobile), retaining seven draggable week targets.
- Respect custom logos, current profile name and settings while harmonizing the daily welcome into the same flat visual vocabulary.

## QA

`npm test`, `npm run test:runtime` and `npm run test:browser`. Browser tests now additionally verify actual toggle geometry, dynamic page header inset, and the 760/1024 px responsive layouts, plus the preexisting desktop/mobile screenshots, six-item dock, Finance picker and Classic appearance test.

**Release**: review-only branch stacked onto Phase 9 (PR #37). Source baseline is retained at that branch head `708499901ede69eb14d118f3bd8d23ca202acd21`. No branch was deployed or merged. Production release requires separate approval and a successful main deployment.
