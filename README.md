# Second Brain

Local-first personal workspace, installed as a PWA or used in a browser.

Live: https://mohamedaminekilani-cyber.github.io/OmniOS/

## Develop and verify

```sh
npm ci
npm run release:source
npm test
npm run test:runtime
```

The source lives in the ordered `app-parts/` fragments and `js/` modules. Run
`npm run release:source` after changing them and commit `source-release.json`
with the edits. Tests reject a stale manifest.

`npm run build` creates `dist/` with one content-addressed application and a
release manifest. Actions publishes this exact build only after verification.
For branch-based static hosting, the loader assembles the source release and
verifies the same SHA-256 before execution. This prevents a competing branch
Pages build from leaving the loader without its application. Mixed or incomplete
releases are rejected. A valid cached release remains available offline.

## Install and keep backups

On iPhone, open the live URL in Safari, choose Share → Add to Home Screen, and
launch once online. Data stays in that browser/PWA on that device. Use Data
Center → Export Backup regularly. Device pairing transfers selected pages;
it is not a cloud backup.
