# DFV-01 — Defender plan tiers

**Model:** Composer 2.5. Paste this file as the whole task. Do not implement DFV-02 in this session.

**Repo:** `c:\ArchLucid`

## Goal

Store which Microsoft Defender for Cloud plans are on for each subscription, and warn when inventory contains a resource type whose matching plan is Free.

## Why

A secure-score percentage does not say whether CSPM, servers, storage, or containers are actually licensed. Later prompts need the plan list to decide whether an empty attack-path file means "plan off" or "nothing found."

## Read first

- `ArchLucid.Integrations.AzureExtractor/GetOnlyHostedAzureArmReadClient.cs` (`ListSubscriptionDefenderSummariesAsync`)
- `ArchLucid.Integrations.AzureExtractor/HostedAzureExtractorClient.cs` (both collect paths)
- `scripts/azure/ArchLucid.SecurityInventory.helpers.ps1` (`Get-ArchLucidAzureDefenderSummaryCompanionRows`)
- `scripts/azure/Get-ArchLucidAzurePackage.ps1` and `scripts/azure/Get-SecureNowAzurePackage.ps1` (every `defender-summary.json` write)
- `ArchLucid.Persistence/Migrations/389_AzureInventoryDefenderSummaries.sql`
- `ArchLucid.Architecture.Tests/InfraEvidenceAzureInventoryDefenderSummariesDdlArchitectureTests.cs`

## What to build

Add optional ZIP entry `defender-pricings.json`.

Call `GET /subscriptions/{subscriptionId}/providers/Microsoft.Security/pricings`. Open the current Microsoft Learn page and use the latest stable `api-version`. Use a preview only when Learn has no stable version. Put that version in a const next to `SecureScoresApiVersion`.

One row per pricing name:

| Field | Rule |
|-------|------|
| `subscriptionId` | Subscription guid |
| `pricingName` | Pricing `name` (`VirtualMachines`, `SqlServers`, `AppServices`, `StorageAccounts`, `KeyVaults`, `Containers`, `Dns`, `Arm`, `CloudPosture`, `Api`, and any other name the API returns) |
| `tier` | `Free` or `Standard`, as returned |
| `extensions` | `name=true` or `name=false` pairs, semicolon-separated, max 512 characters. Drop extension configuration objects |

Compare collected rows with inventory resources already in memory. When a pricing row exists, its tier is `Free`, and at least one resource of the mapped type exists, add warning `defender-plan-off:{pricingName}`.

| Resource type prefix | Pricing name |
|----------------------|--------------|
| `Microsoft.Compute/virtualMachines` | `VirtualMachines` |
| `Microsoft.Sql/servers` | `SqlServers` |
| `Microsoft.Web/sites` | `AppServices` |
| `Microsoft.Storage/storageAccounts` | `StorageAccounts` |
| `Microsoft.KeyVault/vaults` | `KeyVaults` |
| `Microsoft.ContainerService/managedClusters` | `Containers` |
| `Microsoft.ApiManagement/service` | `Api` |

Warn only when the pricing row exists and the tier is Free. A missing pricing name is not a Free plan. Emit the same warning from the PowerShell package when both the pricing rows and the resource list are available.

Table `dbo.AzureInventoryDefenderPricings` with the fields above, plus row id, `SnapshotId`, `TenantId`, and `SourceEvidenceReference`.

## Collector contract

- Hosted read on `GetOnlyHostedAzureArmReadClient`, called from both collect paths in `HostedAzureExtractorClient`.
- Script function in `ArchLucid.SecurityInventory.helpers.ps1`, called from both package scripts beside every `defender-summary.json` write.
- Add the entry to `AzureExtractorPackageZipEntryNames.OptionalInventoryEntryNames`. Write it in `HostedAzureExtractorZipBuilder`. Read it with `ReadOptionalArray`. Leave `AzureExtractorZipSchema.CurrentVersion` at 2.
- HTTP 400, 401, 403, 404, a missing `Invoke-AzRestMethod`, and invalid JSON on a later page produce `[]` and a warning that names `defender-pricings.json`. Do not include the response body. Do not fail the package.
- Pagination matches `ListSubscriptionDefenderSummariesAsync`: repeated-link break, `ShouldBreakForPageCap`, `EnsureTargetsSubscription`, `EnsureTargetsArmRelativeListingPath` for this collection only, and `TryParseArmPaginationPageAsync`. PowerShell follows `nextLink` with the same checks. Do not raise `MaxPaginationRequests`.
- Re-check the highest file in `ArchLucid.Persistence/Migrations` immediately before adding the next number. Add the rollback. Copy the DDL into `ArchLucid.sql` and `ArchLucid_Unified_Schema.sql`. Follow the Defender summaries architecture test. No SQL RLS and no `CREATE SECURITY POLICY`.
- Materialize the rows and thread the list through `AzureInventorySnapshotDetailReadModel`, the write request, SQL read and materialize, `AzureInventoryVisibleSnapshotProjection`, `SecureNowAnalysisSnapshot`, and every `new AzureInventorySnapshotDetailReadModel` that copies `DefenderSummaries`.
- One class per file. No `ConfigureAwait(false)` in tests.
- Before each tracked edit, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- One compile: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Integrations.AzureExtractor.Tests/ArchLucid.Integrations.AzureExtractor.Tests.csproj'`. Run the new test filter and `Invoke-Pester` on `scripts/azure/tests/ArchLucid.SecurityInventory.helpers.Tests.ps1`.
- Do not commit.

## Tests

- Maps a Standard plan and a Free plan, including one extension flag.
- 403 returns an empty list and does not throw.
- A `nextLink` to another subscription or another security collection is rejected.
- A repeated `nextLink` keeps the rows already collected.
- Free `StorageAccounts` plus a storage account in inventory adds `defender-plan-off:StorageAccounts`.
- Free `StorageAccounts` with no storage account does not add that warning.
- Pester covers the helper with a mocked `Invoke-AzRestMethod`.
- Package reader and zip builder round-trip the new entry.
- DDL architecture test matches the Defender summaries test.

## Done when

A subscription with Defender plans produces one stored row per pricing name, a Free plan on a present resource type is a named warning, and a failed pricings call leaves the rest of the extract intact.
