# DFV-10 — Defender settings, export, automations, and connectors

**Model:** Composer 2.5. Paste this file as the whole task. Do not implement DFV-11 in this session.

**Repo:** `c:\ArchLucid`

## Goal

Store the small Defender configuration facts that change how the other evidence should be read: which settings are enabled, where data is exported, whether an automation exists, and which other clouds are connected.

## Why

A low score means something different when Defender is not exporting to a workspace, when no automation is wired, or when an AWS connector is present and this snapshot does not include that cloud.

## Read first

- `ListSubscriptionDefenderSummariesAsync`
- Both package scripts' `defender-summary.json` writes
- The Defender summaries DDL test

## What to build

Add one optional ZIP entry `defender-posture-settings.json`. One walk may call several lists. A failure of one list does not drop rows already collected from another list.

Use the latest stable `api-version` from the current Microsoft Learn page for each resource type. Use a preview only when that page has no stable version.

Lists:

| Kind | List |
|------|------|
| `setting` | `Microsoft.Security/settings` |
| `workspace-export` | `Microsoft.Security/workspaceSettings` |
| `automation` | `Microsoft.Security/automations` |
| `connector` | `Microsoft.Security/securityConnectors` |

One row:

| Field | Rule |
|-------|------|
| `subscriptionId` | Subscription guid |
| `kind` | `setting`, `workspace-export`, `automation`, or `connector` |
| `name` | Resource name, max 256 characters |
| `resourceId` | Normalized id when one exists. For a workspace export, the workspace resource id. For an automation, the Logic App or action resource id when one is present. Empty when absent |
| `status` | `enabled` or `disabled` for a setting. Connectivity or provisioning state for a connector, max 64 characters. Empty when absent |
| `detail` | Short text, max 512 characters. Setting: enabled flag only. Workspace: workspace id. Automation: action type plus resource id. Connector: cloud provider name plus connection status. No URLs that contain a signature, key, or token |

Also, when `Microsoft.Security/iotSecuritySolutions` returns 200, add one `setting` row named `iotSecuritySolutions` whose `detail` is the solution count. A 404 or 403 on that list adds no row and no extra failure.

Cap 200 rows. When a list is truncated by the cap or the page cap, add warning `defender-posture-settings-truncated`.

When a single list fails, add warning `defender-posture-settings-partial:{kind}` and keep the other kinds.

Table `dbo.AzureInventoryDefenderPostureSettings`.

Do not store automation run history, webhook secrets, or connector credentials.

## Collector contract

- Hosted read on `GetOnlyHostedAzureArmReadClient`, called from both collect paths in `HostedAzureExtractorClient`.
- Script function in `ArchLucid.SecurityInventory.helpers.ps1`, called from both package scripts beside every `defender-summary.json` write.
- Add the entry to `OptionalInventoryEntryNames`. Write it in `HostedAzureExtractorZipBuilder`. Read it with `ReadOptionalArray`. Leave schema version at 2.
- Do not fail the package when one of these lists fails.
- Pagination matches `ListSubscriptionDefenderSummariesAsync` on each list. PowerShell follows `nextLink` with the same checks. Do not raise `MaxPaginationRequests`.
- Re-check the highest migration number immediately before adding SQL. Add the rollback. Copy the DDL into `ArchLucid.sql` and `ArchLucid_Unified_Schema.sql`. Follow the Defender summaries architecture test. No SQL RLS.
- Thread the list through `AzureInventorySnapshotDetailReadModel` and every snapshot copy that already copies `DefenderSummaries`.
- One class per file. No `ConfigureAwait(false)` in tests.
- Before each tracked edit, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- One compile: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Integrations.AzureExtractor.Tests/ArchLucid.Integrations.AzureExtractor.Tests.csproj'`. Run the new tests and the Pester helper file.
- Do not commit.

## Tests

- A setting, a workspace id, an automation Logic App id, and an AWS connector become four rows with the right `kind`.
- A connector payload that includes a secret or SAS query string does not copy that secret into `detail`.
- A 403 on automations keeps the setting row and adds `defender-posture-settings-partial:automation`.
- IoT 404 adds no row.
- Pester mocks the four lists.

## Done when

The four configuration lists are stored as short rows, a failure of one list keeps the others, and no secret is written into the package.
