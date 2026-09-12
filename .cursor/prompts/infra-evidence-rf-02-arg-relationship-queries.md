# IE-RF-02 — Tier 1 ARG relationship projections

Follow [`.cursor/prompts/infra-evidence-relationship-first-00-index.md`](infra-evidence-relationship-first-00-index.md) global constraints. **Depends on IE-RF-01** (use catalog constants / strings).

## Goal

Replace “one ARG query that `project properties`” as the **relationship** source. Keep a cheap ARG **index** for id/type/name/location/tags/sku. Add typed KQL projections that emit `network-associations.json` rows (and fill the flatten keys later prompts need).

## Why

`Resources | project … properties` truncates. Diagrams then miss VM→NIC, extra IP configs, peerings, and NSG associations. ARG is already the Tier 1 primary path in `Get-ArchLucidAzureResourcesViaResourceGraph`.

## Context

- `scripts/azure/ArchLucid.ResourceGraph.helpers.ps1`
- `scripts/azure/ArchLucid.SecurityInventory.helpers.ps1`
- `scripts/azure/Get-ArchLucidAzurePackage.ps1` / `Get-SecureNowAzurePackage.ps1` (shared helpers; branded script must keep emitting the same sibling files)
- `scripts/azure/tests/ArchLucid.SecurityInventory.helpers.Tests.ps1`
- IE-RF-01 catalog

## What to build

1. Keep an inventory index query that does **not** rely on the full `properties` blob for topology:
   - `Resources | project id, name, type, location, tags, sku` (plus `resourceGroup` if already consumed).
   - Unknown types still land in `resources.json` (IE-03 invariant).
2. Add typed relationship queries (own helper functions, own file if the ResourceGraph helper exceeds a clear split). Use `mv-expand` / `tostring(...)` on JSON paths — **do not** `project properties` as the edge source. Minimum queries this prompt:

   - VM → NIC: `microsoft.compute/virtualmachines` → `properties.networkProfile.networkInterfaces`
   - NIC → subnet / public IP / NSG: `microsoft.network/networkinterfaces` (all `ipConfigurations`, not `[0]`)
   - VNet peerings: `microsoft.network/virtualnetworks` → `properties.virtualNetworkPeerings`
   - Subnet NSG + route table from VNet `properties.subnets`

3. Merge projected rows into `network-associations.json` via existing `Add-ArchLucidNetworkAssociationRow` (or a sibling that uses IE-RF-01 type names). Deduplicate with the current `$seen` key.
4. Still populate flattened resource properties used today (`ipConfiguration.subnet.id`, `privateLinkServiceId`, `subnets`, `securityRules`) **from the typed projections or a targeted ARG project of those paths**, so RF-04/05 are not blocked if a properties blob is truncated.
5. Fail soft: if a relationship query throws, keep the index, write a telemetry warning (`Add-ArchLucidExtractorWarning`) named per class (`arg-vm-nic`, `arg-nic-subnet`, …). Do not fail the ZIP.
6. Pester: mock `Search-AzGraph` pages **or** unit-test a pure parser that maps ARG row shapes → association rows (prefer parser in `.helpers.ps1` + tests without live Azure). Cases: two IP configs on one NIC → two `nicToSubnet` rows; VM with two NICs → two `vmToNic`; empty peering array → no `vnetPeering`.
7. Do **not** implement hosted lists (**IE-RF-03**).

## Acceptance criteria

- Still one collector family (same script).
- Reader-only. No `Export-AzResourceGroup`.
- Get-AzResource fallback still works when ARG module is missing (may remain property-poor; RF-09 will warn).

## Constraints

- Do not GET each resource id.
- Do not change Mermaid compilers.
- Tests: `pwsh -NoProfile -Command "Invoke-Pester -Strict -EnableExit -Path 'scripts/azure/tests/ArchLucid.SecurityInventory.helpers.Tests.ps1'"` plus any new ResourceGraph Pester file you add.
- Heartbeat on Pester >15s.

## Done when

A fixture ARG payload with VM+two NICs+subnet+peering produces catalog association rows without requiring the full ARM `properties` bag on the index query.
