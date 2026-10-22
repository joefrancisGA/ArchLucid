/* Rollback for migration 336: drop governance environment catalog tables. */

IF OBJECT_ID(N'dbo.GovernanceEnvironmentTransitions', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.GovernanceEnvironmentTransitions;
END;
GO

IF OBJECT_ID(N'dbo.GovernanceEnvironmentDefinitions', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.GovernanceEnvironmentDefinitions;
END;
GO
