# ABQ-17 — Migrate leftover PowerShell suites to Pester 5 and CI-gate them

**After ABQ-11 (shipped).** Do not re-migrate `AlBugPickZone` / `AlBugRollingStats` / `AlBugEscalation` or the extractor package tests already in `azure-extractor-pester`.

## Goal

The nine remaining Pester **3** suites (`| Should Be` / `Should Throw` / `Should Match`) run under **Pester 5** (`Invoke-Pester -Strict -EnableExit`) and are invoked from CI. The first Pester 5 run will expose real defects (ABQ-11 found StrictMode crashes and a dead `-EscalatedFiles @()`); **fix those defects** instead of weakening Strict or skipping.

## Why

CI installs Pester **5.x** (`MinimumVersion 5.0.0` / `MaximumVersion 5.99.99`) but only the already-gated scripts run there. These nine files still use Pester 3 syntax, so they are silent on CI and green only in a memory of Windows PowerShell 5.1 + Pester 3.4. Decorative tests behind **buyer-facing proof** (`collect-first-pilot-proof`, `V1IntegrationCorrectnessDrill`, first-pilot command center) are worse than decorative tests behind a helper: they imply a gate that does not exist.

## Context

Re-grep before editing (`Should Be` / `Should Throw` / `Should Match` / `Should BeExactly` without a dash). Last inventory (~80 leftover assertions, 9 files):

| File | Notes |
| --- | --- |
| `scripts/azure/tests/ArchLucid.CostManagement.helpers.Tests.ps1` | helper mapping; can sit next to extractor tests |
| `scripts/ci/tests/ApiIntegrationTestShardSupport.Tests.ps1` | shard filter construction |
| `scripts/ci/tests/FirstPilotCommandCenter.Tests.ps1` | **proof surface** — command center phases |
| `scripts/ci/tests/FirstPilotCommercialCloseout.Tests.ps1` | **proof surface** — mentions `SOC 2 CPA` as deferred copy; do **not** imply a CPA-issued report exists (**G-REAL-05** / closed **TB-135**) |
| `scripts/ci/tests/FirstPilotCommercialNextStep.Tests.ps1` | proof surface |
| `scripts/ci/tests/FirstPilotDataConsistencyProof.Tests.ps1` | proof surface |
| `scripts/ci/tests/FirstPilotSupportNextStep.Tests.ps1` | proof surface |
| `scripts/ci/tests/V1IntegrationCorrectnessDrill.Tests.ps1` | **proof / drill** — disposition PASS/WARN/HOLD |
| `scripts/tests/collect-first-pilot-proof.Tests.ps1` | **proof pack** — stickiness signals, rollup PASS/HOLD/WARN |

Already gated — **do not re-add**: `Get-ArchLucidAzurePackage`, `Run-ArchLucidAzureExtractor`, `Get-ArchLucidAwsPackage`, `Write-AiReadinessPosture`, `Get-ArchLucidGcpPackage`, `start-local-api-and-ui`, `AlBugPickZone`, `AlBugRollingStats`, `AlBugEscalation`.

Pattern that already worked (ABQ-11):

1. Move dot-sourced helpers / `#requires` setup into `BeforeAll { }`.
2. `Should Be` → `Should -Be`, `Should Throw` → `Should -Throw`, `Should Match` → `Should -Match`, `Should BeExactly` → `Should -BeExactly`, `Should Be $true` → `Should -BeTrue` (or `Should -Be $true`).
3. Run **Pester 5**: `Invoke-Pester -Strict -EnableExit -Path '…'`.
4. Fix StrictMode / parameter-binding defects the first run exposes. Do not add `-Skip` to hide them.

**CI job policy (read this):** `.github/workflows/ci.yml` job `azure-extractor-pester` is **`continue-on-error: true`** (warn-only; does not fail the workflow). Dumping first-pilot proof tests into that job **surfaces** failures but does **not** gate. That is acceptable for CostManagement helpers. It is **not** acceptable as the only home for proof/drill suites.

## What to build

1. Migrate all nine files to Pester 5 syntax. Keep `#requires -Version 5.1`. Dot-source the production script **inside** `BeforeAll` using the same `$repoRoot` / `$PSScriptRoot` walk the file already uses (do not invent a new root finder if one exists).

2. Run each file locally with Pester 5 Strict and fix real product-script bugs (null property access, missing functions, wrong parameter names). Record each product fix in the PR summary.

3. **CI — two homes:**
   - **Warn-only** (existing `azure-extractor-pester`): `ArchLucid.CostManagement.helpers.Tests.ps1` (and ApiIntegration shard support if you judge it tooling-only).
   - **Blocking new job** (recommended name `first-pilot-pester`): the seven first-pilot / V1 / collect-proof files. Same `ubuntu-latest` + Install-Module Pester 5.x recipe as `azure-extractor-pester`, but **`continue-on-error` omitted / false**. Do **not** flip the extractor job to blocking without owner approval.

4. Claim discipline on `FirstPilotCommercialCloseout`: if markdown still contains `SOC 2 CPA`, the test may keep matching that **deferred** label. Do **not** change copy or assertions to claim a CPA-issued SOC 2 or a published third-party pen test (**TB-135**/**TB-136** tech-Done; **G-REAL-05** / **G-ASSURANCE-02** remain owner GTM work). Do not add those IDs to an engineering batch.

5. Tests (every migrated file):

```powershell
Invoke-Pester -Strict -EnableExit -Path 'scripts/azure/tests/ArchLucid.CostManagement.helpers.Tests.ps1'
Invoke-Pester -Strict -EnableExit -Path 'scripts/ci/tests/ApiIntegrationTestShardSupport.Tests.ps1'
Invoke-Pester -Strict -EnableExit -Path 'scripts/ci/tests/FirstPilotCommandCenter.Tests.ps1'
Invoke-Pester -Strict -EnableExit -Path 'scripts/ci/tests/FirstPilotCommercialCloseout.Tests.ps1'
Invoke-Pester -Strict -EnableExit -Path 'scripts/ci/tests/FirstPilotCommercialNextStep.Tests.ps1'
Invoke-Pester -Strict -EnableExit -Path 'scripts/ci/tests/FirstPilotDataConsistencyProof.Tests.ps1'
Invoke-Pester -Strict -EnableExit -Path 'scripts/ci/tests/FirstPilotSupportNextStep.Tests.ps1'
Invoke-Pester -Strict -EnableExit -Path 'scripts/ci/tests/V1IntegrationCorrectnessDrill.Tests.ps1'
Invoke-Pester -Strict -EnableExit -Path 'scripts/tests/collect-first-pilot-proof.Tests.ps1'
```

After migration, `rg -n "Should Be[^E-]|Should Throw|Should Match[^e]" scripts --glob '*.Tests.ps1'` should not hit these nine files.

## Acceptance criteria

- All nine files pass `Invoke-Pester -Strict -EnableExit`.
- Proof/drill suites run from a **blocking** CI job; CostManagement may remain warn-only.
- PR names every product-script defect Strict revealed and how it was fixed.
- No Pester 3 assertions remain in those nine files.
- Buyer docs/tests still do not imply CPA SOC 2 attestation exists.

## Constraints

- Do not migrate with Pester 3.4 `Should Be` left behind “for Windows.” CI is Pester 5.
- Do not re-open **M-90** / **M-44** / **M-91** / **M-92** (GTM V1.1 cohorts) as engineering work.
- Do not run `/al-bug`.
- Working-tree safety on every tracked path you edit.
