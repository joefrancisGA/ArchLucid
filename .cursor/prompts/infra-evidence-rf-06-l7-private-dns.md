# IE-RF-06 — App Gateway, load balancer, Private DNS, App Service subnet

Follow [`.cursor/prompts/infra-evidence-relationship-first-00-index.md`](infra-evidence-relationship-first-00-index.md) global constraints. **Depends on IE-RF-01**. Collection via ARG projections and/or hosted type lists (extend **IE-RF-02** / **IE-RF-03** helpers; do not add a new client).

## Goal

Emit catalog association rows for L7 / DNS / PaaS subnet integration that ARM `dependsOn` never shows:

- `agwToBackend`
- `lbToBackend`
- `privateDnsVnetLink`
- `appServiceToSubnet`
- extra PE hops not finished in **IE-RF-04** if still missing (`peToNic`, `peToSubnet`)

## Why

Executive/Network diagrams currently cannot show App Gateway → backend, LB membership, private DNS hub-spoke, or App Service VNet integration. Those are property references, not `dependsOn`.

## Context

- IE-RF-01 catalog
- Hosted client type-list pattern from **IE-RF-03**
- ARG helper pattern from **IE-RF-02**
- Never collect Key Vault secret values (plane)

## What to build

1. **Application Gateway:** list/project `Microsoft.Network/applicationGateways`. For each backend pool member with a `id` (NIC, VMSS IP config, or backend address ARM id), emit `agwToBackend`. FQDN-only members: emit the row only if `toResourceId` can be a **stable non-ARM node id** you document **or skip** with a completeness warning `agw-backend-fqdn-unresolved`. Do not mint fake ARM ids.
2. **Load balancer:** `Microsoft.Network/loadBalancers` backend address pools → parent NIC / IP config resource id (`lbToBackend`). Strip `/ipConfigurations/` the same way public IP association already does.
3. **Private DNS:** `Microsoft.Network/privateDnsZones/virtualNetworkLinks` (or zone `properties` links) → `privateDnsVnetLink`.
4. **App Service / Function:** `properties.virtualNetworkSubnetId` (and slots if present on the same resource payload) → `appServiceToSubnet`.
5. Hosted: add type lists for App Gateways, load balancers, and private DNS zone links. Still GET-only, still merge by ARM id.
6. Tests: one fixture per type; FQDN-only AGW member does not create a bogus `/subscriptions/...` id; unknown types still in `resources.json`.

## Acceptance criteria

- Provenance remains ObservedFact only when both ends are ARM ids present (or the from resource is inventoried and the to id is a well-formed ARM id).
- Fail soft per class with warnings.

## Constraints

- Do not add Flow Logs.
- Do not implement display VM→VNet (**IE-RF-08**).
- Compile: `ArchLucid.Integrations.AzureExtractor.Tests` + Pester as touched.

## Done when

A mixed fixture (AGW+LB+private DNS link+App Service subnet) writes four new association types without a second collector.
