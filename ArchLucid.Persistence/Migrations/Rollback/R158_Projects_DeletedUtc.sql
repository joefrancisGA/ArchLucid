/* Rollback 158: remove DeletedUtc from dbo.Projects. */
SET XACT_ABORT ON;

IF OBJECT_ID(N'dbo.Projects', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Projects', N'DeletedUtc') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Projects DROP COLUMN DeletedUtc;
END;
GO
