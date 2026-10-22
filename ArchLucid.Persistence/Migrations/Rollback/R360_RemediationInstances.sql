/*
  Rollback 360: Remediation instances and evidence (IE-13).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.RemediationEvidence', N'U') IS NOT NULL
    DROP TABLE dbo.RemediationEvidence;
GO

IF OBJECT_ID(N'dbo.RemediationInstances', N'U') IS NOT NULL
    DROP TABLE dbo.RemediationInstances;
GO
