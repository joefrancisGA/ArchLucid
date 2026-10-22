/*
  R341: Rollback 341_DraftDocumentContentHashPin.sql —
  drop draft document content hash columns.
*/

IF OBJECT_ID(N'dbo.DraftRequests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.DraftRequests', N'SpawnedDocumentContentHashSha256') IS NOT NULL
BEGIN
    ALTER TABLE dbo.DraftRequests
        DROP COLUMN SpawnedDocumentContentHashSha256;
END;
GO

IF OBJECT_ID(N'dbo.DraftRequests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.DraftRequests', N'DocumentContentHashSha256') IS NOT NULL
BEGIN
    ALTER TABLE dbo.DraftRequests
        DROP COLUMN DocumentContentHashSha256;
END;
GO
