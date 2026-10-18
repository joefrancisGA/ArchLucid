# IDX-13g — Data Flow hub pipeline compile forest routing ratchet

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-13e on trunk (graph compile hub ratchet). **Extend only.** Do **not** greenfield IDX-01–13f.

Follow [`.cursor/prompts/inventory-diagram-excellence-00-index.md`](inventory-diagram-excellence-00-index.md) global constraints.

## Goal

`InventoryDiagramExcellenceDataFlowHubPipelineCompileRatchetTests` must call `InventoryDiagramExcellenceDataFlowHubRoutingAssertions.AssertCrossStageRouteAvoidsSpokeCards` for the compiled `landing → adf` edge, matching the hand AST ratchet (IDX-07f).

IDX-13e skipped this assertion because compile humanizes edge labels (`Writes to`) while the hand fixture uses `writes`, and forest SVG `<title>` text is lowercased display label.

## What to build

1. **Routing helper:** resolve the forest SVG edge `<title>` from the `DiagramAst` edge between the two node ids (same lowercasing as `DiagramForestEdgeLabelSvgEmitter`). Keep an optional explicit `edgeLabel` override for tests that need it.

2. **Compile ratchet:** after forest `Render` succeeds on the hub graph fixture, assert cross-stage routing avoids spoke cards using compiled node ids (`MermaidIdSanitizer`).

3. **Do not** change hub layout, stage naming (Source/Ingestion vs Transform), or Mermaid spacing.

## Acceptance criteria

- `dotnet test ArchLucid.ArtifactSynthesis.Tests --filter FullyQualifiedName~InventoryDiagramExcellence` passes, including compile routing.
- Hand AST hub ratchet (`…HubPipelineRatchetTests`) stays green.

## Tests

```bash
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~InventoryDiagramExcellenceDataFlowHubPipelineCompileRatchet'
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~InventoryDiagramExcellence'
```
