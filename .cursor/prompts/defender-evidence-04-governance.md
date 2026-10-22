# DFV-04 — Defender governance due dates

**Model:** Composer 2.5. Paste this file as the whole task. Do not implement DFV-05 in this session.

**Repo:** `c:\ArchLucid`

## Goal

Store Defender governance assignments: which assessment, which resource, who owns it, and when remediation is due.

## Why

A due date and an owner are the difference between a posture fact and work someone already accepted. SecureNow should keep that fact instead of inventing a due date.

## Read first

- `ListSubscriptionDefenderSummariesAsync`
- The DFV-03 assessment row shape if it has already landed. This prompt must still collect governance when DFV-03 has not landed.
- `ArmResourceIdNormalizer`

## What to build

Add optional ZIP entry `defender-governance.json`.

Prefer one subscription list. Open Microsoft Learn and use the first of these that has a stable or, if needed, preview list API:

1. `GET /subscriptions/{subscriptionId}/providers/Microsoft.Security/governanceAssignments`
2. If that list does not exist, the subscription list Learn documents for assessment governance assignments.

Do not call one request per assessment when a subscription list exists.

Use the latest stable `api-version` when Learn has one. Otherwise use the preview Learn documents, and mention that preview name in the skip warning.

One row:

| Field | Rule |
|-------|------|
| `subscriptionId` | Subscription guid |
| `assessmentKey` | Assessment name the assignment points at |
| `resourceId` | Normalized resource id. Drop the row when it cannot be read |
| `owner` | Max 320 characters. Null when absent. This is the value Defender stored, not an address SecureNow invents |
| `remediationDueUtc` | UTC timestamp when present, otherwise null |
| `isGracePeriod` | Boolean, false when absent |
| `assignmentStatus` | Max 64 characters. Empty when absent |

Cap stored rows at 4000. When the cap or the page cap truncates, add warning `defender-governance-truncated`.

Table `dbo.AzureInventoryDefenderGovernanceAssignments`.

## Collector contract

- Hosted read on `GetOnlyHostedAzureArmReadClient`, called from both collect paths in `HostedAzureExtractorClient`.
- Script function in `ArchLucid.SecurityInventory.helpers.ps1`, called from both package scripts beside every `defender-summary.json` write.
- Add the entry to `OptionalInventoryEntryNames`. Write it in `HostedAzureExtractorZipBuilder`. Read it with `ReadOptionalArray`. Leave schema version at 2.
- HTTP 400, 401, 403, 404, a missing command, and invalid JSON on a later page produce `[]` and a warning that names `defender-governance.json`. Keep rows already collected. Do not include the response body. Do not fail the package.
- Pagination matches `ListSubscriptionDefenderSummariesAsync`. PowerShell follows `nextLink` with the same checks. Do not raise `MaxPaginationRequests`.
- Re-check the highest migration number immediately before adding SQL. Add the rollback. Copy the DDL into `ArchLucid.sql` and `ArchLucid_Unified_Schema.sql`. Follow the Defender summaries architecture test. No SQL RLS.
- Thread the list through `AzureInventorySnapshotDetailReadModel` and every snapshot copy that already copies `DefenderSummaries`.
- One class per file. No `ConfigureAwait(false)` in tests.
- Before each tracked edit, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- One compile: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Integrations.AzureExtractor.Tests/ArchLucid.Integrations.AzureExtractor.Tests.csproj'`. Run the new tests and the Pester helper file.
- Do not commit.

## Tests

- Maps assessment key, resource id, owner, and due timestamp.
- A missing owner stays null and the row is kept.
- A row with no resource id is dropped.
- 404 returns an empty list and a warning, and does not throw.
- The 4001st row is not stored, and the warning names truncation.
- A `nextLink` into another security collection is rejected.
- Pester mocks the list path chosen from Learn.

## Done when

Governance assignments that Defender already has are stored with owner and due date, and a missing API or a 403 leaves the extract intact.
