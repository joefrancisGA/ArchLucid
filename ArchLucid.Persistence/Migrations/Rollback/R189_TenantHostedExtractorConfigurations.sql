/*
  R189: Rollback 189_TenantHostedExtractorConfigurations.sql — remove per-tenant hosted extractor configuration table.
*/

IF OBJECT_ID(N'dbo.TenantHostedExtractorConfigurations', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.TenantHostedExtractorConfigurations;
END;
GO
