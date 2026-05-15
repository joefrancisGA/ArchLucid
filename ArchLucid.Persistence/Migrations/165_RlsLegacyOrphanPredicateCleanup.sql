/*
  165: Drop unreferenced legacy RLS predicate inline TVFs (rls.archiforge_scope_predicate /
       rls.archiforge_tenant_predicate).

  Idempotent: skips when functions are absent or still referenced by sys.security_predicates.

  Operational note: catalog still owning SECURITY POLICY rls.ArchiforgeTenantScope requires replay of DbUp 108
  (journal repair / restore-then-upgrade) — that migration performs the atomic ArchLucid rename cutover with full
  predicate replay; this script does not recreate predicates or rename policies.
*/

SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'rls.archiforge_scope_predicate', N'IF') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.security_predicates AS sp
        WHERE sp.predicate_object_id = OBJECT_ID(N'rls.archiforge_scope_predicate'))
    EXEC (N'DROP FUNCTION rls.archiforge_scope_predicate;');
GO

IF OBJECT_ID(N'rls.archiforge_tenant_predicate', N'IF') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.security_predicates AS sp
        WHERE sp.predicate_object_id = OBJECT_ID(N'rls.archiforge_tenant_predicate'))
    EXEC (N'DROP FUNCTION rls.archiforge_tenant_predicate;');
GO
