# OmniOS Phase 09 — Production release hardening and gate

Release candidate: PR #53. Source commit `edd6eb662748f52780318be0f0b12b753480e091` before adding this checklist.

## Dependency reconciliation
- PR #49 Phase 07, #50 latest Phase 06, and #51 integration are **superseded** by PR #53's full integrated tree. Do not merge overlapping source PRs separately.
- PR #52 Phase 08 is an ancestor of PR #53. One integrated merge into `main` avoids duplicate UX loader scripts and conflict-prone cherry-picks.
- `main` had one additional merged Phase 00 commit; GitHub reports the integration PR mergeable. No force pushes.

## Acceptance checklist
- Browser (desktop 1440, mobile 390/360), original edit actions, Life Hub, Calendar, Notes, Workout, Diet, Finance, captures, routes, and offline recovery verified with the full QA runner.
- Release manifest remains SHA-256 content-addressed. Source-app parts, user records and schema are unchanged; verified previous-release fallback added.
- Synthetic interrupted update, corrupt active pointer, blocked release network, 1,000 test records and fail-closed tests passed.
- Semgrep and release/runtime CI must pass on the final release candidate. Check the exact post-merge commit and production URL again.
- Production must only be released by the existing protected `main` workflow, using its validated build and deployment configuration. If deployment cannot be verified, stop and report.

## Rollback
- GitHub: revert the single integration merge commit, then run the production deploy workflow on `main`; do not revert unrelated commits.
- Browser: verified previously cached release can load if a bad active pointer or payload is encountered; does not erase any personal data.
- Netlify: retain the previous published deploy as rollback candidate. Do not delete existing app data, storage, encrypted records or caches in order to roll back.

## Final operational checks
- Production responds, release.json matches new build, scripts and navigation load, mobile screens have no blocking error, and no unexpected login or snapshot reset.
- Preserve old draft PRs as historical review artifacts (no separate merge). Record release merge commit and deployment evidence.
