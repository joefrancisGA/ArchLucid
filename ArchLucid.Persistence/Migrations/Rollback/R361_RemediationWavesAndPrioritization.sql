/*
  Rollback 361: Remediation waves, prioritization weights/scores (IE-15).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.RemediationWaveMembers', N'U') IS NOT NULL
    DROP TABLE dbo.RemediationWaveMembers;
GO

IF OBJECT_ID(N'dbo.RemediationWaves', N'U') IS NOT NULL
    DROP TABLE dbo.RemediationWaves;
GO

IF OBJECT_ID(N'dbo.RemediationPrioritizationScores', N'U') IS NOT NULL
    DROP TABLE dbo.RemediationPrioritizationScores;
GO

IF OBJECT_ID(N'dbo.RemediationPrioritizationWeights', N'U') IS NOT NULL
    DROP TABLE dbo.RemediationPrioritizationWeights;
GO
