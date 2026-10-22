/*
  R340: Rollback 340_ArchitectureVersionArtifactHash_DraftRevisionPin.sql —
  drop draft spawn revision pin and intake request hash column on architecture versions.
*/

IF OBJECT_ID(N'dbo.DraftRequests', N'U') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_DraftRequests_SpawnedArchitectureVersionId'
         AND object_id = OBJECT_ID(N'dbo.DraftRequests'))
BEGIN
    DROP INDEX IX_DraftRequests_SpawnedArchitectureVersionId ON dbo.DraftRequests;
END;
GO

IF OBJECT_ID(N'dbo.DraftRequests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.DraftRequests', N'SpawnedArchitectureVersionId') IS NOT NULL
BEGIN
    ALTER TABLE dbo.DraftRequests
        DROP COLUMN SpawnedArchitectureVersionId;
END;
GO

IF OBJECT_ID(N'dbo.ArchitectureVersions', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ArchitectureVersions', N'IntakeRequestHashSha256') IS NOT NULL
BEGIN
    ALTER TABLE dbo.ArchitectureVersions
        DROP COLUMN IntakeRequestHashSha256;
END;
GO
