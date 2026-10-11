/*
  410: SecureNow collection schedule reported by the customer agent.
*/

SET NOCOUNT ON;
GO

IF COL_LENGTH(N'dbo.SecureNowCollectionRuns', N'ScheduleDescription') IS NULL
BEGIN
    ALTER TABLE dbo.SecureNowCollectionRuns
        ADD ScheduleDescription NVARCHAR(400) NULL;
END;
GO
