# OmniOS — Phase 0 audit and protected baseline

**Audit date:** 2026-10-11  
**Scope:** structural UI, legacy styling, page inventory, deployment reliability, data safety, and test gaps.  
**Frozen production baseline:** `ebf1b7219dd8b30997ec4f118313d101ae8932b9`  
**Protected-by-convention backup ref:** `backup/omnios-phase0-baseline-2026-10-11`  
**Audit branch:** `audit/omnios-phase0-2026-10-11`

> This is a source-code backup, **not** a backup of each user's browser-local records or device storage. No changes to the live UI or users' stored data are made in Phase 0. Keep the backup ref immutable; continue to use OmniOS's own export/restore flow for personal data safety.

## Current baseline verified

- The production workflow **Deploy Second Brain live**, run **38123483311**, completed successfully on this exact commit, with successful `verify` and `deploy-live` jobs.
- CI reported **70 tests passed**, **0 failed**, consistent source manifest, and **30 application screens successfully navigated** in the jsdom runtime test.
- Runtime coverage verifies encrypted password vault migration, absence of plaintext credentials in saved state, notes CRUD/caret preservation, and basic screen navigation. These tests provide a good functional baseline; they do **not** measure visual layout on actual desktop/mobile browsers.
- Published `source-release.json`: SHA-256 `9157145065093aea5fafe1055e063a5277262471e1de5541bbc4963605882ff7`, release size **3,514,134 bytes**, assembled from 13 nonempty HTML source parts and 7 JS modules.
- The build is source-atomic: `scripts/release-source.mjs` concatenates nonempty `app-parts`, inlines local JS modules, hashes the resulting HTML; `scripts/build.mjs` packages the exact release; `index.html` validates and activates updates. The deploy workflow runs `npm test && npm run test:runtime` before publishing.

## Source inventory (static counts)

| Metric | Finding | Meaning |
| --- | ---: | --- |
| HTML startup + source fragments | 14 nonempty files | 13 app parts + `index.html` |
| Embedded style blocks | 148 | Multiple generations share cascade ownership |
| Embedded script blocks | 91 | Several parallel initialization/feature lifecycles |
| `!important` occurrences | 7,174 | High specificity debt; hard to reason about precedence |
| `@media` occurrences | 307 | Repeated breakpoints and mobile layout authorities |
| `MutationObserver` construction occurrences | 41 | **Static occurrences**, not 41 concurrently active observers |
| `DOMContentLoaded` occurrences | 57 | Numerous startup bindings require lifecycle audit |
| Dominant source fragment | `app-parts/part-028.html` | ~796 KB; 61 style blocks, 35 inline scripts, ~5,920 `!important` occurrences |

These are source-code occurrence counts, not proof that every rule is currently active or every observer instantiated. Repeat the measurements with `node scripts/phase0-ui-inventory.mjs` from the repository root.

## Page and component map

**Navigation.** The sidebar source exposes 30 destination buttons. The mobile dock has four primary destinations (Dashboard, Calendar, Tasks, Habits) and a **More** button/drawer for additional modules. The jsdom smoke test exercised 30 actual screens.

| Area | Existing destinations / main UI | Migration dependency |
| --- | --- | --- |
| Daily planning | Today, Dashboard, Inbox, Planner, Calendar, Tasks, Reminders | Shared shell, task state, schedule renderer |
| Habits and wellbeing | Habits, Routine, Workout / Home Workout, Nutrition, Focus | Shared progress components and records |
| Life management | Life Hub, Goals, Projects, Bible, People | Domain lists, details and navigation |
| Organize and finances | Notes, Finance/Budget, Grocery, Wishlist, Pantry | Filters, forms, tables, exports |
| System and advanced tools | Data Center, Activity, Templates, Relations, Automations, Studio, Passwords, Settings, Help | Saved state, encryption, dialogs, sync and backups |

**Shared components to centralize in Phase 1:** buttons, text inputs/selects, cards, summary metrics, tabs, toolbar, page title, sidebar/dock, badge, toasts, dialogs, list rows, empty/loading/error states, responsive grid, calendar surface and settings sections.

**Current competing styles:** the `omnios-unified-design-2026` block contains **OmniOS REMAKE v1** and **OMNIOS PRODUCT REMAKE / v2** inside one switchable CSS layer, while many older `v35`, `v43`, `v64`–`v109` styles remain loaded earlier. The Classic switch is still relevant for comparison, but merely adding a final override will perpetuate this conflict.

## Cascade overlap — priority evidence

The following selectors appear across multiple *separate style blocks* (including broad references; counts are not necessarily direct identical declarations):

| UI surface | Style blocks mentioning selector |
| --- | ---: |
| `.nav-item` | 27 |
| `.modal` | 26 |
| `#view-master-calendar` | 22 |
| `.sidebar` | 21 |
| `.topbar` | 20 |
| `.mobile-nav` | 20 |
| `.view-container` | 17 |
| `.btn-primary` | 10 |
| `#view-habits` | 8 |
| `#view-today` | 7 |
| `#view-workout` | 6 |
| `#view-dashboard` | 5 |

**Interpretation:** more overriding CSS is not a durable fix. Before restyling any component, identify the canonical renderer, remove or isolate obsolete ownership, and replace the old rules with a single semantic-token component definition.

## Prioritized Phase 0 findings and recommended remediation

**P0 — preserve data and a known-good release.** The backup ref is pinned. Do not change `state` storage keys, encrypted vault structures, sync protocols, migrations, export/import or service-worker cache activation during visual migration. Test backup restore using **synthetic** data before any rollout. Do not use a Git branch as a replacement for personal user-data exports.

**P0 — eliminate conflicting CSS authority deliberately.** Large amounts of `!important`, particularly in `part-028`, obscure intended hierarchy. Create a migration map from legacy styles to tokens/components, followed by removal of the replaced blocks (not another overriding block). Keep dark/light semantics paired and inspect cascade on real elements.

**P1 — audit observer and startup lifecycles.** There are 41 statically detected observer constructors and 57 `DOMContentLoaded` occurrences. Measure actual active observers, rerender frequency, and long tasks in Chromium before deduplicating; blindly deleting observers could break dynamically created pages or input controls.

**P1 — mobile and calendar fidelity.** Calendar is referenced by 22 style blocks, including several mobile-specific fixes. Test 320 / 360 / 390 / 768 / 1024 / 1440 px, portrait/landscape where relevant, safe-area insets, month/week/day modes, event edit, navigation, sticky headers and scroll containment.

**P1 — rendered accessibility.** Existing tests enforce some palette/text tokens and keyboard behaviors, but static regex checks do not validate final computed contrast, tap targets, focus order, or forced-colors behavior. Add browser-level axe/accessibility scans and screenshots for both themes. Require text ≥4.5:1, non-text UI ≥3:1, minimum 44px coarse-pointer controls, no keyboard traps.

**P1 — coherent content hierarchy.** Replace repeated nested cards and empty dashed panels with deliberate summaries and compact empty states. Keep users' tasks, workouts and habits connected to their existing data rather than new parallel display models.

**P2 — potential ID collisions.** A source-string scan finds repeated ID tokens (some are within *alternative render templates* or interpolation placeholders). Existing named style/script ID tests pass. Add a real DOM duplicate-ID scan **per activated screen** before calling these collisions bugs.

**P2 — instrumentation and performance.** Measure startup to usable screen, DOM node counts, observer callback volume, long tasks, scroll jank, mobile memory, and time between tab switches in a real browser. Current jsdom smoke testing does not establish these metrics.

## Test coverage and gaps

| Existing gates | Not yet proved |
| --- | --- |
| Source checksum and atomic release validation | Full browser screenshot snapshots across breakpoints |
| 70 Node/jsdom tests, vault and notes workflows | Computed styles and real WCAG contrast throughout pages |
| Navigation through 30 screens | Cross-device scroll behavior and touch ergonomics |
| Some keyboard/modal behavior tests | End-to-end keyboard tours, screen-reader experience |
| Existing mobile authority/source checks | Real mobile Safari / Android rendering and PWA update visuals |

**Recommended visual baseline capture before Phase 1:** for both dark/light themes, capture Today, Dashboard, Calendar (month/day), Tasks, Habits (month/year), Workout (home/session), Finance, Notes, Life Hub and Settings at mobile (360/390 px), tablet (768 px), and desktop (1440 px); note empty vs populated states. These screenshots have **not** been captured by this audit and should not be described as completed.

## Phase 0 acceptance / next gate

- [x] Exact production commit recorded and independent backup branch created
- [x] Current production CI status and release checksum verified
- [x] Source layout, navigation and major page types inventoried
- [x] CSS overlap and lifecycle hot spots quantified
- [x] High-risk data and release workflows identified
- [x] Read-only repeatable inventory script and transitional regression checks added on a review branch
- [ ] Audit PR verified with its own CI result
- [ ] Real browser screenshots, performance traces and pixel-overflow checks (require browser/device access)

**Phase 1 may start after the audit PR passes and the team selects a canonical component ownership plan.** Do not begin by adding yet another global CSS override. No production styling or data code is modified by Phase 0.
