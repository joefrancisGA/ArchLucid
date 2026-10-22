# DFV-02 — Secure score controls

**Model:** Composer 2.5. Paste this file as the whole task. Do not implement DFV-03 in this session.

**Repo:** `c:\ArchLucid`

## Goal

Store the secure-score control breakdown. Keep `defender-summary.json` as it is today: `resourceId` plus one `secureScore` integer.

## Why

The percentage cannot say which control family is weak. The control list is the smallest Defender payload that explains a low score.

## Read first

- `GetOnlyHostedAzureArmReadClient.ListSubscriptionDefenderSummariesAsync`
- `Get-ArchLucidAzureDefenderSummaryCompanionRows` and `Get-ArchLucidAzureDefenderSecureScorePercent`
- `DefenderSummaryCompanionMaterializer`
- `AzureExtractorPackageZipEntryNames`

## What to build

Add optional ZIP entry `defender-score-controls.json`.

Read the secure-score names from `Microsoft.Security/secureScores` for the subscription. Always include `ascScore` when that call succeeds. Include other score names the payload returns, up to five names total. For each name, call:

`GET /subscriptions/{subscriptionId}/providers/Microsoft.Security/secureScores/{scoreName}/secureScoreControls`

Use the latest stable `api-version` from the current Microsoft Learn page. Put it in a const next to `SecureScoresApiVersion`.

Do not change the rows written to `defender-summary.json`. Do not change `DefenderSecureScoreOrdinalBandMapper` thresholds.

One row per control:

| Field | Rule |
|-------|------|
| `subscriptionId` | Subscription guid |
| `scoreName` | `ascScore` or the other score name |
| `controlName` | Control `name` |
| `displayName` | Max 512 characters |
| `current` | Integer. Omit the row when current and max are both missing |
| `max` | Integer |
| `percentage` | 0–100 integer. Prefer the API percentage. Otherwise `current / max * 100` when max is greater than 0 |
| `weight` | Integer when present, otherwise 0 |
| `unhealthyResourceCount` | Integer when present, otherwise 0 |
| `healthyResourceCount` | Integer when present, otherwise 0 |

Table `dbo.AzureInventoryDefenderScoreControls`.

## Collector contract

- Hosted read on `GetOnlyHostedAzureArmReadClient`, called from both collect paths in `HostedAzureExtractorClient`.
- Script function in `ArchLucid.SecurityInventory.helpers.ps1`, called from both package scripts beside every `defender-summary.json` write.
- Add the entry to `OptionalInventoryEntryNames`. Write it in `HostedAzureExtractorZipBuilder`. Read it with `ReadOptionalArray`. Leave schema version at 2.
- HTTP 400, 401, 403, 404, a missing `Invoke-AzRestMethod`, and invalid JSON on a later page produce `[]` and a warning that names `defender-score-controls.json`. A failure of one score name keeps controls already collected for earlier names. Do not include the response body. Do not fail the package.
- Pagination matches `ListSubscriptionDefenderSummariesAsync` for each controls list. PowerShell follows `nextLink` with the same subscription and collection-path checks. Do not raise `MaxPaginationRequests`.
- Re-check the highest migration number immediately before adding SQL. Add the rollback. Copy the DDL into `ArchLucid.sql` and `ArchLucid_Unified_Schema.sql`. Follow the Defender summaries architecture test. No SQL RLS.
- Thread the list through `AzureInventorySnapshotDetailReadModel` and every snapshot copy that already copies `DefenderSummaries`.
- One class per file. No `ConfigureAwait(false)` in tests.
- Before each tracked edit, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- One compile: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Integrations.AzureExtractor.Tests/ArchLucid.Integrations.AzureExtractor.Tests.csproj'`. Run the new tests and the Pester helper file.
- Do not commit.

## Tests

- `ascScore` controls map current, max, percentage, weight, and unhealthy count.
- A second score name is requested, and a sixth name is not.
- 403 on the controls call returns an empty control list and leaves `defender-summary.json` behavior unchanged.
- A bad later page keeps controls from earlier pages.
- A cross-subscription `nextLink` is rejected.
- Pester mocks `Invoke-AzRestMethod` and asserts the controls path.
- Existing defender summary tests still expect `secureScore` 85 and no control fields on that file.

## Done when

The package still has the one-number secure score, and a separate stored list explains that score by control.
