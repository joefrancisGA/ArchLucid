# EXW-08 — Record the real governance HTTP status

**Model:** Composer 2.5. Paste this file as the whole task. Do not implement another EXW file in this session.

**Repo:** `c:\ArchLucid`

## Goal

When Defender governance collection fails, the warning must carry the HTTP status that Azure returned. It must not say HTTP 404 unless the status was 404.

## Why

`ReadGovernanceForAssessmentsAsync` deletes the real `defender-governance.json collection failed; HTTP {status}` warning from `ReadDefenderPagesAsync` and replaces it with `HTTP 404`. The customer script in `Get-ArchLucidAzureDefenderFollowOnBundle` writes that same 404 sentence whenever the subscription list fails and the per-assessment walk misses, without reading a status code.

The 2026-10-22 package printed that 404 sentence together with `defender-governance-truncated`. EXW-04 measures the live status. This session fixes the label even if EXW-04 has not been run.

## Read first

- `ArchLucid.Integrations.AzureExtractor/GetOnlyHostedAzureArmReadClient.DefenderFollowOn.cs` (`ReadGovernanceForAssessmentsAsync`)
- `ArchLucid.Integrations.AzureExtractor/GetOnlyHostedAzureArmReadClient.DefenderCompanions.cs` (`ReadDefenderPagesAsync`)
- `scripts/azure/ArchLucid.SecurityInventory.helpers.ps1` (`Get-ArchLucidAzureDefenderArmValues` and the governance walk)
- The existing governance tests in `ArchLucid.Integrations.AzureExtractor.Tests` and `scripts/azure/tests/Get-ArchLucidAzurePackage.Tests.ps1`

## What to build

1. Hosted client: keep the status warning `ReadDefenderPagesAsync` already added. After three failed assessment walks, do not delete those statuses and do not invent HTTP 404. One summary line is enough when every failed walk status is the same: `defender-governance.json collection failed; HTTP {status}; api-version 2022-01-01-preview`. When the statuses differ, keep each distinct status. When the status is unknown, use `defender-governance.json collection failed; api-version 2022-01-01-preview` with no HTTP clause.
2. Customer script: when `Invoke-AzRestMethod` returns a response, include that status in the companion warning. When it throws, read a status from the error record if one is present. The governance walk must use that status. It must not hardcode 404.
3. Leave `defender-governance-truncated` as the cap warning. Leave the 4000-row cap and the 40-assessment walk cap in place.
4. Do not change AKS, Fabric, attack-path, vulnerability, contact, or policy-compliance warning codes in this session.

## Tests

- A governance list that returns HTTP 403 stores a warning containing `HTTP 403` and does not contain `HTTP 404`.
- A governance list that returns HTTP 404 may contain `HTTP 404`.
- A failure with no status does not contain `HTTP 404`.
- Pester covers the customer-script status path with a fixture response or a thrown error record. Do not call Azure.

## Constraints

- Before each tracked edit, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- One compile: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Integrations.AzureExtractor.Tests/ArchLucid.Integrations.AzureExtractor.Tests.csproj'`.
- Run the new hosted tests and the focused Pester test that covers this warning.
- Do not call Azure.
- Do not re-run DFV-04.
- Do not commit.

## Done when

Governance failures surface the HTTP status Azure returned. Warnings do not claim HTTP 404 unless the response was 404. Ship on trunk with [extractor-warning-triage-09-implement-on-master.md](extractor-warning-triage-09-implement-on-master.md).
