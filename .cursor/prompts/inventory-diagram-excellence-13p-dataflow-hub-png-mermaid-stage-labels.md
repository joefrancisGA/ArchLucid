# IDX-13p — Data Flow hub PNG export Mermaid stage label ratchet

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-13o on trunk. **Extend only.**

## Goal

The hub PNG export ratchet must assert **both** forest `LayoutSvg` stage headers (IDX-13o) and **Mermaid** stage swimlane copy on the same `TryGetMermaidAsync` response used after `TryExportPngAsync`.

## What to build

1. Add `InventoryDiagramExcellenceDataFlowHubPipelineExportStageLabelAssertions.AssertAll(mermaid, layoutSvg)` delegating to the existing Mermaid and forest helpers.

2. Extend `InfraEvidenceSnapshotMermaidDataFlowHubPipelinePngRatchetTests` to call `AssertAll` instead of forest-only assertions.

3. Do not change renderers unless tests fail.

## Tests

```bash
dotnet test ArchLucid.Application.Tests --filter 'FullyQualifiedName~InfraEvidenceSnapshotMermaidDataFlowHubPipelinePng'
```
