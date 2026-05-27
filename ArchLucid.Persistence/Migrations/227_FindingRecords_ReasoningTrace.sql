-- TB-055 / Batch A: persist bounded agent reasoning on relational finding rows.
IF COL_LENGTH(N'dbo.FindingRecords', N'ReasoningTrace') IS NULL
    ALTER TABLE dbo.FindingRecords ADD ReasoningTrace NVARCHAR(2000) NULL;

IF COL_LENGTH(N'dbo.FindingRecords', N'ReasoningTraceDigestSha256') IS NULL
    ALTER TABLE dbo.FindingRecords ADD ReasoningTraceDigestSha256 NVARCHAR(64) NULL;
