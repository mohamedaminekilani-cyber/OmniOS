# OmniOS Phase 01 — design system contract

Status: **foundation staged on UX branch; not yet activated**.

This document and `styles/omnios-ux-foundation.css` are standalone source assets.
They do not alter the running application, because OmniOS uses a content-addressed
source-release manifest. Activating the CSS requires coordinated manifest regeneration,
automated checks, screenshots and a reviewed pull request.

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
