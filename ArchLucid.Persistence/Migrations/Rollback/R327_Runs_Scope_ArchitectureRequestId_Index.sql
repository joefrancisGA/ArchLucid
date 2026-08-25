/* Rollback for migration 327: drop architecture-request idempotency index on dbo.Runs. */

IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_Runs_Scope_ArchitectureRequestId'
         AND object_id = OBJECT_ID(N'dbo.Runs'))
BEGIN
    DROP INDEX IX_Runs_Scope_ArchitectureRequestId ON dbo.Runs;
END;
GO
