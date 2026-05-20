/*
  Add TenantId index to dbo.Runs table to improve query performance for tenant-scoped run lists.
*/

IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_Runs_TenantId'
         AND object_id = OBJECT_ID(N'dbo.Runs'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Runs_TenantId
        ON dbo.Runs (TenantId);
END;
GO
