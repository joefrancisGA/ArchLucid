# IDX-13s — Data Flow hub service test factory

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-13f–13p hub service/PNG ratchets on trunk. **Extend only.**

## Goal

`InfraEvidenceSnapshotMermaidDataFlowHubPipelineRatchetTests` and `InfraEvidenceSnapshotMermaidDataFlowHubPipelinePngRatchetTests` duplicate the same hub-graph service wiring. Extract one factory so Mermaid and PNG paths cannot drift.

## What to build

1. `InfraEvidenceSnapshotMermaidDataFlowHubPipelineServiceTestFactory` (own file) with shared snapshot id, scope, graph resolver, orchestrator stack, and `CreateService(graph, graphvizRenderer?, enablePngWrap)`.

2. Refactor both Application hub service test classes to use the factory. Keep `CapturingGraphvizLayoutRenderer` in the PNG test file only.

3. Add `[Trait("InventoryDiagramExcellence", "DataFlowHubPipeline")]` on both Application test classes.

## Tests

```bash
dotnet test ArchLucid.Application.Tests --filter 'InventoryDiagramExcellence=DataFlowHubPipeline'
```
