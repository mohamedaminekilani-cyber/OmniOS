# OmniOS Phase 2 — Desktop and mobile application shell

**Status:** implementation / stacked pull request, based on the verified Phase 1 foundation. **No changes to live main until both phases have been approved and merged.**

## Scope

Phase 2 is the page frame and navigation **only**. Content structures within Today, Dashboard, Calendar, Habits and Workout are intentionally unchanged; those belong to Phases 3–6.

### Desktop

- Consistent 248px sidebar, neutral groups with clear section headers, 39px navigation rows, icons, readable 13px labels and a single active state.
- Compact 76px icon mode via a topbar « / » button. The compact preference is saved only under `localStorage.omnios_phase2_sidebar_compact` and never inside OmniOS user state. All routes remain available, and tooltips/ARIA labels remain intact.
- Global topbar with page title, date, save status, **Find pages**, Settings and Quick Add, built on the existing action elements.
- A consistent 1520px maximum page width, predictable margins and scroll behavior across desktop/tablet widths.
- One flat visual system from Phase 1; no per-category rainbow blocks, elevation/glows or secondary shadow stacks.

### Mobile

- Fixed **five-item dock**: Home, Calendar, Tasks, Habits and More.
- The existing keyboard-accessible More sheet now supports the actual **v101 grouped sidebar** and lists *all* legitimate route buttons, including items from collapsed groups.
- Dock respects bottom safe areas; topbar actions stay accessible and Quick Add becomes a 40px icon button with accessible name.
- Full page height and scroll support; small-screen horizontal padding prevents accidental cropping.

### Search / navigation

- Functional **Find pages** button next to Settings; this is a page navigator, **not** a full-text content search.
- Keyboard shortcuts: `Ctrl+K` / `Cmd+K`, or `/` outside text fields. Arrow keys select results; Enter routes; Escape closes. Dialog includes focus containment and restoration.
- Search results derive from the existing real sidebar routes. No hardcoded list can become stale, and no new route framework is introduced.

### Source of truth

- Design CSS block `OMNIOS PHASE 2 APPLICATION SHELL / v1` at the end of the switchable unified stylesheet in `app-parts/part-028.html`, immediately after Phase 1.
- One lightweight `omnios-phase2-shell-controls` script in the same app part. It does not add any `MutationObserver`.
- Fix the original `omnios-remake-mobile-nav` More-sheet builder to traverse grouped `v101-nav-group` sections, while still supporting ungrouped fallback.
- Existing `window.switchView`, Quick Add handlers, Settings, v101 profile, group toggles and mobile More focus trap are reused rather than duplicated.
- **Classic appearance** disables Phase 1 and Phase 2 styling; the small inserted Phase 2 topbar controls are hidden in Classic mode.

### Testing / acceptance

1. All original sidebar destinations remain usable in expanded and compact layouts.
2. Mobile More lists each page correctly, even when its desktop group is collapsed; selection closes sheet and navigates.
3. Find pages works with mouse, keyboard, mobile touch and full focus management.
4. No visual overflow at 360, 390, 760, 1024 and wide desktop viewports; 44px touch targets where feasible.
5. Dark and light palettes meet Phase 1 contrast rules.
6. No app data, encrypted vault, local sync, note editor or calendar calculations are changed.
7. `npm test` and `npm run test:runtime` pass on the Phase 2 branch; after browser-based visual approval, merge Phase 1 then Phase 2 in order.

## Rollback

- Snapshot before Phase 2: [`backup/omnios-before-phase2-2026-10-11`](https://github.com/mohamedaminekilani-cyber/OmniOS/tree/backup/omnios-before-phase2-2026-10-11) at commit `97def7a650381fc034521622125d2170259cc15f`.
- Pre-Phase-1 main: [`backup/omnios-before-phase1-2026-10-11`](https://github.com/mohamedaminekilani-cyber/OmniOS/tree/backup/omnios-before-phase1-2026-10-11) at `ebf1b7219dd8b30997ec4f118313d101ae8932b9`.
- Changes are in an isolated feature branch; no user data is copied to GitHub.
- A full source rollback uses a review PR that reverts the merged changes. The in-app Classic appearance switch is available for visual comparison but is **not** a full code rollback.
