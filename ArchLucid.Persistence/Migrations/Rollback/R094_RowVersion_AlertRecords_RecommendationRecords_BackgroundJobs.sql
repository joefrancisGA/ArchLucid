/*
  R094: Roll back 094 — remove RowVersionStamp from dbo.AlertRecords, dbo.RecommendationRecords, dbo.BackgroundJobs.

  Warning: concurrent writers may lose optimistic-concurrency tokens after rollback; coordinate with app deploy.
*/

IF OBJECT_ID(N'dbo.AlertRecords', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AlertRecords', N'RowVersionStamp') IS NOT NULL
    ALTER TABLE dbo.AlertRecords DROP COLUMN RowVersionStamp;
GO

IF OBJECT_ID(N'dbo.RecommendationRecords', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.RecommendationRecords', N'RowVersionStamp') IS NOT NULL
    ALTER TABLE dbo.RecommendationRecords DROP COLUMN RowVersionStamp;
GO

IF OBJECT_ID(N'dbo.BackgroundJobs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.BackgroundJobs', N'RowVersionStamp') IS NOT NULL
    ALTER TABLE dbo.BackgroundJobs DROP COLUMN RowVersionStamp;
GO
