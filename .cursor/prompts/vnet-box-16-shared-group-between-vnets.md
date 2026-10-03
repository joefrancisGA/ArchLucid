# VN-16 — A group that reaches two VNets sits between them

**Model:** GPT-5.6 Luna. Paste this file as the whole task.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_VNET_BOX_LUNA_PROMPTS.md`

**Depends on:** VN-15. Do not re-run VN-01 through VN-15.

## Goal

On Full subscription and Network diagrams, a resource-group frame that connects equally to two VNet boxes is drawn once, between those two boxes. Each of those connectors stays short.

## Why

VN-15 assigns a remainder cell to the single VNet with the most connecting edges. A Key Vault or storage group that reaches two VNets with the same number of connectors still sits beside only one of them. The other connector crosses the rest of the plate.

## Read first

- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs` (`BuildVnetPrimaryPlacements`, and the neighborhood placement VN-15 added)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutOptions.cs`
- `ArchLucid.ArtifactSynthesis.Tests/DiagramForestVnetFrameLayoutTests.cs`

## What to build

For the same VNet-primary titles as VN-15:

1. When a remainder cell's two highest VNet connection counts are equal and at least 1, and those two counts belong to exactly two VNets, take that cell out of VN-15's single-VNet assignment.
2. Place that cell once, between those two VNet boxes. The VNet with the ordinal-lower node id is on the left. The painted gap from the cell's `rg-frame-plate` to each `vnet-frame` is `ComponentHorizontalGap`, within 1px, when the three fit on one row.
3. Cells that connect only to one of those VNets stay on the outer side of that VNet: exclusive cells, then that VNet box, then the shared cell, then the other VNet box, then that VNet's exclusive cells. The shared cell stays adjacent to both VNet boxes.
4. A cell whose top count is strictly greater than its second count keeps the VN-15 seat, beside the winning VNet.
5. A cell that reaches three or more VNets keeps the VN-15 seat, beside the one winning VNet. Do not center it among all of them.
6. Draw the cell once. The Key Vault, storage account, or SQL database stays outside both VNet boxes.

Leave gap constants, edge labels, membership, the Graphviz emitter, and non-VNet-primary modes unchanged. Draw every connector VN-15 drew.

## Tests

Extend `DiagramForestVnetFrameLayoutTests`. Give each resource group its own name so each frame is measurable. Count edges by cards, not by duplicate edges between the same pair.

1. One Key Vault group has one `private endpoint` edge to `vnet-a` and one to `vnet-b`. The vault frame lies between the two VNet frames. Each facing-edge gap is `ComponentHorizontalGap` within 1px. The vault is outside both VNet frames. The SVG contains one `rg-frame` whose title is that resource group.
2. One resource group holds a Key Vault and a storage account. Both have a `private endpoint` edge to `vnet-a`. Only the Key Vault also has a `private endpoint` edge to `vnet-b`. That group sits beside `vnet-a` with the VN-15 gap. It does not lie between the two VNet frames.
3. One Key Vault has one `private endpoint` edge to each of three VNets. The vault frame sits beside the ordinal-lowest VNet node id. It is not centered between the outer two VNets.

## Acceptance criteria

- A resource group with an equal number of connectors into exactly two VNets sits between those two boxes and is drawn once.
- A resource group with a strict majority toward one VNet stays beside that VNet.
- A resource group that reaches three or more VNets stays beside its single winning VNet.
- Private-endpoint targets stay outside every VNet box.
- Gap constants, edge labels, and the extractor are unchanged.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run `DiagramForestVnetFrameLayoutTests`.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.

## Done when

A Full subscription SVG shows a shared Key Vault group between the two VNet boxes it reaches equally, and a group that reaches one VNet more than the other stays beside that VNet.
