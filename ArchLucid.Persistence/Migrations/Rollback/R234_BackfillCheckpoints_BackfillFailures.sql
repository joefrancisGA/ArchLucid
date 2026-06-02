IF OBJECT_ID(N'dbo.BackfillFailures', N'U') IS NOT NULL
    DROP TABLE dbo.BackfillFailures;
GO

IF OBJECT_ID(N'dbo.BackfillCheckpoints', N'U') IS NOT NULL
    DROP TABLE dbo.BackfillCheckpoints;
GO
