IF OBJECT_ID(N'dbo.Architectures', N'U') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_Architectures_Scope_ActiveUpdatedUtc'
         AND object_id = OBJECT_ID(N'dbo.Architectures'))
BEGIN
    DROP INDEX IX_Architectures_Scope_ActiveUpdatedUtc ON dbo.Architectures;
END;
GO

IF OBJECT_ID(N'dbo.Architectures', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Architectures', N'ArchivedUtc') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Architectures DROP COLUMN ArchivedUtc;
END;
GO
