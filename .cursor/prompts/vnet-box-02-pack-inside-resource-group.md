# VN-02 — Pack each VNet inside its resource group

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement VN-03 or VN-04 in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_VNET_BOX_LUNA_PROMPTS.md`

**Depends on:** VN-01 (`DiagramForestVnetMembership`).

## Goal

Inside each resource-group frame, pack the members of each virtual network into their own box. Paint `vnet-frame` from those reserved bounds. The VNet name is the box caption. The VNet is no longer a card inside the box.

## Why

`DiagramForestNestedFrameResolver` unions cards after `LayoutResourceGroupCell` has already placed them by role, hub, or left-to-right. The rectangle can cover a Key Vault that is not in the VNet, and its 8px pad draws the label on top of the first card. Resource-group frames already reserve `DiagramForestResourceGroupFrameStyle.LabelBand` before placing children. VNet boxes need the same order: pack, then chrome, then paint.

## Read first

- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestVnetMembership.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs` (`LayoutResourceGroupCell`, `EmitSvg`)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramResourceGroupPacker.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestResourceGroupFrameStyle.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestNestedFrameSvgEmitter.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestNestedFrameResolver.cs`

## What to build

In `LayoutResourceGroupCell`, after the resource-group cell is known and before interior placement:

1. Ask `DiagramForestVnetMembership` which visible nodes belong to which VNet.
2. Keep a VNet group only when it has at least one member besides the VNet, and every member that will sit in the box has the same `ArmResourceGroup` as the VNet. Leave other-group members for VN-03; in this session, do not pull them into the box.
3. Cards with no VNet stay in a remainder group.
4. Lay out each VNet group with the existing interior packer (`LayoutCellInterior`). Offset children by a VNet label band and pad, the same way the resource-group cell offsets by `LabelBand` and `Pad`.
5. Place VNet groups and the remainder as islands inside the resource group (`PackIslandPlacements` already does this for disconnected islands).
6. Paint `vnet-frame` from those reserved bounds. Stop using a post-hoc union of card rectangles for VNets.

Caption: the VNet node's label, in the label band, above the cards. If that node already renders an inventory pictogram, draw that same pictogram beside the caption, uncropped and unrotated. Do not download an icon pack. Do not draw a second card for the VNet.

A VNet with no other same-group member stays a card. No empty box.

Leave subnet frames as they are. Do not add a subnet box. Two VNet frames in one resource group must not overlap (0.5px). Do not change resource-group stroke (`2px`, `#64748b`, fill `#f1f5f9`). VNet stroke stays `1.5px`, `#94a3b8`, corner radius 7.

Do not drop edges in this session. Do not edit the Graphviz emitter.

## Tests

Extend `ArchLucid.ArtifactSynthesis.Tests` (new class `DiagramForestVnetFrameLayoutTests` if the renderer file is already crowded).

1. One resource group, one VNet, two subnets, two VMs with cited hops to those subnets, plus a Key Vault with no hop. The SVG has one `vnet-frame`. Its rect contains the VM and subnet cards and does not contain the Key Vault. The VNet name is a frame caption. There is no `node-card` whose title is the VNet.
2. Two VNets in one resource group: two `vnet-frame` rects, no overlap.
3. A VNet alone in a resource group: a node card, zero `vnet-frame` for that VNet.

## Acceptance criteria

- Frame bounds come from packing, not from a later union.
- The caption sits in a label band and does not cover the top card.
- The Key Vault stays outside the VNet box.
- Resource-group frames and subscription frames still render.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run `DiagramForestVnetFrameLayoutTests`, `DiagramForestVnetMembershipTests`, and `DiagramForestLayoutSvgRendererTests`.
- Do not bump `ComponentHorizontalGap` or `ComponentVerticalGap`.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.

## Done when

A Full-subscription-style fixture shows the VNet as a box inside its resource group, with only cited same-group members inside it.
