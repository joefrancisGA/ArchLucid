# DFV-06 — Active Defender alerts

**Model:** Composer 2.5. Paste this file as the whole task. Do not implement DFV-07 in this session.

**Repo:** `c:\ArchLucid`

## Goal

Store a short summary of active Defender for Cloud alerts, joined to a resource id when Defender provides one.

## Why

An open high alert on a resource is stronger evidence than a subscription score. The alert entity bag is not useful in the snapshot and can carry command lines and unrelated identities.

## Read first

- `ListSubscriptionDefenderSummariesAsync`
- `ArmResourceIdNormalizer`
- `HostedAzureExtractorClient` warning list

## What to build

Add optional ZIP entry `defender-alerts.json`.

List alerts at subscription scope. Open Microsoft Learn for `Microsoft.Security/alerts` and use the latest stable `api-version`. If Learn requires a location in the path, list locations already known from the subscription and call each location list. Cap location calls at 20. Use the stable version either way.

Keep alerts whose status is `Active` or `InProgress`. Drop `Dismissed` and `Resolved`.

One row:

| Field | Rule |
|-------|------|
| `subscriptionId` | Subscription guid |
| `alertId` | Alert `name` or id, max 128 characters |
| `displayName` | Max 512 characters |
| `severity` | `High`, `Medium`, `Low`, `Informational`, or `Unknown`. Map Defender `Critical` to `High` |
| `status` | `Active` or `InProgress` |
| `intent` | Max 64 characters. Empty when absent |
| `alertType` | Max 256 characters |
| `startTimeUtc` | UTC timestamp when present, otherwise null |
| `resourceId` | Normalized Azure resource id taken only from a resource identifier whose type is an Azure resource. Empty when Defender does not give one |

Do not persist `entities`, `extendedProperties`, `supportingEvidence`, correlation ids beyond `alertId`, or any command line.

Cap stored rows at 500, highest severity first, then newest `startTimeUtc`. When the cap or the page cap truncates, add warning `defender-alerts-truncated`.

Table `dbo.AzureInventoryDefenderAlerts`.

## Collector contract

- Hosted read on `GetOnlyHostedAzureArmReadClient`, called from both collect paths in `HostedAzureExtractorClient`.
- Script function in `ArchLucid.SecurityInventory.helpers.ps1`, called from both package scripts beside every `defender-summary.json` write.
- Add the entry to `OptionalInventoryEntryNames`. Write it in `HostedAzureExtractorZipBuilder`. Read it with `ReadOptionalArray`. Leave schema version at 2.
- HTTP 400, 401, 403, 404, a missing command, and invalid JSON on a later page produce `[]` and a warning that names `defender-alerts.json`. Keep alerts already collected. Do not include the response body. Do not fail the package.
- Pagination matches `ListSubscriptionDefenderSummariesAsync` on each list. PowerShell follows `nextLink` with the same checks. Do not raise `MaxPaginationRequests`.
- Re-check the highest migration number immediately before adding SQL. Add the rollback. Copy the DDL into `ArchLucid.sql` and `ArchLucid_Unified_Schema.sql`. Follow the Defender summaries architecture test. No SQL RLS.
- Thread the list through `AzureInventorySnapshotDetailReadModel` and every snapshot copy that already copies `DefenderSummaries`.
- One class per file. No `ConfigureAwait(false)` in tests.
- Before each tracked edit, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- One compile: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Integrations.AzureExtractor.Tests/ArchLucid.Integrations.AzureExtractor.Tests.csproj'`. Run the new tests and the Pester helper file.
- Do not commit.

## Tests

- An Active high alert with an Azure resource identifier stores the normalized resource id.
- A Resolved alert is dropped.
- An alert whose only identifier is not an Azure resource stores an empty `resourceId`.
- A fixture that includes an `entities` command line does not appear in the serialized row.
- The 501st alert is not stored.
- 403 returns an empty list and does not throw.
- Pester mocks the alerts path and a nextLink page.

## Done when

Active alerts are stored as short resource-joined rows, entity payloads are gone, and a failed alerts call does not fail the extract.
