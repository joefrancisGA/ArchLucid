/*
  Rollback 295_BuyerVocabulary_SpineTableRename.sql —
  drop legacy synonyms, then rename buyer-vocabulary base tables back.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.Runs', N'SN') IS NOT NULL
    DROP SYNONYM dbo.Runs;
GO

IF OBJECT_ID(N'dbo.GoldenManifests', N'SN') IS NOT NULL
    DROP SYNONYM dbo.GoldenManifests;
GO

IF OBJECT_ID(N'dbo.CommitRunIdempotency', N'SN') IS NOT NULL
    DROP SYNONYM dbo.CommitRunIdempotency;
GO

IF OBJECT_ID(N'dbo.Reviews', N'U') IS NOT NULL AND OBJECT_ID(N'dbo.Runs', N'U') IS NULL
BEGIN
    EXEC sp_rename N'dbo.Reviews', N'Runs';
END;
GO

IF OBJECT_ID(N'dbo.SignedReviewRecords', N'U') IS NOT NULL AND OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NULL
BEGIN
    EXEC sp_rename N'dbo.SignedReviewRecords', N'GoldenManifests';
END;
GO

IF OBJECT_ID(N'dbo.FinalizeReviewIdempotency', N'U') IS NOT NULL AND OBJECT_ID(N'dbo.CommitRunIdempotency', N'U') IS NULL
BEGIN
    EXEC sp_rename N'dbo.FinalizeReviewIdempotency', N'CommitRunIdempotency';
END;
GO
