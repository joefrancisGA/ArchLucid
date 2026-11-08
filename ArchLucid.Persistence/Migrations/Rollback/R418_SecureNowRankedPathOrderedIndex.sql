/*
  R418: Manual-only rollback for 418_SecureNowRankedPathOrderedIndex.sql.
  Removes exactly the additive scoped path lookup index; leaves table data,
  primary key, and all other indexes unchanged.
*/
SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.SecurityEvidencePaths', N'U') IS NOT NULL
   AND EXISTS (
       SELECT 1 FROM sys.indexes
       WHERE object_id = OBJECT_ID(N'dbo.SecurityEvidencePaths')
         AND name = N'IX_SecurityEvidencePaths_Tenant_Workspace_Project_Snapshot_Path'
   )
BEGIN
    DROP INDEX IX_SecurityEvidencePaths_Tenant_Workspace_Project_Snapshot_Path
        ON dbo.SecurityEvidencePaths;
END;
GO
