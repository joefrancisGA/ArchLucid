/*
  R256: Rollback 256_FindingsSnapshots_ChecklistCoverage.sql — drop TB-384 checklist coverage header columns.
*/

IF OBJECT_ID(N'dbo.FindingsSnapshots', N'U') IS NULL
BEGIN
    RETURN;
END;
GO

IF COL_LENGTH(N'dbo.FindingsSnapshots', N'InsightDensityRetainedCount') IS NOT NULL
    ALTER TABLE dbo.FindingsSnapshots DROP COLUMN InsightDensityRetainedCount;
GO

IF COL_LENGTH(N'dbo.FindingsSnapshots', N'InsightDensityDemotedCount') IS NOT NULL
    ALTER TABLE dbo.FindingsSnapshots DROP COLUMN InsightDensityDemotedCount;
GO

IF COL_LENGTH(N'dbo.FindingsSnapshots', N'ChecklistCoverageJson') IS NOT NULL
    ALTER TABLE dbo.FindingsSnapshots DROP COLUMN ChecklistCoverageJson;
GO
