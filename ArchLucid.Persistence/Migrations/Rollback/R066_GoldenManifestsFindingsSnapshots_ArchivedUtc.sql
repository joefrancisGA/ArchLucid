IF OBJECT_ID(N'dbo.FindingsSnapshots', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.FindingsSnapshots', N'ArchivedUtc') IS NOT NULL
    ALTER TABLE dbo.FindingsSnapshots DROP COLUMN ArchivedUtc;

IF OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GoldenManifests', N'ArchivedUtc') IS NOT NULL
    ALTER TABLE dbo.GoldenManifests DROP COLUMN ArchivedUtc;
