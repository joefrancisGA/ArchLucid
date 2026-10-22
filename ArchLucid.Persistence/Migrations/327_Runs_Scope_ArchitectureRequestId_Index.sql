/* 327 — Filtered index for architecture-request idempotency lookups on dbo.Runs.

   CountActiveRunsForArchitectureRequest and ExistsRunForArchitectureRequestInScope filter
   TenantId + WorkspaceId + ScopeProjectId + ArchitectureRequestId with ArchivedUtc IS NULL.
   ArchitectureRequestId is only in the INCLUDE list of IX_Runs_Scope_CreatedUtc, so these predicates
   residual-scan active runs in the project. */

IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'ArchitectureRequestId') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_Runs_Scope_ArchitectureRequestId'
         AND object_id = OBJECT_ID(N'dbo.Runs'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Runs_Scope_ArchitectureRequestId
        ON dbo.Runs (TenantId, WorkspaceId, ScopeProjectId, ArchitectureRequestId)
        WHERE ArchivedUtc IS NULL;
END;
GO
