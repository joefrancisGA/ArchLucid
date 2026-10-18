# IDX-13v — Cross-mode excellence wave manifest

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-11b, IDX-12b, IDX-13 cross-mode ratchets on trunk. **Extend only.**

## Goal

Close the **08b–13** cross-mode slice with a manifest guard: every ratchet class that must exist for the shared fat-graph / hop-focus / tail / connection / PE / completeness matrix is listed explicitly so accidental deletion fails CI.

## What to build

1. `InventoryDiagramExcellenceCrossModeWaveManifestTests` (ArtifactSynthesis.Tests) — assert each listed cross-mode ratchet type exists and exposes at least one `[Fact]` or `[Theory]`.

2. `InventoryDiagramExcellenceCrossModeWaveManifestApplicationTests` (Application.Tests) — same for Application-side excellence ratchets (completeness summary).

3. Index row **IDX-13v** shipped — extend only; regression guard may mention `FullyQualifiedName~CrossModeWaveManifest`.

## Tests

```bash
dotnet test ArchLucid.ArtifactSynthesis.Tests --filter 'FullyQualifiedName~CrossModeWaveManifest'
dotnet test ArchLucid.Application.Tests --filter 'FullyQualifiedName~CrossModeWaveManifest'
```
