# IDX-13o — Data Flow hub PNG export LayoutSvg stage label ratchet

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-13j and IDX-13l on trunk. Complements IDX-13m (forest labels on primary service ratchet). **Extend only.**

## Goal

`TryExportPngAsync("dataFlow")` on the hub graph must run on the same inventory-forest layout that still shows **Source** and **Ingestion** `data-flow-stage-label` headers. IDX-13j ratchets Graphviz DOT only; IDX-13m (when merged) guards `TryGetMermaidAsync` directly.

## What to build

1. Add `InventoryDiagramExcellenceDataFlowHubPipelineForestStageLabelAssertions` in Testing (if not already on trunk from IDX-13m/13n).

2. Extend `InfraEvidenceSnapshotMermaidDataFlowHubPipelinePngRatchetTests`: after a successful PNG export, call `TryGetMermaidAsync` with the same service wiring and assert `LayoutSvg` stage labels.

3. Do not change PNG emitters unless tests fail.

## Tests

```bash
dotnet test ArchLucid.Application.Tests --filter 'FullyQualifiedName~InfraEvidenceSnapshotMermaidDataFlowHubPipelinePng'
```
