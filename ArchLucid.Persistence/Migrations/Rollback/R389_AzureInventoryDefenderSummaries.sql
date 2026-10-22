/*
  R389: Rollback 389_AzureInventoryDefenderSummaries.sql — drop dbo.AzureInventoryDefenderSummaries.
*/

IF OBJECT_ID(N'dbo.AzureInventoryDefenderSummaries', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.AzureInventoryDefenderSummaries;
END;
GO
