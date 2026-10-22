# IDX-13u — Data Flow hub pipeline wave manifest

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-13t (hub trait filter). **Extend only.**

## Goal

Close the **07f–13t** hub sub-wave with a manifest guard: every ratchet class that must exist for the Data Flow hub pipeline matrix is listed explicitly so accidental deletion fails CI.

## What to build

1. `InventoryDiagramExcellenceDataFlowHubPipelineWaveManifestTests` (ArtifactSynthesis.Tests) — assert each listed hub ratchet type exists and exposes at least one `[Fact]`.

2. `InfraEvidenceSnapshotMermaidDataFlowHubPipelineWaveManifestTests` (Application.Tests) — same for service Mermaid + PNG ratchets.

3. Index subsection documenting the hub wave as **complete** and pointing at `InventoryDiagramExcellence=DataFlowHubPipeline` for the slice filter.

## Tests

```bash
dotnet test ArchLucid.ArtifactSynthesis.Tests --filter 'FullyQualifiedName~DataFlowHubPipelineWaveManifest'
dotnet test ArchLucid.Application.Tests --filter 'FullyQualifiedName~DataFlowHubPipelineWaveManifest'
```
