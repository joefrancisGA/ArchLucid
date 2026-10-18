# IDX-13r — Data Flow hub stage label assertion dedupe

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-13q on trunk (`HandExportStageLabelRatchet` + `AssertAll` on service/compile/PNG). **Extend only.**

## Goal

Stop asserting **Source** / **Ingestion** stage copy three times on the hand AST path. `InventoryDiagramExcellenceDataFlowHubPipelineHandExportStageLabelRatchetTests` is the canonical paired Mermaid + forest stage-label ratchet; hand-only Mermaid and forest ratchets keep nodes, edges, routing, and rollup checks only.

## What to build

1. Remove `MermaidStageLabelAssertions` from `InventoryDiagramExcellenceDataFlowHubPipelineMermaidRatchetTests`.

2. Remove `ForestStageLabelAssertions` from `InventoryDiagramExcellenceDataFlowHubPipelineRatchetTests`.

3. One-line comment in each file pointing at the hand export stage-label ratchet.

4. Run hub pipeline filters; do not delete the hand export test.

## Tests

```bash
dotnet test ArchLucid.ArtifactSynthesis.Tests --filter 'FullyQualifiedName~InventoryDiagramExcellenceDataFlowHubPipeline'
```
