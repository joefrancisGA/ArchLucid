# DFV-26 — Collect the firewall's routed subnets

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement DFV-21, DFV-22, DFV-23, or a NAT-gateway or load-balancer pass in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Data flow diagram (**DFV**). **Depends on:** current `master` after DFV-25 (PR 4319). DFV-25 already draws **Routes through** when a `firewallToSubnet` row exists. This session collects that row, and it teaches the diagram which factory and Function App sit on the subnet. An old ZIP cannot gain the line until the owner re-collects.

## Goal

On a new Azure inventory package, `network-associations.json` contains `firewallToSubnet` from `fw_hi_nprd_wvd` to each subnet whose route table sends `VirtualAppliance` traffic to that firewall's private IP. On **Data flow — what may connect**, that firewall then has a **Routes through** line to each Application or Ingestion card on one of those subnets. A Data Factory counts when a private endpoint on that subnet targets it. A Function App or App Service counts when its VNet integration names that subnet. The virtual network, the subnet, NICs, and NSGs stay off the canvas.

## Why

DFV-25 is on `master`. Restarting the API does not change this picture. The uploaded `network-associations.json` for `Hmd_HI_HAP_Non_Prod` has no `firewallToSubnet` row. `fw_hi_nprd_wvd` appears only as the target of `publicIpToNic` from `pip_hi_nprd_wvd`. `snet-vmss-hi-nprd-wus-001` is already tied to `rt_hi_nprd_wvd` by `subnetToRouteTable`. Other subnets use `rt-hi-nprd-weus-301`. The route next hop is not in the file, so the collector cannot yet know which of those subnets send traffic to the firewall.

`resources.json` is filled by a Resource Graph query that projects `id`, `name`, `type`, `location`, `tags`, `sku`, and `resourceGroup`. `New-ArchLucidCollectedResourceGraphRecord` sets `properties` to an empty object. Firewall `ipConfigurations` and route-table `routes` never land there. `Get-ArchLucidArgNetworkAssociationQuerySpecs` queries virtual machines, NICs, Bastion, public IPs, virtual networks, and private endpoints. It does not query `microsoft.network/azurefirewalls` or `microsoft.network/routetables`.

The firewall's own `AzureFirewallSubnet` is the wrong join. No Application or Ingestion card lives there. The hosted builder already emits `firewallToSubnet` for that subnet (`AddFirewallAssociations`, including flattened subnet ids). The ZIP collector does not. The cards sit on the subnets whose user route next hop is the firewall. `AzureInventoryRouteTableNextHopResolver` already matches a `VirtualAppliance` next hop to a firewall private IP when the graph node has properties. The ZIP path has to do that match while it still has the Resource Graph page, then write only `firewallToSubnet`.

Two attachment gaps remain after that row exists. Data Factory cards are `privateEndpointTarget` resources (`pendp-adf-edw-hi-dev` on `snet-vmss-hi-dev` targets `adf-edw-hi-dev`, and the ppd and tst pairs match that shape). `BuildSubnetAttachedConsumerNodeIdsBySubnetArmId` does not treat that target as attached to the private endpoint's subnet. Function Apps such as `func-hap-hawaii-nonprod` have no `appServiceToSubnet` row. The hosted builder reads `virtualNetworkSubnetId` on `Microsoft.Web/sites`. The PowerShell package does not.

## Read first

- `docs/architecture/DATA_FLOW_DIAGRAM_LUNA_PROMPTS.md`
- `scripts/azure/ArchLucid.ResourceGraph.RelationshipQueries.helpers.ps1` (`Get-ArchLucidArgNetworkAssociationQuerySpecs`, `Add-ArchLucidArgNetworkAssociationRowsFromBastionRecord`, `Invoke-ArchLucidResourceGraphPagedAssociationQuery`)
- `scripts/azure/tests/ArchLucid.ResourceGraph.RelationshipQueries.helpers.Tests.ps1` (the spec-count test expects 7 query kinds today)
- `ArchLucid.Integrations.AzureExtractor/HostedAzureInventoryNetworkAssociationBuilder.cs` (`AddFirewallAssociations`, `AddAppServiceAssociations`)
- `ArchLucid.Core/AzureExtractor/AzureInventoryRouteTableNextHopResolver.cs`
- `ArchLucid.Core/AzureExtractor/InventoryDiagramDataFlowTraversalHopProjector.cs` (`AddFirewallDownstreamLinks`, `BuildSubnetAttachedConsumerNodeIdsBySubnetArmId`)
- `ArchLucid.Core/AzureExtractor/AzureInventoryDataFlowEvidenceCatalog.cs` (`FirewallToSubnet` and `AppServiceToSubnet` stay excluded)
- `ArchLucid.Core/AzureExtractor/AzureInventoryRelationshipAssociationTypes.cs`

## What to build

1. Branch `dfv/26-firewall-routed-subnets` from current `master`.
2. Add three Resource Graph association queries beside the Bastion query. Each one still projects `id, type`. A failed page warns and stops that query only, through `Invoke-ArchLucidResourceGraphPagedAssociationQuery`. It must not fail the rest of the package.
   - `microsoft.network/azurefirewalls`: `ipConfigurations = properties.ipConfigurations`
   - `microsoft.network/routetables`: `routes = properties.routes`
   - `microsoft.web/sites`: `virtualNetworkSubnetId = properties.virtualNetworkSubnetId`
3. Update the spec-count test. It becomes 10 kinds. Keep the `project id, type` assertion.
4. From each firewall IP configuration, remember the subnet id and `privateIPAddress` for the match. Emit `firewallToSubnet` from the firewall to its own IP-configuration subnet when that subnet id is present. That keeps the ZIP aligned with `AddFirewallAssociations`. Do not stop there.
5. After the association pages return, emit one more `firewallToSubnet` from that firewall to every subnet that already has `subnetToRouteTable` pointing at a route table where a user route has `nextHopType` `VirtualAppliance` and `nextHopIpAddress` equal to that firewall private IP. Compare the addresses as trimmed strings. One row per firewall and subnet. Reuse the existing seen-key dedup.
6. A route that is not `VirtualAppliance`, or whose next hop does not equal a firewall private IP, emits nothing. A firewall with no private IP still emits only its own IP-configuration subnet. Do not invent a target from the route-table name, and do not treat `AzureFirewallSubnet` as the subnet that reaches the cards.
7. Use the private IP only inside that match. Do not write it, the route list, firewall rules, threat intel, or policy into `network-associations.json` or `resources.json`.
8. For each `microsoft.web/sites` row with a non-empty `virtualNetworkSubnetId`, emit `appServiceToSubnet` from the site to that subnet. That covers Function Apps and App Services. Do not read app settings in this session.
9. Leave the hosted builder alone. The owner uploads the ZIP. Do not start copying firewall properties into `resources.json`.
10. On the data-flow hop projector, keep `AddFirewallDownstreamLinks` and the **Routes through** label. Extend subnet attachment so the target of `privateEndpointTarget` is attached to the subnet named by that private endpoint's `peToSubnet` row. The private endpoint itself stays a traversal hop and is not a new card. `appServiceToSubnet` attachment already exists once the row is collected.
11. Keep `firewallToSubnet` and `appServiceToSubnet` excluded from the ordinary painted catalog. Do not add a subnet, virtual network, NIC, or NSG node. Do not draw the line to the subnet. When DFV-14 rolls the downstream card into a count card, the line ends on that count card.
12. Leave NAT gateways, load balancers, application gateways, and factory **Reads from** / **Writes to** labels unchanged. Other diagram types do not gain these edges.
13. Tests:
    - A `VirtualAppliance` route whose next hop equals the firewall private IP emits `firewallToSubnet` from the firewall to the subnet already associated with that route table. The private IP does not appear in the row.
    - A different next-hop IP, and a route that is not `VirtualAppliance`, emit no routed `firewallToSubnet` row.
    - A site with `virtualNetworkSubnetId` emits one `appServiceToSubnet` row. An empty value emits none.
    - A firewall, a `firewallToSubnet` row, a private endpoint on that subnet, and a Data Factory `privateEndpointTarget` produce one data-flow link from the firewall to the factory. The private endpoint is not the target. The SVG has no subnet node, and the label is `Routes through`.
    - A Function App with `appServiceToSubnet` on that subnet produces the same link. A Function App on another subnet does not.
    - The catalog still excludes `firewallToSubnet`.
    - A Full subscription canvas does not contain this `Routes through` edge.
    - A NAT gateway does not gain a new edge in this session.

## Acceptance criteria

- The new package can name the subnets whose user route next hop is the firewall, without storing the private IP or the firewall policy.
- A factory reached by a private endpoint on one of those subnets gets **Routes through** from the firewall.
- A Function App or App Service whose VNet integration names one of those subnets gets the same line.
- The subnet and the other network attachment nodes stay off Data flow.
- NAT gateways and the load balancer are unchanged.
- A query failure does not empty the rest of `network-associations.json`.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Read-only Resource Graph. Do not collect firewall rules, threat intel, or observed traffic.
- Do not relabel factory edges. That is DFV-23.
- Do not remove `firewallToSubnet` from the evidence-catalog exclusion.
- No `ConfigureAwait(false)` in tests.
- Working-tree safety. Stage only the Resource Graph association helper, the hop projector, and the tests. **No `git add -A`.**
- **Do not commit.**

## Verification

```powershell
pwsh -NoProfile -Command "Invoke-Pester -Strict -EnableExit -Path 'scripts/azure/tests/ArchLucid.ResourceGraph.RelationshipQueries.helpers.Tests.ps1'"
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter "FullyQualifiedName~TraversalHop"
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter "FullyQualifiedName~DataFlowTraversalHop|FullyQualifiedName~DataFlow"
.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis/ArchLucid.ArtifactSynthesis.csproj'
```

Heartbeat every 8 seconds on the compile. One compile, plus one retry if it exits 1.

## Done when

Tests pass. Tell the owner the current `Hmd_HI_HAP_Non_Prod` ZIP stays unchanged until they re-run `scripts/azure/Run-SecureNowAzureExtractor.ps1` and upload the new package. After that upload, `fw_hi_nprd_wvd` should have a **Routes through** line to each Application or Ingestion card on a subnet whose route table sends `VirtualAppliance` traffic to that firewall, including a factory targeted by a private endpoint on that subnet and a Function App whose `virtualNetworkSubnetId` names it. `rt-hi-nprd-weus-301` contributes its subnets only when its next hop is that same firewall. The subnet should still be absent. NAT gateways should still have no new line. Wait for that look before any commit.
