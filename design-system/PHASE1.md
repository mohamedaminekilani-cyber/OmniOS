# OmniOS — Phase 1 design foundation

Status: **implementation branch / review only**. This phase does not move navigation, restructure page layouts, or migrate user data.

## Why this exists

The application has many successive UI generations (base, v35, v43, omr, omx). Phase 1 provides a **single semantic contract** for new work and a compatibility bridge for common legacy colors. It must be the *last section* of the switchable `omnios-unified-design-2026` stylesheet in `app-parts/part-028.html`, between `OMNIOS PHASE 1 FOUNDATION / v1` and `END OMNIOS PHASE 1 FOUNDATION / v1`. Do not append new page-specific overrides inside this foundation; those belong to future phases and separate module work.

This is the canonical source of Phase 1 component CSS. No extra network stylesheet is fetched; it is embedded in the existing release-atomic HTML. Existing **Settings → Interface style → Classic** disables it along with the current unified design layer.

## The reference palette

| Token | Hex | Intended use |
| --- | --- | --- |
| `--ds-carbon` | `#101114` | Dark canvas; foreground on Lime |
| `--ds-mist` | `#EEF0F2` | Light canvas; foreground on saturated backgrounds |
| `--ds-electric` | `#2547E8` | Primary action background with white text |
| `--ds-violet` | `#5F31C4` | Secondary emphasis and hover background |
| `--ds-lime` | `#C6F04A` | Positive status fills (only with Carbon ink) |
| `--ds-steel` | `#55606D` | Secondary text in the light theme |

Semantic variables for surfaces, text, statuses, borders and focus adapt between dark and light. Primary CTA text is always `#FFFFFF`. Dark mode accent **text** uses a lighter violet (`#E8DFFF`) on a dark accent surface for legibility. Lime-on-Mist text is forbidden.

## Reusable tokens

- **Surfaces:** `--ds-canvas`, `--ds-surface`, `--ds-surface-raised`, `--ds-surface-hover`, `--ds-line`, `--ds-line-strong`.
- **Text:** `--ds-text`, `--ds-text-secondary`, `--ds-text-muted`.
- **Actions:** `--ds-primary`, `--ds-primary-hover`, `--ds-on-primary`, `--ds-focus`.
- **Feedback:** `--ds-accent-surface`, `--ds-accent-ink`, `--ds-success`, `--ds-on-success`, `--ds-danger`, `--ds-warning`.
- **Spacing:** `--ds-space-{0,1,2,3,4,5,6,8,10,12}` (4–48 px scale).
- **Shape:** `--ds-radius-{xs,sm,md,lg,pill}` (5–12 px, pill for rare cases).
- **Typography:** `--ds-font`, `--ds-text-{xs,sm,md,base,lg,xl,2xl}`, `--ds-line-{tight,body}`, `--ds-weight-{medium,semibold,bold}`.

Use tokenized values, never hard-code reference colors into new components. Reserve accents for intent.

## Component inventory and API

| Primitive | Example | Contract |
| --- | --- | --- |
| Button | `<button class="ds-btn ds-btn--primary">` | Primary, quiet, danger, small, square; disabled and focus-visible |
| Field | `<label class="ds-field"><span class="ds-field__label">Name</span><input class="ds-input"></label>` | Label, hint, `aria-invalid="true"`, error hint |
| Select / textarea | `ds-select`, `ds-textarea` | Same heights, typography and focus ring |
| Card | `<article class="ds-card">...` | Flat border, 12px radius; compact / flat variants |
| Tabs | `<div class="ds-tabs" role="tablist"><button class="ds-tab" role="tab" aria-selected="true">...</button></div>` | Scrolls horizontally; keyboard behavior owned by app JS |
| Badge | `ds-badge ds-badge--success` | Neutral, success, danger, warning, accent |
| Progress | `<div class="ds-progress"><span style="--ds-progress:60%"></span></div>` | Width is a CSS custom prop; caller must supply accessible label |
| Dialog | `ds-dialog`, `ds-dialog__header`, `ds-dialog__footer` | Responsive width/height; app JS owns focus trap and close handlers |
| Feedback | `ds-state`, `ds-state--error`, `ds-alert`, `ds-skeleton` | Empty, loading, error, success; reduced-motion support |
| Accessibility | `ds-sr-only` | Screen-reader-only text; explicit focus-visible treatment |

Common legacy classes (`.btn`, `.btn-primary`, `.form-input`, `.card`, `.v35-card`, `.v43-card`, `.v43-badge`) receive compatible base styles while keeping their existing behavior. **Do not rename legacy classes globally in Phase 1**; later phases can migrate them page by page.

## Quality gates

1. AA contrast for regular text (at least 4.5:1); at least 3:1 for non-text visual controls and large text.
2. At least 44px interaction targets on phone for new foundation buttons/tabs/fields (desktop default 40px).
3. Dark and light appearance, focus/hover/disabled states and reduced-motion handling.
4. No gradients/glows/elevation shadows in foundational cards/actions.
5. No changes to app data, encrypted vault, sync, or task/calendar logic.
6. Test a representative existing legacy form/modal and one new `ds-*` component at common screen widths before any production release.
7. Run `npm test` and `npm run test:runtime` on the feature branch. Merge only after reviewing the diff and real-device visual samples.

## Rollback

**Baseline:** `ebf1b7219dd8b30997ec4f118313d101ae8932b9` preserved at [`backup/omnios-before-phase1-2026-10-11`](https://github.com/mohamedaminekilani-cyber/OmniOS/tree/backup/omnios-before-phase1-2026-10-11).

This branch backs up source and release manifest, not the user's browser-local data. To undo Phase 1, revert its eventual squash merge or restore the baseline source through a review PR. The in-app **Classic** appearance switch disables the unified layer for visual comparison and does not modify saved records.

## Boundaries

**Included:** colors, type, spacing, primitive components, statuses, accessibility states and compatibility tokens.

**Deferred:** sidebar/topbar structure (Phase 2), Today/Dashboard information hierarchy (Phase 3), calendar layouts (Phase 4), habit/workout screen architecture (Phase 5), and remaining views (Phase 6).
