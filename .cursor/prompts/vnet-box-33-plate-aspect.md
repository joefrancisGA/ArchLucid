# VN-33 — Forest rows wrap to the shape of the screen, not to three cards

**Model:** GPT-5.6 Luna. Paste this file as the whole task.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_VNET_BOX_LUNA_PROMPTS.md`

**Depends on:** VN-21. Do not re-run VN-01 through VN-31. VN-32 is the TypeScript half and may run before or after this prompt.

## Goal

A forest plate with many components is about 1.6 times as wide as it is tall, so a landscape viewport shows as much of it as possible at one zoom. A plate with few components keeps today's shape.

## Why

Every row in `DiagramForestLayoutSvgRenderer` wraps at `options.MaxNodeWidth * 3`, which is 840 user units with the default `MaxNodeWidth` of 280. That guard appears at six sites. It does not grow with the plate. On `Hmd_HI_HAP_Non_Prod` (228 resources, 111 components) the plate becomes a column about 600 units wide and more than 1,700 tall. The viewer is about 570 × 340. The contain fit of a 1:3 column into a 1.7:1 viewport is 20%, and 80% of the canvas is white.

Reshape the same area to a 1.6:1 plate and the contain fit rises to about 43%. With the VN-32 floor of 60%, that cuts the vertical scroll from about three viewports to about one and a half.

## Read first

- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutOptions.cs` (`MaxNodeWidth`, `ComponentHorizontalGap` 48, `ComponentVerticalGap` 40)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs`: every `options.MaxNodeWidth * 3` — `PlaceVnetPrimaryNeighborhood` (`widthGuard`), `PlaceVnetPrimaryBlock` (both branches), `PackIslandPlacements`, and the two resource-group packing loops near the `groupWidth` guards
- `ArchLucid.ArtifactSynthesis.Tests/DiagramForestLayoutSvgRendererTests.cs`
- `ArchLucid.ArtifactSynthesis.Tests/DiagramForestVnetFrameLayoutTests.cs`
- `ArchLucid.ArtifactSynthesis.Tests/DiagramResourceGroupPackerTests.cs`

## What to build

Add to `DiagramForestLayoutOptions`:

```csharp
/// <summary>Target width ÷ height for a plate whose components overflow three cards per row.</summary>
public double PlateTargetAspect { get; init; } = 1.6d;
```

Add one static helper in `DiagramForestLayoutSvgRenderer`:

```csharp
private static double ResolveRowWidthLimit(
    IEnumerable<(double Width, double Height)> cells,
    DiagramForestLayoutOptions options)
```

It sums `(Width + ComponentHorizontalGap) * (Height + ComponentVerticalGap)` over the cells, takes `Math.Sqrt(area * PlateTargetAspect)`, and returns the larger of that value and `options.MaxNodeWidth * 3`. The floor keeps every plate that fits in three cards exactly as it is today.

Replace each `options.MaxNodeWidth * 3` guard with a row width limit computed once per placement pass from the cells that pass will place:

- `BuildVnetPrimaryPlacements` knows every `VnetPrimaryGroup` and `VnetRemainderCell` size before it places anything. Compute the limit from all of them and pass it into `PlaceVnetPrimaryNeighborhood` and `PlaceVnetPrimaryBlock` as a parameter. The neighborhood's inner wrap (`relativeRight > widthGuard`) uses the same limit.
- `PackIslandPlacements` lays out each island inside the loop and only then knows its size. Split it into two passes: lay out every island first and collect `(placements, width, height)`, then compute the limit and place. The output for a plate under three cards wide must be byte-identical to today.
- The two resource-group packing loops that compute `groupWidth` inside the loop get the same two-pass treatment.

Do not change `MaxNodeWidth`, `ComponentHorizontalGap`, `ComponentVerticalGap`, `NodeHorizontalGap`, cell interiors, frame padding, or the Graphviz PNG path. The limit only decides where a row breaks.

## Tests

`DiagramForestLayoutSvgRendererTests.cs`:

1. Twelve identical framed cells (280 wide, 200 tall) render to a plate whose width ÷ height is between 1.2 and 2.2. Today that plate is three across and four down.
2. Two identical cells render with the same placements as before this change. Assert the exact `X` and `Y` of both.
3. `ResolveRowWidthLimit` on one 280 × 200 cell returns `840`.
4. `ResolveRowWidthLimit` on twelve 280 × 200 cells returns a value above `840` and equal to `Math.Sqrt(12 * (280 + 48) * (200 + 40) * 1.6)`.

`DiagramForestVnetFrameLayoutTests.cs`:

5. A VNet-primary fixture with six neighborhoods of one VNet and two resource groups each produces at least two neighborhoods on the first row. Today each neighborhood is alone on its row.

Every existing test in the three files listed under Read first still passes. Where an existing test pins a `Y` that only held because the row wrapped at 840, update the pin and name the test in your summary.

## Acceptance criteria

- On a Full subscription plate with more than about nine components, the plate is roughly 1.6:1, and the contain-fit scale in the viewer is at least double what it was for the same snapshot.
- A plate that fits in three cards across renders exactly as before.
- Row order inside a neighborhood, cross-group seating (VN-15, VN-16), remainder wrapping (VN-18), and neighborhood wrap (VN-21) all still hold. Only the width at which they wrap changes.
- The Graphviz PNG cluster export is untouched.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Run `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramForest'`.
- Run `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis/ArchLucid.ArtifactSynthesis.csproj'` once.
- No TypeScript change. Do not touch the viewer.
- Do not commit. Do not edit unrelated dirty files.
- Do not change the extractor.

## Done when

The `Hmd_HI_HAP_Non_Prod` Full subscription plate is wider than it is tall, and Fit in view shows at least twice as much of it as before at the same viewport size.
