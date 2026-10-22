# VN-03 — Cross-group members and interior edges

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement VN-04 in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_VNET_BOX_LUNA_PROMPTS.md`

**Depends on:** VN-02.

## Goal

A workload that lives in a different resource group from its VNet stays in its own resource-group frame. An `in` edge that crosses frames stays. An `in` edge whose two ends both sit inside the VNet box is not drawn.

## Why

Azure allows a NIC or private endpoint in one resource group to join a subnet in another. Pulling that card into the VNet's group would break the resource-group frame. Inside the box, the box already says "in"; the wire only repeats it. Peering is not placement and must stay.

## Read first

- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestLayoutSvgRenderer.cs` (edge loop in `EmitSvg`)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestVnetMembership.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestEdgeLabelCollapse.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramEdgeLabelHumanizer.cs`

## What to build

When placing a VNet box, include only members whose `ArmResourceGroup` equals the VNet's group. A cited member in another group keeps its own card and its own resource-group frame.

Suppress a visible edge when all of these are true:

- The humanized verb is `in` (including `likely · in` and `declared · in`).
- Both endpoints are inside the same VNet box (the VNet caption and the members packed in that box).

Keep the edge when either end is outside that box. Keep peering edges (`DiagramForestEdgeLabelCollapse.IsPeeringEdge`) even when both ends are inside a box.

A VNet whose only cited members are in other groups stays a card in its own group. Do not draw an empty box.

Do not change PNG clusters in this session.

## Tests

Add cases to `DiagramForestVnetFrameLayoutTests`:

1. VM in `rg-app`, VNet in `rg-net`, cited `in` from VM to a subnet of that VNet. Two resource-group frames. The VM is not inside `vnet-frame`. The `in` edge is still in the SVG.
2. VM and VNet in the same group, cited `in`. One `vnet-frame` contains the VM. The SVG does not draw that `in` edge.
3. Two VNets in one group with a peering edge between them. The peering edge is still drawn.

## Acceptance criteria

- Cross-group containment is an edge, not a stolen card.
- Interior placement edges are not drawn.
- Peering edges remain.
- No empty VNet frame.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run `DiagramForestVnetFrameLayoutTests` and `DiagramForestLayoutSvgRendererTests`.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.

## Done when

The fixture with a VM in another resource group still shows that VM in its own frame and an `in` wire to the VNet, and the same-group fixture has the box without the interior wire.
