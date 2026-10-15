# OmniOS UX Phase 08 — Performance and reliability (first slice)

**Source:** Phase 07.1 draft PR #51, exact parent `af0779abaf62629d4d74f9581f18fc3e31ccd511`.
**Branch:** `ux/phase08-performance-2026-10-15`.
**Safety:** independent draft PR; no merge/deployment, no user state edits, no persisted data migration, no changes to content-addressed application fragments or `source-release.json`.

## Baseline audit
- Phase 06 Life Hub observed both the view root and each new V43 content container, but its `WeakSet` only prevented duplicates for one container. It did not explicitly disconnect an observer when that container was replaced.
- Phase 07 module decorations created three independent direct-child observers for Diet, Finance and Notes. Most repeated refreshes redundantly wrote identical accessibility attributes.
- The existing Phase 07.1 browser runner measured responsive correctness but did not record navigation-to-painted-frame timing.

## Changes
1. Keep **one current Life Hub content observer**. When V43 replaces `#v43-life-content`, disconnect the prior one and observe the new content; disconnect it if the shell or content disappears.
2. Replace unchanged Life Hub and module ARIA attribute writes with equality-guarded setters. Original handlers, role semantics, click routing and DOM structure are unchanged.
3. Observe Diet/Finance/Notes via **one shared** `MutationObserver` with exactly three direct-child `observe(...,{childList:true})` registrations; no subtree scans.
4. Capture startup timing and six route-to-painted-frame samples at 390 px in real-browser QA. Collect telemetry only (no artificial hardware-dependent time threshold), and continue to fail on broken routing or horizontal overflow.
5. Add behavioral Node regression coverage for detaching stale observers, coalesced refreshes, selected-state updates and unchanged ARIA writes.

## Follow-up audit (not assumed fixed)
- Audit Phase 05 Calendar's microtask plus animation frame decoration and its need for legacy repaint compatibility.
- Profile heavy legacy modules and startup assembly on slow mobile devices. Avoid deleting old V35/V43 renderers without full dependency mapping.
- Keep offline PWA cache and snapshots, encrypted persistence, saved records, visual appearance and mobile navigation unchanged.
- Compare QA screenshot artifacts at 1440, 390 and 360 against Phase 07.1 images before any release consideration.

## Acceptance
Run `npm test`, `npm run test:runtime`, `npm run test:browser`, and Semgrep for the exact PR head. Review screens and the new `performance08` report section. **Do not merge or deploy.**


## Phase 08 continuation — Calendar and offline reliability (2026-10-15)

### Calendar scheduling
- The Phase 05 adapter used to decorate the same toolbar unconditionally in both a microtask and an animation frame. It now retains the immediate microtask for responsive semantics and uses its single coalesced frame as a **conditional repair** when an old renderer changes the toolbar reference, mode, mobile display, or hides the buttons after that microtask.
- Repeated refresh events share one pending microtask and at most one animation frame. The same original five V36 mode buttons remain in the DOM.
- Unchanged ARIA, gridcell roles, day labels, responsive inline display and month status no longer generate redundant attribute/style writes. A previously marked today cell is unmarked if its role changes; no calendar events, dates, filters or saved state are modified.
- Behavioral Node tests verify duplicate scheduling is skipped and late mobile suppression is restored. Real-browser QA explicitly hides the existing center/Month button at 390 px and verifies recovery without duplicates or overflow.

### Offline recovery checks
- Exercised the existing service worker offline behavior without changing `sw.js`: navigation falls back to the cached shell, scripts resolve from shell cache, uncached resources fail closed, and authenticated/API requests bypass offline cache.
- Verified service-worker activation retains user-assets and `omnios-app-snapshot-*` records and that app-part/release files remain exclusively owned by the release snapshot loader.
- No new storage, migration, or caching layer was introduced.

### Remaining performance work
- Collect comparable repeated measurements across cold/warm starts, rather than attributing an improvement to a single CI timing.
- Profile original content-addressed app-part renderers, startup assembly, images, and long tasks; avoid broad removals that threaten offline release atomicity.
- Continue expanding persistence recovery tests with synthetic data only.

**Validation:** Node `npm test`, runtime, 1440/390/360 browser QA, Semgrep and screenshot comparison must all pass on the exact Phase 08 continuation commit. No merge or deploy.
