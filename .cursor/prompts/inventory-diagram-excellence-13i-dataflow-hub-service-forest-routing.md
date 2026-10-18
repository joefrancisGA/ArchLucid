# IDX-13i — Data Flow hub service forest routing ratchet

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-13f and IDX-13h on trunk. **Extend only.**

## Goal

`InfraEvidenceSnapshotMermaidService.TryGetMermaidAsync` (`dataFlow`) must produce inventory-forest `LayoutSvg` whose cross-stage `landing → adf` route avoids spoke cards, matching IDX-13g on the compile ratchet.

## What to build

1. Move `InventoryDiagramExcellenceDataFlowHubRoutingAssertions` to `ArchLucid.ArtifactSynthesis/Testing` (`internal`, shared with Application.Tests via `InternalsVisibleTo`).

2. Extend `InfraEvidenceSnapshotMermaidDataFlowHubPipelineRatchetTests`: compile the same graph, parse service `LayoutSvg`, call `AssertCrossStageRouteAvoidsSpokeCards`.

## Tests

```bash
dotnet test ArchLucid.Application.Tests --filter 'FullyQualifiedName~InfraEvidenceSnapshotMermaidDataFlowHubPipelineRatchet'
dotnet test ArchLucid.ArtifactSynthesis.Tests --filter 'FullyQualifiedName~InventoryDiagramExcellence'
```
