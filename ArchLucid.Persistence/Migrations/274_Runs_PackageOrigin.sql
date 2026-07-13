-- TB-740: architecture package origin badges (created vs reviewed) on dbo.Runs.

IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'PackageOrigin') IS NULL
BEGIN
    ALTER TABLE dbo.Runs ADD PackageOrigin NVARCHAR(16) NULL;
END;
GO
