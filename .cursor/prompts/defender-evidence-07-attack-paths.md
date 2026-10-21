# DFV-07 — Defender attack-path summaries

**Model:** Composer 2.5. Paste this file as the whole task. Do not implement DFV-08 in this session.

**Repo:** `c:\ArchLucid`

## Goal

Store a summary of Defender for Cloud attack paths: id, risk, entry resource ids, and target resource ids.

## Why

When the CSPM plan is on, Defender already names an entry resource and a target resource. SecureNow can cite that later. This prompt does not generate SecureNow paths and does not replace path ranking.

## Read first

- `ListSubscriptionDefenderSummariesAsync`
- DFV-01 pricing rows if they already exist on the collect path. This prompt must still run when they do not.
- `docs/library/SECURENOW_ARCHITECT_PLANE.md` (CVE payloads and findings stay off the evidence graph)
- `ArmResourceIdNormalizer`

## What to build

Add optional ZIP entry `defender-attack-paths.json`.

When pricing rows are already in memory and every `CloudPosture` and `DefenderCspm` row has tier `Free`, do not call the attack-path API. Write `[]` and warning `defender-attack-paths-skipped-plan-off`.

When no such pricing row is in memory, or any of those rows is `Standard`, call the subscription attack-path list. Open Microsoft Learn for `Microsoft.Security/attackPaths` and use the latest stable `api-version`. Use a preview only when Learn has no stable version, and name that preview in a warning only when the call is skipped.

One row:

| Field | Rule |
|-------|------|
| `subscriptionId` | Subscription guid |
| `attackPathId` | Path `name` or id, max 128 characters |
| `displayName` | Max 512 characters |
| `riskLevel` | Max 64 characters. Empty when absent |
| `entryResourceIds` | Normalized Azure resource ids, semicolon-separated, max 2048 characters |
| `targetResourceIds` | Normalized Azure resource ids, semicolon-separated, max 2048 characters |

Read entry and target ids from the properties Learn documents for this API version. If a property name in a sample disagrees with this prompt, Learn wins. Drop the row when both id lists are empty. Drop description text longer than 240 characters by not storing a description at all. Do not store remediation steps, CVE lists, or the graph of intermediate nodes.

Cap stored rows at 200. When the cap, the id-list length, or the page cap truncates, add warning `defender-attack-paths-truncated`.

Table `dbo.AzureInventoryDefenderAttackPaths`.

Do not create `SecurityEvidencePath` rows from these records. Do not add graph nodes.

## Collector contract

- Hosted read on `GetOnlyHostedAzureArmReadClient`, called from both collect paths in `HostedAzureExtractorClient`.
- Script function in `ArchLucid.SecurityInventory.helpers.ps1`, called from both package scripts beside every `defender-summary.json` write.
- Add the entry to `OptionalInventoryEntryNames`. Write it in `HostedAzureExtractorZipBuilder`. Read it with `ReadOptionalArray`. Leave schema version at 2.
- HTTP 400, 401, 403, 404, a missing command, and invalid JSON on a later page produce `[]` and a warning that names `defender-attack-paths.json`. Keep rows already collected. Do not include the response body. Do not fail the package.
- Pagination matches `ListSubscriptionDefenderSummariesAsync`. PowerShell follows `nextLink` with the same checks. Do not raise `MaxPaginationRequests`.
- Re-check the highest migration number immediately before adding SQL. Add the rollback. Copy the DDL into `ArchLucid.sql` and `ArchLucid_Unified_Schema.sql`. Follow the Defender summaries architecture test. No SQL RLS.
- Thread the list through `AzureInventorySnapshotDetailReadModel` and every snapshot copy that already copies `DefenderSummaries`.
- One class per file. No `ConfigureAwait(false)` in tests.
- Before each tracked edit, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- One compile: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Integrations.AzureExtractor.Tests/ArchLucid.Integrations.AzureExtractor.Tests.csproj'`. Run the new tests and the Pester helper file.
- Do not commit.

## Tests

- A path with one entry id and one target id is stored normalized.
- A path with no resource ids is dropped.
- Free `CloudPosture` and no Standard CSPM row skips the HTTP call and writes the plan-off warning.
- No pricing rows still attempts the list.
- 403 returns an empty list and does not throw.
- Description and remediation fields from the fixture are absent from the stored row.
- Pester mocks the attack-path path and a repeated nextLink.

## Done when

Attack paths Defender already computed are stored as id, risk, and endpoint resource ids, a Free CSPM plan skips the call, and SecureNow path generation is unchanged.
