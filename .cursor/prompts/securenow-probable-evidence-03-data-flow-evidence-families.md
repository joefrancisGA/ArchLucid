# SN-PE-03 — Data Flow evidence families (filter + endpoints)

**Wave:** SecureNow probable-evidence Data Flow (**SN-PE**). **Depends on:** SN-PE-01, SN-PE-02. **Do not** implement SN-PE-04–07 (PE join, messaging role map, legend rewrite, golden contract — a thin legend call is OK if compile already shows SN-DF-04 copy).

Do not implement from the wave index. Implement only *What to build*.

## Goal

`DiagramMode.DataFlow` shows allow-listed evidence families from SN-PE-01, not only ADF/Synapse. Include Application endpoints when a family edge exists. Hide NIC/VNet/PE/diagnostics. Keep ADF **Reads from** / **Writes to** as the declared-movement spine.

## Why

`DiagramDataFlowEdgeFilter` is a closed ADF/Synapse set. AX-DE already materialized `appAuthorizedAccess` and Event Grid edges; they never paint on Diagram 3. AX-DC-02 solved the same endpoint-drop on Executive — Data Flow needs its **own** inclusion so Web App **May access** SQL can sit next to SAP → ADF → SQL without opening the network forest.

## Context

- `docs/securenow/EVIDENCE_BASED_PROBABLE_DATA_FLOWS.md` §§2–3, §6
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramDataFlowCompileSupport.cs` (`DiagramDataFlowEdgeFilter`)
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstFromGraphCompiler.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/InventoryConnectionEndpointIncluder.cs` (pattern only — do not dump diagnostics onto Data Flow)
- SN-PE-01 `IncludeOnDataFlow`
- SN-PE-02 Application stage

## What to build

1. Replace the hard-coded ADF HashSet with SN-PE-01 `IncludeOnDataFlow` lookup (association type **or** inference source). Keep CONTAINS / CONTAINS_RESOURCE excluded.
2. After Data Flow node filter, append missing endpoints for included family edges (Application ↔ Storage, Event Grid → Function, etc.). Do **not** append endpoints for excluded types.
3. Still omit nodes whose stage is null **unless** they were appended as a family endpoint **and** SN-PE-02 now gives them a stage. If an endpoint has no stage, skip the edge (test this: VM **May access** SQL → SQL may show, VM stays off unless you mapped VM — you must **not** map VM in this prompt; drop that edge on Data Flow).
4. Do **not** wrap in RG swimlanes. Stage subgraphs unchanged aside from Application column.
5. Labels: humanizer already has **May access**; add **Routes events to** / **Captures to** / **Private network path** only if SN-PE-01 introduced them and humanizer lacks them. **Never** map `MAY_ACCESS` to Reads from.
6. Tests (must fail on current master):
   - Fixture: external SAP + ADF `adfWritesTo` SQL + Web App `appAuthorizedAccess` SQL. Data Flow includes four nodes (SAP, factory, SQL, Web App), both edge families, **no** VNet even if present.
   - Same graph, Network mode still includes the VNet (regression).
   - Fixture: `diagnosticToDestination` only → Data Flow does **not** show the diagnostic edge.
   - Fixture: `privateEndpointTarget` only (no SN-PE-04 hop) → Data Flow does **not** show PE or PE→SQL as the spine.
   - Executive **May access** tests stay green (do not regress AX-DC-02).

## Acceptance criteria

- CISO can see declared ADF movement and authorized **May access** on one Data Flow canvas.
- Diagnostics and raw PE stay off Diagram 3.
- No Azure HTTP. No new collector.

## Constraints

- Do **not** implement the DNS join (SN-PE-04). If `peReachableTarget` edges exist in a fixture, including them is OK because SN-PE-01 listed them; do not **create** them here.
- Do **not** change Executive includer allow-lists except if a shared helper would accidentally add diagnostics to Data Flow — keep Data Flow stricter.
- Stage only this prompt’s paths. **No `git add -A`.**

## Verification

```bash
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramAstFromGraphCompilerTests|DataFlow'
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis/ArchLucid.ArtifactSynthesis.csproj'
```

Heartbeat every 8s if >15s. No `npm ci`.

## Done when

The SAP + ADF + SQL + Web App fixture compiles in Data Flow with **Writes to** and **May access**, without VNet/PE/diagnostics.
