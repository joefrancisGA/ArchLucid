# IDX-13l — Data Flow hub Mermaid stage label ratchet

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-13k on trunk. **Extend only.**

## Goal

Mermaid export for the canonical Data Flow hub pipeline must surface buyer-facing stage swimlane labels **`Source`** and **`Ingestion`** on both the hand AST path (IDX-13c) and the snapshot service path (IDX-13f).

IDX-13k aligned the hand fixture AST label; Mermaid ratchets still only guard nodes and edges, not stage copy.

## What to build

1. Shared helper in `ArchLucid.ArtifactSynthesis/Testing` (e.g. `InventoryDiagramExcellenceDataFlowHubPipelineMermaidStageLabelAssertions.AssertStageLabels`).

2. Extend `InventoryDiagramExcellenceDataFlowHubPipelineMermaidRatchetTests` to call the helper on `PrimaryMermaid`.

3. Extend `InfraEvidenceSnapshotMermaidDataFlowHubPipelineRatchetTests` to assert the same on service `Mermaid` for `dataFlow`.

4. Do not change renderers unless tests fail on trunk.

## Tests

```bash
dotnet test ArchLucid.Application.Tests --filter 'FullyQualifiedName~InfraEvidenceSnapshotMermaidDataFlowHubPipelineRatchet'
dotnet test ArchLucid.ArtifactSynthesis.Tests --filter 'FullyQualifiedName~InventoryDiagramExcellenceDataFlowHubPipelineMermaid'
```
