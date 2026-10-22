/* Rollback 160: remove optional first-value export branding columns from dbo.Tenants. */
SET XACT_ABORT ON;

IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Tenants', N'BrandingCompanyName') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Tenants DROP COLUMN BrandingCompanyName;
END;
GO

IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Tenants', N'BrandingLogoUrl') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Tenants DROP COLUMN BrandingLogoUrl;
END;
GO
