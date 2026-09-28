# EX-PE-01 — Collect private-endpoint placement from Resource Graph

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement a new EX-PE in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/AZURE_PRIVATE_ENDPOINT_HIDDEN_PLACEMENT_LUNA_PROMPTS.md`

**Depends on:** EX-SP-01 and EX-SP-02. `ConvertFrom-ArchLucidArgJsonArray` already accepts `[object]`, and `Invoke-ArchLucidResourceGraphPagedAssociationQuery` already pages the virtual machine, network interface, and virtual network queries. If `$scriptVersion` is still `0.4.0`, stop.

## Goal

A new customer-script zip writes `peToSubnet`, `peToNic`, and `privateEndpointTarget` into `network-associations.json` from Resource Graph. The hidden private-endpoint card can then be joined to its subnet and to the Key Vault, storage account, or database it reaches. This package does not have those rows today.

## Why

Script `0.4.1` writes `nicToSubnet` for a private-endpoint network interface. On `Hmd_HI_HAP_Non_Prod` that includes `pendp-kv-aep-hi-dev` to `vnet-aep-hi-test-wus-001/subnets/snet-computeaep-hi-test-wus-001`. Full subscription hides network interface cards, so that row has no visible owner.

`Get-ArchLucidArgNetworkAssociationQuerySpecs` queries virtual machines, network interfaces, and virtual networks. It does not query `microsoft.network/privateendpoints`. `Get-ArchLucidAzureNetworkAssociationCompanionRows` can emit `peToSubnet`, `peToNic`, and `privateEndpointTarget`, and it reads `subnet.id`, `networkInterfaces*`, and `privateLinkServiceId*` from resource properties. `New-ArchLucidCollectedResourceGraphRecord` stores `properties = @{}`, so that companion path adds nothing on the Resource Graph inventory.

Re-running script `0.4.1` keeps the same gap.

## Read first

- `scripts/azure/ArchLucid.ResourceGraph.RelationshipQueries.helpers.ps1` (`ConvertFrom-ArchLucidArgJsonArray`, `Get-ArchLucidArgNestedProperty`, `Get-ArchLucidArgNetworkAssociationQuerySpecs`, `Invoke-ArchLucidResourceGraphPagedAssociationQuery`, `Get-ArchLucidAzureNetworkAssociationRowsViaResourceGraph`)
- `scripts/azure/ArchLucid.SecurityInventory.helpers.ps1` (`Add-ArchLucidNetworkAssociationRow`, the private-endpoint block in `Get-ArchLucidAzureNetworkAssociationCompanionRows`)
- `scripts/azure/ArchLucid.ResourceGraph.helpers.ps1` (`New-ArchLucidCollectedResourceGraphRecord`)
- `scripts/azure/Get-SecureNowAzurePackage.ps1` (the `$scriptVersion` constant)
- `scripts/azure/Get-ArchLucidAzurePackage.ps1` (the same constant)
- `scripts/azure/tests/ArchLucid.ResourceGraph.RelationshipQueries.helpers.Tests.ps1`
- `ArchLucid.Core/AzureExtractor/AzureInventoryRelationshipAssociationTypes.cs` (`PeToSubnet`, `PeToNic`, `PrivateEndpointTarget`)

## What to build

Add a fourth query spec, kind `privateEndpoint`, and process it through `Invoke-ArchLucidResourceGraphPagedAssociationQuery`.

```kusto
Resources
| where type =~ 'microsoft.network/privateendpoints'
| project id, type,
    subnetId = tostring(properties.subnet.id),
    networkInterfaces = properties.networkInterfaces,
    privateLinkServiceConnections = properties.privateLinkServiceConnections,
    manualPrivateLinkServiceConnections = properties.manualPrivateLinkServiceConnections
```

Apply the same resource-group filter the other specs use. Keep `-First 1000` and the skip-token loop. A failed page keeps rows already accepted and warns with the query kind. Do not rethrow.

Add `Add-ArchLucidArgNetworkAssociationRowsFromPrivateEndpointRecord`. Pass `networkInterfaces`, `privateLinkServiceConnections`, and `manualPrivateLinkServiceConnections` through `ConvertFrom-ArchLucidArgJsonArray` without `"$( ... )"`. Read nested fields with `Get-ArchLucidArgNestedProperty`.

From the private-endpoint resource id, emit the existing association types only:

- `peToSubnet` when `subnetId` is a non-empty ARM id. `toResourceId` is that subnet id.
- `peToNic` for each `networkInterfaces` item whose `id` is a non-empty ARM id.
- `privateEndpointTarget` for each `privateLinkServiceConnections` and `manualPrivateLinkServiceConnections` item whose `properties.privateLinkServiceId` is a non-empty ARM id. `toResourceId` is that service id.

Leave `vmToNic`, `nicToSubnet`, and the other existing types alone. Do not add an association type. Do not copy ARM property bags into `resources.json`. Do not change the inventory `project` list.

Bump `$scriptVersion` from `0.4.1` to `0.4.2` in both customer scripts. Do not rewrite fixtures that embed `"0.4.0"` or `"0.4.1"` as sample zip content.

## Tests

Extend `scripts/azure/tests/ArchLucid.ResourceGraph.RelationshipQueries.helpers.Tests.ps1`.

1. A private endpoint whose `subnetId` is a subnet ARM id emits one `peToSubnet` row. A `networkInterfaces` object array emits `peToNic`. A `privateLinkServiceConnections` object array whose `properties.privateLinkServiceId` is a Key Vault ARM id emits `privateEndpointTarget`.
2. The same three facts, passed as JSON strings, emit the same rows.
3. `manualPrivateLinkServiceConnections` emits `privateEndpointTarget` the same way.
4. `$null` and `'   '` emit no private-endpoint rows.
5. Two fake pages both contribute a `privateEndpointTarget` row. A failure on page two keeps the row from page one and emits a warning.

Do not add a live Azure test.

## Acceptance criteria

- Resource Graph object arrays produce `peToSubnet`, `peToNic`, and `privateEndpointTarget`.
- JSON strings of those same fields still parse.
- `resources.json` stays a slim id, name, type, location, sku, and tags list.
- Both customer scripts stamp `scriptVersion` `0.4.2`.
- A failed later page keeps the private-endpoint rows already collected.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Run `pwsh -NoProfile -Command "Invoke-Pester -Strict -EnableExit -Path 'scripts/azure/tests/ArchLucid.ResourceGraph.RelationshipQueries.helpers.Tests.ps1'"`.
- Do not edit the diagram renderer, the peel filter, the hidden-hop composer, or the hosted `hosted-1.0.0` zip builder.
- Do not commit. Do not edit unrelated dirty files.

## Done when

A Pester case that passes live-shaped Resource Graph objects writes `peToSubnet`, `peToNic`, and `privateEndpointTarget` from the private endpoint, and a failed second page keeps the first page's target row.
