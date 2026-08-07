/*
  Rollback 297_TenantCatalogMigrations.sql —
  drop tenant catalog migration fan-out state (no row restore).
*/

SET NOCOUNT ON;
GO

IF EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'UX_TenantCatalogMigrations_Tenant_Active'
      AND object_id = OBJECT_ID(N'dbo.TenantCatalogMigrations', N'U'))
BEGIN
    DROP INDEX UX_TenantCatalogMigrations_Tenant_Active ON dbo.TenantCatalogMigrations;
END;
GO

IF OBJECT_ID(N'dbo.TenantCatalogMigrations', N'U') IS NOT NULL
    DROP TABLE dbo.TenantCatalogMigrations;
GO
