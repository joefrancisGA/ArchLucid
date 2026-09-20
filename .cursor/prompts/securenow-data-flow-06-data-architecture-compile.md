# SN-DF-06 — Data Architecture compile mode

**Wave:** SecureNow data flow (**SN-DF**). **Depends on:** SN-DF-02, SN-DF-05 pattern (parser + workbench). **Do not** implement SN-DF-07–08.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Add `DiagramMode.DataArchitecture` / `mermaidMode=dataArchitecture` — **repositories and platforms only**: SQL, Cosmos, ADLS/storage, ADF/Synapse (as platforms), plus SN-DF-01 external sources if you include origins as architecture boxes. **Few or no arrows.** No NIC/VNet/PE/LB.

## Why

Owner Diagram 2 is “what stores exist,” not movement. Do not overload Data Flow or Data mode.

Focus: Application (optional, omit if it pulls VMs), Storage account, SQL database, Cosmos, Data lake, Fabric, Power BI — **only types present in the snapshot**.

## Context

- `docs/securenow/DATA_ARCHITECTURE_AND_DATA_FLOW_DIAGRAMS.md` §1 Diagram 2
- SN-DF-03 Data Flow compiler (reuse stage resolver; different filter/edges)
- SN-DF-05 files for the second mode key

## What to build

1. `DiagramMode.DataArchitecture`. Parser key `dataArchitecture`. UI label **Data architecture**.
2. Include stages Storage + Ingestion + Transform + Consumer + Source (external). Omit network/compute except `Microsoft.Web/sites` **only if** you can do it without pulling VM/NIC (prefer omit App Service in this prompt — keep the canvas a repository catalog; apps as producers are a later slice).
3. Edges: **none** by default, or parent SQL server→database `CONTAINS` only. Do **not** draw ADF reads/writes here (that is Data Flow).
4. Layout: flat or type groups (Databases / Storage / Integration). **Not** RG swimlanes. **Not** required to use LR.
5. Honesty: same family as SN-DF-04 — “Inventory of data platforms in this snapshot. Not a data-flow diagram.” (own constant; sentence case).
6. Tests: storage+SQL+factory+VNet → architecture has storage/SQL/factory, **no** VNet, **no** `adfWritesTo`. Data Flow on the same graph **does** keep movement edges (regression).
7. Workbench option + Ask allowlist + parser error text.

## Acceptance criteria

- Data architecture is a catalog of stores/platforms.
- Data flow still shows movement.
- Infrastructure modes unchanged.

## Constraints

- Working-tree safety. No fake Fabric/PBI.
- Do not re-do SN-DF-03 packing.
- Stage only this prompt’s paths. **No `git add -A`.**

## Verification

```bash
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramAstFromGraphCompilerTests'
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~InfraEvidenceMermaidModeParser|FullyQualifiedName~DiagramViewPlanValidator'
cd archlucid-ui && npx vitest run src/lib/infra-evidence/infra-evidence-diagrams-filter-url.test.ts
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application/ArchLucid.Application.csproj'
```

Heartbeat every 8s if >15s.

## Done when

- Operators can pick Data architecture and see SQL/ADLS/ADF boxes without VNets or ETL arrows.
