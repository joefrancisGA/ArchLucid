/*
  TB-112 — run-level operator governance disposition on dbo.Runs.
*/

IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'OperatorGovernanceDecision') IS NULL
    ALTER TABLE dbo.Runs ADD OperatorGovernanceDecision NVARCHAR(32) NULL;
GO

IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'OperatorGovernanceDecisionRationale') IS NULL
    ALTER TABLE dbo.Runs ADD OperatorGovernanceDecisionRationale NVARCHAR(2000) NULL;
GO

IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'OperatorGovernanceDecisionUtc') IS NULL
    ALTER TABLE dbo.Runs ADD OperatorGovernanceDecisionUtc DATETIME2(7) NULL;
GO

IF OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Runs', N'OperatorGovernanceDecisionByUserId') IS NULL
    ALTER TABLE dbo.Runs ADD OperatorGovernanceDecisionByUserId NVARCHAR(256) NULL;
GO
