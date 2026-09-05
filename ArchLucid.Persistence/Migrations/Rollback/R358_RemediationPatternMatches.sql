/*
  Rollback 358: drop remediation pattern match tables.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.RemediationPatternMatchConflicts', N'U') IS NOT NULL
    DROP TABLE dbo.RemediationPatternMatchConflicts;
GO

IF OBJECT_ID(N'dbo.RemediationPatternMatchResults', N'U') IS NOT NULL
    DROP TABLE dbo.RemediationPatternMatchResults;
GO
