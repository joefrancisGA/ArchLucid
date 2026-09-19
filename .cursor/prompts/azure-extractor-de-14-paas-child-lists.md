# AX-DE-14 — PaaS child lists and identity flatten

**Wave:** AX-DE. **Depends on:** AX-DE-01. Parallel with AX-DE-15.

Follow [`.cursor/prompts/azure-extractor-diagram-enrichment-00-index.md`](azure-extractor-diagram-enrichment-00-index.md) global constraints.

## Goal

Type-scoped ARM lists (and/or ARG projections) so diagrams see SQL databases, Cosmos databases (names), storage blob containers / ADLS filesystems, AKS `networkProfile` / agent pools, and **identity.principalId** on compute — without GET-every-id.

## Why

Hosted `/resources` and ARG index drop nested properties. Data Architecture is a repository catalog; a SQL **server** without databases is incomplete. AX-DE-03 needs principalId on App Service/VM/AKS.

## Context

- `HostedAzureArmNetworkTypeListDescriptors` — add PaaS descriptors in a **new** file (do not dump PaaS into the network descriptor class)
- ARG helper currently `project id, name, type, location, tags, sku, resourceGroup` — add **typed** relationship queries (IE-RF-02 style), not `project properties`

## What to build

1. SQL: list `Microsoft.Sql/servers/databases` (and MI databases if the API is a child list). Associate server→database CONTAINS_RESOURCE ObservedFact.
2. Cosmos: list SQL databases under the account (names only). Skip connection strings / keys.
3. Storage: list blob containers and ADLS filesystems (names). Cap count if needed (e.g. 200 per account) with warning `storage-children-truncated`.
4. AKS: type-scoped GET `Microsoft.ContainerService/managedClusters` so `properties.networkProfile` (vnet/subnet, dns) and `agentPoolProfiles` exist in `resources.json` properties. Map cluster→subnet if subnet id present.
5. Identity: ensure expander copies `identity` JSON for Web/sites, VM, VMSS, Container Apps, ADF, AKS, Function-as-sites — not only when other property extractors run. AX-DE-03 consumes this.
6. Tests: SQL server with two databases; storage with containers; AKS subnet association; App Service identity principalId flattened; 403 on child list fail-soft.

## Acceptance criteria

- No full property dump of every type.
- Unknown types still not dropped (IE-02).

## Constraints

- Compile Integrations.AzureExtractor.Tests + Pester ARG tests if you add queries.
- Heartbeat >15s.

## Done when

A snapshot with a SQL server includes database child nodes/edges, and an App Service identity blob includes `principalId` for AX-DE-03.
