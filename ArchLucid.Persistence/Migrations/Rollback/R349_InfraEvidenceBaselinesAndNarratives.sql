/*
  Rollback 349: drop infrastructure-evidence baselines, drift approvals, and diff narratives.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.AzureInventoryDiffNarratives', N'U') IS NOT NULL
    DROP TABLE dbo.AzureInventoryDiffNarratives;
GO

IF OBJECT_ID(N'dbo.AzureInventoryDriftApprovals', N'U') IS NOT NULL
    DROP TABLE dbo.AzureInventoryDriftApprovals;
GO

IF OBJECT_ID(N'dbo.AzureInventoryBaselines', N'U') IS NOT NULL
    DROP TABLE dbo.AzureInventoryBaselines;
GO
