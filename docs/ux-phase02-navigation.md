# OmniOS UX Transformation — Phase 02 navigation
Status: **four-group navigation implemented on isolated branch; review/QA pending**.

## Intent groups
- **Today**: Today, Dashboard, Inbox.
- **Plan**: Planner, Calendar, Tasks, Projects, Routine, Habits, Goals, Reminders, Focus, Automations.
- **Life**: Life Hub, Workout, Nutrition, Finance, Grocery, Pantry, Wishlist.
- **Library**: Notes, Bible, Templates, Relations, Activity, Studio, Data Center, Passwords, Settings, Help. Unknown future or previously unclassified screens remain reachable from Library.

## Safety and compatibility
- Preserve original `data-view` buttons and move them into four sidebar groups rather than create new routes.
- Preserve `window.switchView`, `#view-*`, URL hash, app data/storage keys and existing capture modal.
- Keep original mobile dock in DOM for legacy code while presenting an accessible Phase 02 dock with Today / Plan / Life / Library / Add.
- Tapping Plan / Life / Library opens that section's accessible destination sheet. Tapping Today opens the Today group (Today, Dashboard and Inbox); no destination is hidden. The Add tab clicks `#global-add-btn`, so no new creation code or storage path exists.
- The legacy global capture FAB is hidden on mobile because the Add dock entry is present on every page. It stays available on desktop where applicable.
- The new UI uses two opt-in assets: `js/omnios-navigation-phase02.js` and `styles/omnios-ux-phase02.css`. No content-addressed app fragments or source-release manifest were modified. Both assets are precached offline in v6.
- On desktop the sidebar groups can be expanded/collapsed, with active group sync after navigation; deep links still call original routes.

## Acceptance
1. `npm test` and `npm run test:runtime` pass on Phase 02 commit.
2. `npm run test:browser` passes and **actually enters via index.html** for Phase 02 assertions; screenshots at 1440, 390, 360.
3. Test all existing sidebar destinations, groups, group drawer, keyboard and Quick Add entry.
4. Run Semgrep, inspect 390/360px no overlap, responsive light/dark.
5. Review the draft PR. **Do not merge or deploy** before explicit release approval.

## Rollback
Remove Phase 02 loader tags, CSS/JS resources and service-worker v6 asset references. No data migration is required.
