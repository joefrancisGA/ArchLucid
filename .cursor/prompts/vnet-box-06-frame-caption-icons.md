# VN-06 — Frame captions: bold label, leading icon, drop the VNet card

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement a new layout.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_VNET_BOX_LUNA_PROMPTS.md`

**Depends on:** VN-02 (forest `vnet-frame` already packs inside the resource group). Prefer VN-04 so the PNG cluster already exists.

## Goal

The VNet bounding-box caption is bold, and a Virtual Network icon sits immediately before that text, sized to the caption. The resource-group bounding-box caption gets the same treatment with the Resource Groups icon. A VNet that has a bounding box is no longer a diagram node.

## Why

`DiagramForestNestedFrameSvgEmitter` paints the VNet name at `font-weight` 600 and `font-size` 11, with no mark. `DiagramForestResourceGroupFrameSvgEmitter` already uses `font-weight` 700 and `font-size` 12, and sizes `rg-frame-label-halo` from the text width alone. `LayoutVnetAwareCell` still places the VNet node inside the group it captions, so the network appears twice: once as the box, once as a card.

## Read first

- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestNestedFrameSvgEmitter.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestResourceGroupFrameSvgEmitter.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestResourceGroupFrameStyle.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs` (`LayoutVnetAwareCell`)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestNodeSvgEmitter.cs` (`EmitAzureIcon`)
- `ArchLucid.ArtifactSynthesis/Layout/AzureArchitectureIconCatalog.cs`
- `ArchLucid.ArtifactSynthesis/Assets/AzureIcons/azure-icon-manifest.json`
- `ArchLucid.ArtifactSynthesis/Graphviz/DiagramAstGraphvizDotEmitter.cs`

## What to build

Forest SVG only for the icons. Do not download an icon pack. The July 2026 zip is already at `ArchLucid.ArtifactSynthesis/Assets/AzureIcons/Source/Azure_Public_Service_Icons.zip`.

1. VNet caption. Set `font-weight` to `700`. Keep `font-size` 11. Resolve `Microsoft.Network/virtualNetworks` through `AzureArchitectureIconCatalog` (embedded file `Svg/virtual-network.svg`). Draw that SVG immediately before the caption. Square side equals the caption font size. Gap between icon and text is 4px. Do not crop, flip, rotate, distort, or recolor the icon. Keep the VNet name as the text.
2. Resource-group caption, the same way. Keep `font-weight` 700 and `font-size` 12. Find the Resource Groups SVG inside the vendored zip, embed that one file, and add one manifest row whose ARM type is `Microsoft.Resources/resourceGroups`. Draw it immediately before the group name. Square side equals the resource-group caption font size. Same 4px gap. Same icon rules. If that file is not in the zip, stop and say so. Do not substitute the teal network pictogram or another service's icon.
3. Widen each label halo so the icon, the gap, and the text sit inside it. The icon must not cover the first card or the frame stroke.
4. When a VNet has a `vnet-frame`, omit that VNet from node placement and from the node layer. Membership, cited edges, and the caption still use the VNet node in the AST. A VNet with no box (fewer than two same-group members) stays a card. Subnet cards stay. Do not add a subnet box.
5. Graphviz PNG: do not emit a node for a VNet that is only a cluster label. Do not put an icon in the Graphviz label. Mermaid may keep its current subgraphs. If a Mermaid fixture lists a VNet node that the forest box dropped, update that fixture.

## Tests

Extend `ArchLucid.ArtifactSynthesis.Tests`.

1. A VNet with a cited same-group member: one `vnet-frame`, caption `font-weight` 700, one `azure-icon` whose `data-file` is `Svg/virtual-network.svg` inside that frame, and no `node-card` for that VNet.
2. The icon's scale makes its drawn side equal to the VNet caption font size.
3. A resource-group frame caption has `font-weight` 700 and one `azure-icon` for the Resource Groups file, drawn side equal to the resource-group caption font size. The halo width covers icon + gap + text.
4. A VNet with no other same-group member: a node card, zero `vnet-frame`.
5. PNG dot for a boxed VNet contains `cluster_vnet_` and does not contain a node statement for that VNet.

## Acceptance criteria

- Both captions are `font-weight` 700, with the official icon before the name.
- Icon side length equals that caption's font size.
- A boxed VNet is absent as a card on the forest canvas and as a Graphviz node.
- Resource-group stroke, fill, and VNet stroke stay as they are (`2px` `#64748b` / `#f1f5f9`, and `1.5px` `#94a3b8`).

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run the new or extended frame tests plus `DiagramForestLayoutSvgRendererTests` and `DiagramAstGraphvizDotEmitterTests`.
- Do not bump `ComponentHorizontalGap` or `ComponentVerticalGap`.
- Do not embed the rest of the zip. Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.

## Done when

A resource group that contains a VNet shows a bold Resource Groups icon plus the group name on the outer box, a bold Virtual Network icon plus the VNet name on the inner box, and no card for that VNet.
