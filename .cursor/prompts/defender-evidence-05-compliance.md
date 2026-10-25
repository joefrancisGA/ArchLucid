# DFV-05 — Defender regulatory compliance

**Model:** Composer 2.5. Paste this file as the whole task. Do not implement DFV-06 in this session.

**Repo:** `c:\ArchLucid`

## Goal

Store Defender regulatory-compliance standard totals, and the failed controls under those standards.

## Why

A failed Microsoft cloud security benchmark control is audit evidence. The secure-score percentage does not name the standard or the control.

## Read first

- `ListSubscriptionDefenderSummariesAsync`
- `AzureExtractorPackageZipEntryNames`
- The Defender summaries migration and architecture test

## What to build

Add two optional ZIP entries:

- `defender-compliance-standards.json`
- `defender-compliance-controls.json`

List `GET /subscriptions/{subscriptionId}/providers/Microsoft.Security/regulatoryComplianceStandards`. Use the latest stable `api-version` from the current Microsoft Learn page. Use a preview only when Learn has no stable version.

For each standard whose state is Failed, list that standard's controls and keep failed controls only. Do not list controls for a Passed standard.

Standard row:

| Field | Rule |
|-------|------|
| `subscriptionId` | Subscription guid |
| `standardName` | Standard `name`, max 128 characters |
| `state` | As returned, max 64 characters |
| `passedControlCount` | Integer from the standard object |
| `failedControlCount` | Integer from the standard object |
| `skippedControlCount` | Integer from the standard object. 0 when absent |

Failed control row:

| Field | Rule |
|-------|------|
| `subscriptionId` | Subscription guid |
| `standardName` | Parent standard name |
| `controlName` | Control `name`, max 256 characters |
| `state` | `Failed` |
| `failedAssessmentCount` | Integer when the control object has it, otherwise 0 |

Cap failed control rows at 500. Counts on the standard row come from the standard object, not from the truncated control list. When the cap or the page cap truncates, add warning `defender-compliance-truncated`.

Tables `dbo.AzureInventoryDefenderComplianceStandards` and `dbo.AzureInventoryDefenderComplianceControls`.

## Collector contract

- Hosted read on `GetOnlyHostedAzureArmReadClient`, called from both collect paths in `HostedAzureExtractorClient`.
- Script function in `ArchLucid.SecurityInventory.helpers.ps1`, called from both package scripts beside every `defender-summary.json` write.
- Add both names to `OptionalInventoryEntryNames`. Write both from `HostedAzureExtractorZipBuilder`. Read both with `ReadOptionalArray`. Leave schema version at 2.
- HTTP 400, 401, 403, 404, a missing command, and invalid JSON on a later page produce two empty arrays and a warning that names `defender-compliance-standards.json`. A failure while listing controls for one standard keeps standards and controls already collected. Do not include the response body. Do not fail the package.
- Pagination matches `ListSubscriptionDefenderSummariesAsync` on each list. PowerShell follows `nextLink` with the same checks. Do not raise `MaxPaginationRequests`.
- Re-check the highest migration number immediately before adding SQL. Both tables may share one migration. Add the rollback. Copy the DDL into `ArchLucid.sql` and `ArchLucid_Unified_Schema.sql`. Follow the Defender summaries architecture test. No SQL RLS.
- Thread both lists through `AzureInventorySnapshotDetailReadModel` and every snapshot copy that already copies `DefenderSummaries`.
- One class per file. No `ConfigureAwait(false)` in tests.
- Before each tracked edit, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- One compile: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Integrations.AzureExtractor.Tests/ArchLucid.Integrations.AzureExtractor.Tests.csproj'`. Run the new tests and the Pester helper file.
- Do not commit.

## Tests

- A Failed standard stores passed, failed, and skipped counts from the standard object.
- A failed control under that standard is stored. A passed control is not.
- Controls are not requested for a Passed standard.
- The 501st failed control is not stored, and the standard's own failed count stays the API value.
- 403 returns empty arrays and does not throw.
- Pester mocks the standards list and one controls list.

## Done when

Each compliance standard's own totals are stored, failed controls are stored up to the cap, and a missing compliance API does not fail the extract.
