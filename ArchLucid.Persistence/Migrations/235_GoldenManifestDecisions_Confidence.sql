/*
  TB-050 — manifest decision confidence + source for operator-facing uncertainty.
*/

IF OBJECT_ID(N'dbo.GoldenManifestDecisions', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GoldenManifestDecisions', N'Confidence') IS NULL
    ALTER TABLE dbo.GoldenManifestDecisions ADD Confidence FLOAT NULL;
GO

IF OBJECT_ID(N'dbo.GoldenManifestDecisions', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GoldenManifestDecisions', N'ConfidenceSource') IS NULL
    ALTER TABLE dbo.GoldenManifestDecisions ADD ConfidenceSource NVARCHAR(32) NULL;
GO
