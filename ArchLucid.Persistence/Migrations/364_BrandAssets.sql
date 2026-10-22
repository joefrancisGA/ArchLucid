/*
  364: Tenant brand assets (BR-02).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.BrandAssets', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.BrandAssets
    (
        AssetId            UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_BrandAssets PRIMARY KEY CLUSTERED,
        TenantId           UNIQUEIDENTIFIER NOT NULL,
        AssetType          INT               NOT NULL,
        OriginalFileName   NVARCHAR(512)     NOT NULL,
        MimeType           NVARCHAR(128)     NOT NULL,
        Width              INT               NULL,
        Height             INT               NULL,
        StorageReference   NVARCHAR(2048)    NOT NULL,
        ChecksumSha256     VARBINARY(32)     NOT NULL,
        Status             INT               NOT NULL,
        CreatedUtc         DATETIME2         NOT NULL,
        UpdatedUtc         DATETIME2         NOT NULL,
        CreatedBy          NVARCHAR(256)     NULL
    );

    CREATE NONCLUSTERED INDEX IX_BrandAssets_Tenant_Status
        ON dbo.BrandAssets (TenantId, Status);
END;
GO
