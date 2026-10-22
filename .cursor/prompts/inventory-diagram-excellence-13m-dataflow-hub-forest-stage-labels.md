# IDX-13m — Data Flow hub forest LayoutSvg stage label ratchet

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-13k on trunk (Ingestion stage label on AST). **Extend only.** Complements IDX-13l when that is on trunk (Mermaid stage copy).

## Goal

Inventory-forest `LayoutSvg` for the canonical Data Flow hub pipeline must render **`data-flow-stage-label`** text for **Source** and **Ingestion** on the hand AST path (IDX-07f) and the snapshot service path (IDX-13h).

Mermaid stage labels are IDX-13l; the workbench canvas reads forest SVG stage headers, which are still unguarded.

## What to build

1. Shared helper `InventoryDiagramExcellenceDataFlowHubPipelineForestStageLabelAssertions` in `ArchLucid.ArtifactSynthesis/Testing`.

2. Extend `InventoryDiagramExcellenceDataFlowHubPipelineRatchetTests` (hand forest).

3. Extend `InfraEvidenceSnapshotMermaidDataFlowHubPipelineRatchetTests` on `LayoutSvg`.

4. Do not change layout emitters unless tests fail.

## Tests

```bash
dotnet test ArchLucid.ArtifactSynthesis.Tests --filter 'FullyQualifiedName~InventoryDiagramExcellenceDataFlowHubPipelineRatchet'
dotnet test ArchLucid.Application.Tests --filter 'FullyQualifiedName~InfraEvidenceSnapshotMermaidDataFlowHubPipelineRatchet'
```
