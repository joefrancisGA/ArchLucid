/*
  R220: Rollback 220_TenantMarketingAttribution.sql — drop first-touch attribution table.
*/

IF OBJECT_ID(N'dbo.TenantMarketingAttribution', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.TenantMarketingAttribution;
END;
GO
