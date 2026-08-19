/*
  R227: Rollback 227_FindingRecords_ReasoningTrace.sql — drop bounded agent reasoning columns on finding rows.
*/

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NULL
BEGIN
    RETURN;
END;
GO

IF COL_LENGTH(N'dbo.FindingRecords', N'ReasoningTraceDigestSha256') IS NOT NULL
    ALTER TABLE dbo.FindingRecords DROP COLUMN ReasoningTraceDigestSha256;
GO

IF COL_LENGTH(N'dbo.FindingRecords', N'ReasoningTrace') IS NOT NULL
    ALTER TABLE dbo.FindingRecords DROP COLUMN ReasoningTrace;
GO
