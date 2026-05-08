> **Scope:** Operators & developers — branch protection, strict SARIF gate in CI, and local CodeQL CLI parity; not per-alert triage (see [CODEQL_TRIAGE.md](CODEQL_TRIAGE.md)).

> **Spine doc:** [Five-document onboarding spine](../FIRST_5_DOCS.md). Read this file when wiring merge gates or running CodeQL locally.

# CodeQL merge gates and local runs (ArchLucid)

## 1. Merge-blocking checks (GitHub — no Cursor usage)

The workflow [`.github/workflows/codeql.yml`](../../.github/workflows/codeql.yml) runs on pull requests to **`main`** / **`master`**. After analysis it writes SARIF under **`csharp-sarif/`** and **`javascript-sarif/`** and runs [`scripts/ci/assert_codeql_sarif_clean.py`](../../scripts/ci/assert_codeql_sarif_clean.py), which **fails the job** if any non-suppressed SARIF result exists (excluding **`note`** / **`none`** severities).

**Branch protection (recommended):** In the GitHub repo, open **Settings → Branches → Branch protection rule** for **`main`** (and **`master`** if used). Under **Require status checks to pass before merging**, require at least:

- **`CodeQL (csharp)`** — C# job (includes restore, analysis, SARIF gate).
- **`CodeQL (javascript)`** — Operator UI job (includes `npm ci` / `npm run build`, analysis, SARIF gate).

Optional but useful: under **Settings → Code security and analysis → Code scanning**, configure **pull request check failure** severities so GitHub’s own code-scanning check aligns with your policy (the workflow gate above is independent and enforces zero unresolved SARIF findings in the uploaded run output).

**Fork PRs:** Contributors from forks may not upload to code scanning the same way; the SARIF gate step still enforces findings on the workflow run artifact path when SARIF is produced.

## 2. Cursor / VS Code extension (local IDE)

1. Install the **CodeQL** extension (`GitHub.vscode-codeql`) — already listed in [`.vscode/extensions.json`](../../.vscode/extensions.json).
2. Install the **[CodeQL CLI](https://github.com/github/codeql-cli-binaries/releases)** and either add it to your **`PATH`** or set **User** setting **`codeQL.cli.executablePath`** to the **`codeql`** / **`codeql.exe`** binary (see the extension’s *CLI* section in Settings).
3. Keep query behavior aligned with CI: **`security-extended`** plus the model pack in [`.github/codeql/codeql-config.yml`](../../.github/codeql/codeql-config.yml) (see [CODEQL_TRIAGE.md](CODEQL_TRIAGE.md)).

## 3. Local CLI (C#) — mirror CI before you push

From the repository root, with **.NET SDK** and **CodeQL CLI** on **`PATH`**:

- **Bash (Linux / macOS / Git Bash):** [`scripts/ci/codeql-local-csharp.sh`](../../scripts/ci/codeql-local-csharp.sh)
- **PowerShell (Windows):** [`scripts/ci/codeql-local-csharp.ps1`](../../scripts/ci/codeql-local-csharp.ps1)

These scripts create **`codeql-out/db-csharp`**, run **`security-extended`**, write **`codeql-out/results-csharp.sarif`**, then invoke the same Python SARIF gate as CI on **`codeql-out/`**. Output lives under **`codeql-out/`** (gitignored).

**JavaScript / Operator UI:** Use the same steps as the **`javascript`** job in [`.github/workflows/codeql.yml`](../../.github/workflows/codeql.yml) (`npm ci` / `npm run build` under **`archlucid-ui/`**), then run **`codeql`** against that source root; for a one-off local gate, point the Python script at the directory that contains the generated **`*.sarif`** files.

## Related

- [CODEQL_TRIAGE.md](CODEQL_TRIAGE.md) — alert interpretation and suppressions.
- [`.github/workflows/codeql.yml`](../../.github/workflows/codeql.yml) — canonical automation.
