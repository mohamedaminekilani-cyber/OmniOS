# OmniOS UX Phase 06 — Life Hub consolidation

Implementation staged on `ux/phase06-life-hub-2026-10-14`, stacked on Phase 05.

## Canonical renderer retained
- The V43 Life Hub renderer is already the source of truth, and V35 delegates to it. Do not create a third renderer, duplicate the Life Hub state or delete older functions without complete dependency audit.
- Preserve all ten V43 domains: People, Health, Home, Documents, Administration, Education, Travel, Money, Journal and Automations.
- Preserve all original record creation, editing, deletion, quick add, filtering, notes and navigation handlers; no new persistence or storage schema.

## Phase 06 changes
- Add a lightweight, responsive **Related tools** navigation row linking to Workout, Nutrition, Finance, Grocery, Pantry and Wishlist through `window.switchView`; these remain distinct modules.
- Add proper keyboard access and role/labels to the existing actionable Overview cards and attention rows. Key activation calls the existing click handler, not a duplicate handler.
- Retain the existing desktop domain rail and native mobile domain select. Label them and mark the current section for accessibility.
- Tighten and standardize compact mobile cards and tool hit targets, without replacing the V43 card grid or its domain detail pages.
- Observe only direct child changes on the Life Hub view and current content container, restoring interaction enhancements after V43 rerenders. No global MutationObserver or extra writes.
- Use separate `js/omnios-life-phase06.js` and `styles/omnios-ux-phase06.css`, linked into the actual app loader and precached in service-worker shell v10.

## Acceptance
- Pass Node tests, runtime, Semgrep and real-loader browser QA on the **exact final commit**.
- Confirm the canonical V43 hero appears once, desktop rail is visible, mobile native select works, and all ten domains stay reachable.
- Confirm a domain card opens via keyboard, Overview returns, existing related Life modules open and preserve their data.
- Review screenshots at 1440, 390 and 360px; no horizontal overflow, duplicate Life Hub or runtime errors.
- Review stacked PRs #43–#47 before any merge. No deployment or data migration.

## Rollback
Remove Phase 06 stylesheet/script injection and service-worker v10 references. Stored records remain unchanged.
