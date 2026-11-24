/* Existing tenants have no recorded erasure approval until it is explicitly granted. */
IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.Tenants', N'TenantErasureApprovedUtc') IS NULL
        ALTER TABLE dbo.Tenants ADD TenantErasureApprovedUtc DATETIMEOFFSET(7) NULL;

    IF COL_LENGTH(N'dbo.Tenants', N'TenantErasureApprovedByUserId') IS NULL
        ALTER TABLE dbo.Tenants ADD TenantErasureApprovedByUserId NVARCHAR(256) NULL;
END;
GO
