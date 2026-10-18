# OmniOS UX Phase 06 — Life Hub consolidation

Status: staged on `ux/phase06-life-hub-2026-10-15`, with browser review required.

## Canonical authority and data safety
The existing v43 Life Hub is the **only record renderer/editor**. Its domains are Overview, People, Health, Home, Documents, Administration, Education, Travel, Money, Journal and Automations. Phase 06 does not modify `state.life`, persistent storage keys, record schemas, or the hashed assembled release.

## UX updates
- Unify Life Hub's presentation around its existing hero, ten-domain rail, searchable record views, edit/delete actions and responsive select.
- Add one clearly labeled “Your everyday life” navigation row for the separate Workout, Nutrition, Finance, Grocery, Pantry and Wishlist modules, using the existing `switchView` routes rather than duplicate summaries or records.
- Keep the original v43 domain buttons and section select authoritative; expose non-destructive `OmniLife06.openDomain(id)` and `openModule(id)` for future shortcuts.
- Make Overview cards and attention rows keyboard-accessible via Enter/Space, and mark the active rail destination using `aria-current`.
- Maintain one view-level child-list observer to redecorate controls after the existing renderer replaces the view DOM; no global subtree observers.
- Allow all six module shortcuts to wrap into responsive grids on mobile; existing data editors and original screens remain untouched.
- Separate CSS and JS are loaded after the content-addressed app via the actual index shell and precached in service worker shell v10.

## Release acceptance
1. Node regression, runtime, browser and Semgrep checks green on the exact head commit.
2. Browser screenshots at 1440, 390 and 360px with no page-wide horizontal overflow.
3. Navigate ten domains, verify current domain select and keyboard card actions, open each of the six standalone Life modules and return.
4. Verify original record creation/edit, deletion confirmations and saved data persisted without change.
5. Confirm offline bootstrap and safe rollback. **No merge or deployment** without a reviewed release decision.

## Rollback
Remove the Phase 06 loader CSS/JS references and service-worker additions, restore previous v9 cache contract. No user data migration required. This PR is stacked on Phase 01–05 draft work.

## Phase 07.1 integration (2026-10-15)
- Selected PR #50's updated six-card Life Hub shortcut presentation and original V43 domain API as canonical.
- Preserved Phase 07's bounded direct-child content observer and compatibility `canonical` / `relatedTools` exports for existing consumers.
- Loaded **only** `js/omnios-life-hub-phase06.js`; the older `js/omnios-life-phase06.js` was removed from the integration branch to avoid duplicate bridge code.
- Preserved all existing personal records, local storage keys, V43 renderers, and the content-addressed source release manifest.
- Phase 07 mobile Notes/Finance/Workout/Nutrition/Habits enhancements remain unchanged.
- Review branch only; do not merge or deploy.
