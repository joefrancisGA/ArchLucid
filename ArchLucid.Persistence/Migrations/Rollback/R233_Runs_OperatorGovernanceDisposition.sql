/*
  R233: Rollback 233_Runs_OperatorGovernanceDisposition.sql — drop run-level operator governance disposition columns.
*/

IF OBJECT_ID(N'dbo.Runs', N'U') IS NULL
BEGIN
    RETURN;
END;
GO

IF COL_LENGTH(N'dbo.Runs', N'OperatorGovernanceDecisionByUserId') IS NOT NULL
    ALTER TABLE dbo.Runs DROP COLUMN OperatorGovernanceDecisionByUserId;
GO

IF COL_LENGTH(N'dbo.Runs', N'OperatorGovernanceDecisionUtc') IS NOT NULL
    ALTER TABLE dbo.Runs DROP COLUMN OperatorGovernanceDecisionUtc;
GO

IF COL_LENGTH(N'dbo.Runs', N'OperatorGovernanceDecisionRationale') IS NOT NULL
    ALTER TABLE dbo.Runs DROP COLUMN OperatorGovernanceDecisionRationale;
GO

IF COL_LENGTH(N'dbo.Runs', N'OperatorGovernanceDecision') IS NOT NULL
    ALTER TABLE dbo.Runs DROP COLUMN OperatorGovernanceDecision;
GO
