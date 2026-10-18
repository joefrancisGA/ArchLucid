# IDX-13k — Data Flow hub hand fixture Ingestion stage label parity

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-13j on trunk. **Extend only.**

## Goal

The hand-built hub AST (`InventoryDiagramExcellenceDataFlowHubPipelineFixture`) must use the same second-stage **label** as graph compile and the service path: **`Ingestion`**, not `Transform`.

IDX-13f left label rename out of scope. Agents copying the hand fixture still see `Transform` while compile DOT/Mermaid/service export show `Ingestion`, which invites false “regressions.”

## What to build

1. Set the second stage subgraph **label** to `Ingestion` on the hand fixture. Keep subgraph id `stage_transform` unchanged so forest/Mermaid ratchets stay stable.

2. Update `InventoryDiagramExcellenceDataFlowHubPipelineDotRatchetTests` to expect `label="Ingestion"` (cluster id `cluster_stage_transform` unchanged).

3. **New test** `InventoryDiagramExcellenceDataFlowHubPipelineStageLabelParityTests`: compile `InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture` to DataFlow and assert the second stage subgraph label is `Ingestion`; hand fixture `Build()` must match.

4. Do **not** rename compile subgraph ids, change forest layout, or retune Mermaid spacing.

## Tests

```bash
dotnet test ArchLucid.ArtifactSynthesis.Tests --filter 'FullyQualifiedName~InventoryDiagramExcellenceDataFlowHubPipeline'
```
