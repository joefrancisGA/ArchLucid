/* Run retry metadata (docs/library/STATE_MACHINES.md). */

IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'RetryCount') IS NULL
    ALTER TABLE dbo.Runs ADD RetryCount INT NOT NULL CONSTRAINT DF_Runs_RetryCount_Db128 DEFAULT (0);
GO

IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'LastFailureReason') IS NULL
    ALTER TABLE dbo.Runs ADD LastFailureReason NVARCHAR(2000) NULL;
GO
