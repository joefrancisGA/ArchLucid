/*
  341: Wave-3 robustness — content-addressed draft revision pin at spawn.

  - DraftRequests.DocumentContentHashSha256 tracks canonical document JSON hash.
  - DraftRequests.SpawnedDocumentContentHashSha256 pins document body at RunSpawned transition.
*/

IF OBJECT_ID(N'dbo.DraftRequests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.DraftRequests', N'DocumentContentHashSha256') IS NULL
BEGIN
    ALTER TABLE dbo.DraftRequests
        ADD DocumentContentHashSha256 VARBINARY(32) NULL;
END;
GO

IF OBJECT_ID(N'dbo.DraftRequests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.DraftRequests', N'SpawnedDocumentContentHashSha256') IS NULL
BEGIN
    ALTER TABLE dbo.DraftRequests
        ADD SpawnedDocumentContentHashSha256 VARBINARY(32) NULL;
END;
GO
