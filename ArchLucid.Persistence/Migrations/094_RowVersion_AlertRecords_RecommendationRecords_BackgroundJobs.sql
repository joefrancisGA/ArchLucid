/*
  094: Optimistic concurrency — add RowVersionStamp (ROWVERSION) to dbo.AlertRecords, dbo.RecommendationRecords,
  dbo.BackgroundJobs (same pattern as dbo.Runs / dbo.GoldenManifests / dbo.PolicyPackAssignments).

  Idempotent: each ALTER TABLE runs only when the table exists and RowVersionStamp is absent.

  Application code can use the column for WHERE RowVersionStamp = @expected on UPDATE when repositories adopt it.

  Rollback: Rollback/R094_RowVersion_AlertRecords_RecommendationRecords_BackgroundJobs.sql
*/

IF OBJECT_ID(N'dbo.AlertRecords', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AlertRecords', N'RowVersionStamp') IS NULL
    ALTER TABLE dbo.AlertRecords ADD RowVersionStamp ROWVERSION;
GO

IF OBJECT_ID(N'dbo.RecommendationRecords', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.RecommendationRecords', N'RowVersionStamp') IS NULL
    ALTER TABLE dbo.RecommendationRecords ADD RowVersionStamp ROWVERSION;
GO

IF OBJECT_ID(N'dbo.BackgroundJobs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.BackgroundJobs', N'RowVersionStamp') IS NULL
    ALTER TABLE dbo.BackgroundJobs ADD RowVersionStamp ROWVERSION;
GO
