# IDL-05 — Executive mode carries counts and grouping, not a bare VNet list

**Wave:** inventory-diagram-layout (**IDL**). **Depends on:** IDL-01, IDL-02. **Do not** implement IDL-06. **Owner must fill the Decisions section before pasting.**

Do not implement from the wave index. Implement only *What to build*.

## Goal

For an 889-resource snapshot, Executive mode must tell a reviewer something: how many subnets / VMs / peerings sit behind each VNet, and how the VNets group (region or resource group). Today it emits 11 bare VNet labels with no relationships and no grouping.

## Why

`IsExecutiveSummaryNode` keeps resource groups, VNets, and subscriptions; snapshot graphs have no RG/subscription nodes, so Executive = VNets only. `IncludeInventoryConnectedVirtualMachines` only adds VMs reachable by `connectsTo` VM → NIC → subnet, which this snapshot does not have as edges. `FlattenSparseSubgraphs` (threshold 8) removes the 11 one-node RG frames. Result: 11 labels, zero structure. VNet peerings (`Microsoft.Network/virtualNetworks/virtualNetworkPeerings`) are the one **real** VNet-to-VNet relationship in Azure inventory and are not surfaced.

## Decisions (owner fills in)

| # | Question | Default if blank |
|---|----------|------------------|
| D1 | Group sparse Executive VNets by **region**, by **resource group**, or **flat**? | Region subgraphs when ≥ 2 regions, else flat |
| D2 | Label suffix format | `vnet-eastus` newline `4 subnets · 12 VMs` (Mermaid `<br/>` is unavailable with `htmlLabels:false`; use two-line label via `\n` escaped as `#10;` only if the renderer proves it paints; otherwise ` · 4 subnets · 12 VMs` inline) |
| D3 | Emit VNet peering edges as real edges (label `peered`) | Yes |
| D4 | Max Executive nodes (`ExecutiveMaxResourceNodes = 12` today) | Keep 12; overflow → `+N more VNets` summary node |

## Context

- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstFromGraphCompiler.cs` — `ApplyExecutiveFilter`, `IncludeInventoryConnectedVirtualMachines`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstGraphNodeClassifier.cs` — `IsExecutiveSummaryNode`, `ReadArmId`, `ReadResourceGroup`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramSubgraphPlanner.cs`, `DiagramAstExecutiveLayoutSimplifier.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstFromGraphCompilerConstants.cs`
- `ArchLucid.ArtifactSynthesis/Renderers/MermaidDiagramRenderer.cs` — `EscapeLabel`
- `ArchLucid.KnowledgeGraph/Inventory/AzureInventoryTopologyCategory.cs`
- `ArchLucid.ArtifactSynthesis.Tests/DiagramAstFromGraphCompilerTests.cs`
- `GraphNode.Properties` keys in use: `arm.id`, `arm.type`, `arm.resourceGroup`, `arm.parentId`, `arm.subscriptionId`; check whether `arm.location` / region exists — if not, D1 region grouping needs IE-side property first (report and fall back to RG).

## What to build

1. `ExecutiveVnetSummaryBuilder` (own file): for each VNet node, count child resources by ARM id prefix (`{vnetArmId}/subnets/…`) and by `arm.parentId`, plus VMs whose NIC subnet resolves to the VNet (reuse `DiagramAstLayoutEdgeBuilder.ResolveVnetNodeIdsForVirtualMachine` logic — extract it to a shared helper rather than duplicating). Produce `(subnetCount, vmCount, peeringCount)`.
2. Executive labels append counts per **D2**. Zero counts omitted (`vnet-eastus · 2 subnets`).
3. Per **D3**: emit real edges between VNet nodes when a `virtualNetworkPeerings` child ARM id (or its `remoteVirtualNetwork` property, if present) names another included VNet. Label `peered`. Dedupe A↔B.
4. Per **D1**: in Executive mode, when flatten would leave 0 subgraphs and ≥ 2 distinct regions exist among included nodes, plan **region** subgraphs (`Region {name}`) instead of flat. `FlattenSparseSubgraphs` must not flatten these (they are not one-node RG frames). Grid links (IDL-02) apply inside each region subgraph.
5. Per **D4**: when more than `ExecutiveMaxResourceNodes` VNets exist, keep the first N by ARM id and add one summary node `+N more virtual networks` (no `al-seed`, so the outline does not offer Focus neighborhood on it).
6. Tests: fixture with 11 VNets across 3 regions, 2 with subnets and VMs, 1 peering pair. Assert labels, `peered` edge count 1, region subgraphs 3, no `-->` other than the peering, IDL-01 `edgeCount == 1`.

## Acceptance criteria

- Owner snapshot shape renders as grouped VNets with counts; the status strip reads `11 nodes · 1 edge · 3 subgraphs` (or per decisions).
- Network / Data / Identity modes unchanged.
- Outline Nodes table still lists VNet labels (with suffix) and Focus neighborhood works on them.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** touch `archlucid-ui`. **Do not** change readability thresholds.
- C#: concrete types over `var`, LINQ where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks. No `ConfigureAwait(false)` in tests.
- TB-645 vocabulary. Sentence case in labels (`2 subnets`, not `2 Subnets`).
- Verification: `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~ExecutiveVnetSummary|FullyQualifiedName~DiagramAstFromGraphCompilerTests'`. No full-solution build.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
