# NR-39 — Link AKS clusters to Kubernetes service load balancers and collect load balancer backends

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not treat a load balancer as a data-flow hop. Do not infer a Kubernetes service load balancer from resource-group collocation or from a name prefix `kubernetes` alone.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_NODE_RELATIONSHIP_LUNA_PROMPTS.md`

**Depends on:** NR-04, NR-05, NR-20, and NR-25. NR-36 and the existing `vmssToManagedCluster` / **Node pool** path are already in the tree. The owner is looking at a `Microsoft.Network/loadBalancers` resource whose name or category reads like Kubernetes (`kubernetes`, `kube`, or an AKS-owned name in an `MC_*` node resource group) on the full subscription diagram. The outline says it stands alone. The managed cluster in the subscription may already show **Node pool** lines to its scale sets and **Pulls image from** to registries, but nothing ties the cluster to the service load balancer in its node resource group, and CustomerScript snapshots often lack backend pool properties so NR-25 never draws **Sends traffic to**.

## Goal

The next inventory capture does two things.

1. **Cluster to service load balancer:** When a stored `Microsoft.ContainerService/managedClusters` resource has `nodeResourceGroup` and a `Microsoft.Network/loadBalancers` resource in that same resource group carries a stored Kubernetes ownership tag for that cluster, store one association from the cluster to that load balancer. Draw one solid **Exposes services through** line from the cluster to that load balancer when both are visible. A load balancer in the node resource group without a matching tag stays unconnected to the cluster.

2. **Load balancer backends (CustomerScript parity):** For every collected load balancer, store `backendAddressPools` and `loadBalancingRules` on the resource row (same JSON shape hosted collection already uses). Emit `lbToBackend` rows for each resolved backend NIC or parent resource id. Hosted association building must walk `loadBalancerBackendAddresses` the same way `AzureInventoryLoadBalancerBackendTrafficResolver` already does for diagram compilation. After ingest, NR-25 **Sends traffic to** lines appear from the load balancer to each visible backend (for example a node-pool scale set or virtual machine), including Kubernetes Standard SKU pools that only cite `loadBalancerBackendAddresses[].properties.networkInterfaceIPConfiguration`.

## Why

`InventoryDiagramIndirectRelationshipClassifier` classifies load balancers as `LoadBalancer` and managed clusters as `KubernetesCluster`. `InventoryDiagramOrphanedStateClassifier` does not treat an empty backend pool as orphaned; without stored backends or a cluster link, the ledger shows **Stands alone**.

NR-25 already draws **Sends traffic to** from graph node properties via `InventoryDiagramLoadBalancerBackendTrafficResolver` and `InventoryDiagramLoadBalancerBackendRelationshipApplier`. That path works when `backendAddressPools` (and `loadBalancingRules` for ports) are on the load balancer node. CustomerScript lists load balancers through Resource Graph but does not project pool members into properties or `network-associations.json`. Hosted `HostedAzureInventoryNetworkAssociationBuilder.AddLoadBalancerAssociations` only walks `backendIPConfigurations`, not `loadBalancerBackendAddresses`, so Standard pools that AKS uses can miss `lbToBackend` rows even on hosted collection.

AKS creates service load balancers in `properties.nodeResourceGroup` (for example `MC_rg_aks_westus`). The cluster resource lives in the customer resource group. Nothing derives `managedClusterToLoadBalancer` today. Sharing the `MC_*` resource group with a scale set is not proof the load balancer belongs to that cluster; AKS tags are.

`AzureInventoryRelationshipAssociationTypes.LbToBackend` and `VmssToManagedCluster` already exist. Add `managedClusterToLoadBalancer` only if no existing type fits.

Do not confuse this with Application Gateway (`agwToBackend`), AMPLS (NR-38), or network security perimeters (NR-37). Do not open the Kubernetes API from the collector.

## Read first

- `ArchLucid.Core/AzureExtractor/AzureInventoryLoadBalancerBackendTrafficResolver.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/InventoryDiagramLoadBalancerBackendRelationshipApplier.cs` (NR-25)
- `ArchLucid.Application/InfraEvidence/AzureInventoryVmssToManagedClusterEdgeMapper.cs` (**Node pool**)
- `ArchLucid.Integrations.AzureExtractor/HostedAzureInventoryNetworkAssociationBuilder.cs` (`AddLoadBalancerAssociations`)
- `ArchLucid.Integrations.AzureExtractor/HostedAzureInventoryResourcePropertyExpander.cs` (load balancer arrays)
- `scripts/azure/ArchLucid.ResourceGraph.RelationshipQueries.helpers.ps1` (`Get-ArchLucidArgNetworkAssociationQuerySpecs`, switch body)
- `scripts/azure/ArchLucid.SecurityInventory.helpers.ps1` (managed cluster `nodeResourceGroup`, companion association rows)
- `ArchLucid.Core/AzureExtractor/InventoryDiagramIndirectRelationshipClassifier.cs`
- `ArchLucid.Core/AzureExtractor/InventoryDiagramDataFlowTraversalHopClassifier.cs`

## What to build

### A. CustomerScript load balancer properties and `lbToBackend`

1. Add one Resource Graph query spec `loadBalancer` for `microsoft.network/loadbalancers`. Project `id`, `tags`, `backendAddressPools = properties.backendAddressPools`, and `loadBalancingRules = properties.loadBalancingRules`. Reuse the existing paging helper.
2. In the association query switch, add a handler that:
   - Serializes `backendAddressPools` and `loadBalancingRules` onto the matching load balancer resource in the inventory payload (or a documented companion property bag keyed by resource id) so ingest copies them onto the graph node the same way hosted expander does.
   - Walks each pool’s `backendIPConfigurations` and each `loadBalancerBackendAddresses` entry’s `properties.networkInterfaceIPConfiguration.id` (string or object). Resolve each ip configuration id to a parent ARM id with the same rules as `AzureInventoryPublicIpConfigurationParentResolver` / hosted `TryResolveAssociatedResourceFromIpConfiguration`. Emit `lbToBackend` from load balancer id to resolved parent id when both ids are non-empty. Deduplicate rows.
3. Reuse association type `lbToBackend` and inference source `inventory-lb-backend`. Do not invent a parallel type for CustomerScript.

### B. Hosted parity

4. Update `AddLoadBalancerAssociations` to emit `lbToBackend` for `loadBalancerBackendAddresses` nested NIC ip configurations, matching `AzureInventoryLoadBalancerBackendTrafficResolver.AddIpConfigurationTargets` behavior.
5. Add `loadBalancingRules` to hosted load balancer property expansion so NR-25 can attach rule ports on hosted snapshots.

### C. Managed cluster to Kubernetes service load balancer

6. Add association type `managedClusterToLoadBalancer`. Evidence label **Current**. Diagram label **Exposes services through**. Inference source `inventory-aks-service-lb`. Direction: managed cluster → load balancer.
7. CustomerScript: after managed clusters and load balancers are known, for each cluster with non-empty `nodeResourceGroup`, consider each load balancer whose resource group name matches that value (case-insensitive). Link only when `tags` prove Kubernetes ownership of that cluster, using at least:
   - `kubernetes.io/cluster-name` equal to the cluster’s ARM **name** segment, or
   - `kubernetes.io/cluster-name` equal to the full normalized cluster resource id, or
   - `aks-managed-cluster-name` equal to the cluster name when present on the load balancer tags.
   Do not link when only the resource group matches.
8. Hosted: derive the same rows from stored cluster `nodeResourceGroup` and load balancer tags in `HostedAzureInventoryNetworkAssociationBuilder` or a small dedicated helper called from it.
9. Materialize stored rows through the existing security edge / relationship pipeline. Add `InventoryDiagramKubernetesServiceLoadBalancerRelationshipApplier` (or extend an existing applier) to label **Exposes services through** on edges whose inference source is `inventory-aks-service-lb`. Keep `managedClusterToLoadBalancer` out of `InventoryDiagramDataFlowTraversalHopClassifier`.
10. When a load balancer has stored backends and NR-25 resolves a visible target, the load balancer is no longer **Stands alone** even if the cluster link is missing. When both cluster link and NR-25 backends exist, both edge types may appear.

Do not draw **Exposes services through** because the load balancer name contains `kubernetes`. Do not link a load balancer in the application resource group to the cluster solely because it fronts the same subscription. Do not collect load balancer metrics or flow logs. Do not change NR-37 or NR-38 behavior.

Bump `scriptVersion` and `collectorVersion` in `Get-ArchLucidAzurePackage.ps1` and `Get-SecureNowAzurePackage.ps1` by one patch from the version already in those files.

## Tests

1. A Standard load balancer pool with only `loadBalancerBackendAddresses[].properties.networkInterfaceIPConfiguration` pointing at a scale set NIC emits one `lbToBackend` row to that scale set (or VM parent). CustomerScript ARG handler and hosted builder each have at least one test.
2. A load balancer resource in the ingest fixture carries serialized `backendAddressPools` and `loadBalancingRules`. `InventoryDiagramLoadBalancerBackendRelationshipApplier` draws **Sends traffic to** to a visible VM or scale set without requiring a second manual property injection in the test.
3. A cluster with `nodeResourceGroup = MC_rg_aks` and a load balancer in resource group `MC_rg_aks` tagged `kubernetes.io/cluster-name = myaks` links to `/.../managedClusters/myaks`. One solid **Exposes services through** edge. A second load balancer in the same group without the tag does not link.
4. A load balancer in `MC_rg_aks` with the tag but no backends and no cluster in the snapshot does not invent a cluster edge.
5. `managedClusterToLoadBalancer` is not a data-flow hop.

Use Resource Graph association Pester tests, one hosted association builder test, one `AzureInventoryNetworkAssociationEdgeMapper` or materializer test if touched, and one diagram applier test for **Exposes services through**. Do not call Azure. Do not require the `ArchitectureDiagramViewer` zoom suite to pass.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Compile the projects you edit with `.\scripts\ci\agent-compile-check.ps1` and run the new tests.
- Do not commit unless the user names the branch in that request.
- Do not write to customer Azure.
- Do not re-run NR-01 through NR-38 or SB-01 through SB-06 as greenfield.

## Done when

After the next collection, an AKS-owned service load balancer in the cluster node resource group has a solid **Exposes services through** line from the managed cluster when tags match. The same load balancer shows **Sends traffic to** toward each visible backend when pools are stored. CustomerScript and hosted snapshots behave the same for Standard `loadBalancerBackendAddresses` pools. Resources without stored proof stay **Stands alone**.
