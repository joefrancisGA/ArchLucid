/*
  R366: Rollback 366_ArchitectureIdentityDisplayNameAndDraftFk.sql —
  drop draft ArchitectureId FK/index/column and architecture display metadata columns.
*/

SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID(N'dbo.DraftRequests', N'U') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_DraftRequests_Scope_ArchitectureId'
         AND object_id = OBJECT_ID(N'dbo.DraftRequests'))
BEGIN
    DROP INDEX IX_DraftRequests_Scope_ArchitectureId ON dbo.DraftRequests;
END;
GO

IF OBJECT_ID(N'dbo.DraftRequests', N'U') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.foreign_keys
       WHERE name = N'FK_DraftRequests_Architectures'
         AND parent_object_id = OBJECT_ID(N'dbo.DraftRequests'))
BEGIN
    ALTER TABLE dbo.DraftRequests DROP CONSTRAINT FK_DraftRequests_Architectures;
END;
GO

IF OBJECT_ID(N'dbo.DraftRequests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.DraftRequests', N'ArchitectureId') IS NOT NULL
BEGIN
    ALTER TABLE dbo.DraftRequests DROP COLUMN ArchitectureId;
END;
GO

IF OBJECT_ID(N'dbo.Architectures', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Architectures', N'Description') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Architectures DROP COLUMN Description;
END;
GO

IF OBJECT_ID(N'dbo.Architectures', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Architectures', N'DisplayName') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Architectures DROP CONSTRAINT DF_Architectures_DisplayName;
    ALTER TABLE dbo.Architectures DROP COLUMN DisplayName;
END;
GO
