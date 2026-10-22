# SN-RT-06 — Log Analytics observed companion (Option B)

**Wave:** SecureNow runtime connections (**SN-RT**). **Option B.** **Depends on:** SN-RT-01 identity principal ids in inventory (preferred). **Do not** implement SN-RT-07–10 except a row DTO if 07 needs it.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Optional extractor companion `dependency-observations.json`: **counts** of observed app→target calls from Log Analytics, joined by **MI object id** or App Insights role name. No query payloads, no full SQL text, no secrets.

## Why

Declared env/RBAC cannot prove traffic or direction. App Insights `AppDependencies`, SQL `SQLSecurityAuditEvents`, `StorageBlobLogs` / `StorageQueueLogs`, Key Vault `AuditEvent`, and `AADManagedIdentitySignInLogs` can — when diagnostics exist and the operator grants Log Analytics Reader.

## Context

- `docs/securenow/RUNTIME_DECLARED_AND_OBSERVED_DATA_FLOWS.md` §B
- `scripts/azure/Get-ArchLucidAzurePackage.ps1` optional flags (`-IncludeAppSettingsHosts` pattern)
- `docs/library/AZURE_EXTRACTOR.md` never-collected categories
- Hosted: **skip** unless a documented GET-only Logs Query API is already in the family; default **Tier 1 only**

## What to build

1. New switch `-IncludeDependencyObservations` (default **false**). Fail-soft: missing workspace / 403 → empty array + warning, ZIP still Succeeded.
2. Row shape (own C# type + parser): `sourcePrincipalId` or `sourceAppRoleName`, `targetHost` or `targetArmId` (only if uniquely resolved), `targetCatalog` (SQL), `observationKind` (`sqlDependency` | `sqlAudit` | `storageBlob` | `storageQueue` | `keyVault` | `managedIdentitySignIn` | `httpDependency`), `operationClass` (`read` | `write` | `unknown`), `eventCount`, `windowStartUtc` / `windowEndUtc`, `workspaceId`, `collectionStatus`. **No** query text, **no** statement, **no** row data.
3. KQL (bounded window, e.g. last 7 days; cap rows):
   - `AppDependencies` SQL/HTTP
   - `AzureDiagnostics` SQLSecurityAuditEvents (principal + database_name)
   - Storage blob/queue logs by `RequesterObjectId`
   - KV AuditEvent by `identity_claim_oid_g`
   - Optional MI sign-in (service type only — `targetArmId` null)
4. Join principal id → Container App `identity.principalId` when unique; else leave source as principal id + warning.
5. Tests: parser rejects a row that includes a `statement` field; empty companion when flag off; fixture JSON round-trip.

## Acceptance criteria

Flag off → no companion (or empty, documented). Flag on + no LAW → warning, not a failed ZIP. No SQL text in artifacts.

## Constraints

- Working-tree check. Do **not** paint Data Flow (SN-RT-07). Do **not** merge into `appAuthorizedAccess`.
- Do **not** require a new ZIP collector script.
- Hosted default: omit. If you add hosted, GET-only Logs Query with the same redaction tests — otherwise skip hosted.
- Stage only this prompt’s paths. **No `git add -A`.**
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.

## Verification

```bash
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter 'FullyQualifiedName~DependencyObservation'
pwsh -NoProfile -Command "Invoke-Pester -Strict -EnableExit -Path 'scripts/azure/tests'"
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.Core/ArchLucid.Core.csproj'
```

Heartbeat every 8s if >15s.

## Done when

Companion schema + redaction tests exist. Flag default false. No diagram paint.
