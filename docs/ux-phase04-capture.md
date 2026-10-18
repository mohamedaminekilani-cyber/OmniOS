# OmniOS UX Phase 04 — Universal Quick Capture

Status: staged on ux/phase04-universal-capture-2026-10-14; browser acceptance pending.

## Architecture
- One universal **Capture** doorway, backed by the existing V55 natural-language parser and save path. No new user-data schema or write path is introduced.
- Capture can create Task, Event, Note, Habit, Expense, Income, Project, Goal and Journal using existing V55 code and preview. Selecting a type prefixes the text without saving; the original Save button commits.
- The existing **Quick Add** modal remains available through Browse all creation types for the additional actions (19 existing choices). No handlers are replaced.
- Existing universal Add controls (desktop global Add, Phase 02 mobile dock Add, Today New and optional V55 floating FAB) open the same natural-language dialog. Module-specific New task / New event / New habit controls are untouched.
- Direct Today Inbox capture remains quick Inbox capture intentionally; universal Add is separate.
- The old V55 shortcut can continue opening capture; a body *direct-child-only* observer decorates that same dialog. No repeated subtree observers.
- Restore via deleting Phase 04 assets and loader references and rolling SW v8 assets back to v7; no app data migration. Original content-addressed HTML remains unmodified.

## Acceptance
- Real-loader browser QA: mobile Add, desktop global Add, type chip updates V55 preview, Browse all types opens the legacy modal with existing creation actions, no duplicate dialog, 1440/390/360 responsive.
- App regression suite, runtime checks and Semgrep pass on exact commit.
- PR remains draft. No merge or deploy without explicit approval.
