# IDX-08c — Collapsed singleton tail label excellence ratchet

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-08b and collapsed-tail tile labels on trunk (`DiagramForestCollapsedSingletonTailLabels`). **Extend only.**

## Goal

`DiagramForestCollapsedSingletonTailLabelsTests` guards caption/count helpers outside `FullyQualifiedName~InventoryDiagramExcellence`. Add a named excellence ratchet class so label regressions fail the cross-mode slice filter.

## What to build

1. `InventoryDiagramExcellenceCollapsedSingletonTailLabelsRatchetTests` — assert collapsed tail caption uses `Other resource groups (N)` label and neighborhood resource count parses from that label.

2. Register the type in **IDX-13v** cross-mode wave manifest and **IDX-13w** trait guard lists.

3. Index row **IDX-08c** shipped — extend only; filter `FullyQualifiedName~InventoryDiagramExcellenceCollapsedSingletonTailLabelsRatchet`.

## Tests

```bash
dotnet test ArchLucid.ArtifactSynthesis.Tests --filter 'FullyQualifiedName~InventoryDiagramExcellenceCollapsedSingletonTailLabelsRatchet'
dotnet test ArchLucid.ArtifactSynthesis.Tests --filter 'FullyQualifiedName~CrossModeWaveManifest'
```
