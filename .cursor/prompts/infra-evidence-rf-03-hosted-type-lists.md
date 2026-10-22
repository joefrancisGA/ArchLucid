# IE-RF-03 — Hosted type-scoped ARM list GETs

Follow [`.cursor/prompts/infra-evidence-relationship-first-00-index.md`](infra-evidence-relationship-first-00-index.md) global constraints. **Depends on IE-RF-01**. Parallel with **IE-RF-02**.

## Goal

Hosted collection must obtain nested relationship properties without `GET` per resource id. Extend the **existing** `GetOnlyHostedAzureArmReadClient` with type-scoped provider list GETs, then reuse/extend `HostedAzureInventoryResourcePropertyExpander` + `HostedAzureInventoryNetworkAssociationBuilder`.

## Why

`GET /subscriptions/{id}/resources` (api-version `2021-04-01`) typically returns id/type/name/location/tags/sku and **empty** `properties`. Hosted diagrams then have no NIC→subnet. Plane forbids a second ARM client.

## Context

- `ArchLucid.Integrations.AzureExtractor/GetOnlyHostedAzureArmReadClient.cs` (`ListSubscriptionResourcesAsync`)
- `HostedAzureInventoryResourcePropertyExpander.cs`
- `HostedAzureInventoryNetworkAssociationBuilder.cs`
- `HostedAzureExtractorClient.cs`
- `ArchLucid.Integrations.AzureExtractor.Tests/HostedAzureInventoryNetworkAssociationBuilderTests.cs`
- Architecture grep: `SecureNowInventoryEdgeArchitectureTests` / extractor-only `management.azure.com`

## What to build

1. After (or instead of relying on) the subscription `/resources` index, list by provider type with GET-only URLs, same pagination / nextLink / `MaxPaginationRequests` discipline. Minimum types this prompt:

   - `Microsoft.Network/networkInterfaces`
   - `Microsoft.Network/virtualNetworks`
   - `Microsoft.Network/networkSecurityGroups`
   - `Microsoft.Network/privateEndpoints`
   - `Microsoft.Compute/virtualMachines`

   Use current Network/Compute stable API versions already used in-repo if present; otherwise pick one documented GET list version and keep it in one constants file.

2. Merge list payloads **onto** the index records by normalized ARM id (fill `properties` used by the expander). Do not drop index-only unknown types.
3. Expand: all NIC `ipConfigurations` (not only first) into flatten keys **and/or** association rows. VM `networkProfile.networkInterfaces` → `vmToNic` via the network association builder (even if RF-04 also expands PowerShell — hosted must not wait).
4. Keep GET-only. No POST Cost/Policy in this prompt (already deferred on hosted).
5. Tests:
   - List JSON with two IP configs → two `nicToSubnet` rows.
   - VM with `networkInterfaces[0].id` → `vmToNic`.
   - `/resources` index row without properties + type-list fill → expander sees subnet id.
   - Pagination cap still throws/stops as today (do not infinite-loop).
   - Grep test: no new inventory client class with `management.azure.com` outside `ArchLucid.Integrations.AzureExtractor`.
6. Throttle: type lists are O(types), not O(resources). Document in a short comment on the client.

## Acceptance criteria

- Hosted ZIP still schema v2.
- Reader token only.
- Unknown ARM types from `/resources` still present.

## Constraints

- Do not add App Gateway/LB/Private DNS lists here (**IE-RF-06**).
- Do not call Network Watcher.
- Compile: `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.Integrations.AzureExtractor.Tests/ArchLucid.Integrations.AzureExtractor.Tests.csproj'`

## Done when

A hosted fixture with empty `/resources` properties plus a NIC list payload materializes `nicToSubnet` (and `vmToNic` if the VM list is present).
