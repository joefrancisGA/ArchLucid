# IDX-13n — Data Flow hub compile ratchet stage label parity

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-13e on trunk; complements IDX-13l (Mermaid) and IDX-13m (forest) on hand/service paths. **Extend only.**

## Goal

`InventoryDiagramExcellenceDataFlowHubPipelineCompileRatchetTests` must assert **Source** and **Ingestion** stage copy on both Mermaid and forest `LayoutSvg` emitted from **graph compile**, not only nodes/edges/DOT.

## What to build

1. Reuse or add shared helpers in `ArchLucid.ArtifactSynthesis/Testing`:
   - `InventoryDiagramExcellenceDataFlowHubPipelineMermaidStageLabelAssertions`
   - `InventoryDiagramExcellenceDataFlowHubPipelineForestStageLabelAssertions`

2. Extend the compile ratchet test after forest and Mermaid render.

3. Do not change compile/layout unless tests fail on trunk.

## Tests

```bash
dotnet test ArchLucid.ArtifactSynthesis.Tests --filter 'FullyQualifiedName~InventoryDiagramExcellenceDataFlowHubPipelineCompile'
```
