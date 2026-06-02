/*
  R235: Rollback 235_GoldenManifestDecisions_Confidence.sql — drop manifest decision confidence columns.
*/

IF OBJECT_ID(N'dbo.GoldenManifestDecisions', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GoldenManifestDecisions', N'ConfidenceSource') IS NOT NULL
    ALTER TABLE dbo.GoldenManifestDecisions DROP COLUMN ConfidenceSource;
GO

IF OBJECT_ID(N'dbo.GoldenManifestDecisions', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GoldenManifestDecisions', N'Confidence') IS NOT NULL
    ALTER TABLE dbo.GoldenManifestDecisions DROP COLUMN Confidence;
GO
