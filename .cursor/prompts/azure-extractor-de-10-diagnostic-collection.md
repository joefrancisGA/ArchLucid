# AX-DE-10 — Diagnostic settings collection expansion

**Wave:** AX-DE. **Depends on:** AX-DE-02 (row shape + mapper).

Follow [`.cursor/prompts/azure-extractor-diagram-enrichment-00-index.md`](azure-extractor-diagram-enrichment-00-index.md) global constraints.

## Goal

Collect diagnostic settings for a **wider but still bounded** set of path-relevant types, and persist Log Analytics **and** Storage **and** Event Hub destinations.

## Why

`Test-ArchLucidPathRelevantDiagnosticResourceType` / `HostedAzureInventoryPathRelevantDiagnosticResourceFilter` only include Storage, Key Vault, NSG, SQL. Rows only keep `workspaceId`. Event Hub capture of control-plane logs is a real architecture edge.

## Context

- `Get-ArchLucidAzureDiagnosticSettingCompanionRows`
- `GetOnlyHostedAzureArmReadClient` diagnostic list
- ARM: `GET {resourceId}/providers/Microsoft.Insights/diagnosticSettings?api-version=2021-05-01-preview`

## What to build

1. Expand allow-list (exact types, not `Contains`): existing four plus `Microsoft.DataFactory/factories`, `Microsoft.Synapse/workspaces`, `Microsoft.KeyVault/vaults` (already), `Microsoft.EventHub/namespaces`, `Microsoft.ServiceBus/namespaces`, `Microsoft.Web/sites`, `Microsoft.ContainerService/managedClusters`, `Microsoft.Network/applicationGateways`, `Microsoft.Network/azureFirewalls`, `Microsoft.DocumentDB/databaseAccounts`. Comment why the list is bounded (O(resources) GET).
2. Parse destinations: `workspaceId`, `storageAccountId`, `eventHubAuthorizationRuleId` (store as-is plus best-effort parent Event Hub/namespace ARM id if inventoried).
3. Fail-soft per resource. Completeness `diagnostic-settings-partial` if some 403.
4. Hosted + PowerShell parity. Tests for each dest kind; types not on the allow-list are not called.
5. Do not GET diagnostics for every ARM type in the subscription.

## Acceptance criteria

- Still Reader. No log **contents**.
- Mapper from AX-DE-02 consumes the new fields.

## Constraints

- Compile Integrations.AzureExtractor.Tests + Pester diagnostic describes.
- Heartbeat if fan-out tests are slow.

## Done when

An App Service diagnostic setting to Event Hub produces **Sends diagnostics to** the hub/namespace, not only Log Analytics.
