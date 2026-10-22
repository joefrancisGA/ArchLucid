/* Rollback for migration 334: drop platform operational error inbox table. */

IF OBJECT_ID(N'dbo.PlatformOperationalErrors', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.PlatformOperationalErrors;
END;
GO
