/*
  365: Tenant branding co-branding flag (BR-04).
*/

SET NOCOUNT ON;
GO

IF COL_LENGTH(N'dbo.TenantBrandingProfiles', N'CoBrandingEnabled') IS NULL
BEGIN
    ALTER TABLE dbo.TenantBrandingProfiles
        ADD CoBrandingEnabled BIT NOT NULL
            CONSTRAINT DF_TenantBrandingProfiles_CoBrandingEnabled DEFAULT (0);
END;
GO
