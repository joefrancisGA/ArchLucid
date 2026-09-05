IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'AcknowledgedCoverageJson') IS NULL
BEGIN
    ALTER TABLE dbo.Runs ADD AcknowledgedCoverageJson NVARCHAR(MAX) NULL;
END;
GO
