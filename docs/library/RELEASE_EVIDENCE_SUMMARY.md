> **Scope:** Contributor-reference — For release operators gathering post-build verification signals (tests, snapshots, smoke); not a substitute for full CI or formal release sign-off.

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

   **Generated report (attach to release artifacts; gitignored):** `artifacts/release/real-llm-evidence-gate.md`. With credentials, companion metrics may appear next to it as **`artifacts/release/real-llm-last-run-metrics.json`** (also gitignored).

5. **Production profile preflight (repo-only, no Azure login)** — auth mode, JWT posture, API key disablement, SQL connection shape, Key Vault sample, prompt redaction, observability export hints, billing safety, Worker `appsettings` presence, plus Terraform layout.    **Generated report (attach to release artifacts; gitignored by default):** `artifacts/deployment/production-profile-preflight.md`.

   ```powershell
   .\scripts\Emit-ProductionProfilePreflightMarkdown.ps1
   ```

6. **Observability export readiness (repo-only, no Azure login)** — verifies merged **Api** / **Worker** appsettings plus optional process env overlay (connection strings and headers are **never** printed). Emits **PASS** / **WARN** / **FAIL** in the Markdown summary. Attach: `artifacts/observability-export-readiness.md` (gitignored path is team convention).

   ```powershell
   python scripts/report_observability_export_readiness.py --environment Production --out artifacts/observability-export-readiness.md
   ```

   Release gate (non-zero exit unless verdict is **PASS**): add `--strict-exit-code`.

7. **Aggregated script** (non-fatal collection)

   ```powershell
   .\scripts\Invoke-ReleaseEvidenceSummary.ps1 [-MarkdownOut artifacts\release\release-evidence-summary.md] [-FailOnError]
   ```

8. **Procurement / buyer materials readiness (repo-only)** — validates canonical **`PROCUREMENT_PACK_INDEX.md`**: resolved source links, **90-day** freshness on **Implemented** and **Self-asserted** table rows, buyer-placeholder strictness (no **TBD**/**TODO**/stub markers in the index), and forbidden wording that would imply issued **SOC 2** / **ISO** / third-party pen-test completion. Does **not** require CPA reports or move deferred assurance into product gates.

   ```powershell
   python scripts/ci/check_procurement_pack_index.py
   ```

   **Broader pack validation** (canonical JSON sources, templates, optional **--deal-ready** staleness stack): `python scripts/validate_procurement_pack.py` · **Strict buyer ZIP staging:** `python scripts/build_procurement_pack.py --dry-run` or **`--deal-ready`** per **`docs/go-to-market/HOW_TO_REQUEST_PROCUREMENT_PACK.md`**. **Self-test:** `python -m unittest discover -s scripts/ci/tests -p "test_check_procurement_pack_index.py"`.

9. **Fixture expectation (offline):** `scripts/fixtures/release-evidence/expected-status-labels.txt` lists the Result labels the preflight report may emit (`Passed`, `Warning`, `Failed`, `Skipped`, `Not captured`). CI guards structure via `scripts/ci/tests/test_production_profile_preflight_md.py`.

**Optional — data consistency enforcement posture:** `python scripts/data_consistency_mode_readiness_report.py` → `artifacts/deployment/data-consistency-mode-readiness.md` (merges **appsettings.json** + **appsettings.Advanced.json** by default; deployment evidence table includes `OrphanProbeEnabled`, `Enforcement:Mode`, thresholds, migration/DDL posture, and **not captured** orphan counts when offline). **Read-only SQL census (optional):** set **`ARCHLUCID_DATA_CONSISTENCY_READINESS_SQL`** or pass **`--sql-odbc`** — same detection-only **COUNT** queries as admin diagnostics (**no** writes). Linked from production preflight **§B** and **`docs/data-consistency/DATA_CONSISTENCY_ENFORCEMENT.md`**.

## Interpretation

- Collect logs + exit codes; a single failing gate blocks calling the build “fully verified” for that dimension.
- Buyer-safe reference packaging still requires human review of the first-value report **buyer-safe gate** section and proof sendability.
