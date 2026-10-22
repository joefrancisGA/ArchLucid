/* Rollback for migration 371: drop durable advisory draft operations. */

IF OBJECT_ID(N'dbo.AdvisoryDraftOperations', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.AdvisoryDraftOperations;
END;
GO
