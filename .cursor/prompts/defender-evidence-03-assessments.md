# DFV-03 — Defender assessments

**Model:** Composer 2.5. Paste this file as the whole task. Do not implement DFV-04 in this session.

**Repo:** `c:\ArchLucid`

## Goal

Store unhealthy Defender for Cloud assessments on the resource they describe, and store healthy / unhealthy / not-applicable counts for every assessment key observed.

## Why

This is the Defender data that can change a conclusion about a specific storage account, identity, or network resource. The subscription score cannot.

## Read first

- `ListSubscriptionDefenderSummariesAsync` pagination helpers
- `ArmResourceIdNormalizer`
- `AzureExtractorPackageInventoryReader.ReadOptionalArray`
- `DefenderSummaryCompanionMaterializer`

## What to build

Add two optional ZIP entries:

- `defender-assessments.json` — unhealthy rows only
- `defender-assessment-counts.json` — one row per assessment key

Call `GET /subscriptions/{subscriptionId}/providers/Microsoft.Security/assessments`. Use the latest stable `api-version` from the current Microsoft Learn page. Put it in a const next to `SecureScoresApiVersion`.

While paging, update counts for every status. Append an unhealthy detail row only while the detail list is under 4000 rows. After that, keep counting and stop appending details. When the page cap stops the loop before the API is exhausted, add warning `defender-assessments-truncated`.

Unhealthy detail row:

| Field | Rule |
|-------|------|
| `subscriptionId` | Subscription guid |
| `assessmentKey` | Assessment `name` |
| `displayName` | Max 512 characters |
| `severity` | `High`, `Medium`, `Low`, or `Unknown` |
| `status` | `Unhealthy` |
| `statusCause` | Max 240 characters. Empty when absent |
| `category` | First category, max 128 characters. Empty when absent |
| `resourceId` | Normalized id from `properties.resourceDetails.Id` or the parent resource id inside the assessment id. Drop the row when no resource id can be read |

Count row:

| Field | Rule |
|-------|------|
| `subscriptionId` | Subscription guid |
| `assessmentKey` | Assessment `name` |
| `displayName` | Max 512 characters |
| `severity` | Same vocabulary as the detail row |
| `healthyCount` | Integer |
| `unhealthyCount` | Integer |
| `notApplicableCount` | Integer |

Do not store Healthy rows in the detail file. Do not store assessment metadata descriptions or remediation steps.

Tables `dbo.AzureInventoryDefenderAssessments` and `dbo.AzureInventoryDefenderAssessmentCounts`.

## Collector contract

- Hosted read on `GetOnlyHostedAzureArmReadClient`, called from both collect paths in `HostedAzureExtractorClient`. One ARM walk fills both files.
- Script function in `ArchLucid.SecurityInventory.helpers.ps1`, called from both package scripts beside every `defender-summary.json` write.
- Add both names to `OptionalInventoryEntryNames`. Write both from `HostedAzureExtractorZipBuilder`. Read both with `ReadOptionalArray`. Leave schema version at 2.
- HTTP 400, 401, 403, 404, a missing `Invoke-AzRestMethod`, and invalid JSON on a later page produce two empty arrays and a warning that names `defender-assessments.json`. Keep counts and details already collected when a later page fails. Do not include the response body. Do not fail the package.
- Pagination matches `ListSubscriptionDefenderSummariesAsync`. PowerShell follows `nextLink` with the same checks. Do not raise `MaxPaginationRequests`.
- Re-check the highest migration number immediately before adding SQL. Two tables may share one migration. Add the rollback. Copy the DDL into `ArchLucid.sql` and `ArchLucid_Unified_Schema.sql`. Follow the Defender summaries architecture test. No SQL RLS.
- Thread both lists through `AzureInventorySnapshotDetailReadModel` and every snapshot copy that already copies `DefenderSummaries`.
- Normalize resource ids with `ArmResourceIdNormalizer`.
- One class per file. No `ConfigureAwait(false)` in tests.
- Before each tracked edit, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- One compile: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Integrations.AzureExtractor.Tests/ArchLucid.Integrations.AzureExtractor.Tests.csproj'`. Run the new tests and the Pester helper file.
- Do not commit.

## Tests

- An Unhealthy assessment becomes a detail row on the normalized resource id.
- A Healthy assessment increments `healthyCount` and does not appear in the detail file.
- The 4001st unhealthy row is counted and is not stored as a detail.
- 403 returns empty details and empty counts.
- A cross-collection `nextLink` is rejected.
- A bad later page keeps the earlier unhealthy row and its count.
- Pester mocks a two-item payload and asserts both result arrays.
- DDL architecture test covers both tables.

## Done when

Unhealthy assessments are stored against resource ids, status counts survive after the detail cap, and a failed assessments call does not fail the extract.
