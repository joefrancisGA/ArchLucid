# IDX-13j — Data Flow hub service PNG export DOT ratchet

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-13f and IDX-13i on trunk. **Extend only.**

Follow [`.cursor/prompts/inventory-diagram-excellence-00-index.md`](inventory-diagram-excellence-00-index.md) global constraints.

## Goal

`InfraEvidenceSnapshotMermaidService.TryExportPngAsync` for mode `dataFlow` on the canonical hub `GraphSnapshot` must route through **inventory-forest** Graphviz DOT (not Mermaid PNG fallback) and that DOT must retain the hub pipeline nodes, stage clusters, and cited edges.

IDX-13d/13e ratchet DOT on hand AST and compile paths in ArtifactSynthesis.Tests. Operators download PNG from the service, which re-compiles `RepairedAst` and calls `IGraphvizLayoutRenderer.RenderPngAsync(dot)`. That DOT string is unguarded.

## What to build

1. **Shared DOT assertions** in `ArchLucid.ArtifactSynthesis/Testing` (e.g. `InventoryDiagramExcellenceDataFlowHubPipelineCompiledDotAssertions`) for compiled hub pipeline DOT: stage cluster ids, `Source` / `Ingestion` labels, nodes `landing`/`adf`/`st0`/`st11`, edges landing→adf, adf→st0, adf→st11. Reuse from `InventoryDiagramExcellenceDataFlowHubPipelineCompileRatchetTests`.

2. **New test class** `InfraEvidenceSnapshotMermaidDataFlowHubPipelinePngRatchetTests` in Application.Tests:
   - Stub graph resolver with `InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture.Build()`.
   - `CapturingGraphvizLayoutRenderer` records DOT and returns a minimal valid PNG byte sequence on `RenderPngAsync`.
   - Mock `WrapRenderedPngForExportAsync` to pass PNG through.
   - `TryExportPngAsync(..., "dataFlow", includePrivateEndpointNodes: false)` succeeds.
   - Assert captured DOT via shared helper.

3. **Out of scope:** shelling out to real Graphviz; Mermaid PNG fallback path; stage label rename between hand AST and compile.

## Tests

```bash
dotnet test ArchLucid.Application.Tests --filter 'FullyQualifiedName~InfraEvidenceSnapshotMermaidDataFlowHubPipelinePngRatchet'
dotnet test ArchLucid.ArtifactSynthesis.Tests --filter 'FullyQualifiedName~InventoryDiagramExcellence'
```
