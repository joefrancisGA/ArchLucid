# EXW-09 — Ship extractor warning triage on `master`

**Model:** Composer 2.5. Paste this file as the whole task.

**Repo:** `c:\ArchLucid`

## Goal

Land the extractor warning triage work on **`origin/master`**: paste-ready probe prompts (EXW-01–EXW-07), governance HTTP-status fix (EXW-08), docs index, and tests. Do not reopen NR-36, NR-40, or DFV-04–DFV-09 collector implementations.

## Branch

1. `git fetch origin`
2. `git checkout master` and `git pull --ff-only origin master` (or `main` when that is the default trunk — match `origin/HEAD`).
3. Create `cursor/extractor-warning-triage-master` from that tip.

Before each tracked edit: `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.

## Deliverables (verify on the branch)

| Path | Expect |
|------|--------|
| `.cursor/prompts/extractor-warning-triage-00-index.md` | Index EXW-01–EXW-08 |
| `.cursor/prompts/extractor-warning-triage-01-aks-runcommand.md` through `08-governance-status.md` | Probe + EXW-08 spec |
| `docs/architecture/EXTRACTOR_WARNING_TRIAGE_PROMPTS.md` | Docs mirror of the index |
| `ArchLucid.Integrations.AzureExtractor/GetOnlyHostedAzureArmReadClient.DefenderFollowOn.cs` | Governance warnings use real HTTP status; no invented `HTTP 404`; assessment walk when subscription list fails |
| `scripts/azure/ArchLucid.SecurityInventory.helpers.ps1` | `httpStatusCode` on `Get-ArchLucidAzureDefenderArmValues`; governance walk uses measured status |
| `ArchLucid.Integrations.AzureExtractor.Tests/GetOnlyHostedAzureArmReadClientDefenderFollowOnTests.cs` | 403 governance assertions + assessment-walk test |
| `scripts/azure/tests/ArchLucid.SecurityInventory.helpers.Tests.ps1` | Format / failure-warning Pester |

## EXW-08 behavior (must match)

- Hosted: `ReadDefenderPagesAsync` keeps `defender-governance.json collection failed; HTTP {code}`.
- Hosted: after three failed per-assessment governance walks, emit one `FormatDefenderGovernanceCollectionFailedWarning` summary — not a hardcoded 404.
- Hosted: when the subscription governance list fails and assessment keys exist, run the per-assessment walk (do not require a prior 404 warning).
- Script: non-success `Invoke-AzRestMethod` status flows into `httpStatusCode` and governance summary warnings.
- Script: empty assessment list with a failed subscription list uses measured status, not `HTTP 404`.
- Script: count assessment-walk misses only when `assignmentPage.warning` is set, not when the API returns an empty 200.

## Verification

```powershell
.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Integrations.AzureExtractor.Tests/ArchLucid.Integrations.AzureExtractor.Tests.csproj'
dotnet test ArchLucid.Integrations.AzureExtractor.Tests/ArchLucid.Integrations.AzureExtractor.Tests.csproj --filter 'FullyQualifiedName~GetOnlyHostedAzureArmReadClientDefenderFollowOnTests'
pwsh -NoProfile -Command "Invoke-Pester -Strict -EnableExit -Path 'scripts/azure/tests/ArchLucid.SecurityInventory.helpers.Tests.ps1' -FullNameFilter '*defender governance*|*defender ARM failure*'"
```

## Out of scope

- Azure probe sessions (EXW-01–EXW-07) against a live tenant in this implementation pass.
- RBAC changes, package re-runs, or ingest.
- Changing AKS, Fabric, attack-path, vulnerability, contact, or policy-compliance warning codes beyond governance status propagation.

## Commit

Only when the user names the branch and asks to commit. Stage only paths touched for this batch. Suggested message:

`fix(extractor): record real HTTP status on Defender governance collection failures`

Do not commit unless requested.
