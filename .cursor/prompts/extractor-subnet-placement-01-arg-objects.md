# EX-SP-01 — Keep Resource Graph subnet placement objects

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement a new EX-SP in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/AZURE_EXTRACTOR_SUBNET_PLACEMENT_LUNA_PROMPTS.md`

**Depends on:** nothing. Do not start EX-SP-02 in this session.

## Goal

A new customer-script zip writes `nicToSubnet` and `vmToNic` rows into `network-associations.json` when Resource Graph returns those arrays as objects. The virtual-network diagram box is built from those rows. This package does not have them today.

## Why

`securenow-azure-package_09262026.zip` is script `0.4.0`, `captureMethod` `CustomerScript`, subscription `Hmd_HI_HAP_Non_Prod`, collected 2026-09-26. It lists 11 virtual networks, 100 network interfaces, and 22 virtual machines. Every `resources.json` `properties` object is `{}`. `network-associations.json` has 4 `nicToNsg` rows and 7 `avdSessionHostToVm` rows. It has no `nicToSubnet`, no `vmToNic`, no `subnetToNsg`, and no `vnetPeering`.

That shape matches the collector. `Get-ArchLucidAzureResourcesViaResourceGraph` projects `id, name, type, location, tags, sku, resourceGroup` and `New-ArchLucidCollectedResourceGraphRecord` stores `properties = @{}`. The placement facts are supposed to come from the second query in `Get-ArchLucidAzureNetworkAssociationRowsViaResourceGraph`.

`ConvertFrom-ArchLucidArgJsonArray` takes a `[string]`. Every caller passes `"$( $value )"`. A JSON string still parses. A Resource Graph object or array stringifies to a type name, `ConvertFrom-Json` fails, and the function returns `@()`. `networkSecurityGroup.id` is already a string, so `nicToNsg` survives and `nicToSubnet` does not. The same drop hits VM network interfaces, subnet arrays, and peerings.

Re-running script `0.4.0` writes the same gap. Importing the existing zip again does not add the rows.

## Read first

- `scripts/azure/ArchLucid.ResourceGraph.RelationshipQueries.helpers.ps1`
- `scripts/azure/ArchLucid.ResourceGraph.helpers.ps1` (`New-ArchLucidCollectedResourceGraphRecord`)
- `scripts/azure/ArchLucid.SecurityInventory.helpers.ps1` (`Add-ArchLucidNetworkAssociationRow`, `Get-ArchLucidAzureNetworkAssociationCompanionRows`)
- `scripts/azure/Get-SecureNowAzurePackage.ps1` (the `$scriptVersion` constant and the call to `Get-ArchLucidAzureNetworkAssociationRowsViaResourceGraph`)
- `scripts/azure/Get-ArchLucidAzurePackage.ps1` (the same constant and the same call)
- `scripts/azure/tests/ArchLucid.ResourceGraph.RelationshipQueries.helpers.Tests.ps1`

## What to build

Change `ConvertFrom-ArchLucidArgJsonArray` so its parameter is `[object]`.

- `$null`, an empty string, or a whitespace string returns `@()`.
- A string is parsed with `ConvertFrom-Json`. A parse failure returns `@()`.
- A value that is already a collection is enumerated. Do not stringify it first. Skip `$null` items.
- A single object is returned as a one-item array.

Stop wrapping the argument in `"$( ... )"` in `Add-ArchLucidArgNetworkAssociationRowsFromVmRecord`, `Add-ArchLucidArgNetworkAssociationRowsFromNicRecord`, and `Add-ArchLucidArgNetworkAssociationRowsFromVNetRecord`. Pass `networkInterfaces`, `ipConfigurations`, `subnets`, and `peerings` through unchanged.

Leave the association types as they are: `vmToNic`, `nicToSubnet`, `publicIpToNic`, `nicToNsg`, `subnetToNsg`, `subnetToRouteTable`, `vnetPeering`. Do not add a new association type. Do not copy full ARM property bags into `resources.json`. Do not change the inventory `project` list.

Bump `$scriptVersion` from `0.4.0` to `0.4.1` in both package scripts so the next manifest shows the new collector. Do not rewrite test fixtures that embed `"0.4.0"` as sample zip content.

## Tests

Extend `scripts/azure/tests/ArchLucid.ResourceGraph.RelationshipQueries.helpers.Tests.ps1`.

1. A JSON string of NIC `ipConfigurations` still emits one `nicToSubnet` row whose `toResourceId` is the subnet ARM id, and one `publicIpToNic` row when a public IP id is present. A string `networkSecurityGroupId` still emits `nicToNsg`.
2. The same NIC facts, passed as a PowerShell object array rather than a JSON string, emit the same `nicToSubnet` and `publicIpToNic` rows.
3. A VM `networkProfile.networkInterfaces` object array emits `vmToNic`. The existing JSON-string peering case still emits `vnetPeering`.
4. A VNet `subnets` object array with a nested network security group id emits `subnetToNsg`.
5. `$null` and `'   '` still emit no rows.

## Acceptance criteria

- Object arrays from Resource Graph produce `nicToSubnet` and `vmToNic` without a JSON round-trip.
- Existing JSON-string rows still parse.
- `resources.json` stays a slim id, name, type, location, sku, and tags list.
- Both customer scripts stamp `scriptVersion` `0.4.1`.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Run `pwsh -NoProfile -Command "Invoke-Pester -Strict -EnableExit -Path 'scripts/azure/tests/ArchLucid.ResourceGraph.RelationshipQueries.helpers.Tests.ps1'"`.
- Do not edit the diagram renderer, the peel filter, or the hosted `hosted-1.0.0` zip builder.
- Do not commit. Do not edit unrelated dirty files.

## Done when

A Pester case that passes live-shaped Resource Graph objects, not JSON strings, writes `nicToSubnet` from the NIC and `vmToNic` from the virtual machine.
