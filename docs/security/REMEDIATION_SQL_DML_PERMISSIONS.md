# SecureNow remediation SQL DML permissions

**Scope:** IE-13 remediation persistence, `ArchLucidApp` database role, and
production-like runtime permission validation. With migration 427 deployed and
the startup permission probe passing for the actual runtime principal, raw
instance UPDATE is denied for that principal. This is **not** protection from
dbo/db_owner, direct INSERT, a privileged SQL operator, or an unauthorized
caller with valid scoped procedure arguments.

## Audited production write paths (2026-11-23)

- `SqlRemediationInstanceRepository.UpdateInstanceInScopeAsync`: uses
  `dbo.uspRemediationUpdateScoped` (migration 427), with full
  tenant/workspace/project/instance predicates, eight-byte rowversion CAS and a
  constrained state transition allowlist.
- `SqlRemediationInstanceRepository.AtomicApproval`: calls
  `dbo.uspRemediationCommitApproval`; only a scoped, independent
  `PreflightPassed → Approved` change with valid evidence is committed,
  together in a SQL-owned transaction.
- `SqlRemediationInstanceRepository.AtomicVerification`: calls
  `dbo.uspRemediationCommitVerification`; the verified/failed decision and
  matching evidence INSERT share one SQL-owned transaction, with strict CAS.
- `SqlRemediationInstanceRepository.InsertEvidenceAsync` and
  `InsertEvidenceInScopeAsync`: evidence **INSERT**, not amendment.
- `SqlAzureInventorySnapshotRepository.Delete`: previously used an
  independent `UPDATE dbo.RemediationInstances SET PathId = NULL` while
  deleting a linked security-path snapshot. This bypassed remediation
  rowversion and provenance constraints. The delete path now blocks when
  a security path in that snapshot is referenced by any remediation instance
  in the tenant, using the existing
  `BlockedReferencedByRemediationInstance` outcome. It does **not**
  silently clear frozen path IDs.

No in-repository `UPDATE` or `DELETE` of `dbo.RemediationEvidence`, and
no in-repository `DELETE` of `dbo.RemediationInstances`, was located in
the targeted indexed search. External SQL clients and jobs are not
covered by the in-tree search.

## Migration 426: deny only unsafe operations

`426_RemediationRoleWritePermissions.sql` is an idempotent tenant-catalog
migration, mirrored into `Scripts/ArchLucid.sql`. When database role
`ArchLucidApp` and the tables exist, it installs:

| Table | DENY to `ArchLucidApp` | Why |
| --- | --- | --- |
| `dbo.RemediationEvidence` | `UPDATE`, `DELETE` | Preserve append-only approval/verification evidence |
| `dbo.RemediationInstances` | `DELETE` | Preserve state history and avoid orphaning evidence |

Migration 426 intentionally leaves instance UPDATE available until
migration 427 replaces the three legitimate inline update families with
`WITH EXECUTE AS OWNER` procedures and **DENY UPDATE** on
`dbo.RemediationInstances` for `[ArchLucidApp]`. Required SELECT/INSERT
privileges remain intact. Migration 427 grants EXECUTE only on the three
existing-control procedures, not blanket access to owner permissions.

This migration follows migrations 051/247: it does not create the
application role, grant membership, or assign `GRANT` permissions. If
the role is missing at migration time, the DDL does not apply. The
existing production-like sealed-evidence startup probe has been
extended to check these three role DENYs, **membership of the connected
runtime principal in [ArchLucidApp]**, and the **effective** absence of
the forbidden rights. It also requires effective `SELECT`/`INSERT` on
both tables. After migration 427 it requires the
three procedure EXECUTE permissions and rejects effective raw UPDATE on
instances, rather than permitting that DML from the runtime role. Failure to meet those checks is a
startup error where that probe runs. A `dbo` / `db_owner` connection can
bypass object DENYs and should not be used by the runtime.

## Operator verification — each real tenant catalog

Use an administrator or a read-only security inventory identity to
inspect `sys.database_permissions` and role membership. Separately
connect as the **actual runtime managed identity** to evaluate effective
rights, with no production data writes:

```sql
SELECT DB_NAME() AS CatalogName,
       USER_NAME() AS CurrentDatabaseUser,
       IS_MEMBER(N'ArchLucidApp') AS IsArchLucidAppMember,
       IS_MEMBER(N'db_owner') AS IsDbOwner,
       IS_MEMBER(N'db_datawriter') AS IsDbDataWriter;

SELECT N'dbo.RemediationEvidence' AS TableName,
       HAS_PERMS_BY_NAME(N'dbo.RemediationEvidence', N'OBJECT', N'INSERT') AS CanInsert,
       HAS_PERMS_BY_NAME(N'dbo.RemediationEvidence', N'OBJECT', N'UPDATE') AS CanUpdate,
       HAS_PERMS_BY_NAME(N'dbo.RemediationEvidence', N'OBJECT', N'DELETE') AS CanDelete
UNION ALL
SELECT N'dbo.RemediationInstances',
       HAS_PERMS_BY_NAME(N'dbo.RemediationInstances', N'OBJECT', N'INSERT'),
       HAS_PERMS_BY_NAME(N'dbo.RemediationInstances', N'OBJECT', N'UPDATE'),
       HAS_PERMS_BY_NAME(N'dbo.RemediationInstances', N'OBJECT', N'DELETE');
```

Expected after migration 427 on the actual application principal:
evidence can be **inserted but not updated/deleted**; instances can be
**inserted but not directly updated/deleted**. `CanUpdate=1` for instances
is a failed security invariant, not a pass. Verify EXECUTE rights for
all three `dbo.uspRemediation*` procedures separately.
Unexpected `NULL` or `0` on required SELECT/INSERT or procedure
EXECUTE permissions may indicate a broken deployment; `1` on
forbidden operations is unsafe.
Inspect role membership, schema/object-level grants, server privileges,
`db_owner`, and `db_datawriter` rather than assuming a role name
alone establishes runtime protection.

Under production `SystemWithPerTenantCatalogs` topology, perform this
check for **each tenant catalog** and identity. SQL RLS is not deployed
(ADR 0037), so it is not a substitute for correct catalog routing.
The existing production-like startup probe resolves a configured
catalog; it is **not** a fleet-wide proof for all tenant catalogs.

## Verification and remaining boundary

The focused source workflow tests migration and consolidated-schema
parity, runtime probe wiring, and absence of the direct snapshot-delete
remediation UPDATE. A disposable SQL Server integration test replays
both actual migrations after setting up a test role and impersonates an
`ArchLucidApp` user with `db_datawriter` privileges, ensuring direct
instance UPDATE, instance DELETE and evidence UPDATE/DELETE are denied,
while evidence INSERT and guarded procedure EXECUTE remain available.
A SQL fixture skip is not a passing SQL test.

**Remaining trust boundary:** Application SQL principals can still insert
remediation instances and evidence, and callers able to invoke a guarded
procedure with valid scoped identifiers and current rowversions may still
forge inputs if the upstream application authorization is compromised.
Procedure-level transition predicates and atomic provenance narrow the impact
but are not a substitute for an independent database actor/approval authority.
Check SQL permissions separately in **every** tenant catalog, including role
provisioning after migrations have been journaled. If the runtime identity
is dbo/db_owner or another privileged principal, these DENYs are ineffective.

The snapshot-deletion protection relies on the existing
`FK_RemediationInstances_SecurityEvidencePaths` from migration 384. It prevents
deletion of referenced paths where enabled, including conflicts, but
concurrent delete and rebind behavior still requires executed SQL testing.
The verified-control association occurs in a separate repository transaction;
a compensating, CAS-protected status restore is allowed by the scoped procedure
when that association fails. The prior verification evidence is append-only
and remains subject to separate reconciliation.

**Deployment sequence:** merge migration 426 before 427, deploy both against
each tenant database using an elevated migration identity, ensure
`ArchLucidApp` exists, and then run the runtime-principal startup permission
probe. Never revoke direct UPDATE before the deployed application version
uses the procedure-only code. If role provisioning happened after migration
427 was journaled, a privileged operator must replay its idempotent grant/deny
portion. Never replay against a customer database during disposable tests.

No cloud remediation executor, `remediation.execute` permission,
FND-015 signing authority, or full build on `master` was enabled.
