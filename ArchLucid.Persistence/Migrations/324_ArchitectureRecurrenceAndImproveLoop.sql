/*
  324 — Architecture-scoped recurrence schedules and persisted improve-loop evidence on runs.

  After ADR 0064 / migration 295, dbo.Runs is a synonym for dbo.Reviews. COL_LENGTH on the
  synonym returns NULL, so ALTER TABLE dbo.Runs raises SQL 4909. ImproveLoopEvidenceJson
  is added on the physical table (dbo.Reviews first, pre-295 dbo.Runs fallback).
*/

IF OBJECT_ID(N'dbo.ArchitectureReviewRecurrenceSchedules', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ArchitectureReviewRecurrenceSchedules', N'ArchitectureId') IS NULL
BEGIN
    ALTER TABLE dbo.ArchitectureReviewRecurrenceSchedules ADD ArchitectureId UNIQUEIDENTIFIER NULL;
END;
GO

SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID(N'dbo.ArchitectureReviewRecurrenceSchedules', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ArchitectureReviewRecurrenceSchedules', N'ArchitectureId') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_ArchitectureReviewRecurrenceSchedules_ArchitectureId'
         AND object_id = OBJECT_ID(N'dbo.ArchitectureReviewRecurrenceSchedules'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_ArchitectureReviewRecurrenceSchedules_ArchitectureId
        ON dbo.ArchitectureReviewRecurrenceSchedules (TenantId, ArchitectureId)
        WHERE ArchitectureId IS NOT NULL;
END;
GO

DECLARE @runTable sysname =
    CASE
        WHEN OBJECT_ID(N'dbo.Reviews', N'U') IS NOT NULL THEN N'dbo.Reviews'
        WHEN OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL THEN N'dbo.Runs'
    END;

DECLARE @sql NVARCHAR(MAX);

IF @runTable IS NOT NULL
   AND COL_LENGTH(@runTable, N'ImproveLoopEvidenceJson') IS NULL
BEGIN
    SET @sql = N'ALTER TABLE ' + @runTable + N' ADD ImproveLoopEvidenceJson NVARCHAR(MAX) NULL;';

    EXEC sp_executesql @sql;
END
GO
