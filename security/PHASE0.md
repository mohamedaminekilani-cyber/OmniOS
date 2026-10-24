# Phase 0 — OmniOS security triage and immutable-reference baseline
Date: 2026-10-11

## Scope and evidence
- Repository: `mohamedaminekilani-cyber/OmniOS`.
- Exact baseline `main` commit: `dce919f0bd33bc576bdf8bc3849e4a8c4acc5de8`.
- Verified source-only rollback branch: `backup/omnios-before-security-remediation-2026-10-11` points to that exact SHA. **Git branches can move**: use the commit SHA for exact restoration.
- Triage-only working branch: `security/phase0-triage-baseline-2026-10-11` started at the same SHA.
- Latest baseline Semgrep run: https://github.com/mohamedaminekilani-cyber/OmniOS/actions/runs/38170040086 (passed).
- Source scan report artifact: `semgrep-security-reports` (GitHub Actions artifact 11713996273; 14-day retention, ending 2026-10-25).
- Files inside artifact: `semgrep.sarif`, `semgrep-inline.json`, `.semgrep-inline/manifest.json`.
- Exact 43-entry inventory: [phase0-semgrep-triage-2026-10-11.csv](phase0-semgrep-triage-2026-10-11.csv).
- The findings are *static-analysis hypotheses*, not verified attacks, and there were **zero new ERROR-level findings under the narrow custom PR gate**, which is not equivalent to zero vulnerabilities.

## Triage summary
| Category | Count | Initial disposition | Priority | Phase |
|---|---:|---|---|---:|
| Potential unsafe HTML insertion (`insertAdjacentHTML`) | 8 | Investigate data flow and sanitization; no exploit demonstrated | P1 | 1 |
| HTML escaping (`autoescape-disabled`, JSF rule on HTML) | 9 | Likely rule-context mismatch; **do not close** until sinks are reviewed | P2 | 1 |
| `document.write` in PWA loader | 2 | Verify SHA-256 release trust and cached update/loader control | P3 | 1 |
| Prototype-pollution loops | 2 | Review dynamic keys and untrusted backup/sync inputs | P1 | 2 |
| `Object.assign` over possibly untrusted data | 8 | Inspect assignment sources, allowlist when necessary | P2 | 2 |
| Mutable GitHub Action tags | 10 | Configuration risk confirmed, not proof of compromise | P2 | 3 |
| Dynamic regular expressions | 3 | Assess ReDoS with attacker-controlled inputs and limits | P3 | 4 |
| HTTP to loopback debugger in browser QA | 1 | Appears test-only; confirm the exception stays in test code | P4 | 4 |
| **Total** | **43** | **All inventoried; exploitation status unverified** | | |

P1 = investigate first; P2 = planned hardening; P3 = lower-priority validation; P4 = documented likely benign/test exception. Priorities are *triage order*, not scanner-assigned exploit severity.

## Evidence-based observations
1. At `scripts/phase7-browser-qa.mjs:53`, the unencrypted HTTP endpoint is `http://127.0.0.1:<port>/json` for local Chrome DevTools automation, not an external production API. Keep the finding documented rather than switching a local debugger to HTTPS unnecessarily.
2. The 10 mutable-action findings are in `.github/workflows/pages.yml` and `.github/workflows/phase7-qa.yml`. Semgrep's own workflow was already pinned and did not appear in this main-branch scan. Pin the remaining references to reviewed full-length action SHAs in Phase 3 without altering release permissions or triggers accidentally.
3. The nine `java.lang.security.audit.xss.jsf.autoescape-disabled` alerts fire on OmniOS **HTML and inline JavaScript**, not a JavaServer Faces application. The rule may not apply semantically. Nevertheless, the app has dynamic `innerHTML` rendering; independently test untrusted user strings, imported backup content, synced records, and URLs for XSS. Do not auto-suppress the warnings.
4. `index.html` uses `document.write` during initial load and in the update flow. The surrounding code checks a release digest before activation, but full trust-boundary review is still required.
5. The extraction manifest maps findings to generated `.semgrep-inline/app-assembled-NNN.js` or `pwa-loader-004.js` with a script index and **assembled HTML start line**. These are *not* original file line numbers; generated script files are not committed. All **23/23** extracted alerts have now been reverse-mapped in the CSV to an original `app-parts` or `index.html` source line, using the recorded script start lines and an assembly reconstruction checked against the scan manifest. Phase 1/2 should still re-check local source context and the end-to-end data path before any change.
6. The inline scan also returned **one partial parsing warning** on `.semgrep-inline/app-assembled-049.js`, at lines 267 and 758. The count of 43 excludes this coverage warning; Phase 5 must address it. A green scanner job does not prove complete analysis.

## Verification tasks and safety controls
- [x] Confirm exact `main` SHA and latest successful Semgrep workflow.
- [x] Create and independently verify code-only backup branch at exact pre-remediation SHA.
- [x] Put all **20 tracked-source** and **23 inline** findings in a stable 43-row register with source locations, category, triage order, disposition and assigned remediation phase.
- [x] Classify the suspected JSF rule mismatch and localhost exception without prematurely marking issues fixed.
- [x] Preserve app release source, current manifest, navigation, local data and production workflows (documentation-only pull request).
- [ ] Validate XSS and prototype-pollution reachability with non-production, disposable test data in Phases 1–2.
- [x] Reverse-map all 23 generated inline JavaScript warnings to original source files and lines and retain both coordinates in the triage CSV.
- [ ] Repair incomplete inline script parsing in Phase 5.
- [ ] **User action required:** export browser/PWA data from **Data Center → Export Backup**, keep a private copy, and test importing into an isolated disposable browser profile before any behavior-changing release. **No browser data is present in GitHub**; the source-only backup does not protect local records.
- [ ] Confirm owner acceptance of the triage before Phase 1 remediation.

## Development and release policy
- Changes from future remediation phases occur on their own branches and PRs, not as direct modifications to `main`.
- Test `npm test`, `npm run test:runtime`, `npm run test:browser`, and Semgrep; compare the exact source-release manifest.
- Use an isolated test profile for malicious payload cases; never test with a live private vault.
- Preserve Flat/Classic UI, service worker update behavior, offline availability, sync and imported-data compatibility.
- Rollback to the exact commit above via a reviewed revert or deployment of the verified historical build. Do not delete IndexedDB, localStorage, caches of user assets, or vault contents as part of source rollback.

## Definition of done
**Documentary baseline, initial triage and all 23 original-file mappings are complete.** The exploitability investigation, partial-script-parser repair, and isolated test restore of private user data are explicitly outstanding. Therefore this Phase 0 PR must not be represented as full security remediation or a security clearance.
