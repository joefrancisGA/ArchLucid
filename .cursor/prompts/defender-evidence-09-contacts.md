# DFV-09 — Defender security contacts

**Model:** Composer 2.5. Paste this file as the whole task. Do not implement DFV-10 in this session.

**Repo:** `c:\ArchLucid`

## Goal

Record whether the subscription has a Defender security contact and which notification flags are on. Do not store phone numbers.

## Why

"No one is configured to receive alerts" is a different fact from "the alerts API failed." The phone number is not useful for architecture evidence.

## Read first

- `ListSubscriptionDefenderSummariesAsync`
- `HostedAzureExtractorClient` warning list
- `Add-ArchLucidExtractorWarning` in the package scripts

## What to build

Add optional ZIP entry `defender-security-contacts.json`.

Call `GET /subscriptions/{subscriptionId}/providers/Microsoft.Security/securityContacts`. Use the latest stable `api-version` from the current Microsoft Learn page.

Always write exactly one status row for the subscription when the call succeeds, even when Defender returns no contacts.

| Field | Rule |
|-------|------|
| `subscriptionId` | Subscription guid |
| `collectionStatus` | `Collected` when the call succeeded. `Unavailable` when it failed |
| `emailCount` | Number of distinct email addresses read. 0 when none |
| `emails` | Semicolon-separated addresses, max 512 characters. Empty when none |
| `alertsToAdmins` | Boolean, false when absent |
| `minimalSeverity` | Max 64 characters. Empty when absent |
| `notificationRoles` | Role names only, semicolon-separated, max 512 characters |

Do not store `phone`, `phoneNumber`, or any mobile field. If the only contact data is a phone, `emailCount` stays 0 and `collectionStatus` stays `Collected`.

When `collectionStatus` is `Collected` and `emailCount` is 0, add warning `defender-security-contact-missing`.

When the call fails, write one row with `collectionStatus` `Unavailable` and add warning `defender-security-contacts-not-collected`. Do not use the missing-contact warning for a failed call.

Table `dbo.AzureInventoryDefenderSecurityContacts`.

## Collector contract

- Hosted read on `GetOnlyHostedAzureArmReadClient`, called from both collect paths in `HostedAzureExtractorClient`.
- Script function in `ArchLucid.SecurityInventory.helpers.ps1`, called from both package scripts beside every `defender-summary.json` write.
- Add the entry to `OptionalInventoryEntryNames`. Write it in `HostedAzureExtractorZipBuilder`. Read it with `ReadOptionalArray`. Leave schema version at 2.
- HTTP 400, 401, 403, 404, a missing command, and invalid JSON produce the Unavailable row. Do not include the response body. Do not fail the package.
- Pagination matches `ListSubscriptionDefenderSummariesAsync` when the API returns `nextLink`. Do not raise `MaxPaginationRequests`.
- Re-check the highest migration number immediately before adding SQL. Add the rollback. Copy the DDL into `ArchLucid.sql` and `ArchLucid_Unified_Schema.sql`. Follow the Defender summaries architecture test. No SQL RLS.
- Thread the list through `AzureInventorySnapshotDetailReadModel` and every snapshot copy that already copies `DefenderSummaries`.
- One class per file. No `ConfigureAwait(false)` in tests.
- Before each tracked edit, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- One compile: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Integrations.AzureExtractor.Tests/ArchLucid.Integrations.AzureExtractor.Tests.csproj'`. Run the new tests and the Pester helper file.
- Do not commit.

## Tests

- A contact with an email and `alertsToAdmins` true stores both, and the serialized row has no phone property.
- A successful empty list stores `Collected`, `emailCount` 0, and warning `defender-security-contact-missing`.
- 403 stores `Unavailable` and warning `defender-security-contacts-not-collected`, and does not store the missing-contact warning.
- A fixture phone number is absent from the ZIP entry.
- Pester mocks both the success payload and a thrown REST failure.

## Done when

A successful read records whether a contact email exists, a failed read is labeled Unavailable, and no phone number is stored.
