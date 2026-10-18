# OmniOS UX Phase 03 — Today command center

Status: implementation staged on ux/phase03-today-2026-10-13; browser review required.

## Design
- Today is the primary action workspace. Existing priorities, agenda, habits, lightweight capture, and daily metrics stay visible.
- Connected intelligence cards (Bible, projects, supply, wellbeing, Inbox analytics) stay in the DOM and are shown through an accessible **Show connected insights** control, avoiding duplicate dense dashboards.
- Dashboard becomes the deeper **Insights & trends** destination, with a Back to Today action.
- Shared command strip opens Tasks, Calendar, Inbox and Dashboard through the original switchView route.
- Mobile hides the old Today New button because Phase 02 Add dock provides universal Quick Add, while retaining existing creation handlers.
- No user data schema or core renderer changes. Phase 03 CSS and JS are separate assets, and shell cache is v7.
- Only direct-child observers are used to restore controls after old page rendering.
- Rollback removes Phase 03 assets and their loader/cache references; no data migration is required.

## Acceptance
Node, runtime, Semgrep and browser QA on the exact commit; 1440, 390, 360 screenshots; verify connected insights toggle, dashboard return and existing tasks/calendar/inbox navigation. Review stacked Phase 01 PR #43 and Phase 02 PR #44 separately. Do not merge or deploy without authorization.
