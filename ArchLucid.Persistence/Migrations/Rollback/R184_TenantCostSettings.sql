/*
  R184: Rollback 184_TenantCostSettings.sql — remove per-tenant ROI cost assumptions table.
*/

IF OBJECT_ID(N'dbo.TenantCostSettings', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.TenantCostSettings;
END;
GO
