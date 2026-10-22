# VN-15 — Seat each VNet box beside the groups it connects to

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement VN-16 in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_VNET_BOX_LUNA_PROMPTS.md`

**Depends on:** VN-08 and VN-14. Do not re-run VN-01 through VN-14.

## Goal

On Full subscription and Network diagrams, each VNet box sits beside the resource-group frames that have a painted connector into that box. The VNets stop forming one block with every other resource group shifted to the far side.

## Why

`BuildVnetPrimaryPlacements` places every VNet box first. It wraps only when `groupX + groupWidth` passes `MaxNodeWidth * 3`. It then places every remaining resource-group cell at `offsetX`, the right edge of that whole VNet block. On a subscription plate the VNet boxes form a left column and the Key Vault, storage, and database groups sit in the middle and on the right. Each `private endpoint` line crosses the page.

XC-02 already seats resource-group cells from painted edges, and this path never uses that order. The VNets are placed before the cells, and the cells move as one remainder. Membership stays as it is: a private-endpoint target stays outside the box.

## Read first

- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs` (`IsVnetPrimaryTitle`, `BuildVnetPrimaryPlacements`, `BuildResourceGroupCellLayouts`, `PlaceNodes`)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutOptions.cs` (`ComponentHorizontalGap`, `ComponentVerticalGap`, `MaxNodeWidth`)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramResourceGroupPacker.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestResourceGroupFrameSvgEmitter.cs` (`rg-frame-plate`)
- `ArchLucid.ArtifactSynthesis.Tests/DiagramForestVnetFrameLayoutTests.cs`

## What to build

For titles `IsVnetPrimaryTitle` already treats as VNet-primary (`(FullSubscription)` and `(Network)`):

1. Keep the VNet boxes and their members as VN-08 built them. A Key Vault, storage account, or SQL database stays outside the box.
2. A remainder resource-group cell connects to a VNet box when a visible edge has one end in that cell and the other end is the VNet node or a member of that box. Use the `visibleEdges` list this method already receives. Skip `IsLayoutOnly` edges. Skip an `in` edge whose both ends are already inside the same box. A peering edge does not assign a resource group to a VNet.
3. Assign each connected cell to one VNet: the VNet with the most such edges. When the counts tie, use the VNet node id that sorts first under ordinal comparison.
4. Place one neighborhood per VNet box, in ordinal VNet node-id order. In a neighborhood, place the VNet box, then its assigned cells, using the existing cell layout. The painted `vnet-frame` rect and the painted `rg-frame-plate` of the first assigned group share a row. The horizontal distance between their facing edges is `ComponentHorizontalGap`, within 1px. No other `vnet-frame` or `rg-frame-plate` lies between those facing edges.
5. When a neighborhood is wider than the existing `MaxNodeWidth * 3` guard, put that neighborhood's assigned cells on the next row, with their left edge equal to that VNet box's left edge. The next VNet starts after that pair. Do not leave a VNet on one row and its assigned cells on the far side of the other VNets.
6. Remainder cells with no edge into any VNet box stay together after the last neighborhood. Do not insert them between a VNet box and the cells assigned to it.
7. Draw every connector that is drawn today. This session moves frames. It does not merge lines, drop `likely` edges, or change labels.

Leave `ComponentHorizontalGap` and `ComponentVerticalGap` at their current values. Leave `DiagramResourceGroupCellFlowPlanner` unchanged. Leave the Graphviz emitter unchanged. Identity, Data, Data flow, Executive, and every other mode keep today's placement.

## Tests

Extend `DiagramForestVnetFrameLayoutTests`. Measure the `vnet-frame` rect and the `rg-frame-plate` rect. Read `ComponentHorizontalGap` from `DiagramForestLayoutOptions`.

1. Full subscription. One VNet, one virtual machine cited inside it, one Key Vault in another resource group, and one `private endpoint` edge from the vault to the VNet. The vault frame and the VNet frame share a row, the facing-edge gap is `ComponentHorizontalGap` within 1px, and the vault is outside the VNet frame.
2. The same fixture with a `(Network)` title places the vault frame the same way.
3. Two VNets and two resource groups. The vault in the first group has a `private endpoint` edge only to the first VNet. The vault in the second group has a `private endpoint` edge only to the second VNet. Each vault frame is closer to its own VNet frame than to the other VNet frame. The two VNet frames are not both left of both vault frames.
4. Add a third Key Vault in a third resource group and give it no edge. It stays outside every VNet frame, and it is not between the first VNet and the vault that connects to that VNet.
5. Compile the two-VNet fixture as Identity. The Key Vaults stay outside every `vnet-frame`. Do not require the Full subscription adjacency.

## Acceptance criteria

- On Full subscription and Network, a resource group that connects to one VNet sits beside that VNet box.
- A resource group with no such connector stays outside the neighborhoods.
- A private-endpoint target stays outside the VNet box.
- Other diagram modes keep today's placement.
- Gap constants, edge labels, and the extractor are unchanged.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run `DiagramForestVnetFrameLayoutTests`.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.

## Done when

A Full subscription SVG with two VNets and two privately connected resource groups shows each group beside its VNet, and the VNets are not one left-hand block with both groups on the far side.
