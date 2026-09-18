# AX-DE-15 — Network leftover type lists

**Wave:** AX-DE. **Depends on:** AX-DE-01. Parallel with AX-DE-14. Extends IE-RF-03/06 — do **not** re-run IE-RF-01–11 as greenfield.

Follow [`.cursor/prompts/azure-extractor-diagram-enrichment-00-index.md`](azure-extractor-diagram-enrichment-00-index.md) global constraints.

## Goal

Add type-scoped ARM lists and association rows for NAT Gateway, Azure Firewall, VMSS, Front Door / AFD, Container Apps environment, and private-endpoint DNS zone groups.

## Why

IE-RF type lists cover NIC, VNet, NSG, PE, VM, AGW, LB, Private DNS, App Service. Gold-standard pictures still need NAT, Firewall, Front Door origins, Container Apps, VMSS NICs, and PE→DNS.

## Context

- `HostedAzureArmNetworkTypeListDescriptors`
- `HostedAzureInventoryNetworkAssociationBuilder`
- `Get-ArchLucidArgNetworkAssociationQuerySpecs`
- Firewall policies are currently NeverShow — **keep omitting policy nodes**; still collect firewall→subnet / public IP

## What to build

1. Descriptors (GET list, not per-id): NAT Gateways, azureFirewalls, VMSS, `Microsoft.Cdn/profiles` (AFD) and/or classic `Microsoft.Network/frontDoors` (whichever ARG shows in fixtures), `Microsoft.App/containerApps`, `Microsoft.App/managedEnvironments`.
2. Associations from nested properties:
   - `natGatewayToSubnet` / public IP
   - `firewallToSubnet` (+ firewall public IP if present)
   - VMSS → NIC or subnet (all IP configs, IE-RF-04 cardinality)
   - Front Door / AFD origin group → host or ARM id (`frontDoorToOrigin`)
   - `containerAppToEnv`; env → subnet if VNet injected
   - PE `dnsZoneGroups` → `peDnsZoneGroup`
3. ARG projections on Tier 1 for the same edges when properties are nested.
4. Tests: one fixture per associationType; fail-soft empty list; NextLink guard.

## Acceptance criteria

- Do not treat `dependsOn` as edges.
- Do not AlwaysDispose Azure Firewall (already backbone). NAT Gateway should be visible on Network.

## Constraints

- Compile Integrations + Application network association tests + Pester ARG.
- Do not reopen IE-ND empty-canvas prompts.

## Done when

Network mermaid golden (or a new fixture) includes NAT→subnet and PE→private DNS zone when those ARM facts exist.
