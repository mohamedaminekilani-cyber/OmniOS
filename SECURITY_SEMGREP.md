# OmniOS | Semgrep security checks

The GitHub Actions workflow at .github/workflows/semgrep.yml scans pull
requests targeting main, changes to main, once each week, and on demand.

## Rules and scope

- Public Semgrep rule packs: p/default, p/secrets and p/github-actions.
- Project-specific rules in .semgrep/rules.yml flag JavaScript eval(),
  Function() string execution, disabled TLS verification and document.write().
- Scans include browser JS, Netlify TypeScript functions, HTML and CI YAML.
  Coverage of HTML depends on which Registry rules support that language.
- OmniOS has large inline scripts within app-parts/*.html.
  scripts/semgrep-inline.mjs reconstructs the official release and extracts
  executable script tags, including loader scripts, into a temporary
  .semgrep-inline directory for a dedicated JS-aware scan.
- Inline findings have generated filenames rather than source-file annotations.
  The manifest in the artifact identifies the assembled document and starting
  line. Inline audit findings are currently advisory.

## Finding reports

Tracked-source findings appear under GitHub Security > Code scanning and in
the semgrep-security-reports workflow artifact (SARIF format).
Inline-script findings appear in semgrep-inline.json in the same artifact.
The reports are retained for 14 days.

Legacy findings are reported for review and do not block production.
New ERROR-severity findings from the high-confidence local rules in directly
tracked JS and TypeScript block new pull requests. Review findings before
deciding which code to change; avoid suppressing real vulnerabilities.

## Run it locally

Install Semgrep 1.179.0 and Node.js 22+, then run:

    semgrep scan --validate --config .semgrep/rules.yml
    semgrep scan --config p/default --config p/secrets --config p/github-actions --config .semgrep/rules.yml .
    node scripts/semgrep-inline.mjs
    semgrep scan --config p/default --config .semgrep/rules.yml .semgrep-inline

Clean up analysis output with: rm -rf .semgrep-inline

Semgrep Community Edition does not provide the cross-file, proprietary
supply-chain or validated-secrets coverage of the hosted Semgrep platform.
This configuration requires no Semgrep account or API token. Rule packs are
fetched over the internet. GitHub code scanning SARIF requires repository
support (public repositories on GitHub.com are eligible).

To make the scan a mandatory merge gate, add the status check named
'Semgrep SAST and GitHub Actions rules' to branch protection or a repository
ruleset after the first successful PR scan. This change does not modify app
data, local storage, the live build, or the release checksum.
