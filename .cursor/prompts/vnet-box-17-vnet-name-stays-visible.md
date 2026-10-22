# VN-17 — Keep the VNet name visible

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement VN-18 in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_VNET_BOX_LUNA_PROMPTS.md`

**Depends on:** VN-15. Do not re-run VN-01 through VN-16.

## Goal

On Full subscription and Network diagrams, the VNet name stays readable in the title band of its box. Member cards sit below that band.

## Why

`BuildVnetPrimaryPlacements` sizes the VNet frame with `DiagramForestResourceGroupFrameStyle.Pad` and `LabelBand`, then stores member placements at the interior origin. The frame anchor starts at `0,0`. `PlaceVnetPrimaryBlock` adds the same neighborhood offset to the anchor and to the members, so the first card occupies the top-left corner.

`DiagramForestNestedFrameSvgEmitter.EmitCaption` paints the VNet name in that corner: `VnetCaptionFontSize` is 11 and the fill is `#64748b`. Nodes are painted after the frame, so a card covers the name. An empty corner still shows it, which is why some boxes have a name and some do not. Eleven-pixel gray type also disappears on a zoomed-out plate.

`LayoutVnetAwareCell` already insets framed members by `pad` and `labelBand`. This session brings the VNet-primary path back to that inset and makes the shared VNet caption dark enough to read.

## Read first

- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs` (`BuildVnetPrimaryPlacements`, the `VnetPrimaryGroup` member list, `LayoutVnetAwareCell`)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestResourceGroupFrameStyle.cs` (`Pad`, `LabelBand`)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestNestedFrameSvgEmitter.cs` (`VnetCaptionFontSize`, `EmitCaption`)
- `ArchLucid.ArtifactSynthesis.Tests/DiagramForestVnetFrameLayoutTests.cs`

## What to build

1. In `BuildVnetPrimaryPlacements`, shift every non-anchor member by `Pad` on X and `LabelBand` on Y before the neighborhood offset is applied. Leave the frame anchor at the outer origin. The member card's top is at or below the bottom of the title band. The card stays inside the `vnet-frame` rect.
2. Raise `VnetCaptionFontSize` to at least 14. Paint the VNet caption fill as `#334155`. Keep `font-weight` 700, the leading virtual-network icon, and the white halo. Size the halo from the same font size so it covers the full name.
3. Leave subscription captions and subnet captions on their current size and color. Leave resource-group captions unchanged.
4. Do not move a private-endpoint target into the box. Do not change neighborhood seating.

`Render_packs_cited_members_inside_one_vnet_frame_and_leaves_key_vault_outside` compares the icon's drawn side to `VnetCaptionFontSize`. Change the constant. Do not hardcode 11 in that test.

## Tests

Extend `DiagramForestVnetFrameLayoutTests`.

1. Full subscription. One VNet and one cited virtual machine. The VM card's top is at least `DiagramForestResourceGroupFrameStyle.LabelBand` below the `vnet-frame` top. The VM remains inside the frame. The caption text equals the VNet label, its `font-size` is at least 14, and its `fill` is `#334155`.
2. The same fixture with a `(Network)` title keeps the VM below the title band.
3. A Key Vault in another resource group, with no edge, stays outside the VNet frame.

## Acceptance criteria

- A card inside a VNet box does not cover the VNet name.
- The VNet name is at least 14px and `#334155`.
- Subscription, subnet, and resource-group captions keep their current size and color.
- Neighborhood seating and membership stay as VN-15 and VN-16 left them.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run `DiagramForestVnetFrameLayoutTests`.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.

## Done when

A Full subscription VNet box shows its name in the title band, and the first member card starts below that band.
