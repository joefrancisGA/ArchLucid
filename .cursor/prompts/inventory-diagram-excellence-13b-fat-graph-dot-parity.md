# IDX-13b — Fat-graph forest / DOT nested-frame parity

**Wave:** inventory-diagram-excellence (**IDX**). **Depends on:** IDX-13 and IDX-05 compile-path subnet frames already on trunk (including fat fixture `VmToNic`). **Extend only.** Do **not** greenfield IDX-01–12. Do **not** implement new visuals unless a parity assertion fails because Graphviz is missing a cluster the forest already draws.

Follow [`.cursor/prompts/inventory-diagram-excellence-00-index.md`](inventory-diagram-excellence-00-index.md) global constraints and **All `DiagramMode` contract**.

## Goal

`InventoryDiagramExcellenceSharedGraphFixture.BuildFatGraph()` compiled through `DiagramAstFromGraphCompiler` must keep forest SVG nested frames and Graphviz DOT clusters in lockstep for modes that actually draw those frames.

Today dual-subnet parity lives on `InventoryDiagramExcellenceNestedFrameParityTests` (hand-sized same-RG graph). The fat graph already ratchets subscription `cluster_subscription` policy and, for Network, a subnet SVG frame. It does **not** yet assert `cluster_vnet_` / `cluster_subnet_` counts match `vnet-frame` / `subnet-frame` on that same compile.

## Why

A later agent can add a forest frame or a DOT cluster on one fixture and leave the shared excellence graph lying. PNG export then disagrees with the live inventory-forest canvas on the graph every IDX ratchet uses.

## Applies to every `DiagramMode`

| Mode | Parity |
|------|--------|
| Network | Hero. Forest subnet frame count > 0 on the fat graph (already true after the `VmToNic` fixture fix). DOT subnet and VNet cluster counts must equal those SVG frame counts. |
| FullSubscription | If the compiled forest draws `vnet-frame` and/or `subnet-frame`, DOT must match those counts. If the mode peels subnet cards, both sides stay at 0 for subnet — do not invent subnet cards to force a frame. |
| ResourceGroup | Same rule as FullSubscription, scoped to `network-rg` (the existing Idx13 compile options). |
| Executive / Architecture / Security / Data | Call parity only when the forest actually emits nested frames; a 0 = 0 match is success. |
| Identity | Expect 0 VNet frames and 0 matching VNet clusters. |
| DataFlow / DataArchitecture | Do **not** replace stage or type-group subgraphs with RG-first packing to satisfy parity. If those modes emit no nested frames, 0 = 0 is success. |
| SelectedResources / DependencyNeighborhood | No subscription outer cluster. Nested parity only for frames the hop-focus compile actually draws. |

Skip with an explicit comment when a mode filter leaves no nested frames. Do not `Assert.Skip` the whole mode if RG `cluster_rg_` and subscription policy already apply.

## Context (extend, do not replace)

- `ArchLucid.ArtifactSynthesis.Tests/InventoryDiagramExcellenceSharedGraphFixture.cs` — `vm-1 → nic-1` is `VmToNic`; `nic-1 → subnet-1` stays `NicToSubnet`.
- `ArchLucid.ArtifactSynthesis.Tests/InventoryDiagramExcellenceRatchetAssertions.cs` — `AssertForestAndDotNestedFrameParity`, `AssertDotSubscriptionClusterPolicy`.
- `ArchLucid.ArtifactSynthesis.Tests/InventoryDiagramExcellenceIdx13RatchetTests.cs` — twelve-mode fat-graph compile. Wire parity here or in a sibling test class that compiles the **same** fixture.
- `ArchLucid.ArtifactSynthesis.Tests/InventoryDiagramNetworkSubnetCompileTests.cs` — Network fat graph already requires a `subnet-frame`. Keep that test green.
- `ArchLucid.ArtifactSynthesis/Graphviz/DiagramResourceGroupGraphvizClusterPlanner.cs` — `PlanVnetClusters` / `PlanSubnetClusters`.
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestNestedFrameResolver.cs` — forest frame source of truth.

## What to build

1. On the fat-graph compile for **Network**, **FullSubscription**, and **ResourceGroup**, render forest SVG and emit DOT, then call `AssertForestAndDotNestedFrameParity`.

2. Network fat graph: subnet SVG frames stay greater than 0, and DOT `cluster_subnet_` count equals that SVG count. VNet frames and `cluster_vnet_` match the same way.

3. If parity fails because DOT omitted a cluster the forest drew, fix the Graphviz planner so membership matches `DiagramForestVnetMembership` / cited placement. Do **not** delete forest frames to make the counts match.

4. If parity fails because the forest drew a frame with no cited members, fix the resolver. Do **not** add all-to-all same-RG edges.

5. Leave `AssertDotSubscriptionClusterPolicy` and PE-default / NIC-default ratchets unchanged.

## Acceptance criteria

- `dotnet test ArchLucid.ArtifactSynthesis.Tests --filter FullyQualifiedName~InventoryDiagramExcellence` passes, including the new fat-graph parity assertions.
- `dotnet test ArchLucid.ArtifactSynthesis.Tests --filter FullyQualifiedName~InventoryDiagramNetworkSubnet` still passes.
- No Mermaid `nodeSpacing` retune. No new Azure icons. No default PE or NIC cards.

## Constraints

- **Do not** reopen IDX-01 capture, IDX-02 compose, or IDX-10 UI.
- **Do not** start this from an IDA or IDF chat.
- **This is not IDX-HOLD.** If the session starts a complete graph so cluster counts rise, stop.

## Done when

Compiling `BuildFatGraph()` for Network shows the same VNet and subnet frame counts in forest SVG and in Graphviz DOT, and FullSubscription / ResourceGroup either match the same way or both sides are zero for a layer that mode does not draw.

## Tests

```bash
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~InventoryDiagramExcellence|FullyQualifiedName~InventoryDiagramNetworkSubnet'
```
