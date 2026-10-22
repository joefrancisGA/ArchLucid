# IDX-13e — Data Flow hub pipeline graph-compile ratchet

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-07f, IDX-13c, and IDX-13d on trunk (hand-built `DiagramAst` hub fixture; forest, Mermaid, and DOT ratchets). **Extend only.** Do **not** greenfield IDX-01–13. Do **not** duplicate the hand AST fixture — add a **GraphSnapshot** compile path that must stay equivalent in behavior.

Follow [`.cursor/prompts/inventory-diagram-excellence-00-index.md`](inventory-diagram-excellence-00-index.md) global constraints and **All `DiagramMode` contract**.

## Goal

`DiagramAstFromGraphCompiler.Compile(snapshot, DiagramMode.DataFlow)` on a **graph-backed** hub pipeline fixture must preserve the same excellence contract as `InventoryDiagramExcellenceDataFlowHubPipelineFixture.Build()`: two movement stages, fourteen cited resources, no erroneous Data Flow rollup collapse, in-stage hub forest layout, and honest Mermaid/DOT export.

IDX-07f through **13d** ratchet a **hand-built AST**. Hosted infra evidence builds `DiagramAst` from `GraphSnapshot` + compile. An agent can break graph compile (stage assignment, edge filtering, type peel rules) while every `InventoryDiagramExcellenceDataFlowHubPipeline*` AST test stays green.

## Why

Workbench and `InfraEvidenceSnapshotMermaidService` never see the test-only AST builder. Buyers upload snapshots; edges come from relationship association types on graph edges. The hub star is the hardest Data Flow shape (cross-stage hop + twelve same-type sinks). It belongs in the compile ratchet, not only in layout unit tests fed by hand AST.

## Applies to every `DiagramMode`

| Mode | This prompt |
|------|-------------|
| DataFlow | Hero. Compile ratchet only. |
| Network / FullSubscription / other modes | Unchanged. Do not widen compile filters to “fix” Data Flow. |

## Context (extend, do not replace)

- `ArchLucid.ArtifactSynthesis.Tests/InventoryDiagramExcellenceDataFlowHubPipelineFixture.cs` — behavioral reference (stages, counts, edges); **do not** delete.
- `ArchLucid.ArtifactSynthesis.Tests/InventoryDiagramExcellenceDataFlowHubPipelineRatchetTests.cs` — forest; `…MermaidRatchetTests.cs`; `…DotRatchetTests.cs` — reuse assertion helpers where possible (`InventoryDiagramExcellenceRatchetAssertions`, `InventoryDiagramExcellenceDataFlowHubRoutingAssertions`).
- `ArchLucid.ArtifactSynthesis.Tests/DiagramAstFromGraphCompilerTests.cs` — `BuildDataFlowMvpGraph`, `AddDataFlowEdge`, `CreateTopologyNode` patterns for movement edges and stage placement.
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstFromGraphCompiler.cs` — compile filters and Data Flow stage planner (fix here only when compile ratchet fails).
- `ArchLucid.Application.Tests/InfraEvidence/InfraEvidenceSnapshotMermaidServiceTests.cs` — service path is **IDX-13f**, not this prompt.

## What to build

1. **Graph fixture** (own file): `InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture.Build()` returns a `GraphSnapshot` with:
   - One storage landing node in stage 1 (source / ingestion).
   - One `Microsoft.DataFactory/factories` hub in stage 2 (transform).
   - Twelve `Microsoft.Storage/storageAccounts` sinks in stage 2.
   - Cited Data Flow edges: landing → factory, factory → each sink (use the same association / movement edge helpers as `DiagramAstFromGraphCompilerTests`).
   - Mermaid-safe **graph** node ids (letters, digits, underscore).

2. **New test class** `InventoryDiagramExcellenceDataFlowHubPipelineCompileRatchetTests` (names include `InventoryDiagramExcellence`).

3. **Minimum assertions** after `compiler.Compile(graph, DiagramMode.DataFlow)`:
   - `AssertDataFlowRetainsStageSubgraphs(ast)`.
   - At least fourteen renderable topology nodes matching the graph intent (labels or node ids documented in test comments).
   - `DiagramForestDataFlowRollup.Apply` yields **no** `IsDataFlowRollup` nodes for the hub component (same rule as 07f).
   - Forest `Render`: `Succeeded`, exactly one `data-hub-spoke="hub"`, cross-stage route avoids spoke cards (reuse `InventoryDiagramExcellenceDataFlowHubRoutingAssertions` with compile-time node ids).
   - Mermaid pipeline: `Succeeded`; retain compile-time node tokens and `landing → factory` plus factory → `st0` / `st11` (map graph ids to compiled `NodeId`s in one place).
   - DOT: stage clusters present; cited edges in DOT (reuse 13d edge assertion style).

4. **If compile drops nodes or edges**, fix **graph compile** (Data Flow stage assignment, edge inclusion, peel rules). Do **not** change forest hub layout unless forest ratchet on the **hand** fixture also fails.

5. Do **not** require a new hosted snapshot package or live Azure calls.

## Acceptance criteria

- `dotnet test ArchLucid.ArtifactSynthesis.Tests --filter FullyQualifiedName~InventoryDiagramExcellence` includes the compile ratchet.
- Existing hub AST ratchets (07f, 13c, 13d) and `DiagramAstFromGraphCompiler` Data Flow tests stay green.

## Constraints

- **Do not** reopen IDX-01 capture or IDX-10 PE UI.
- **Do not** merge this with **IDX-13b** fat-graph nested-frame work.
- **This is not IDX-HOLD.**

## Done when

Breaking Data Flow compile for a twelve-spoke hub graph fails `FullyQualifiedName~InventoryDiagramExcellence` even when hand-built AST hub tests still pass.

## Tests

```bash
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~InventoryDiagramExcellence'
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramAstFromGraphCompiler&FullyQualifiedName~data_flow'
```
