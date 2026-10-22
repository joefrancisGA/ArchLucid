/*
  160: Optional tenant-owned branding for first-value Markdown/PDF exports (logo URL + company display name).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.Tenants', N'BrandingLogoUrl') IS NULL
BEGIN
    ALTER TABLE dbo.Tenants ADD
        BrandingLogoUrl NVARCHAR(2048) NULL,
        BrandingCompanyName NVARCHAR(256) NULL;
END;
GO
