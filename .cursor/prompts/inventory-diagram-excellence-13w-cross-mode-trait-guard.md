# IDX-13w — Cross-mode trait isolation guard

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-13v (cross-mode manifest). **Extend only.**

## Goal

Hub pipeline ratchets use `InventoryDiagramExcellence=DataFlowHubPipeline` (**IDX-13t**). Cross-mode ratchets must **not** carry that trait or `dotnet test --filter InventoryDiagramExcellence=DataFlowHubPipeline` would silently shrink when someone tags a fat-graph test as hub-only.

## What to build

1. `InventoryDiagramExcellenceCrossModeTraitGuardTests` (ArtifactSynthesis.Tests) — every type listed in the cross-mode manifest lacks `InventoryDiagramExcellence=DataFlowHubPipeline`.

2. `InventoryDiagramExcellenceCrossModeTraitGuardApplicationTests` (Application.Tests) — same for Application cross-mode excellence ratchets.

3. Extend **IDX-13v** manifest class lists to include the trait guard types.

4. Index row **IDX-13w** shipped — extend only; filter `FullyQualifiedName~CrossModeTraitGuard`.

## Tests

```bash
dotnet test ArchLucid.ArtifactSynthesis.Tests --filter 'FullyQualifiedName~CrossModeTraitGuard'
dotnet test ArchLucid.Application.Tests --filter 'FullyQualifiedName~CrossModeTraitGuard'
```
