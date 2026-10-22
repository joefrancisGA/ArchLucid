/* Rollback for migration 372: drop bulk-uploaded review evidence file catalog. */

IF OBJECT_ID(N'dbo.RunStoredEvidenceFiles', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.RunStoredEvidenceFiles;
END;
GO
