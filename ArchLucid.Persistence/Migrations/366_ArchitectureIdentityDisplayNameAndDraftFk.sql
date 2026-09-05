/*
  366: ADR 0074 — architecture display name + draft FK to identity (DA-02).
*/

IF OBJECT_ID(N'dbo.Architectures', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Architectures', N'DisplayName') IS NULL
BEGIN
    ALTER TABLE dbo.Architectures
        ADD DisplayName NVARCHAR(200) NULL,
            Description NVARCHAR(500) NULL;

    UPDATE dbo.Architectures
    SET DisplayName = N'Untitled architecture'
    WHERE DisplayName IS NULL;

    ALTER TABLE dbo.Architectures
        ALTER COLUMN DisplayName NVARCHAR(200) NOT NULL;
END;
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
       WHERE name = N'FK_DraftRequests_Architectures'
         AND parent_object_id = OBJECT_ID(N'dbo.DraftRequests'))
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
