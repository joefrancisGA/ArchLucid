# SN-PE-07 — Data Flow probable-evidence mermaid/AST contract

**Wave:** SecureNow probable-evidence Data Flow (**SN-PE**). **Depends on:** SN-PE-03, SN-PE-04. Prefer SN-PE-05 and SN-PE-06 merged.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Lock a snapshot compile contract so Data Flow keeps the ADF MVP **and** authorized/Event Grid families, and so the hub-spoke PE negative cannot silently regress.

## Why

SN-DF-07 guards SAP → factory → store without VNet. SN-PE families can drift back to ADF-only or re-introduce naive PE fan-out without a failing test.

## Context

- `.cursor/prompts/securenow-data-flow-07-mermaid-contract.md` (copy the test shape, do not re-run SN-DF-07)
- `ArchLucid.Application.Tests/InfraEvidence/InfraEvidenceSnapshotMermaidServiceTests.cs` (or ArtifactSynthesis compiler tests if that is where SN-DF-07 landed)
- Fixtures from SN-PE-03 and SN-PE-04

## What to build

1. Golden fixture (ZIP or in-memory graph — match existing SN-DF-07 style):

   - External SAP linked service + Data Factory + SQL.
   - Web App system-assigned MI + `appAuthorizedAccess` to the same SQL.
   - Storage account Event Grid subscription → Function (`eventGridToDestination`).
   - Optional: Event Hub capture to the storage account.
   - VNet + PE to SQL + DNS join **only** for the Web App’s VNet.
   - Second Function **VNet-integrated in another VNet with no DNS link**.

2. Assertions (`mode=dataFlow` Succeeded):

   - Labels include factory / SQL / SAP (or External) / Web App.
   - Edge labels include **Writes to** or **Reads from** (ADF) **and** **May access**.
   - Event Grid family present (**Routes events to** or catalog label).
   - Mermaid/AST does **not** contain VNet/PE node labels (hide infrastructure).
   - Second Function does **not** gain **Private network path** to SQL.
   - Web App **may** gain **Private network path** if SN-PE-04 is merged; if 04 is missing, assert no naive PE fan-out (no PE-only hop for Function 2).

3. Network-mode compile of the same snapshot still shows the VNet (regression).
4. Do **not** assert percents. Do **not** require Power BI.

## Acceptance criteria

- One test file (or clearly named facts) fails on master without SN-PE-03/04, passes after this wave.
- No live Azure. No Playwright unless an existing operator-mock path is cheaper — prefer AST/mermaid string tests (SN-DF-07).

## Constraints

- Copy IE-DD-02 / SN-DF-07 shape. Do not re-run IE-DD or SN-DF.
- Stage only this prompt’s paths. **No `git add -A`.**

## Verification

```bash
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~InfraEvidenceSnapshotMermaidServiceTests'
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DataFlow'
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application/ArchLucid.Application.csproj'
```

Retarget if SN-DF-07 tests live elsewhere. Heartbeat every 8s if >15s. No `npm ci` unless you must touch a Vitest parser — prefer not to.

## Done when

The contract fails if Data Flow drops **May access** or paints a PE hop for the unlinked spoke.
