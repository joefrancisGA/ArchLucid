# DFV-25 — Draw the firewall to the cards on its subnet

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement DFV-21, DFV-23, or a NAT-gateway or load-balancer pass in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Data flow diagram (**DFV**). **Depends on:** current `master`. The firewall card and the `firewallToSubnet` association already exist. This session draws the firewall to the cards already on the canvas. It does not collect a new Azure resource.

## Goal

On **Data flow — what may connect**, `fw_hi_nprd_wwd` has a **Routes through** line to each Application or Ingestion card that shares its subnet. The virtual network, the subnet, NICs, and NSGs stay off the canvas. NAT gateways and the load balancer stay as they are.

## Why

A later look at `Hmd_HI_HAP_Non_Prod` shows the source hosts reaching the Data Factory cards, and those factories reaching storage accounts that say `used by 1`. `fw_hi_nprd_wwd` sits in Application with no line. `AzureInventoryDataFlowEvidenceCatalog` excludes `firewallToSubnet`, so the only collected firewall hop never paints, and the subnet it names is not a data-flow node. The applications and factories on that subnet are already cards. The picture should show the firewall in front of those cards.

`InventoryDiagramDataFlowTraversalHopProjector` already joins a subnet to the nodes attached to it, including `appServiceToSubnet`, and already uses the words **Routes through** for a route-table next hop. Reuse that join. Do not paint the subnet as the other end of the line.

## Read first

- `docs/architecture/DATA_FLOW_DIAGRAM_LUNA_PROMPTS.md`
- `ArchLucid.Core/AzureExtractor/AzureInventoryDataFlowEvidenceCatalog.cs` (`FirewallToSubnet` stays excluded)
- `ArchLucid.Core/AzureExtractor/InventoryDiagramDataFlowTraversalHopProjector.cs` (`BuildSubnetAttachedConsumerNodeIdsBySubnetArmId`, `ResolveTraversalDiagramLabel`)
- `ArchLucid.Core/AzureExtractor/AzureInventoryRelationshipAssociationTypes.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramEdgeLabelHumanizer.cs`
- `ArchLucid.KnowledgeGraph/Inventory/AzureInventoryDataFlowStageResolver.cs`

## What to build

1. Branch `dfv/25-firewall-downstream` from current `master`.
2. On a data-flow canvas only, for each `Microsoft.Network/azureFirewalls` node that has a `firewallToSubnet` association, find the subnet ARM id. Draw one edge from that firewall to each other data-flow node that is attached to the same subnet and whose stage is Application or Ingestion. The edge label is **Routes through**.
3. Attachment includes the subnet join the hop projector already builds: `appServiceToSubnet`, a NIC-to-subnet parent that is already a data-flow node, and a node that stores that subnet id on its properties. A node that is the firewall itself, a subnet, a virtual network, a NIC, or an NSG is not a target.
4. Keep `firewallToSubnet` excluded. Do not add a subnet node, a virtual-network node, a NIC node, or an NSG node. Do not draw the line to the subnet.
5. One edge per firewall and downstream card. When DFV-14 rolls the downstream card into a count card, the line ends on that count card, the same way other data-flow edges do.
6. A firewall with no subnet, or with no Application or Ingestion card on that subnet, stays a card. Do not invent a target.
7. Leave NAT gateways, load balancers, application gateways, and private endpoints unchanged.
8. Other diagram types do not gain these edges.
9. Tests:
    - A firewall and a Function App on subnet A produce one data-flow edge whose label is `Routes through`. The SVG has no node whose type is a virtual network or a subnet.
    - A Function App on subnet B produces no edge from that firewall.
    - The catalog still excludes `firewallToSubnet`.
    - A Full subscription canvas does not contain this `Routes through` edge.
    - A NAT gateway on subnet A does not gain a new edge in this session.

## Acceptance criteria

- The firewall card connects to the Application and Ingestion cards on its subnet.
- Each of those lines says **Routes through**.
- The subnet and the other network attachment nodes stay off Data flow.
- NAT gateways and the load balancer are unchanged.
- Factory-to-storage edges already on the canvas stay as they are.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not collect firewall rules, threat intel, or observed traffic.
- Do not relabel factory edges. That is DFV-23.
- Working-tree safety. Stage only the data-flow hop join, the edge label if **Routes through** is missing there, and the tests. **No `git add -A`.**
- **Do not commit.**

## Verification

```powershell
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter "FullyQualifiedName~DataFlow|FullyQualifiedName~TraversalHop"
.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis/ArchLucid.ArtifactSynthesis.csproj'
```

Heartbeat every 8 seconds on the compile. One compile, plus one retry if it exits 1.

## Done when

Tests pass. Tell the owner to restart the API and open Data flow on `Hmd_HI_HAP_Non_Prod`. `fw_hi_nprd_wwd` should have a **Routes through** line to each Application or Ingestion card on its subnet. The subnet should still be absent. NAT gateways should still have no new line. Wait for that look before any commit.
