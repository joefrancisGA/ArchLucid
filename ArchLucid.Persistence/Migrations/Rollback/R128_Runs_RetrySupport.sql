/* Rollback for 128_Runs_RetrySupport.sql */

IF COL_LENGTH(N'dbo.Runs', N'LastFailureReason') IS NOT NULL
    ALTER TABLE dbo.Runs DROP COLUMN LastFailureReason;
GO

IF COL_LENGTH(N'dbo.Runs', N'RetryCount') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Runs DROP CONSTRAINT DF_Runs_RetryCount_Db128;
    ALTER TABLE dbo.Runs DROP COLUMN RetryCount;
END;
GO
