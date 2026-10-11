/*
  Rollback 410: SecureNow collection schedule.
*/

SET NOCOUNT ON;
GO

IF COL_LENGTH(N'dbo.SecureNowCollectionRuns', N'ScheduleDescription') IS NOT NULL
BEGIN
    ALTER TABLE dbo.SecureNowCollectionRuns
        DROP COLUMN ScheduleDescription;
END;
GO
