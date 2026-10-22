-- Adds ROWVERSION columns for optimistic concurrency on high-churn tables (Runs wired in app code; others reserved for future updates).

IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'RowVersionStamp') IS NULL
    ALTER TABLE dbo.Runs ADD RowVersionStamp ROWVERSION;

IF OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GoldenManifests', N'RowVersionStamp') IS NULL
    ALTER TABLE dbo.GoldenManifests ADD RowVersionStamp ROWVERSION;

IF OBJECT_ID(N'dbo.PolicyPackAssignments', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.PolicyPackAssignments', N'RowVersionStamp') IS NULL
    ALTER TABLE dbo.PolicyPackAssignments ADD RowVersionStamp ROWVERSION;
