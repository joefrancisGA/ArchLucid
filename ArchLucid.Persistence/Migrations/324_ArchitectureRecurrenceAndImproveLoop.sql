/*
  324 — Architecture-scoped recurrence schedules and persisted improve-loop evidence on runs.
*/

IF OBJECT_ID(N'dbo.ArchitectureReviewRecurrenceSchedules', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ArchitectureReviewRecurrenceSchedules', N'ArchitectureId') IS NULL
BEGIN
    ALTER TABLE dbo.ArchitectureReviewRecurrenceSchedules ADD ArchitectureId UNIQUEIDENTIFIER NULL;

    CREATE NONCLUSTERED INDEX IX_ArchitectureReviewRecurrenceSchedules_ArchitectureId
        ON dbo.ArchitectureReviewRecurrenceSchedules (TenantId, ArchitectureId)
        WHERE ArchitectureId IS NOT NULL;
END;
GO

IF COL_LENGTH(N'dbo.Runs', N'ImproveLoopEvidenceJson') IS NULL
BEGIN
    ALTER TABLE dbo.Runs ADD ImproveLoopEvidenceJson NVARCHAR(MAX) NULL;
END;
GO
