-- ADR 0064: buyer-vocabulary spine table rename + synonyms for existing SQL text.
-- Existing catalogs: rename base tables, then expose legacy names as synonyms.
-- Greenfield ArchLucid.sql creates legacy names then applies the same rename+synonym block at end.

IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL AND OBJECT_ID(N'dbo.Reviews', N'U') IS NULL
BEGIN
    EXEC sp_rename N'dbo.Runs', N'Reviews';
END;
GO

IF OBJECT_ID(N'dbo.Reviews', N'U') IS NOT NULL AND OBJECT_ID(N'dbo.Runs', N'SN') IS NULL
BEGIN
    CREATE SYNONYM dbo.Runs FOR dbo.Reviews;
END;
GO

IF OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL AND OBJECT_ID(N'dbo.SignedReviewRecords', N'U') IS NULL
BEGIN
    EXEC sp_rename N'dbo.GoldenManifests', N'SignedReviewRecords';
END;
GO

IF OBJECT_ID(N'dbo.SignedReviewRecords', N'U') IS NOT NULL AND OBJECT_ID(N'dbo.GoldenManifests', N'SN') IS NULL
BEGIN
    CREATE SYNONYM dbo.GoldenManifests FOR dbo.SignedReviewRecords;
END;
GO

IF OBJECT_ID(N'dbo.CommitRunIdempotency', N'U') IS NOT NULL AND OBJECT_ID(N'dbo.FinalizeReviewIdempotency', N'U') IS NULL
BEGIN
    EXEC sp_rename N'dbo.CommitRunIdempotency', N'FinalizeReviewIdempotency';
END;
GO

IF OBJECT_ID(N'dbo.FinalizeReviewIdempotency', N'U') IS NOT NULL AND OBJECT_ID(N'dbo.CommitRunIdempotency', N'SN') IS NULL
BEGIN
    CREATE SYNONYM dbo.CommitRunIdempotency FOR dbo.FinalizeReviewIdempotency;
END;
GO
