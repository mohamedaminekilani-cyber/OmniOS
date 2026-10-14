# OmniOS UX Phase 07 — Module polish

Status: **staged on ux/phase07-modules-2026-10-14; QA pending**. Stacked on validated Phase 06 PR #48.

## Modules
- Workout: preserve current sessions, templates, exercises, history and existing start/save handlers; standardize hero actions and tabs, touch sizes and focus indicators.
- Nutrition: retain V41/V94 planner, Today, food logging, library, prep, targets, and the capture-phase click router. The new layer never adds a competing Log Food handler.
- Finance: preserve finance month navigation, transaction editor, graphs and calculated figures; avoid replacing renderers or transaction state.
- Habits: preserve weekly/monthly progress, creation modal and records; standardize segmented controls and focus.
- Notes: preserve note modal/editor, search, sort, selection and grouping; ensure toolbar fits a narrow phone without clipping search inputs.

## Scope and integrity
- Standalone JS `js/omnios-modules-phase07.js` adds semantic group labels, tab pressed state and accessible names. It does not create, update, delete or migrate user data.
- Scoped CSS `styles/omnios-ux-phase07.css` aligns responsive heroes, toolbar actions, minimum tap targets, and keyboard focus.
- Only Nutrition root's direct child-list changes are observed because its renderer replaces the root children; no subtree observers or global DOM scans.
- App loader includes both external files; shell cache v11 precaches them.
- The content-addressed release manifest and all original app-part HTML remain unchanged.

## Acceptance
1. Node and runtime tests and Semgrep on final commit.
2. Browser QA through real `index.html`: five modules load and show primary actions at 1440, 390, 360 without document overflow.
3. Verify Workout Start, Nutrition Log Food, Finance transaction, Habits New, and Notes New dialogs open through existing handlers. Do not save test records.
4. Review screenshots, keyboard interactions and offline availability.
5. No merge or deploy. Review previous PRs #43–#48 first.

## Rollback
Remove Phase 07 loader and service-worker asset references; no user data migration.
