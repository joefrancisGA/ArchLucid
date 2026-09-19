# SN-RT-08 — SQL database principals probe (Option C)

**Wave:** SecureNow runtime connections (**SN-RT**). **Option C.** **Depends on:** inventory SQL servers + compute `principalId`. **Do not** implement SN-RT-09–10.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Optional, fail-soft companion `sql-database-principals.json`: Entra **user/app names** in `sys.database_principals` (`type` E/X only) per inventoried user database. Map unique names to Container App identities → `appAuthorizedAccess` **or** a dedicated `sqlDatabasePrincipal` association (**May access**, DerivedFact — **not** ObservedFact).

## Why

DEV SQL uses `CREATE USER [mi-name] FROM EXTERNAL PROVIDER` inside the database. Azure RBAC `SQL DB Contributor` is often absent, so SN-RT-05 will not paint SQL. Membership is the missing authorization hop. This is **not** an ER diagram and **not** table harvest.

## Context

- `docs/security/MANAGED_IDENTITY_SQL_BLOB.md`
- `docs/library/SECURENOW_RUNTIME_CONNECTION_HOLD.md` (principals only)
- `scripts/azure/Get-ArchLucidAzurePackage.ps1` optional-flag pattern
- `AzureInventoryNeverShowSqlDatabaseNames` (`master` skip)

## What to build

1. Switch `-IncludeSqlDatabasePrincipals` (default **false**). Hosted: **omit** (needs a DB session).
2. Connect with the extractor’s existing Azure context if possible (`Active Directory Default`); if connect fails, warning per database, continue.
3. Query **only**: `SELECT name, type_desc FROM sys.database_principals WHERE type IN ('E','X')` — no `sys.tables`, no rows, no permissions DMVs beyond this.
4. Persist: `databaseArmId`, `principalName`, `typeDesc`, `collectionStatus`. Skip `master` / `msdb` / `tempdb`.
5. Join `principalName` to Container App name or UAMI name when **unique**; else warning, no edge.
6. Tests: parser rejects extra columns like `table_name`; `master` skipped; unique API app name + principal `archlucid-api` → one May access edge; two apps same name → no edge.

## Acceptance criteria

Flag off → no companion. Flag on + firewall deny → warnings, ZIP Succeeded. No table/FK data. Edges are authorization, not traffic.

## Constraints

- Working-tree check. **Plane exception is this prompt only** — still one collector family, still no second ZIP.
- Do **not** enable by default on hosted.
- Do **not** paint ObservedRuntime (that is logs).
- Stage only this prompt’s paths. **No `git add -A`.**
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.

## Verification

```bash
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter 'FullyQualifiedName~SqlDatabasePrincipal'
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~SqlDatabasePrincipal'
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application/ArchLucid.Application.csproj'
```

Heartbeat every 8s if >15s.

## Done when

Opt-in companion + join tests exist. Default off. No ER surface.
