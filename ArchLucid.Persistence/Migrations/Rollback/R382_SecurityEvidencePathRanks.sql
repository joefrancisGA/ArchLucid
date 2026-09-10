/*
  Rollback 382: SecureNow architect — path ranking breakdown (SA-09).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.SecurityEvidencePathRanks', N'U') IS NOT NULL
    DROP TABLE dbo.SecurityEvidencePathRanks;
GO

IF OBJECT_ID(N'dbo.SecurityEvidencePathRankWeights', N'U') IS NOT NULL
    DROP TABLE dbo.SecurityEvidencePathRankWeights;
GO
