/*
  340: Wave-2 robustness — artifact hash provenance on versions; draft spawn revision pin.

  - ArchitectureVersions.IntakeRequestHashSha256 stores intake body hash separately from artifact ContentHashSha256.
  - DraftRequests.SpawnedArchitectureVersionId pins the revision evaluated at spawn.
*/

IF COL_LENGTH(N'dbo.ArchitectureVersions', N'IntakeRequestHashSha256') IS NULL
BEGIN
    ALTER TABLE dbo.ArchitectureVersions
        ADD IntakeRequestHashSha256 VARBINARY(32) NULL;
END;
GO

UPDATE dbo.ArchitectureVersions
SET IntakeRequestHashSha256 = ContentHashSha256
WHERE IntakeRequestHashSha256 IS NULL;
GO

IF OBJECT_ID(N'dbo.DraftRequests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.DraftRequests', N'SpawnedArchitectureVersionId') IS NULL
BEGIN
    ALTER TABLE dbo.DraftRequests
        ADD SpawnedArchitectureVersionId UNIQUEIDENTIFIER NULL;
END;
GO

IF OBJECT_ID(N'dbo.DraftRequests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.DraftRequests', N'SpawnedArchitectureVersionId') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_DraftRequests_SpawnedArchitectureVersionId'
         AND object_id = OBJECT_ID(N'dbo.DraftRequests'))
BEGIN
    CREATE INDEX IX_DraftRequests_SpawnedArchitectureVersionId
        ON dbo.DraftRequests (TenantId, WorkspaceId, ProjectId, SpawnedArchitectureVersionId)
        WHERE SpawnedArchitectureVersionId IS NOT NULL;
END;
GO
