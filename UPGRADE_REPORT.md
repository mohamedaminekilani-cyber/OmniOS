# Second Brain reliability upgrade — 25 September 2026

This release builds on stabilization commit `b4ca34b`. It preserves the existing app and data formats while introducing a new sync protocol and release packaging. It is not a claim that every workflow on every physical device has been tested.

## Changes in this release

- Field revisions replace device-clock comparisons. Independently edited nested records can merge; deletions remain in revision history. Up to 200 differing field alternatives are retained locally and can be reviewed/exported in Data Center.
- Sending and receiving both respect selected categories. Passwords, encrypted vaults, push credentials and transport identity remain device-local.
- Incoming merges are serialized, take a recovery snapshot, rebase changes made during that snapshot, verify local storage and await the IndexedDB transaction. Failure restores the prior document and auxiliary values where storage permits.
- Transfers use bounded 8 KB frames, UTF-8 byte lengths, SHA-256 integrity checking, duplicate suppression, incomplete-transfer limits and data-channel backpressure. Missing save acknowledgments produce a visible timeout rather than permanent sender deduplication.
- The relay uses an independent bearer capability derived from the pairing secret, validates the capability against the channel, restricts browser origins, limits request bodies and excludes expired messages. Scheduled cleanup removes expired relay blobs even after a session closes.
- The Passwords page provides AES-256-GCM encryption using PBKDF2-SHA-256 with 600,000 iterations. Setup encrypts existing credentials and historical snapshot credentials. Keys remain in memory; the vault locks when hidden or after five minutes. Legacy entries are not encrypted until the owner chooses a passphrase in the app.
- Backup import validates structure, saves a pre-restore recovery point and attempts rollback of state, auxiliary storage and user assets on failure. General backup exports explicitly report excluded legacy plaintext passwords. Encrypted vaults are included in portable backups.
- Undo detects changes across all top-level state modules. Storage failures are surfaced instead of allowing later success UI to run.
- Deployment produces one immutable application file with a SHA-256 release manifest. All local application scripts are embedded in that release, avoiding mixed-version fragments. A verified installed release opens first; complete updates stage in the background.
- Today prioritizes the agenda before secondary intelligence cards and hides redundant daily summary cards. Keyboard focus, reduced motion, mobile input sizing, vault labels, disconnect controls and byte-based transfer feedback are improved. A repeated habits UI mutation was removed.
- Data Center exposes sync alternatives and diagnostics containing counts/capabilities, without record contents or credentials.
- Push registration limits payload size and accepts only supported HTTPS push-service endpoints. Dispatch retains enough recent receipts to avoid the previous 600-item truncation edge case.
- CI parses the assembled application rather than isolated fragments, runs behavioral regression tests, and exercises offline startup plus synthetic vault migration.

## Audit coverage

| Original findings | Status and evidence |
|---|---|
| 01 backup completeness | Existing stabilization adds auxiliary data/assets. This release adds restore rollback and explicit legacy-password exclusions. |
| 02, 05, 09 nested edits, tombstones, clocks | New field-revision core; regression tests cover independent edits, stale third-device deletion and clock independence. |
| 03, 38 password security | Secure generator preserved; encrypted migration and wrong-passphrase/tampering tests added. Owner setup remains necessary. |
| 04, 10, 12 persistence, concurrency, early deduplication | Serialized durable merges and post-apply receipts; failure and asynchronous-rebase tests. Physical two-device validation remains open. |
| 06 Bible reload | Existing reload hook called after committed sync/restore. Auxiliary structured fields use the same revision core. |
| 07, 08 identity and page selection | Receive-side scope tests and exclusions for device metadata. |
| 11 large messages | Common bounded transfer protocol now covers Internet, raw RTC, assisted peer and relay paths. Multi-megabyte Unicode regression test. |
| 13–17 relay and connection reporting | Visible phases, transfer bytes, disconnect controls, confirmed HTTP writes, string cursors, capabilities, limits and cleanup. Infrastructure-level abuse quotas remain outside this patch. |
| 18–20 release loading/offline | Immutable verified build and cache-first installed release; existing script-query fallback preserved. Real iPhone offline-upgrade testing remains open. |
| 21–22 IndexedDB and recovery | Existing transaction-completion helpers retained; durable sync now awaits them. Generic undo coverage and rollback added. Auxiliary data restoration uses snapshots, not session Undo. |
| 23–24 push registration | Existing CORS/owner-token fixes preserved; endpoint/body validation added. |
| 25 tests | Syntax, 17 behavioral tests and full-app offline/vault runtime check. |
| 26–29 branding, Today, hydration, calendar | Existing Second Brain branding, canonical hydration and calendar-width fixes preserved; Today order and duplicate summary visibility improved. |
| 30 locale | Existing week-start preference and short-month behavior retained. Full cross-module locale/time-zone consolidation remains open. |
| 31–32 accessibility | Existing dialog isolation retained; focus, motion, input sizing and new vault controls improved. Full screen-reader audit remains open. |
| 33 monthly routines | Existing short-month clamping retained. |
| 34 rendering | One repeat-mutation issue removed. Full workspace render architecture still needs incremental conversion. |
| 35 snapshot retention | Existing separate pre-sync retention preserved. |
| 36 multiple tabs | Storage-event propagation and Web Locks serialization added; simultaneous physical-browser conflict matrix remains open. |
| 37 Focus Guard | Existing honest PWA/native distinction retained. Native system-wide blocking requires an iOS host and entitlements. |
| 39 missed push | Existing 24-hour missed-reminder recovery preserved; receipt truncation improved. Physical push delivery remains unverified. |
| 40 patch ownership | New data, transport, vault and build responsibilities extracted into modules. The inherited UI patch stack has not been fully rewritten. |

## Verification and operational notes

Run `npm test` and `npm run test:runtime`. The latter builds the release, starts the full app with an offline DOM/IndexedDB environment, migrates a synthetic credential, checks persisted ciphertext, and decrypts it to prove no credential loss. No real user credentials are used in tests.

Both devices must refresh to protocol 2 before pairing; older pairing codes must be regenerated. The relay backend must be deployed with the client because protocol 2 uses bearer capabilities.

Recovery cannot guarantee rollback if the browser rejects all writes (for example, denied storage or severe quota exhaustion). Errors remain visible; recovery snapshots and portable exports are the fallback. Encryption does not protect an unlocked vault against a compromised app origin or malicious browser extension.

Remaining work requiring separate validation or platform support: real two-iPhone/iPhone-PC transport and push tests, native Screen Time enforcement, a complete responsive/screen-reader matrix, per-service abuse quotas, exhaustive locale/time-zone consolidation, lazy Bible asset loading, incremental rendering and removal of the inherited UI patch layers. These are explicitly not reported as completed.
