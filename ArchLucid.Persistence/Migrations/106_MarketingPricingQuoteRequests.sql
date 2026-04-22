/*
  106: Anonymous marketing pricing quote requests (append-only; no RLS — not tenant-scoped).

  API enforces rate limiting + honeypot; inserts use the app connection (no SESSION_CONTEXT tenant requirement).
*/
IF OBJECT_ID(N'dbo.MarketingPricingQuoteRequests', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.MarketingPricingQuoteRequests
    (
        Id            UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_MarketingPricingQuoteRequests PRIMARY KEY CLUSTERED
            CONSTRAINT DF_MarketingPricingQuoteRequests_Id DEFAULT NEWSEQUENTIALID(),
        CreatedUtc    DATETIME2(7)     NOT NULL
            CONSTRAINT DF_MarketingPricingQuoteRequests_CreatedUtc DEFAULT SYSUTCDATETIME(),
        WorkEmail     NVARCHAR(320)    NOT NULL,
        CompanyName   NVARCHAR(200)    NOT NULL,
        TierInterest  NVARCHAR(120)    NOT NULL,
        Message       NVARCHAR(2000)   NOT NULL,
        ClientIpHash  VARBINARY(32)    NULL
    );

    CREATE NONCLUSTERED INDEX IX_MarketingPricingQuoteRequests_CreatedUtc
        ON dbo.MarketingPricingQuoteRequests (CreatedUtc DESC);
END;
GO
