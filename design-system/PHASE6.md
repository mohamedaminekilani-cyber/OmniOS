# OmniOS — Phase 6: remaining modules

**Status:** review branch, stacked onto Phase 5. The live GitHub Pages `main` release is not modified.

**Exact pre-Phase-6 source backup:** `backup/omnios-before-phase6-2026-10-11` at `94a5402e85a2456295c7b74fa198676af9453265`. This snapshots code only, not personal browser storage.

## Design system and scope

Use the existing Phase 1 palette and semantic tokens: Carbon `#101114`, Mist `#EEF0F2`, Electric `#2547E8`, Violet `#5F31C4`, Lime `#C6F04A`, Steel `#55606D`, with WCAG AA text contrast, keyboard focus, and 44px mobile controls. No new gradients, visual shadows, images, observers, assets, or dependencies.

The final Phase 6 CSS block is appended **inside** `<style id="omnios-unified-design-2026">` in `app-parts/part-028.html`. **Settings → Interface style → Classic** disables the complete Phase 1–6 layer for comparison. No new stylesheet outside the toggle.

## Modules

- **Tasks**: consistent header/filter/view switcher, horizontally bounded Kanban columns, cards, responsive filters, and a functional **+ New task** action when filters return zero results. Active views expose `aria-pressed`.
- **Inbox**: flat capture/triage layout, pending-count label, descriptive input label, and disabled **Process oldest** when empty. Existing capture-to-task/note/event/project processing remains.
- **Projects & Life Areas**: readable status and progress cards, accessible selected tabs; project cards can be opened with Enter or Space as well as mouse/touch. Existing milestone/edit workflows remain.
- **Finance**: unified month header, scroll-contained seven-view tab navigation, flat cash-flow and budget cards, consistent transactions/accounts/recurring/goals layouts, and labeled month arrows. No accounting formula changes.
- **Nutrition**: adaptive KPIs and food/prep cards, bounded scrollable planner month, and touch-friendly controls. No calorie/macronutrient/history changes.
- **Notes, Reminders, Organize, Grocery, Pantry, Wishlist**: consistent library rails, cards, row hierarchy, reminder groups and responsive workspaces; reminder filters announce selected state.
- **Life Hub, People, Goals, Studio**: unified flat card/panel styling and readable metadata, preserving each screen's existing actions.
- **Bible, Settings, Data Center, Sync and supporting screens**: accessible controls, border/typography normalization and smaller-screen containment. No change to Bible data loading, encrypted vaults, sync transport, key derivation, or storage logic.
- **Secondary dialogs and inspector**: maximum viewport-width containment without global modal rewrites.

## Source ownership

- `app-parts/part-001.html`: task view/empty state behavior and semantics.
- `app-parts/part-004.html`: Inbox and project UI affordances.
- `app-parts/part-005.html`: Finance navigation semantics.
- `app-parts/part-006.html`: Reminders tab/input semantics.
- `app-parts/part-028.html`: scoped flat CSS layer; no runtime JS changes.
- `tests/phase6-secondary-modules.test.js`: source/DOM safety contracts.
- `source-release.json`: checksum and byte count of exact assembled source.

## Quality gates before merging

1. Run `npm run release:source`, `npm test`, and `npm run test:runtime`. Verify the manifest matches the app source exactly.
2. Visual inspection in both light and dark appearances at **360, 390, 760, 1024 and 1440 px**; confirm no page-wide horizontal overflow or clipped controls.
3. Test Tasks filtered-empty creation and view switching; Inbox capture/triage; Projects keyboard opening, tabs, editing; Finance all seven tabs and month navigation; Nutrition day editor and progress/history; Notes tags/editor; Reminders filters; Grocery/Pantry/Wishlist actions; Bible navigation; Settings and Sync modal flows.
4. Check contrast/keyboard focus on selected tabs, interactive cards, modal close/escape and mobile touch targets. Verify Classic toggle instantly reverts the new CSS layer and retains all saved records.

**Safety:** no migrations, data clears, added network fetches, deployment or changes to `main`. Review/merge stacked PRs in order **Phase 1 → 2 → 3 → 4 → 5 → 6** only after CI and manual visual QA. Next phase: full QA, release and regression fixes.

**Note:** GitHub PR checks may need temporary base retargeting to `main` because the existing workflow filters to PRs targeting `main`; restore the stacked Phase 5 base after checking. No Pages production deployment is triggered by PR checks.
