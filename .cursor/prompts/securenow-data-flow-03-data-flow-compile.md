# SN-DF-03 — Data Flow compile mode

**Wave:** SecureNow data flow (**SN-DF**). **Depends on:** SN-DF-01, SN-DF-02. **Do not** implement SN-DF-04–08 (legend copy, UI picker, Data Architecture mode, contracts, empty-state UX).

Do not implement from the wave index. Implement only *What to build*.

## Goal

Add `DiagramMode.DataFlow` that compiles a **stage-ordered data-movement diagram**: Source → Ingestion → Storage (Transform/Consumer only when nodes exist). Arrows are ADF `adfReadsFrom` / `adfWritesTo` (and linked-service edges only when no directional pair exists). Hide NIC, VNet, subnet, PE, LB.

## Why

`DiagramMode.Data` is a category filter on the ARM forest. Owner commentary: that is the wrong product. Diagram 3 must answer origin / ingest / store.

Minimum viable picture:

```text
[External: SAP / host]  →  Azure Data Factory  →  [ADLS or SQL]
```

## Context

- `docs/securenow/DATA_ARCHITECTURE_AND_DATA_FLOW_DIAGRAMS.md` §1, §5
- `ArchLucid.ArtifactSynthesis/Models/DiagramMode.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstFromGraphCompiler.cs`
- `ArchLucid.Application/InfraEvidence/Mermaid/InfraEvidenceMermaidModeParser.cs` (parser wiring can wait for SN-DF-05 **if** you add a failing test on the enum+compiler only; prefer adding `"dataFlow"` parse here so 05 is UI-only — **do** add parser mapping in this prompt if it is a one-line `Success(DiagramMode.DataFlow, "dataFlow")`. Ask allowlist is SN-DF-05.)
- SN-DF-01 external node injection
- SN-DF-02 stage resolver
- `DiagramEdgeLabelHumanizer` (Reads from / Writes to)

## What to build

1. Add `DataFlow` to `DiagramMode`.
2. Filter: include nodes whose stage is non-null; inject SN-DF-01 external nodes; include ADF factories even if they have no flows (Ingestion with dangling sources still useful).
3. **Do not** wrap Data Flow in RG swimlanes. Pack by stage subgraphs (or ordered columns). Stage order: Source, Ingestion, Storage, Transform, Consumer. Omit empty stages entirely in this prompt (empty-stage captions are SN-DF-08).
4. Edges: keep `adfReadsFrom`, `adfWritesTo`; keep `adfLinkedService` / `Inferred` only when SN-DF-01/Prompt 7 would today (directional pair skip already in mapper). Drop `CONTAINS` parent/child, peering, NIC→subnet, PE→target from this mode (PE is Diagram 1).
5. Direction: Read means store/source → factory or factory ← store per existing relationship `From`/`To` (do not reverse Provenance). Human labels already exist.
6. Data Flow **may** emit `flowchart LR` **only for this mode**. Do **not** change Executive/Network/Identity/Data to LR.
7. Tests:
   - Graph: factory + SQL + unresolved SAP LS + `adfWritesTo` factory→SQL + factory→external. Data Flow compile includes three nodes, two movement edges, **no** VNet even if present on the graph.
   - Network-mode compile of the same graph still includes the VNet (regression).
   - Data mode unchanged (still category filter; may still omit SQL until IE-DD-01 — do not “fix” Data mode here).
   - VM-only graph → Data Flow has zero resource nodes (Succeeded empty is OK; UX copy is SN-DF-08).

## Acceptance criteria

- Data Flow compile of the MVP fixture matches Source → ADF → SQL and does not show VNet/NIC/PE.
- Existing mode tests stay green.
- No fake Power BI node.

## Constraints

- Working-tree safety. Plane wins. One collector. No apply.
- Do **not** collapse desktop review tabs.
- Do **not** implement the workbench dropdown (SN-DF-05) unless parser tests require the mode key — then add parser only, not React.
- Stage only this prompt’s paths. **No `git add -A`.**

## Verification

```bash
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramAstFromGraphCompilerTests'
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~InfraEvidenceMermaidModeParser'
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis/ArchLucid.ArtifactSynthesis.csproj'
```

Heartbeat every 8s if >15s. No `npm ci`.

## Done when

- A unit graph of SAP (external) + ADF + SQL compiles in Data Flow as the owner MVP, with Reads from / Writes to labels, without infrastructure boxes.
