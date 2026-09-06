/*
  367: DraftRequests parent architecture FK (CA-03 / ADR 0074).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.DraftRequests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.DraftRequests', N'ArchitectureId') IS NULL
BEGIN
    ALTER TABLE dbo.DraftRequests
        ADD ArchitectureId UNIQUEIDENTIFIER NULL;
END;
GO

IF OBJECT_ID(N'dbo.DraftRequests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.DraftRequests', N'ArchitectureId') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.foreign_keys
       WHERE name = N'FK_DraftRequests_Architectures')
BEGIN
    ALTER TABLE dbo.DraftRequests
        ADD CONSTRAINT FK_DraftRequests_Architectures
            FOREIGN KEY (ArchitectureId) REFERENCES dbo.Architectures (ArchitectureId);
END;
GO

SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID(N'dbo.DraftRequests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.DraftRequests', N'ArchitectureId') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_DraftRequests_Scope_ArchitectureId'
         AND object_id = OBJECT_ID(N'dbo.DraftRequests'))
BEGIN
    CREATE INDEX IX_DraftRequests_Scope_ArchitectureId
        ON dbo.DraftRequests (TenantId, WorkspaceId, ProjectId, ArchitectureId)
        WHERE ArchitectureId IS NOT NULL;
END;
GO
