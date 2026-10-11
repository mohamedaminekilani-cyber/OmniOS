# OmniOS — Phase 5: Habits, Routine & Workout

**Status:** development feature branch, based on Phase 4 (not merged into production).

**Rollback snapshot:** `backup/omnios-before-phase5-2026-10-11` at `c258f4fef055e3ecdff86dd35caeff8129673586`, preserving all Phase 1–4 code. The backup is a GitHub *source snapshot*, not a copy of personal browser data.

## Design contract

Use Phase 1's exact six Tech SaaS palette colors: Carbon `#101114`, Mist `#EEF0F2`, Electric `#2547E8`, Violet `#5F31C4`, Lime `#C6F04A`, Steel `#55606D`, plus semantic neutral surfaces. **Lime always uses Carbon foreground**, never white. No shadows, glassmorphism, neon or external fitness images. Maintain WCAG AA foreground contrast, focus visibility, and min. 44px mobile controls.

## Habits

- Simplify weekly metrics into consistency, completed today, best streak and current streak, with a semantically labeled progress meter.
- Keep the original week and month tracking records unchanged. Overview supports one-tap check-in, heatmap and habit detail; month retains every day as a button.
- Restrict cycling accents to the approved palette; completed-day controls use a universal Lime fill with Carbon text.
- Announce day completion through `aria-pressed` and highlight the current date with `aria-current="date"`.
- Preserve habit creation, editing, detail notes, week/month navigation and historic logging.
- Empty state provides an actionable **Create a habit** button.

## Routine

- Reduce lengthy hero copy and visually prioritize today's steps.
- Keep Today, Daily, Weekly, Monthly and All views. Tabs announce their selected state.
- Display progress for the current filtered routine cycle as an accessible 0–100% meter.
- Grid of compact routine cards on desktop, readable single-column cards on mobile.
- Step buttons announce their checked status; linked steps still open Tasks, Workout, Habits, Notes, Calendar and other modules.
- Existing cycle reset, step linking, routine creation, edit and delete behavior remains unchanged.

## Gym workout

- Focus active session around progress, exercise cards, set table and rest actions.
- Preserve weight, reps, RPE, done state, adding/removing sets, personal records, templates, analytics, membership and history.
- Set completion controls announce `aria-pressed` and a meaningful exercise/set label.
- Set tables are contained in horizontally scrollable cards if there is insufficient mobile space; no page-wide horizontal overflow.
- Gym progress is an accessible progressbar, and navigation tabs expose their active state.

## Home Workout

- Keep **21 bodyweight exercises**, starter/custom plans, repetition and time targets, session queue, actual set tracking, timed exercises, adjustable rest timer, history and per-exercise progress.
- Remain **image-free**; no external exercise artwork or CDN dependency.
- Distinct main active exercise and adjacent queue on desktop; stacked on mobile.
- Add accessible timer group/label roles and completion state without changing the clock engine or stored workout data.

## Source ownership / performance

- `app-parts/part-002.html`: summary and gym renderers.
- `app-parts/part-004.html`: modern overview and monthly habit cards.
- `app-parts/part-028.html`: Routine renderer and one **final scoped Phase 5 CSS block inside the existing switchable unified stylesheet**.
- `js/home-workout.js`: passive ARIA improvements only.
- `tests/phase5-habits-routine-workout.test.js`: focused contracts, DOM fixture, safety checks.

No new data migrations, MutationObservers, setIntervals, network requests, runtime dependencies, images or bespoke state stores. **Settings → Interface style → Classic** still toggles the unified UI layer off.

## Verification and release gates

CI: regenerate `source-release.json`, run `npm test` and `npm run test:runtime`; the versioned release checksum must match the assembled source.

Human UI checks before merging: **360, 390, 760, 1024, 1440 px**, dark/light contrast, tap targets, habit date toggles, routine cycle reset, step links, gym set editing/RPE/rest, Home Workout timed sets + adjustable rest, history charts, modal close and no horizontal page overflow.

Pull requests remain stacked: Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5. Merge each stage only after visual review and verified rollback, without overwriting personal app records. **Next planned phase:** remaining modules.
