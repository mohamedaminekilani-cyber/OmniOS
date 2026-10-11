# OmniOS design refresh — rollback and data safety

**Baseline saved before redesign:** `51c269205ca0b2b4de7e50c26cdaa901a1638654`

**Read-only-in-practice backup branch:** [`backup/omnios-pre-2026-10-11-ui-refresh`](https://github.com/mohamedaminekilani-cyber/OmniOS/tree/backup/omnios-pre-2026-10-11-ui-refresh)

**Feature branch:** `feature/omnios-unified-2026-design-system`

This is a source-code backup: it preserves the precise prior application files, styling, JavaScript and pinned release checksum. The branch was created directly at the baseline commit and should not be force-pushed or reused. Existing user records, attachments, notes, passwords and browser-local data are **not** copied into GitHub and are not modified by this UI refresh.

## Instant in-app appearance comparison

Go to **Settings → Interface style** and select **Use Classic appearance**. This switches off the new final stylesheet and saves the preference as `localStorage.omnios_visual_style_2026`. It does not clear or migrate OmniOS state. Select **Use refreshed design** to restore the new look. Note that the Dashboard's refreshed heading/capture affordance is part of the app markup and may remain while in Classic mode; a full code rollback removes those changes too.

## Full code rollback on request

After the redesign PR is merged, its GitHub squash-merge commit can be reverted through a new PR (preferred): in a local checkout of `main`, use `git revert <redesign-squash-commit>` and push a review branch. This restores all changed source files and the matching `source-release.json` in one commit; the existing CI workflow verifies and redeploys the exact previous application. Alternatively, create a rollback PR restoring the app files from `backup/omnios-pre-2026-10-11-ui-refresh`.

Do **not** run `git reset --hard` on published main or delete/overwrite current user browser data. Do not modify the baseline backup ref. After a rollback deploy, ask users to reload/accept the PWA update if an older service worker is cached.

## Design decisions

- New design changes are isolated in **`omnios-unified-design-2026`** at the end of `app-parts/part-028.html`, with one lightweight interaction block.
- Dashboard copy and quick-capture markup are in `app-parts/part-006.html`.
- The new design layer does not own app data, persistence, calculations or screen rendering.
- Both dark and light modes, reduced-motion preference, mobile safe areas, and all existing modules remain supported.
- The Home Workout illustration removal remains in force: no new exercise images.
