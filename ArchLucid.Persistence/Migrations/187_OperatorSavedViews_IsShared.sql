/*
  187: Team-shared operator saved views (Audit / Graph surfaces).
*/
IF OBJECT_ID(N'dbo.OperatorSavedViews', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.OperatorSavedViews', N'IsShared') IS NULL
BEGIN
    ALTER TABLE dbo.OperatorSavedViews
        ADD IsShared BIT NOT NULL
            CONSTRAINT DF_OperatorSavedViews_IsShared DEFAULT 0;
END;
GO

IF OBJECT_ID(N'dbo.OperatorSavedViews', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_OperatorSavedViews_TenantSharedSurface'
         AND object_id = OBJECT_ID(N'dbo.OperatorSavedViews'))
BEGIN
    CREATE INDEX IX_OperatorSavedViews_TenantSharedSurface
        ON dbo.OperatorSavedViews (TenantId, Surface, IsShared)
        INCLUDE (Name, SortKey, UpdatedUtc, UserId)
        WHERE IsShared = 1;
END;
GO
