/*
  Rollback 367: Remove DraftRequests.ArchitectureId FK and column.
*/

SET NOCOUNT ON;
GO

IF EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_DraftRequests_Scope_ArchitectureId'
      AND object_id = OBJECT_ID(N'dbo.DraftRequests'))
BEGIN
    DROP INDEX IX_DraftRequests_Scope_ArchitectureId ON dbo.DraftRequests;
END;
GO

IF EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = N'FK_DraftRequests_Architectures')
BEGIN
    ALTER TABLE dbo.DraftRequests DROP CONSTRAINT FK_DraftRequests_Architectures;
END;
GO

IF COL_LENGTH(N'dbo.DraftRequests', N'ArchitectureId') IS NOT NULL
BEGIN
    ALTER TABLE dbo.DraftRequests DROP COLUMN ArchitectureId;
END;
GO
