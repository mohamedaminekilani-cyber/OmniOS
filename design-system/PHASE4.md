# OmniOS — Phase 4: Calendar & Planner

**Status:** development only, stacked onto Phase 3. No merge to `main` and no production deployment.

**Rollback snapshot:** `backup/omnios-before-phase4-2026-10-11` from `2f258fc65ab2f75cc0aa86f3aa6e5a035d553c2b`. It preserves the complete Phase 1–3 codebase. User browser data is never copied or overwritten.

## Visual direction

Flat Tech SaaS style using the canonical Phase 1 tokens: Carbon `#101114`, Mist `#EEF0F2`, Electric `#2547E8`, Violet `#5F31C4`, Lime `#C6F04A`, Steel `#55606D`. Applied after Phase 3 inside the single `omnios-unified-design-2026` stylesheet so **Settings → Classic appearance** can still disable the entire refresh.

### Calendar — master calendar (`app-parts/part-004.html`)

- All **Workspace / Week / Month / Day / Agenda** modes are retained and shown in an accessible view switcher, with explicit `aria-pressed` states.
- Consistent month/year range, Previous/Today/Next actions, input search label, and search keyboard focus retained after filter updates.
- **Month on desktop:** seven columns or five when weekends hidden; more readable day numbers, flat event strips, and overflow buttons. Today is visibly selected. The date button announces its item count to assistive technology.
- **Month on mobile:** compact date cells with 3 category-colored markers and an extra-overflow marker, and a tap target that opens the day; this prevents the month being an unreadable column of tiny event chips. The desktop event records remain unchanged.
- **Week:** scheduled event blocks, all-day lanes and time axis remain functional. On phones the existing responsive week-list is styled to match the design.
- **Day:** the existing 24-hour timeline, clickable hourly slots, and live time marker remain. The timeline scrolls within a bounded container.
- **Agenda:** clearer chronological sections, legible times and labels, and an action to schedule the first item when the range is empty.
- Calendar type filters, saved preferences, mini-month navigation, inspector/event preview, event editing, repeat options and draggable records remain integrated.

### Planner — time blocking (`app-parts/part-004.html`)

- Cleaner weekly summary, consistent date navigation and separated schedule columns on desktop.
- Active unplanned tasks remain draggable and have **two explicit accessible actions:** **Schedule…** (opens the existing time-block form) and **Auto** (uses the original free-slot scheduling algorithm).
- An **Open calendar** shortcut uses the existing OmniOS view switcher.
- On small screens, the seven-day grid becomes a full-width vertical list instead of forcing the user to pan across an 880px-wide calendar.
- Weekly Review and Annual Direction tabs are unchanged in behavior, with clearer selected states.

## Source ownership

- `app-parts/part-004.html`: only calendar and planner render templates/wiring.
- `app-parts/part-005.html`: preserve search focus on calendar re-render. No new network requests or observers.
- `app-parts/part-028.html`: CSS at the end of the existing switchable theme.
- `tests/phase4-calendar-planner.test.js`: static contracts plus DOM month-view fixture.

## Verification and release gates

Run `npm run release:source`, `npm test` and `npm run test:runtime` from the Phase 4 branch. Confirm the versioned manifest matches the exact assembled HTML.

Manually review **light and dark mode**, keyboard focus, CSS/contrast, breakpoints **360 / 390 / 760 / 1024 / 1440 px**, the five views, left tools rail, date navigation, search, drag/drop, scheduling with keyboard/mobile, event editing, month with hidden weekends, and long agenda entries. Verify no blank Calendar page or horizontal overflow.

No user-data migrations; storage, calendar filters, task IDs and reminder workflows remain intact. Merge the stacked PRs in order **Phase 1 → Phase 2 → Phase 3 → Phase 4**, with independent release checks and safe rollback via the preserved GitHub branch.

**Excluded from Phase 4:** Habits, Workout, Today, Finance, and other module redesigns.

## Stacked PR verification

GitHub Actions currently runs for PRs targeting `main`. For CI verification, PR #32 is temporarily retargeted to `main` and a documentation-only commit triggers the `synchronize` event. On success, its base must be restored to `feature/omnios-phase3-today-dashboard-2026-10-11`; the pull-request workflow does not deploy GitHub Pages.
