# IDX-13q — Data Flow hub export stage label bundle ratchet

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-13p on trunk (`ExportStageLabelAssertions`). **Extend only.**

## Goal

All primary hub pipeline ratchets must use `InventoryDiagramExcellenceDataFlowHubPipelineExportStageLabelAssertions.AssertAll` so Mermaid and forest stage copy stay paired. Add one hand-fixture test that renders both exports in a single excellence-filtered fact.

## What to build

1. Refactor `InfraEvidenceSnapshotMermaidDataFlowHubPipelineRatchetTests` to call `AssertAll` instead of separate Mermaid/forest stage helpers.

2. Refactor `InventoryDiagramExcellenceDataFlowHubPipelineCompileRatchetTests` the same way.

3. Add `InventoryDiagramExcellenceDataFlowHubPipelineHandExportStageLabelRatchetTests` (hand AST, forest + Mermaid render, `AssertAll`).

4. Do not change renderers unless tests fail.

## Tests

```bash
dotnet test ArchLucid.Application.Tests --filter 'FullyQualifiedName~InfraEvidenceSnapshotMermaidDataFlowHubPipelineRatchet'
dotnet test ArchLucid.ArtifactSynthesis.Tests --filter 'FullyQualifiedName~InventoryDiagramExcellenceDataFlowHubPipeline'
```
