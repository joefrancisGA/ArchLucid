# NR-39 — AKS service load balancers (Composer implementation)

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier model.

**Branch:** `cursor/nr-39-aks-service-lb-4156` from `origin/master` (NR-37 and NR-38 are on trunk; do not stack on open NR branches unless rebasing).

**Spec (authoritative):** [`.cursor/prompts/node-relationship-39-kubernetes-service-load-balancer.md`](node-relationship-39-kubernetes-service-load-balancer.md) — implement sections A–C and tests there without reopening NR-01–NR-38.

**Record:** `docs/architecture/INVENTORY_DIAGRAM_NODE_RELATIONSHIP_LUNA_PROMPTS.md` (NR-39 row).

## Goal

1. **CustomerScript parity** — Resource Graph projects load balancer `backendAddressPools` and `loadBalancingRules`; emit `lbToBackend` for `backendIPConfigurations` and Standard `loadBalancerBackendAddresses` NIC ip configurations.
2. **Hosted parity** — `HostedAzureInventoryNetworkAssociationBuilder` walks `loadBalancerBackendAddresses`; expander stores `loadBalancingRules`.
3. **Cluster → SLB** — `managedClusterToLoadBalancer` when `nodeResourceGroup` and Kubernetes ownership tags match; diagram label **Exposes services through** (`inventory-aks-service-lb`). NR-25 **Sends traffic to** still comes from stored backends.

## Why

AKS Standard service LBs often have no `lbToBackend` rows on CustomerScript snapshots and miss `loadBalancerBackendAddresses` on hosted builds. The cluster card does not link to the tagged SLB in `MC_*` node resource groups, so both show **Stands alone** despite real wiring.

## Read first

- Full NR-39 spec (this session’s source of truth for file list and acceptance tests)
- `ArchLucid.Core/AzureExtractor/AzureInventoryLoadBalancerBackendTrafficResolver.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/InventoryDiagramLoadBalancerBackendRelationshipApplier.cs`
- `ArchLucid.Integrations.AzureExtractor/HostedAzureInventoryNetworkAssociationBuilder.cs` (`AddLoadBalancerAssociations`)
- `scripts/azure/ArchLucid.ResourceGraph.RelationshipQueries.helpers.ps1`

## Constraints

- Before editing a tracked file: `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'` (stop on exit code 2).
- Compile touched projects: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath '<test-project>.csproj'`.
- Run new unit/Pester tests you add; do not call Azure.
- Do not commit unless the user names the branch in that request.
- Bump `scriptVersion` / `collectorVersion` in `Get-ArchLucidAzurePackage.ps1` and `Get-SecureNowAzurePackage.ps1` by one patch when association or ARG behavior changes (per NR-39 spec).

## Done when

NR-39 **Tests** 1–5 in the Luna spec pass; CustomerScript and hosted fixtures both produce `lbToBackend` for Standard pools; a tagged SLB in `nodeResourceGroup` gets **Exposes services through** from the managed cluster; backends visible via NR-25 get **Sends traffic to**; no tag-only or RG-only guesses.
