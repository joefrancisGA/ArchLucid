/*
  R416: Rollback 416_AzureInventoryDefenderFollowOn.sql.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.AzureInventoryDefenderVulnerabilityFindings', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.AzureInventoryDefenderVulnerabilityFindings;
END;
GO

IF OBJECT_ID(N'dbo.AzureInventoryDefenderVulnerabilityCounts', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.AzureInventoryDefenderVulnerabilityCounts;
END;
GO

IF OBJECT_ID(N'dbo.AzureInventoryDefenderAttackPaths', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.AzureInventoryDefenderAttackPaths;
END;
GO

IF OBJECT_ID(N'dbo.AzureInventoryDefenderAlerts', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.AzureInventoryDefenderAlerts;
END;
GO

IF OBJECT_ID(N'dbo.AzureInventoryDefenderComplianceControls', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.AzureInventoryDefenderComplianceControls;
END;
GO

IF OBJECT_ID(N'dbo.AzureInventoryDefenderComplianceStandards', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.AzureInventoryDefenderComplianceStandards;
END;
GO

IF OBJECT_ID(N'dbo.AzureInventoryDefenderGovernanceAssignments', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.AzureInventoryDefenderGovernanceAssignments;
END;
GO
