/*
  365: Tenant branding co-branding flag (BR-04).
*/

IF COL_LENGTH(N'dbo.TenantBrandingProfiles', N'CoBrandingEnabled') IS NOT NULL
BEGIN
    ALTER TABLE dbo.TenantBrandingProfiles DROP CONSTRAINT DF_TenantBrandingProfiles_CoBrandingEnabled;
    ALTER TABLE dbo.TenantBrandingProfiles DROP COLUMN CoBrandingEnabled;
END;
GO
