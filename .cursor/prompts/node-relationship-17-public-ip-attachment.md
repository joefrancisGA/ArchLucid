# NR-17 — A public IP attached outside `/ipConfigurations/` is connected

**Model:** Composer 2.5 (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier model.

**Repo:** `c:\ArchLucid`

**Depends on:** NR-05 and the scale-set ancestor walk already in `TryClassifyOrphanedPublicIp`. Do not re-run NR-01 through NR-16. Do not edit the NR index or `docs/architecture/INVENTORY_DIAGRAM_NODE_RELATIONSHIP_LUNA_PROMPTS.md`.

## Goal

On Full subscription, a public IP that Azure has attached to a load balancer, Application Gateway, Bastion host, Azure Firewall, NAT gateway, network interface, or scale set is **Connected** when that parent is on the diagram. It is **Used**, with the parent name, when the parent is in the snapshot but not on the diagram. It stays **Missing a required link: no IP configuration or parent reference** only when Azure stored neither an IP configuration nor a NAT gateway.

## Why

`TryResolveAssociatedResourceFromIpConfiguration` keeps a parent only when the configuration id contains the literal segment `/ipConfigurations/`. These Azure ids do not:

- Load balancer and Application Gateway: `/frontendIPConfigurations/{name}`
- Bastion: `/bastionHostIpConfigurations/{name}`
- Azure Firewall: `/azureFirewallIpConfigurations/{name}`

NAT gateway public IPs often have no `ipConfiguration`. The parent is `properties.natGateway.id`.

The Resource Graph collector drops those ids before they are stored, so the diagram graph has no `ipConfiguration.id` and no edge. Clearing the orphan flag without drawing an edge relabels the card **Needs evidence**. That is the wrong result.

A public IP with a cited diagram edge is already **Connected**. Resource-group collocation is not a cited edge.

## What to build

### One parent parser

Add `AzureInventoryPublicIpConfigurationParentResolver` in its own file under `ArchLucid.Core/AzureExtractor/`.

`TryResolveParentArmId(string? configurationId)` returns the ARM id in front of the **last** path segment whose name ends with `ipConfigurations`, compared ordinal-ignore-case. Rebuild the id with a leading `/`.

Examples:

- `…/networkInterfaces/nic1/ipConfigurations/ipconfig1` → the network interface
- `…/virtualMachineScaleSets/vmss1/virtualMachines/0/networkInterfaces/nic1/ipConfigurations/ipconfig1` → the instance network interface
- `…/loadBalancers/lb1/frontendIPConfigurations/fe1` → the load balancer
- `…/applicationGateways/agw1/frontendIPConfigurations/fe1` → the application gateway
- `…/bastionHosts/bastion1/bastionHostIpConfigurations/IpConf` → the Bastion host
- `…/azureFirewalls/fw1/azureFirewallIpConfigurations/ipconfig` → the firewall
- null, blank, or an id with no such segment → null

Do not treat `natGateway.id` with this method. That value is already the parent ARM id.

Replace the private `/ipConfigurations/` splits in:

- `InventoryDiagramOrphanedStateClassifier.TryResolveAssociatedResourceFromIpConfiguration`
- `AzureInventoryParentAttachmentParentResolver.TryResolveAssociatedResourceFromIpConfiguration`
- `AzureInventorySecurityEdgeMaterializer.TryResolveAssociatedResourceFromIpConfiguration`

Call the new resolver from each. Delete the private copies.

### Diagram edge

Add `AzureInventorySnapshotPublicIpParentEdgeHydrator` in its own file under `ArchLucid.Application/InfraEvidence/Mermaid/`. Call it from `AzureInventorySnapshotGraphResolver.BuildGraph` next to the other snapshot edge hydrators.

For each `Microsoft.Network/publicIPAddresses` node:

1. Read `ipConfiguration.id`. Resolve the parent with `AzureInventoryPublicIpConfigurationParentResolver`.
2. When that parent is null, read `natGateway.id` and use that ARM id as the parent.
3. Map the parent through `AzureInventoryArmEndpointNodeResolver` so a missing child resolves to an ancestor that is a snapshot node (the scale set, when the instance network interface was not collected).
4. When the parent node exists and is not the public IP, add an edge from the public IP to that parent when that pair and type are not already present.

Edge type: `GraphEdgeTypes.Exposes`. Inference source: `GraphEdgeInferenceSources.InventoryPublicIp`. Provenance: the same observed-fact provenance the other inventory hydrators use.

`HydrateSubnetPlacementProperties` already copies `ipConfiguration.id` onto the public IP node. Also copy `natGateway.id` there, with the same redaction and blank-value skips.

### Orphan caption

In `TryClassifyOrphanedPublicIp`, resolve the parent with the same two steps (configuration id, then `natGateway.id`).

- Parent or an ancestor is in the analysis graph: return null.
- A parent id was read and neither that id nor an ancestor is in the graph: orphaned, `parent resource {name} no longer exists`.
- No configuration parent and no NAT gateway id: orphaned, `no IP configuration or parent reference`.

In `InventoryDiagramOrphanedStateApplier`, when the public IP has no cited diagram edge and classification returned null because a parent is in the analysis graph, set **Used** and `attached to {name}`. Do not leave it **Unknown**. Do not change Used handling for other resource types.

A cited `EXPOSES` edge to a load balancer, application gateway, Bastion host, firewall, NAT gateway, or scale set marks the public IP **Connected** on Full subscription. Do not require the target to be a network interface.

### Collector

In `scripts/azure/ArchLucid.ResourceGraph.RelationshipQueries.helpers.ps1`:

- Add a PowerShell function with the same last-segment rule as the C# resolver. Comment that the two must match.
- `Add-ArchLucidArgNetworkAssociationRowsFromPublicIpRecord` must keep an `ipConfiguration.id` that uses `frontendIPConfigurations`, `bastionHostIpConfigurations`, or `azureFirewallIpConfigurations`. Stamp that full id on the fact. Emit `publicIpToNic` to the resolved parent. Stop returning early only because `/ipConfigurations/` is absent.
- Project `natGatewayId = properties.natGateway.id` on the public IP Resource Graph query. Stamp `natGateway.id` on the public IP resource. Emit the same association to that NAT gateway id when `ipConfiguration` produced no parent.

In `scripts/azure/ArchLucid.SecurityInventory.helpers.ps1`, `Resolve-ArchLucidAssociatedResourceFromIpConfiguration` must use the same segment rule. `Add-ArchLucidPublicIpIpConfigurationPropertiesFromFacts` stays the stamp for `ipConfiguration.id`. Add a stamp for `natGateway.id` when that fact is present and the key is not already set.

Do not query a new Azure resource type. Do not add flow logs.

## Tests

1. A public IP whose `ipConfiguration.id` ends in `frontendIPConfigurations/fe1` is not orphaned when the load balancer is in the graph, and the graph has an `EXPOSES` edge to that load balancer. The caption does not contain `no IP configuration or parent reference`.
2. The same shape for `bastionHostIpConfigurations` and `azureFirewallIpConfigurations`.
3. A public IP with only `natGateway.id` is not orphaned when the NAT gateway is in the graph, and the edge target is the NAT gateway.
4. A scale-set instance configuration id still resolves through the existing ancestor walk when the scale set is in the graph. Keep `Classify_public_ip_with_vmss_nic_ip_configuration_is_not_orphaned_when_vmss_is_in_graph` passing.
5. A public IP with a configuration id whose parent is absent from the graph is orphaned with `parent resource {name} no longer exists`.
6. A public IP with neither `ipConfiguration.id` nor `natGateway.id` is orphaned with `no IP configuration or parent reference`.
7. Full subscription compile: the load-balancer public IP has a cited edge and connection state Connected. When the load balancer is removed from the diagram node set but remains in `OrphanAnalysisGraph`, the public IP is Used and the message is `attached to {name}`.
8. Pester: a Resource Graph public IP row whose `ipConfiguration.id` uses `frontendIPConfigurations` emits `publicIpToNic` and stamps the full configuration id. A row with only `natGateway.id` stamps that id and emits the association. A row with neither emits no public-IP association.

## Acceptance criteria

- An attached public IP on Full subscription no longer reads **Missing a required link: no IP configuration or parent reference**.
- The card is Connected when the parent is drawn, and Used when the parent is only in the snapshot.
- An unattached public IP keeps that orphan sentence.
- The C# resolver and the PowerShell resolver implement one rule.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run the new classifier, hydrator, and Full subscription tests, plus `InventoryDiagramOrphanedStateClassifierTests`.
- Run the touched Pester files under `scripts/azure/tests/`.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.
- A blank line before `if` and `foreach` unless it is the first line in the method.
- Prefer concrete types over `var`.

## Done when

A Full subscription public IP attached to a load balancer, Application Gateway, Bastion host, firewall, NAT gateway, or scale set no longer shows **Missing a required link: no IP configuration or parent reference**, and a public IP with no configuration still does.
