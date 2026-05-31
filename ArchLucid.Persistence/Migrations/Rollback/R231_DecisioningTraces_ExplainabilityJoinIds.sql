/*
  R231: Rollback 231_DecisioningTraces_ExplainabilityJoinIds.sql — drop explainability join ids + prompt refs + warnings on authority traces.
*/

IF OBJECT_ID(N'dbo.DecisioningTraces', N'U') IS NULL
BEGIN
    RETURN;
END;
GO

IF COL_LENGTH(N'dbo.DecisioningTraces', N'WarningsJson') IS NOT NULL
    ALTER TABLE dbo.DecisioningTraces DROP COLUMN WarningsJson;
GO

IF COL_LENGTH(N'dbo.DecisioningTraces', N'PromptRefsJson') IS NOT NULL
    ALTER TABLE dbo.DecisioningTraces DROP COLUMN PromptRefsJson;
GO

IF COL_LENGTH(N'dbo.DecisioningTraces', N'FindingsSnapshotId') IS NOT NULL
    ALTER TABLE dbo.DecisioningTraces DROP COLUMN FindingsSnapshotId;
GO

IF COL_LENGTH(N'dbo.DecisioningTraces', N'GraphSnapshotId') IS NOT NULL
    ALTER TABLE dbo.DecisioningTraces DROP COLUMN GraphSnapshotId;
GO

IF COL_LENGTH(N'dbo.DecisioningTraces', N'ContextSnapshotId') IS NOT NULL
    ALTER TABLE dbo.DecisioningTraces DROP COLUMN ContextSnapshotId;
GO
