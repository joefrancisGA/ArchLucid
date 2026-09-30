# VN-21 — Wrap a wide VNet neighborhood under itself

**Model:** GPT-5.6 Luna. Paste this file as the whole task.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_VNET_BOX_LUNA_PROMPTS.md`

**Depends on:** VN-15, VN-16, and VN-18. Do not re-run VN-01 through VN-20.

## Goal

On Full subscription and Network diagrams, a VNet and the resource groups seated with it stay together. When that run is wider than the existing width guard, the extra groups continue on the next row under that VNet.

## Why

`PlaceVnetPrimaryBlock` places a neighborhood as one horizontal run. It starts a new row only when `groupX > 0` and the whole block is wider than `MaxNodeWidth * 3`. The first neighborhood starts at x 0, so that guard never runs, and a busy VNet paints as one strip across the top.

VN-18 already wraps leftover groups that are not seated with a VNet. It does not wrap a neighborhood.

## Read first

- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs` (`BuildVnetPrimaryPlacements`, the neighborhood call, the shared-pair call, `PlaceVnetPrimaryBlock`)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutOptions.cs` (`MaxNodeWidth`, `ComponentHorizontalGap`, `ComponentVerticalGap`)
- `ArchLucid.ArtifactSynthesis.Tests/DiagramForestVnetFrameLayoutTests.cs`

## What to build

Wrap inside a single-VNet neighborhood. Keep the existing order of cells. Use the existing gap constants. Do not change their values.

A single-VNet neighborhood is the VNet box followed by the remainder cells whose winning VNet is that box.

1. When `groupX > 0` and the whole neighborhood is wider than the room left before `MaxNodeWidth * 3`, start that neighborhood on a new row, as the block wrap does today.
2. Remember the neighborhood's left x. Place the VNet there.
3. Place each following resource group to the right. When the next group would pass `MaxNodeWidth * 3`, start the next row at the neighborhood's left x and move y down by the current row height plus `ComponentVerticalGap`. A group wider than the guard stays on its own row.
4. When a neighborhood used an inner wrap, start the next neighborhood on a fresh row at x 0, below that wrapped block. A neighborhood that stayed on one row still continues on the current row, so two short neighborhoods can sit side by side.

The continuation row starts at the neighborhood's left x, so the extra groups sit under that VNet. Do not reset an inner wrap to x 0 when the neighborhood itself started further right.

Keep the VN-16 shared block readable. Its core is the left VNet, the shared resource group, and the right VNet, in that order, on one Y. The shared group stays between those boxes, one `ComponentHorizontalGap` from each. Exclusive cells for the left VNet stay to the left of that core. Exclusive cells for the right VNet stay to the right. Those exclusive cells may wrap under the shared block's left x. The core stays on one row even when the core itself is wider than the guard.

Leave unplaced remainder cells on the VN-18 path (`wrapItems: true`). Do not pull a private-endpoint target into the VNet box. Do not hide same-group `likely` edges. Do not change click-focus, membership, or edge labels.

## Tests

Extend `DiagramForestVnetFrameLayoutTests`. Frame positions come from the `vnet-frame` rect and the `rg-frame-plate` rect.

1. Full subscription. One VNet with one cited virtual machine. Six other resource groups, each with one Key Vault and one `private endpoint` edge to that VNet. The VNet frame and at least one of those resource-group frames share a Y. At least one of those resource-group frames has a larger Y. Every connected resource-group frame starts at or to the right of the VNet frame. The right edge of every connected frame is at most `MaxNodeWidth * 3` plus that frame's own width.
2. The existing single-group test still holds: one connected Key Vault sits beside its VNet on the same Y, one `ComponentHorizontalGap` away.
3. The existing equal-share test still holds: one group with one `private endpoint` edge to each of two VNets sits between those VNet frames on the same Y.
4. The existing leftover-wrap test still holds: six resource groups with no edges use more than one Y.

## Acceptance criteria

- Extra groups in a wide single-VNet neighborhood continue on the next row under that VNet.
- A VNet and one connected group stay on the same row.
- A group shared equally by two VNets stays between those boxes on one row.
- Leftover groups still wrap. Gap constants, membership, and edge labels stay as they are.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run `DiagramForestVnetFrameLayoutTests`.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.
- Do not hide same-group `likely` edges in this session.

## Done when

A Full subscription plate whose first VNet serves many resource groups shows that VNet on the first row and the extra groups on the next row under it.
