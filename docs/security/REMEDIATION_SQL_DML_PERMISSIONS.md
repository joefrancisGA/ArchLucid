# SecureNow remediation SQL DML permissions

**Scope:** IE-13 remediation persistence, `ArchLucidApp` database role, and
production-like runtime permission validation. This is a defense-in-depth
control, **not** proof that direct SQL can no longer update remediation state.

## Audited production write paths (2026-11-23)

- `SqlRemediationInstanceRepository.UpdateInstanceInScopeAsync`: SQL
  `UPDATE dbo.RemediationInstances` with exact tenant/workspace/project/instance
  predicates and an eight-byte SQL rowversion CAS.
- `SqlRemediationInstanceRepository.AtomicApproval`: scoped
  `PreflightPassed → Approved` mutation and `RemediationEvidence`
  INSERT committed in a single transaction.
- `SqlRemediationInstanceRepository.AtomicVerification`: verification
  status update and evidence INSERT in a single transaction, with strict CAS.
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

**Intentionally NOT denied:** `UPDATE` on
`dbo.RemediationInstances`, plus `INSERT` on both tables and
existing required `SELECT`. SQL Server table `DENY UPDATE` would
also prevent legitimate scoped repository updates, including the
atomic approval/verification operations. These methods currently run
as application SQL statements, not through independently privileged
stored procedures.

This migration follows migrations 051/247: it does not create the
application role, grant membership, or assign `GRANT` permissions. If
the role is missing at migration time, the DDL does not apply. The
existing production-like sealed-evidence startup probe has been
extended to check these three role DENYs, **membership of the connected
runtime principal in [ArchLucidApp]**, and the **effective** absence of
the forbidden rights. It also requires effective `SELECT`/`INSERT` on
both tables and `UPDATE` on remediation instances so that the existing
scoped-Dapper workflow remains usable. Failure to meet those checks is a
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

Expected on an application runtime principal with appropriate grants:
evidence can be **inserted but not updated/deleted**; instance can
be **inserted/updated but not deleted**. `CanUpdate=1` for instances
is a recorded residual risk and must not be reported as eliminated.
Unexpected `NULL` or `0` on required INSERT/UPDATE permissions may
indicate a broken deployment; `1` on forbidden operations is unsafe.
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
the actual migration after setting up a test role and impersonates an
`ArchLucidApp` user with `db_datawriter` privileges, ensuring the
DENYs override inherited DML rights while instance UPDATE and evidence
INSERT remain available. A SQL fixture skip is not a passing SQL test.

**Not solved by this change:** an application principal with
`UPDATE` on `dbo.RemediationInstances` can issue arbitrary direct SQL
and bypass the application's CAS/approval evidence code. Fully
eliminating that escape path requires migrating every legitimate update,
including any maintenance/snapshot path, to reviewed privileged stored
procedures or another authenticated database authority, then revoking
direct instance UPDATE from the runtime identity. The snapshot-deletion protection
also relies on the existing `FK_RemediationInstances_SecurityEvidencePaths`
defined in migration 384. Where that FK has been applied and enabled,
SQL Server rejects deletion of a path referenced by a remediation
instance, including conflicting concurrent writes. The new scoped
precheck provides the existing `BlockedReferencedByRemediationInstance`
response; concurrent delete outcomes still need executed SQL tests. Role-based DENYs do not protect
against privileged administrators or out-of-band database migrations.

No cloud remediation executor, `remediation.execute` permission,
FND-015 signing authority, or full build on `master` was enabled.
