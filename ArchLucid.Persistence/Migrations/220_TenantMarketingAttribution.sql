/*
  220: Immutable first-touch marketing attribution per tenant (TB-019).
*/
IF OBJECT_ID(N'dbo.TenantMarketingAttribution', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantMarketingAttribution
    (
        TenantId       UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_TenantMarketingAttribution PRIMARY KEY CLUSTERED,
        CapturedUtc    DATETIME2(7)     NOT NULL
            CONSTRAINT DF_TenantMarketingAttribution_CapturedUtc DEFAULT SYSUTCDATETIME(),
        UtmSource      NVARCHAR(120)    NULL,
        UtmMedium      NVARCHAR(120)    NULL,
        UtmCampaign    NVARCHAR(120)    NULL,
        UtmContent     NVARCHAR(120)    NULL,
        CoarseMedium   NVARCHAR(32)     NOT NULL,
        CoarsePlatform NVARCHAR(32)     NOT NULL
    );
END;
GO
