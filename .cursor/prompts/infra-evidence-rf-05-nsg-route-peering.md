# IE-RF-05 — NSG, route table, and VNet peering associations

Follow [`.cursor/prompts/infra-evidence-relationship-first-00-index.md`](infra-evidence-relationship-first-00-index.md) global constraints. **Depends on IE-RF-01** and ARG/hosted property availability (**IE-RF-02** / **IE-RF-03**).

## Goal

Emit ObservedFact association rows for:

- NIC → NSG (`nicToNsg`)
- subnet → NSG (`subnetToNsg`)
- subnet → route table (`subnetToRouteTable`)
- VNet → remote VNet (`vnetPeering`)

Do **not** treat `nsgAllowRule` Storage heuristics as ObservedFact.

## Why

These relationships are in ARM property bags (`networkSecurityGroup.id` on NIC/subnet, `routeTable.id` on subnet, `virtualNetworkPeerings[].properties.remoteVirtualNetwork.id`) but never become diagram edges. SA-05 intended reachability then cannot cite them.

## Context

- VNet `properties.subnets` JSON already collected when present
- `HostedAzureInventoryNsgAllowRuleBuilder` (heuristic — leave provenance)
- IE-RF-01 catalog
- `GraphEdgeTypes.AppliesTo` / `ConnectsTo` mapping is **IE-RF-07**; this prompt is ZIP + builders

## What to build

1. From NIC: `properties.networkSecurityGroup.id` → `nicToNsg`.
2. From each VNet subnet object: `properties.networkSecurityGroup.id` → `subnetToNsg`; `properties.routeTable.id` → `subnetToRouteTable`.
3. From each peering: local VNet id → `remoteVirtualNetwork.id` as `vnetPeering`. Skip peerings with empty remote id. If peering state is present, you may put it on `ruleName` **only if** the column stays optional and RF-07 ignores unknown `ruleName` for this type — prefer **not** overloading `ruleName`; omit state until a typed column exists (do not add ZIP columns in this prompt).
4. Do not infer “all subnets in a VNet can talk.”
5. Do not create `nsgAllowRule` rows from these associations.
6. Tests: subnet with NSG+UDR → two rows; NIC with NSG → `nicToNsg`; two peerings → two `vnetPeering`; peering missing remote id → skip.

## Acceptance criteria

- Builders are shared conceptually between PowerShell and hosted (same type strings).
- Completeness: missing NSG id is skip, not allow-all.

## Constraints

- Do not call `effectiveNetworkSecurityGroups` (**IE-RF-10**).
- Compile: `ArchLucid.Integrations.AzureExtractor.Tests` + Pester SecurityInventory helpers.

## Done when

A VNet fixture with subnet NSG + route table + one peering produces four distinct catalog types (plus existing nicToSubnet if NIC present).
