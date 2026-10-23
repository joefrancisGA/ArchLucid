/*
  R415: Rollback 415_AzureInventoryDefenderCompanions.sql.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.AzureInventoryDefenderSecurityContacts', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.AzureInventoryDefenderSecurityContacts;
END;
GO

IF OBJECT_ID(N'dbo.AzureInventoryDefenderAssessmentCounts', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.AzureInventoryDefenderAssessmentCounts;
END;
GO

IF OBJECT_ID(N'dbo.AzureInventoryDefenderAssessments', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.AzureInventoryDefenderAssessments;
END;
GO

IF OBJECT_ID(N'dbo.AzureInventoryDefenderScoreControls', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.AzureInventoryDefenderScoreControls;
END;
GO

IF OBJECT_ID(N'dbo.AzureInventoryDefenderPricings', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.AzureInventoryDefenderPricings;
END;
GO
