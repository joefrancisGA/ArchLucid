# IDX-13t — Data Flow hub pipeline trait guard

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-13s (Application hub service trait filter). **Extend only.**

## Goal

Hub pipeline ratchets span `ArchLucid.ArtifactSynthesis.Tests` and `ArchLucid.Application.Tests`. Give every hub-pipeline test class the same xUnit trait (`InventoryDiagramExcellence=DataFlowHubPipeline`) and a guard test so new ratchets cannot forget it.

## What to build

1. Add `[Trait("InventoryDiagramExcellence", "DataFlowHubPipeline")]` to each `InventoryDiagramExcellenceDataFlowHubPipeline*Tests` class in ArtifactSynthesis.Tests and both `InfraEvidenceSnapshotMermaidDataFlowHubPipeline*Tests` classes in Application.Tests.

2. `InventoryDiagramExcellenceDataFlowHubPipelineTraitGuardTests` — explicit list of hub ratchet class names; assert each type in the assembly carries the trait.

3. `InfraEvidenceSnapshotMermaidDataFlowHubPipelineTraitGuardTests` — same for the two Application hub service classes.

4. Index regression guard: run both filters (ArtifactSynthesis + Application).

## Tests

```bash
dotnet test ArchLucid.ArtifactSynthesis.Tests --filter 'InventoryDiagramExcellence=DataFlowHubPipeline'
dotnet test ArchLucid.Application.Tests --filter 'InventoryDiagramExcellence=DataFlowHubPipeline'
```
