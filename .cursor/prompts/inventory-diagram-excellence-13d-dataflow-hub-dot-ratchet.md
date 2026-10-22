# IDX-13d — Data Flow hub pipeline Graphviz DOT export ratchet

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-07f and IDX-13c on trunk (canonical hub fixture; forest + Mermaid ratchets under `FullyQualifiedName~InventoryDiagramExcellence`). **Extend only.** Do **not** greenfield IDX-01–13. Do **not** reimplement forest hub layout (IDX-07b–07e) or Mermaid repair unless DOT and Mermaid fail together.

Follow [`.cursor/prompts/inventory-diagram-excellence-00-index.md`](inventory-diagram-excellence-00-index.md) global constraints and **All `DiagramMode` contract**.

## Goal

**Graphviz DOT** emitted from the canonical Data Flow hub pipeline fixture must stay honest: every cited node and the cross-stage `landing → adf` edge appear in DOT text suitable for PNG export. IDX-13 names forest, Mermaid, and PNG. **IDX-13b** ratchets nested VNet/subnet frames on the **fat** graph only. **IDX-07f / 13c** guard forest and Mermaid on the **hub** fixture. DOT/PNG for that fixture is still unguarded.

## Why

Operators download Graphviz PNG from the same `DiagramAst` that drives inventory-forest. An agent can break `DiagramAstGraphvizDotEmitter` for Data Flow stage subgraphs (drop spokes, omit cross-stage edges, or cluster nodes away from cited edges) while forest SVG and Mermaid export stay green.

## Applies to every `DiagramMode`

| Mode | This prompt |
|------|-------------|
| DataFlow | Hero. DOT ratchet on the canonical hub fixture only. |
| FullSubscription / Network / ResourceGroup | Unchanged. Nested-frame DOT parity remains **IDX-13b** on `BuildFatGraph()`. |
| All other modes | Unchanged. |

## Context (extend, do not replace)

- `ArchLucid.ArtifactSynthesis.Tests/InventoryDiagramExcellenceDataFlowHubPipelineFixture.cs` — canonical AST; **reuse**.
- `ArchLucid.ArtifactSynthesis.Tests/InventoryDiagramExcellenceDataFlowHubPipelineRatchetTests.cs` — forest ratchet (keep green).
- `ArchLucid.ArtifactSynthesis.Tests/InventoryDiagramExcellenceDataFlowHubPipelineMermaidRatchetTests.cs` — Mermaid ratchet (keep green).
- `ArchLucid.ArtifactSynthesis.Tests/DiagramAstGraphvizDotEmitterTests.cs` — DOT shape and cluster conventions.
- `ArchLucid.ArtifactSynthesis/Graphviz/DiagramAstGraphvizDotEmitter.cs` — emit path for stage subgraphs vs RG clusters.
- `ArchLucid.ArtifactSynthesis.Tests/InventoryDiagramExcellenceRatchetAssertions.cs` — `AssertDataFlowRetainsStageSubgraphs`; optional shared helper (e.g. `AssertDataFlowHubPipelineDot`) if it reduces duplication across 13c/13d.

## What to build

1. **New test class** (one type per file) named `InventoryDiagramExcellenceDataFlowHubPipelineDotRatchetTests`. Class or test names must include `InventoryDiagramExcellence`.

2. **Minimum assertions** on `DiagramAstGraphvizDotEmitter.Emit` for `InventoryDiagramExcellenceDataFlowHubPipelineFixture.Build()`:
   - `AssertDataFlowRetainsStageSubgraphs(ast)` on the fixture AST before emit.
   - DOT is non-empty and contains node identifiers for `landing`, `adf`, and `st0`…`st11` (use the same id spelling the emitter applies today — see `DiagramAstGraphvizDotEmitterTests` for quoting rules).
   - DOT contains a cited **landing → adf** edge (Graphviz arrow syntax, e.g. `landing -> adf` or quoted equivalents).
   - DOT contains cited **adf → st0** and **adf → st11** edges.
   - When stage subgraphs compile to DOT clusters, assert both stage cluster ids or labels for `stage_source` and `stage_transform` appear (do not require subscription outer on Data Flow if `ShouldDraw` is false for this title — match existing policy).

3. **If tests fail on trunk**, fix **Graphviz DOT planning/emit** only (`DiagramAstGraphvizDotEmitter`, `DiagramResourceGroupGraphvizClusterPlanner`, or Data Flow–specific subgraph membership). Do **not** change forest hub layout or Mermaid repair unless those ratchets also fail.

4. **PNG (optional, same PR only if CI already runs `dot`):** if the repo has an existing unit test that shells out to Graphviz for a small AST, add one smoke render of the hub fixture DOT. If no harness exists, **skip PNG** — DOT string ratchet is sufficient for this prompt.

5. Do **not** add nested VNet/subnet frame requirements on this fixture (no VNets in the graph). Do **not** add same-RG all-to-all edges. Do **not** default Graphviz layout to `dot` globally.

## Acceptance criteria

- `dotnet test ArchLucid.ArtifactSynthesis.Tests --filter FullyQualifiedName~InventoryDiagramExcellence` includes the new DOT ratchet.
- `DiagramAstGraphvizDotEmitterTests` and hub forest/Mermaid ratchets stay green.
- Tests-only PR is valid when trunk already passes.

## Constraints

- **Do not** reopen IDX-01 capture or IDX-10 PE UI.
- **Do not** merge this with **IDX-13b** fat-graph nested-frame parity — different fixture and contract.
- **This is not IDX-HOLD.**

## Done when

Breaking Graphviz DOT export for the canonical two-stage hub fixture fails `FullyQualifiedName~InventoryDiagramExcellence` while forest and Mermaid ratchets still pass.

## Tests

```bash
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~InventoryDiagramExcellence'
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramAstGraphvizDotEmitter'
```
