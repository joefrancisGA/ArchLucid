/*
  R242: Rollback 242_TrialArchitecturePreseedAttemptTracking.sql.
*/
IF COL_LENGTH(N'dbo.Tenants', N'TrialArchitecturePreseedAttemptCount') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Tenants DROP CONSTRAINT IF EXISTS DF_Tenants_TrialArchitecturePreseedAttemptCount;
    ALTER TABLE dbo.Tenants DROP COLUMN TrialArchitecturePreseedAttemptCount;
END;
GO

IF COL_LENGTH(N'dbo.Tenants', N'TrialArchitecturePreseedFailedUtc') IS NOT NULL
    ALTER TABLE dbo.Tenants DROP COLUMN TrialArchitecturePreseedFailedUtc;
GO

IF COL_LENGTH(N'dbo.Tenants', N'TrialArchitecturePreseedLastError') IS NOT NULL
    ALTER TABLE dbo.Tenants DROP COLUMN TrialArchitecturePreseedLastError;
GO
