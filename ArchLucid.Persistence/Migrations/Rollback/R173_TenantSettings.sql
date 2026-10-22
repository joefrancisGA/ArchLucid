/*
  R173: Rollback 173_TenantSettings.sql — remove per-tenant key/value settings table.
*/

IF OBJECT_ID(N'dbo.TenantSettings', N'U') IS NOT NULL
    DROP TABLE dbo.TenantSettings;
GO
