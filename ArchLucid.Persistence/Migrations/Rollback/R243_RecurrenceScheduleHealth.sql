/*
  R243: Rollback 243_RecurrenceScheduleHealth.sql.
*/
IF COL_LENGTH(N'dbo.ArchitectureReviewRecurrenceSchedules', N'LastRunStatus') IS NOT NULL
BEGIN
    ALTER TABLE dbo.ArchitectureReviewRecurrenceSchedules DROP CONSTRAINT IF EXISTS DF_ArchitectureReviewRecurrenceSchedules_LastRunStatus;
    ALTER TABLE dbo.ArchitectureReviewRecurrenceSchedules DROP COLUMN LastRunStatus;
END;
GO

IF COL_LENGTH(N'dbo.ArchitectureReviewRecurrenceSchedules', N'LastErrorMessage') IS NOT NULL
    ALTER TABLE dbo.ArchitectureReviewRecurrenceSchedules DROP COLUMN LastErrorMessage;
GO

IF COL_LENGTH(N'dbo.ArchitectureReviewRecurrenceSchedules', N'ConsecutiveFailureCount') IS NOT NULL
BEGIN
    ALTER TABLE dbo.ArchitectureReviewRecurrenceSchedules DROP CONSTRAINT IF EXISTS DF_ArchitectureReviewRecurrenceSchedules_ConsecutiveFailureCount;
    ALTER TABLE dbo.ArchitectureReviewRecurrenceSchedules DROP COLUMN ConsecutiveFailureCount;
END;
GO
