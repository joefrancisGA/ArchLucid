/*
  Rollback 357: drop remediation pattern tables.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.RemediationPatternVersions', N'U') IS NOT NULL
    DROP TABLE dbo.RemediationPatternVersions;
GO

IF OBJECT_ID(N'dbo.RemediationPatterns', N'U') IS NOT NULL
    DROP TABLE dbo.RemediationPatterns;
GO
