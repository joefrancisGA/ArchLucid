-- TB-384: persist checklist coverage separately from decision-grade findings on snapshot headers.
IF COL_LENGTH(N'dbo.FindingsSnapshots', N'ChecklistCoverageJson') IS NULL
    ALTER TABLE dbo.FindingsSnapshots ADD ChecklistCoverageJson NVARCHAR(MAX) NULL;

IF COL_LENGTH(N'dbo.FindingsSnapshots', N'InsightDensityDemotedCount') IS NULL
    ALTER TABLE dbo.FindingsSnapshots ADD InsightDensityDemotedCount INT NULL;

IF COL_LENGTH(N'dbo.FindingsSnapshots', N'InsightDensityRetainedCount') IS NULL
    ALTER TABLE dbo.FindingsSnapshots ADD InsightDensityRetainedCount INT NULL;
