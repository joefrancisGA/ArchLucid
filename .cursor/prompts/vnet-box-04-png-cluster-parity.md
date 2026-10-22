# VN-04 — PNG cluster per VNet

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement VN-05 in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_VNET_BOX_LUNA_PROMPTS.md`

**Depends on:** VN-02. Prefer VN-03 so cross-group membership matches.

## Goal

Graphviz PNG export draws one cluster per virtual network inside the resource-group cluster. The cluster label is the VNet name. The same members that sit in the forest `vnet-frame` sit in that cluster. Remove the single cluster labeled "VNet / subnet".

## Why

`DiagramAstGraphvizDotEmitter.EmitResourceGroupCluster` puts every VNet and subnet, and any node that is the target of an `in` edge, into one dashed cluster per resource group. Member workloads stay outside it. The label is the fixed string "VNet / subnet". Forest and PNG then disagree.

## Read first

- `ArchLucid.ArtifactSynthesis/Graphviz/DiagramAstGraphvizDotEmitter.cs` (`EmitResourceGroupCluster`, `IsNestedVnetOrSubnet`)
- `ArchLucid.ArtifactSynthesis/Graphviz/DiagramResourceGroupGraphvizClusterPlanner.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestVnetMembership.cs`
- `ArchLucid.ArtifactSynthesis.Tests` classes that assert `cluster_vnet_` or `VNet / subnet`

## What to build

For each resource-group cluster, emit one nested `subgraph cluster_vnet_{id}` per VNet that has a forest box (at least one other same-group member). Label it with the VNet node's label, quoted the same way other cluster labels are quoted.

Put inside it the members `DiagramForestVnetMembership` assigns, limited to nodes already in that resource-group cluster. Do not put a cross-group VM in the VNet cluster.

Do not emit a node statement for the VNet itself when it is the cluster label. A VNet with no box stays an ordinary node.

Delete the "VNet / subnet" cluster and `IsNestedVnetOrSubnet`'s "any `in` target" rule.

Do not switch the layout engine to `dot`. Do not change forest SVG in this session except to share the membership type if the emitter cannot see it today.

Mermaid export may keep its current subgraphs. If a test fixture asserts Mermaid membership, it must not list a node the forest box excludes.

## Tests

1. One resource group, one VNet, two member VMs, one Key Vault. DOT contains one `cluster_vnet_` whose label is the VNet name, the two VM ids inside it, the Key Vault outside it, and no `VNet / subnet` label.
2. Two VNets in one resource group: two `cluster_vnet_` subgraphs.
3. A VNet with no other same-group member: no `cluster_vnet_` for it; the VNet id is still a node.
4. Search tests for `VNet / subnet` and update them to the per-VNet contract. Do not leave an assertion that requires the old label.

## Acceptance criteria

- PNG clusters match forest membership.
- Cluster label is the VNet name.
- No "VNet / subnet" cluster remains.
- `dot` is not the default engine.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run tests matching `DiagramAstGraphvizDotEmitter` and `DiagramForestVnetFrameLayout`.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.

## Done when

The DOT for a resource group with two VNets contains two named VNet clusters, and a Key Vault in that group is in neither.
