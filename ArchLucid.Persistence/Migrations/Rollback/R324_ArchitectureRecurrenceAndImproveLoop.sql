/*
  R324: Rollback 324_ArchitectureRecurrenceAndImproveLoop.sql —
  drop the recurrence ArchitectureId index/column, then drop ImproveLoopEvidenceJson
  from the physical run/review table (dbo.Reviews after ADR 0064, else dbo.Runs).
*/

SET QUOTED_IDENTIFIER ON;
GO

IF EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_ArchitectureReviewRecurrenceSchedules_ArchitectureId'
      AND object_id = OBJECT_ID(N'dbo.ArchitectureReviewRecurrenceSchedules'))
    DROP INDEX IX_ArchitectureReviewRecurrenceSchedules_ArchitectureId
        ON dbo.ArchitectureReviewRecurrenceSchedules;
GO

IF OBJECT_ID(N'dbo.ArchitectureReviewRecurrenceSchedules', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ArchitectureReviewRecurrenceSchedules', N'ArchitectureId') IS NOT NULL
    ALTER TABLE dbo.ArchitectureReviewRecurrenceSchedules DROP COLUMN ArchitectureId;
GO

DECLARE @runTable sysname =
    CASE
        WHEN OBJECT_ID(N'dbo.Reviews', N'U') IS NOT NULL THEN N'dbo.Reviews'
        WHEN OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL THEN N'dbo.Runs'
    END;

DECLARE @sql NVARCHAR(MAX);

IF @runTable IS NOT NULL
   AND COL_LENGTH(@runTable, N'ImproveLoopEvidenceJson') IS NOT NULL
BEGIN
    SET @sql = N'ALTER TABLE ' + @runTable + N' DROP COLUMN ImproveLoopEvidenceJson;';

    EXEC sp_executesql @sql;
END
GO
