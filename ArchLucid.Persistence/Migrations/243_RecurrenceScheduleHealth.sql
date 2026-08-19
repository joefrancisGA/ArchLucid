-- Recurrence schedule failure health + auto-disable (TB-262).

IF OBJECT_ID(N'dbo.ArchitectureReviewRecurrenceSchedules', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ArchitectureReviewRecurrenceSchedules', N'LastRunStatus') IS NULL
BEGIN
    ALTER TABLE dbo.ArchitectureReviewRecurrenceSchedules ADD
        LastRunStatus NVARCHAR(32) NOT NULL
            CONSTRAINT DF_ArchitectureReviewRecurrenceSchedules_LastRunStatus DEFAULT (N'never'),
        LastErrorMessage NVARCHAR(2048) NULL,
        ConsecutiveFailureCount INT NOT NULL
            CONSTRAINT DF_ArchitectureReviewRecurrenceSchedules_ConsecutiveFailureCount DEFAULT (0);
END;
GO
