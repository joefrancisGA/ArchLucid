# VN-18 — Wrap the leftover resource-group row

**Model:** GPT-5.6 Luna. Paste this file as the whole task.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_VNET_BOX_LUNA_PROMPTS.md`

**Depends on:** VN-15 and VN-16. Do not re-run VN-01 through VN-17.

## Goal

On Full subscription and Network diagrams, resource groups that are not seated beside a VNet wrap into rows. They stop forming one strip across the bottom of the plate.

## Why

`PlaceVnetPrimaryBlock` starts a new row only when `groupX > 0` and the whole block is wider than `MaxNodeWidth * 3`. Items inside a block are then placed left to right with no further wrap.

`BuildVnetPrimaryPlacements` sends every unplaced remainder cell through that method as one block. After the VNet neighborhoods wrap back to the left edge, `groupX` is 0, so the wrap condition does not run. Every leftover group is painted on one row. That is the long strip under the neighborhoods.

## Read first

- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs` (`BuildVnetPrimaryPlacements`, the `unplacedCells` call, `PlaceVnetPrimaryBlock`)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutOptions.cs` (`MaxNodeWidth`, `ComponentHorizontalGap`, `ComponentVerticalGap`)
- `ArchLucid.ArtifactSynthesis.Tests/DiagramForestVnetFrameLayoutTests.cs`

## What to build

Wrap the unplaced remainder cells one cell at a time.

When the next cell would make `groupX + cell.Width` greater than `MaxNodeWidth * 3`, start a new row at x 0 and move y down by the current row height plus `ComponentVerticalGap`. A cell that is itself wider than the guard stays on its own row. Use the existing gap constants. Do not change their values.

Leave VNet neighborhoods as VN-15 and VN-16 placed them: a VNet stays beside the groups assigned to it, and a group that reaches two VNets equally stays between those boxes. Do not wrap those neighborhoods apart.

Do not add a heading, tray, or new legend entry for the leftover groups. Do not drop groups from the canvas. Do not change membership or edge labels.

## Tests

Extend `DiagramForestVnetFrameLayoutTests`.

1. Full subscription. One VNet with one cited virtual machine, plus six resource groups that have no edges. Each leftover group holds one Key Vault. The combined width of those six `rg-frame-plate` rects exceeds `MaxNodeWidth * 3`. Their frames use at least two distinct Y positions. The right edge of every leftover frame is at most `MaxNodeWidth * 3` plus that frame's own width.
2. The existing single-group adjacency test still holds: a Key Vault with one `private endpoint` edge sits beside its VNet, on the same row, one `ComponentHorizontalGap` away.
3. The existing equal-share test still holds: one group with one `private endpoint` edge to each of two VNets sits between those VNet frames.

## Acceptance criteria

- Leftover resource groups wrap into rows bounded by the existing width guard.
- A VNet and the groups seated with it stay together.
- No groups disappear, and no new orphan heading is added.
- Gap constants are unchanged.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run `DiagramForestVnetFrameLayoutTests`.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.

## Done when

A Full subscription plate with many unconnected resource groups shows those groups on wrapped rows under the VNet neighborhoods, not as one strip across the bottom.
