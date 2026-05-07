/*
  148: Remove SQL Server row-level security (tenant/workspace/project SESSION_CONTEXT predicates).

  RLS shipped with STATE=OFF and was optional defense-in-depth. Production isolation is enforced by
  per-tenant catalogs (ArchLucid:SqlTopology:Mode=SystemWithPerTenantCatalogs) and application-scope
  queries. Predicate functions cannot be dropped until the owning security policy is removed.

  Idempotent: tolerates catalogs that never had RLS (greenfield post-148 bootstrap) or legacy names.

  Operational note: if a database had SECURITY POLICY rls.ArchLucidTenantScope STATE=ON, dropping
  removes database-layer filtering; callers must rely on catalog boundaries and application scope.
*/

SET XACT_ABORT ON;
GO

IF EXISTS (SELECT 1 FROM sys.security_policies WHERE name = N'RunsScopeFilter')
    EXEC (N'DROP SECURITY POLICY rls.RunsScopeFilter;');
GO

IF EXISTS (SELECT 1 FROM sys.security_policies WHERE name = N'ArchiforgeTenantScope')
    EXEC (N'DROP SECURITY POLICY rls.ArchiforgeTenantScope;');
GO

IF EXISTS (SELECT 1 FROM sys.security_policies WHERE name = N'ArchLucidTenantScope')
    EXEC (N'DROP SECURITY POLICY rls.ArchLucidTenantScope;');
GO

IF OBJECT_ID(N'rls.archlucid_scope_predicate', N'IF') IS NOT NULL
    DROP FUNCTION rls.archlucid_scope_predicate;
GO

IF OBJECT_ID(N'rls.archlucid_tenant_predicate', N'IF') IS NOT NULL
    DROP FUNCTION rls.archlucid_tenant_predicate;
GO

IF OBJECT_ID(N'rls.archiforge_scope_predicate', N'IF') IS NOT NULL
    DROP FUNCTION rls.archiforge_scope_predicate;
GO

IF OBJECT_ID(N'rls.archiforge_tenant_predicate', N'IF') IS NOT NULL
    DROP FUNCTION rls.archiforge_tenant_predicate;
GO

IF OBJECT_ID(N'rls.runs_scope_predicate', N'IF') IS NOT NULL
    DROP FUNCTION rls.runs_scope_predicate;
GO

IF EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'rls')
   AND NOT EXISTS (SELECT 1 FROM sys.objects WHERE schema_id = SCHEMA_ID(N'rls'))
   AND NOT EXISTS (
        SELECT 1
        FROM sys.types AS t
        INNER JOIN sys.schemas AS s ON s.schema_id = t.schema_id
        WHERE s.name = N'rls')
    DROP SCHEMA rls;
GO
