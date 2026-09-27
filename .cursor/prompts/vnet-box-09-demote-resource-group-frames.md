# VN-09 — Resource-group frames become secondary

**Model:** GPT-5.6 Luna. Paste this file as the whole task.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_VNET_BOX_LUNA_PROMPTS.md`

**Depends on:** VN-08. Do not re-run VN-01 through VN-08.

## Goal

On Full subscription and Network diagrams, the VNet box is the strong container. A resource-group frame stays available for cards that are not in a VNet, and its ink is lighter than the VNet box. A card inside a VNet box is not also wrapped in a resource-group frame of equal weight.

## Why

`DiagramForestResourceGroupFrameStyle` paints resource-group frames at 2px in `#64748b` on fill `#f1f5f9`. `DiagramForestNestedFrameSvgEmitter` paints a VNet frame at 1.5px in `#94a3b8`. On a security-analyst canvas the resource-group rectangle is the shape the eye follows, and the VNet boundary is the one that answers reachability. VN-08 moves cross-group members into the VNet box. This session makes that box the primary mark and keeps resource group as the secondary mark.

## Read first

- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestResourceGroupFrameStyle.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestResourceGroupFrameSvgEmitter.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestNestedFrameSvgEmitter.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLegendSvgEmitter.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramResourceGroupPacker.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs`

## What to build

For `DiagramMode.FullSubscription` and `DiagramMode.Network` only:

1. Do not paint a resource-group frame around a card that already sits inside a `vnet-frame`. The card keeps the resource-group text VN-08 added when the groups differ.
2. Cards with no VNet membership still get a resource-group frame.
3. Make the VNet frame the stronger stroke: at least 2px, and darker than the resource-group stroke. Make a remaining resource-group frame lighter than that VNet stroke: 1px and a lighter gray than `#64748b`. Keep the resource-group fill readable. Do not change subscription-frame ink.
4. Update the legend swatch so the resource-group sample matches the lighter frame and the VNet sample matches the stronger frame. Keep both legend entries.

Other diagram modes keep the current resource-group frame ink and still draw a resource-group frame around cards in that group.

Do not remove resource-group captions. Do not add subnet frames. Do not change global gaps.

## Tests

Extend `DiagramForestVnetFrameLayoutTests` or the existing frame-style tests.

1. Full subscription. A virtual machine inside a `vnet-frame` has no resource-group frame rect around it. The VNet frame `stroke-width` is greater than any resource-group frame `stroke-width` in that SVG.
2. A Key Vault with no VNet placement still has a resource-group frame. That frame's stroke is lighter than the VNet frame.
3. The legend still names both the virtual network and the resource group.
4. The same Key Vault fixture compiled as Identity still uses a 2px resource-group stroke.

## Acceptance criteria

- The VNet box is the dark container on Full subscription and Network.
- A resource-group frame does not compete with a VNet box around the same card.
- Cards outside every VNet still show their resource group as a light frame.
- Other modes keep today's resource-group frames.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run `DiagramForestVnetFrameLayoutTests`.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.

## Done when

A Full-subscription SVG shows the VNet as the strong box, and a resource-group frame only around cards that are not in a VNet.
