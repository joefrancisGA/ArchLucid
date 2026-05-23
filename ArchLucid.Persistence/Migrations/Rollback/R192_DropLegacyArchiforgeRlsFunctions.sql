/* Rollback 192 — restore orphaned legacy RLS predicate inline TVFs (same as R165). */

SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'rls.archiforge_scope_predicate', N'IF') IS NULL
    EXEC (N'
CREATE FUNCTION rls.archiforge_scope_predicate(
    @TenantId        uniqueidentifier,
    @WorkspaceId     uniqueidentifier,
    @ProjectScopeId  uniqueidentifier)
RETURNS TABLE
WITH SCHEMABINDING
AS
RETURN
(
    SELECT 1 AS access_granted
    WHERE ISNULL(TRY_CONVERT(int, SESSION_CONTEXT(N''af_rls_bypass'')), 0) = 1
       OR (
            @TenantId       = TRY_CONVERT(uniqueidentifier, SESSION_CONTEXT(N''af_tenant_id''))
        AND @WorkspaceId    = TRY_CONVERT(uniqueidentifier, SESSION_CONTEXT(N''af_workspace_id''))
        AND @ProjectScopeId = TRY_CONVERT(uniqueidentifier, SESSION_CONTEXT(N''af_project_id''))
       )
);');
GO

IF OBJECT_ID(N'rls.archiforge_tenant_predicate', N'IF') IS NULL
    EXEC (N'
CREATE FUNCTION rls.archiforge_tenant_predicate(@TenantId uniqueidentifier)
RETURNS TABLE
WITH SCHEMABINDING
AS
RETURN
(
    SELECT 1 AS access_granted
    WHERE ISNULL(TRY_CONVERT(int, SESSION_CONTEXT(N''af_rls_bypass'')), 0) = 1
       OR @TenantId = TRY_CONVERT(uniqueidentifier, SESSION_CONTEXT(N''af_tenant_id''))
);');
GO
