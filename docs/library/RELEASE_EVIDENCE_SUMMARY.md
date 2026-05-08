> **Scope:** For release operators gathering post-build verification signals (tests, snapshots, smoke); not a substitute for full CI or formal release sign-off.

# Release evidence summary (operator)

Use this drill after a candidate release build to gather **signals** (not a substitute for full CI). Prefer running from repo root on Windows (PowerShell).

## What to run

1. **API + health**

   ```powershell
   dotnet test .\ArchLucid.Api.Tests\ArchLucid.Api.Tests.csproj --filter "FullyQualifiedName~Health" --no-build:$false
   ```

   Or against a live host: `archlucid health` (from a directory with `archlucid.config.json` / env pointing at the API).

2. **OpenAPI contract snapshot** (locks public HTTP contract)

   ```powershell
   dotnet test .\ArchLucid.Api.Tests\ArchLucid.Api.Tests.csproj --filter "FullyQualifiedName~OpenApiContractSnapshot" --no-build:$false
   ```

3. **UI smoke** (when SQL-backed live API is available — see `docs/library/LIVE_E2E_HAPPY_PATH.md`)

   ```powershell
   npx playwright test --config archlucid-ui/playwright.live.config.ts
   ```

4. **Optional live Azure OpenAI gate** (skips when env vars unset — always writes **`artifacts/release/real-llm-evidence-gate.md`**)

   ```powershell
   .\scripts\Invoke-RealLlmEvidenceGate.ps1
   ```

   **Generated report (attach to release artifacts; gitignored):** [`artifacts/release/real-llm-evidence-gate.md`](../../artifacts/release/real-llm-evidence-gate.md). With credentials, companion metrics may appear next to it as **`artifacts/release/real-llm-last-run-metrics.json`** (also gitignored).

5. **Production profile preflight (repo-only, no Azure login)** — auth mode, JWT posture, API key disablement, SQL connection shape, Key Vault sample, prompt redaction, observability export hints, billing safety, Worker `appsettings` presence, plus Terraform layout. **Generated report (attach to release artifacts; gitignored by default):** [`artifacts/deployment/production-profile-preflight.md`](../../artifacts/deployment/production-profile-preflight.md).

   ```powershell
   .\scripts\Emit-ProductionProfilePreflightMarkdown.ps1
   ```

6. **Aggregated script** (non-fatal collection)

   ```powershell
   .\scripts\Invoke-ReleaseEvidenceSummary.ps1 [-MarkdownOut artifacts\release\release-evidence-summary.md] [-FailOnError]
   ```

7. **Fixture expectation (offline):** `scripts/fixtures/release-evidence/expected-status-labels.txt` lists the Result labels the preflight report may emit (`Passed`, `Warning`, `Failed`, `Skipped`, `Not captured`). CI guards structure via `scripts/ci/tests/test_production_profile_preflight_md.py`.

**Optional:** data consistency documentation readiness (no DB): `python scripts/data_consistency_mode_readiness_report.py` → `artifacts/deployment/data-consistency-mode-readiness.md`.

## Interpretation

- Collect logs + exit codes; a single failing gate blocks calling the build “fully verified” for that dimension.
- Buyer-safe reference packaging still requires human review of the first-value report **buyer-safe gate** section and proof sendability.
