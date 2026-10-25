# DFV-11 — Defender for Endpoint exposure

**Model:** Composer 2.5. Paste this file as the whole task. Do not implement DFV-12 in this session.

**Repo:** `c:\ArchLucid`

## Goal

Store the Defender for Endpoint exposure score, and machine counts by risk bucket, when the collector identity can already obtain a token for that API.

## Why

Endpoint exposure is a different product from Defender for Cloud, and subscription Reader does not grant it. When the same managed identity can already read it, the score is useful. When it cannot, the snapshot should say so instead of looking like the score was zero.

## Read first

- How `HostedAzureExtractorClient` gets its ARM access token
- ADR `docs/architecture/adrs/0103-securenow-in-tenant-collection-agent.md` (extra permissions are explicit, and absence is an inaccessible-evidence condition)
- `ListSubscriptionDefenderSummariesAsync` only as the fail-soft pattern

## What to build

Add optional ZIP entry `defender-endpoint-exposure.json`.

Open the current Microsoft Learn page for the Microsoft Defender for Endpoint API. Use the exposure score request and, if Learn documents one list for it, a machine count by risk score. Use the audience Learn documents, commonly `https://api.securitycenter.microsoft.com`.

Token rule:

- If the hosted client or the PowerShell `Az` context can already request a token for that audience with the identity it is already using, call the API.
- If it cannot, do not add an app registration, a client secret, a certificate, a stored refresh token, or a new credential configuration key. Write one Unavailable row and warning `defender-endpoint-exposure-not-authorized`.

One row:

| Field | Rule |
|-------|------|
| `subscriptionId` | Subscription guid when the API is subscription scoped. Empty when the score is tenant scoped. Still store the row |
| `collectionStatus` | `Collected` or `Unavailable` |
| `exposureScore` | Integer 0–100 when collected, otherwise null |
| `highRiskMachineCount` | Integer, 0 when the count API was not called |
| `mediumRiskMachineCount` | Integer, 0 when the count API was not called |
| `lowRiskMachineCount` | Integer, 0 when the count API was not called |

Do not store machine names, device ids, user names, or IP addresses. A 403 after a token was acquired is `Unavailable` plus the same warning. Do not fail the package.

Table `dbo.AzureInventoryDefenderEndpointExposure`.

## Collector contract

- Call this from both collect paths in `HostedAzureExtractorClient` and from both package scripts beside every `defender-summary.json` write.
- Add the entry to `OptionalInventoryEntryNames`. Write it in `HostedAzureExtractorZipBuilder`. Read it with `ReadOptionalArray`. Leave schema version at 2.
- Do not raise `MaxPaginationRequests`. If the machine count is paged, follow the same nextLink subscription-or-tenant guard used for other Defender lists and stop at the existing page cap. Keep counts already added.
- Re-check the highest migration number immediately before adding SQL. Add the rollback. Copy the DDL into `ArchLucid.sql` and `ArchLucid_Unified_Schema.sql`. Follow the Defender summaries architecture test. No SQL RLS.
- Thread the list through `AzureInventorySnapshotDetailReadModel` and every snapshot copy that already copies `DefenderSummaries`.
- One class per file. No `ConfigureAwait(false)` in tests.
- Before each tracked edit, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- One compile: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Integrations.AzureExtractor.Tests/ArchLucid.Integrations.AzureExtractor.Tests.csproj'`. Run the new tests and the Pester helper file.
- Do not commit.

## Tests

- A mocked exposure score of 42 and high-risk count of 3 is stored, with `Collected`.
- A machine payload that includes a device name and an IP does not copy either into the row.
- When no token audience helper exists, the result is `Unavailable`, the warning is `defender-endpoint-exposure-not-authorized`, and no new options class or secret key is added. Assert that by searching the diff for a new credential setting.
- A 403 after a mocked token is `Unavailable` and does not throw.
- Pester covers the Unavailable path without calling the network.

## Done when

A readable endpoint exposure score is stored as numbers only, and a missing permission is an explicit Unavailable row rather than a new credential flow.
