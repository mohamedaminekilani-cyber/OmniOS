# OmniOS Phase 08.3 + 08.4 — Startup performance and validated recovery

**Branch:** `ux/phase08-3-4-startup-resilience-2026-10-15` based on verified Phase 08 PR #52 head `2a937a4fd9773326cab5fdef7841613027a3217a`.

## Phase 08.3 — Performance

- Scoped, coalesced navigation synchronization: the Phase 02 sidebar updater previously scheduled a separate microtask for route, hash, popstate, title and click changes. This PR queues **at most one sync per microtask turn**; the first synchronous initialization and all original navigation handlers remain intact.
- Node test triggers 200 refresh signals and requires one queued synchronization, preserving final active-route accuracy.
- Expanded full-browser QA profiles **real index.html startup**, not just the assembled HTML, with one cold and three warm launches at 390 px.
- CDP collects ScriptDuration, TaskDuration, LayoutDuration, RecalcStyleDuration, heap size, node counts and resource timing where supported. Record the median of repeated warm runs; do not assert absolute CI latency or claim a speedup without a matched baseline.
- No modification to app parts, data persistence, legacy screen renderers, visual styles or the content-addressed release contents.

## Phase 08.4 — Release/cache resilience

- Keep two CacheStorage pointer records in `secondbrain-releases-v1`: the existing `__active_release__` and new `__previous_valid_release__` entry.
- On activation of a new release, archive the existing **fully checksum-verified** active pointer before committing the new pointer. Never back up an invalid payload.
- Offline startup tries active, then previous; each must pass SHA-256, content length and canonical `app.<sha-prefix>.html` filename validation. Neither unverified scripts nor corrupted cache can execute.
- No restored pointer is automatically written during recovery. Preserve personal data, IndexedDB, localStorage records, user-assets cache, and existing two-slot app-part snapshots; do not overwrite them or change the service worker.
- Browser QA uses an isolated CI profile to corrupt the active pointer, confirms boot from a validated previous release, and repairs the synthetic pointer afterward.
- Node regression tests cover valid active cache, interrupted update, damaged active pointer, both pointers corrupt, and mismatch between checksum and filename. Fail closed if no valid release is present.
- Maintains integrity-first atomic deployment, no automatic migration or background sync.

## Safety and acceptance

Run full `npm test`, assembled release/runtime verification, 1440/390/360 browser regression and 68 screenshot review, Semgrep, and offline synthetic recovery against the exact final branch head. Do not merge or deploy.
