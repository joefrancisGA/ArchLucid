/*
  Rollback 162: remove dbo.HostLlmCostEstimationUsdRates (introduced in 162_HostLlmCostEstimationUsdRates.sql).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.HostLlmCostEstimationUsdRates', N'U') IS NOT NULL
    DROP TABLE dbo.HostLlmCostEstimationUsdRates;
GO
