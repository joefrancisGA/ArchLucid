/*
  R432 rollback: drop Architecture Intelligence standalone run scope table when reverting migration 432.
*/
SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.ArchitectureIntelligenceStandaloneRuns', N'U') IS NOT NULL
    DROP TABLE dbo.ArchitectureIntelligenceStandaloneRuns;
GO
