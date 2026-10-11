# OmniOS Phase 3 — Today & Dashboard

**Status: feature branch; no live deployment.** Built on the Phase 1 token foundation and Phase 2 responsive app shell.

## Purpose

Move from fragmented status boxes toward **one daily workflow**: understand today, choose what matters, see what is scheduled, capture ideas, and act. Preserve all existing calculations, storage schemas, task IDs, and integrations.

## Today (source: `app-parts/part-004.html`)

**Information hierarchy**
1. Greeting, local date, Quick Add, daily reflection.
2. Four meaningful at-a-glance metrics: due/overdue tasks, habit completion, scheduled events/focus blocks, and recorded spending.
3. Primary column: **Today's priorities** (pinned tasks or urgent/high importance) and **Today's agenda** (calendar events/focus blocks).
4. Supporting column: a compact **Inbox capture**, actionable habits, nutrition logging summary, and life signals.

All previous entry points still work: task detail, event/calendar navigation, manual habit check-in, journal reflection, Quick Add and Inbox capture. The nutrition row merely displays already calculated log totals. Empty states remain actionable and **do not occupy a fake full-screen panel**.

## Dashboard (source: `app-parts/part-006.html`)

**Information hierarchy**
1. Greeting and existing Quick Add.
2. A priority lane containing at most three open tasks, sorted for due/overdue urgency, with entry access and a Today shortcut.
3. Existing scope switcher, period filter and compact KPIs.
4. Attention list only when an attention item exists; upcoming schedule, execution stats, finance/wellness and knowledge beneath, respecting existing scope and customization options.

Priority lane uses the existing `state.entries` and `done43` completion predicate. It is a **derived view**, not a separate task database, and never writes new flags or rankings. Tasks can open through the existing detail sidebar; if unavailable, the task page remains the fallback.

## Shared layout and accessibility

The new `OMNIOS PHASE 3 / DAILY WORKSPACE AND DASHBOARD / v1` block lives **after Phase 2** inside the existing switchable stylesheet in `app-parts/part-028.html`.

- Dark/light semantic colors inherited from Phase 1; no new palette.
- Flat surfaces and subtle separators rather than glows and oversized outlined empty states.
- Desktop two-column work area, responsive two-column metrics; mobile becomes a single readable flow.
- Task rows and capture buttons remain keyboard accessible. Progress shows value text and ARIA attributes.
- No new MutationObservers, data migrations, external images, or third-party JavaScript.
- The Classic switch continues to disable the entire new design stylesheet for side-by-side comparison.

## Review and release gates

- `npm test` and `npm run test:runtime` must pass.
- Verify dark and light modes, desktop and mobile (360 / 390 / 760 / 1024 / 1440 px), keyboard focus, text contrast and no horizontal overflow.
- Manually exercise Quick Add, Inbox capture, task detail, habit toggles, daily journal, event navigation, scope/period controls, and an empty account.
- Approve and merge Phase 1 then Phase 2 then Phase 3, with production checks after each release.
- Source rollback branch: [`backup/omnios-before-phase3-2026-10-11`](https://github.com/mohamedaminekilani-cyber/OmniOS/tree/backup/omnios-before-phase3-2026-10-11), commit `09d42b76a240bdf9c0edf9f044d8aebe03c7860c`. Earlier Phase 1/2 backups remain available.

**Not part of Phase 3:** rewriting Calendar, Habits, Workout, Finance or other modules, or changing their underlying workflows. Those are later phases.

## CI routing

The verification workflow runs only when a pull request targets `main`. For automated verification, this stacked PR can temporarily target `main` and receive a documentation-only commit to trigger the `synchronize` event. After the job finishes, restore base `feature/omnios-phase2-shell-2026-10-11`. The deployment job is intentionally skipped for pull requests.
