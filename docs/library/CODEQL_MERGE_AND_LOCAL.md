> **Scope:** Contributor-reference — Operators & developers — branch protection, strict SARIF gate in CI, and local CodeQL CLI parity; not per-alert triage (see [CODEQL_TRIAGE.md](CODEQL_TRIAGE.md)).

> **Spine doc:** [`START_HERE.md`](../START_HERE.md). Read this file when wiring merge gates or running CodeQL locally.

# CodeQL merge gates and local runs (ArchLucid)

## 1. Trunk / scheduled SARIF gate (GitHub — no Cursor usage)

The workflow [`.github/workflows/codeql.yml`](../../.github/workflows/codeql.yml) does **not** run on pull requests. It runs on **push** to **`main`** / **`master`**, the weekly Monday cron, and **`workflow_dispatch`**. After analysis it writes SARIF under **`csharp-sarif/`** and **`javascript-sarif/`** and runs [`scripts/ci/assert_codeql_sarif_clean.py`](../../scripts/ci/assert_codeql_sarif_clean.py), which **fails the job** if any non-suppressed SARIF result exists (excluding **`note`** / **`none`** severities).

That job failure is a **trunk/security** gate, not a PR required status check. The live ruleset (`Golden cohort real-LLM gate`) does **not** require `CodeQL (csharp)` or `CodeQL (javascript)`. Do **not** add those check names to required PR checks while this workflow has no `pull_request` trigger — GitHub will wait forever for checks that never run.

**If you restore CodeQL as a merge-blocking PR check:** add the `pull_request` trigger back to `codeql.yml` first, then require:

- **`CodeQL (csharp)`** — C# job (includes restore, analysis, SARIF gate).
- **`CodeQL (javascript)`** — Architect workspace (`archlucid-ui`) job (includes `npm ci` / `npm run build`, analysis, SARIF gate).

The checked-in ruleset JSON [`.github/rulesets/push-corset-codeql-required-check.json`](../../.github/rulesets/push-corset-codeql-required-check.json) still lists those two contexts. **Do not apply it** until CodeQL runs on `pull_request` again (or those contexts are removed from the JSON).

Optional: under **Settings → Code security and analysis → Code scanning**, configure alert handling. GitHub’s own code-scanning PR annotations need a `pull_request` trigger; without it, SARIF still uploads from trunk/scheduled runs.

**Fork PRs:** CodeQL does not run on PRs at all in this configuration. Use the local CLI scripts below before merge if you need SARIF locally.

## 2. Cursor / VS Code extension (local IDE)

1. Install the **CodeQL** extension (`GitHub.vscode-codeql`) — already listed in [`.vscode/extensions.json`](CODEQL_MERGE_AND_LOCAL.md).
2. Install the **[CodeQL CLI](https://github.com/github/codeql-cli-binaries/releases)** and either add it to your **`PATH`** or set **User** setting **`codeQL.cli.executablePath`** to the **`codeql`** / **`codeql.exe`** binary (see the extension’s *CLI* section in Settings).
3. Keep query behavior aligned with CI: **`security-extended`** plus the model pack in [`.github/codeql/codeql-config.yml`](../../.github/codeql/codeql-config.yml) (see [CODEQL_TRIAGE.md](CODEQL_TRIAGE.md)).

## 3. Local CLI (C#) — mirror CI before you push

From the repository root, with **.NET SDK** and **CodeQL CLI** on **`PATH`**:

- **Bash (Linux / macOS / Git Bash):** [`scripts/ci/codeql-local-csharp.sh`](../../scripts/ci/codeql-local-csharp.sh)
- **PowerShell (Windows):** [`scripts/ci/codeql-local-csharp.ps1`](../../scripts/ci/codeql-local-csharp.ps1)

These scripts create **`codeql-out/db-csharp`**, run **`security-extended`**, write **`codeql-out/results-csharp.sarif`**, then invoke the same Python SARIF gate as CI on **`codeql-out/`**. Output lives under **`codeql-out/`** (gitignored).

**JavaScript / architect workspace:** Use the same steps as the **`javascript`** job in [`.github/workflows/codeql.yml`](../../.github/workflows/codeql.yml) (`npm ci` / `npm run build` under **`archlucid-ui/`**), then run **`codeql`** against that source root; for a one-off local gate, point the Python script at the directory that contains the generated **`*.sarif`** files.

## Related

- [CODEQL_TRIAGE.md](CODEQL_TRIAGE.md) — alert interpretation and suppressions.
- [`.github/workflows/codeql.yml`](../../.github/workflows/codeql.yml) — canonical automation.
