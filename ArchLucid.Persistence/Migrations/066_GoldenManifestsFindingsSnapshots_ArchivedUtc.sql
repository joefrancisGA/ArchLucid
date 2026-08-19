-- Soft-archive alignment: when dbo.Runs are bulk-archived, cascade ArchivedUtc to primary child rows
-- keyed by RunId (same retention semantics as dbo.Runs.ArchivedUtc).
IF OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GoldenManifests', N'ArchivedUtc') IS NULL
    ALTER TABLE dbo.GoldenManifests ADD ArchivedUtc DATETIME2 NULL;

IF OBJECT_ID(N'dbo.FindingsSnapshots', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.FindingsSnapshots', N'ArchivedUtc') IS NULL
    ALTER TABLE dbo.FindingsSnapshots ADD ArchivedUtc DATETIME2 NULL;
