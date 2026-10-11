# Security Phase 1 — HTML injection and XSS hardening
Date: 2026-10-11
Base production commit: `dce919f0bd33bc576bdf8bc3849e4a8c4acc5de8`
Branch: `security/phase1-xss-safe-render-2026-10-11`
Phase 0 triage register: https://github.com/mohamedaminekilani-cyber/OmniOS/pull/40

## Implemented changes
1. **Shared attachment gallery** (`app-parts/part-002.html`): `imgTags()` formerly interpolated stored attachment URLs directly into double-quoted HTML attributes (`src` and `data-image-view`). It now accepts only HTTPS, same-origin HTTP/blob, or raster base64 data images (PNG/JPEG/WebP/GIF), and HTML-encodes all attribute metacharacters. The attachment viewer creates a static DOM template and assigns a validated `img.src` property; it no longer interpolates URLs into markup.
2. **Diet image gallery and viewer** (`app-parts/part-002.html`): an additional pair of raw `src`/`data-diet-image` interpolations was found by regression tests and replaced with allowlisted URL and escaped-attribute rendering; diet lightbox now assigns the validated `img.src` property after creating static markup.
3. **Task gallery legacy renderer** (`app-parts/part-002.html`): escape task identifiers, category labels, and note snippets before writing task-card markup, including values restored from backups.
4. **Item card photography** (`app-parts/part-007.html`): replace all seven `insertAdjacentHTML()` calls flagged by Semgrep with `document.createElement`, safe image-source assignment, and `prepend` / `after`. Keep the established card/media CSS class names and the note-reader layout.
5. **Photo editor** (`part-007.html`): build photo tiles with DOM APIs, preserving primary-image selection, remove controls, six-photo limit, captions and accessibility attributes. Invalid URLs are not loaded.
6. **Task board** (`app-parts/part-008.html`): replace dynamic `insertAdjacentHTML()` drop-slot markup with DOM creation and `textContent`. Keep drag-and-drop behavior and current task-board styles.
7. **Regression tests** (`tests/phase1-security-render.test.js`): exercise dangerous image URLs in both attachment and diet galleries, attribute injection, data-URI exclusions, actual photo nodes, photo ordering/removal and static sink removal.
8. **Release manifest** (`source-release.json`): regenerate exact assembled release SHA-256 and byte size from updated sources; verify via normal CI release-source assertions.

## Semgrep triage disposition
| Initial finding group | Count | Phase 1 status |
|---|---:|---|
| `insertAdjacentHTML` in 7 photo-card and 1 task-board paths | 8 | Replaced with DOM nodes; check new Semgrep output |
| `autoescape-disabled` (JSF-language rule on JS/HTML; not JavaServer Faces) | 9 | Suspected rule-context mismatch. Raw attachment/diet URL interpolation and older task gallery values have been hardened; review remaining HTML value flows before marking all nine closed |
| `document.write()` for boot and verified PWA update | 2 | Intentionally unchanged: replacing an entire verified app document risks breaking offline/upgrade logic. The loader verifies release SHA-256 before activation; dedicated trust-boundary review is still necessary |

**This PR is targeted remediation, not a blanket claim that all 19 findings are closed.** No exploit chain has been demonstrated or excluded for unmodified legacy templates. Local script extraction has a separate parsing coverage warning tracked in Phase 5.

## Compatibility / release checklist
- [ ] `npm test` (includes exact source checksum and new security tests).
- [ ] `npm run test:runtime`.
- [ ] `npm run test:browser` responsive, visual and navigation smoke QA.
- [ ] Semgrep tracked source and inline audit.
- [ ] Confirm live release unchanged until PR merged, no data schema/storage changes.
- [ ] Optional owner test: import a *disposable* non-private backup and verify image cards, gallery, workout attachments, task drag/drop and offline PWA update.

## Rollback
Exact baseline commit `dce919f0bd33bc576bdf8bc3849e4a8c4acc5de8` remains available at source backup branch `backup/omnios-before-security-remediation-2026-10-11`. No user-browser data is stored in this branch; export user data separately before production merging.
