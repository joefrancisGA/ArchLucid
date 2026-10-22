/*
  R187: Rollback 187_OperatorSavedViews_IsShared.sql — remove team-shared saved view column and index.
*/

IF OBJECT_ID(N'dbo.OperatorSavedViews', N'U') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_OperatorSavedViews_TenantSharedSurface'
         AND object_id = OBJECT_ID(N'dbo.OperatorSavedViews'))
BEGIN
    DROP INDEX IX_OperatorSavedViews_TenantSharedSurface ON dbo.OperatorSavedViews;
END;
GO

IF OBJECT_ID(N'dbo.OperatorSavedViews', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.OperatorSavedViews', N'IsShared') IS NOT NULL
BEGIN
    ALTER TABLE dbo.OperatorSavedViews DROP CONSTRAINT IF EXISTS DF_OperatorSavedViews_IsShared;
    ALTER TABLE dbo.OperatorSavedViews DROP COLUMN IsShared;
END;
GO
