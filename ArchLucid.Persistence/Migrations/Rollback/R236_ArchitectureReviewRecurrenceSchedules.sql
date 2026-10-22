/*
  R236: Rollback 236_ArchitectureReviewRecurrenceSchedules.sql — drop recurrence schedule table.
*/

IF OBJECT_ID(N'dbo.ArchitectureReviewRecurrenceSchedules', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.ArchitectureReviewRecurrenceSchedules;
END;
GO
