/*
  167: Anonymous marketing early-access / waitlist capture (append-only; no RLS — not tenant-scoped).

  API enforces rate limiting + honeypot; inserts use the app connection (no SESSION_CONTEXT tenant requirement).
*/
IF OBJECT_ID(N'dbo.MarketingEarlyAccessRequests', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.MarketingEarlyAccessRequests
    (
        Id            UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_MarketingEarlyAccessRequests PRIMARY KEY CLUSTERED
            CONSTRAINT DF_MarketingEarlyAccessRequests_Id DEFAULT NEWSEQUENTIALID(),
        CreatedUtc    DATETIME2(7)     NOT NULL
            CONSTRAINT DF_MarketingEarlyAccessRequests_CreatedUtc DEFAULT SYSUTCDATETIME(),
        Email         NVARCHAR(320)    NOT NULL,
        CompanyName   NVARCHAR(200)    NULL,
        Role          NVARCHAR(120)    NULL,
        UtmSource     NVARCHAR(120)    NULL,
        UtmMedium     NVARCHAR(120)    NULL,
        UtmCampaign   NVARCHAR(120)    NULL,
        ClientIpHash  VARBINARY(32)    NULL
    );

    CREATE NONCLUSTERED INDEX IX_MarketingEarlyAccessRequests_CreatedUtc
        ON dbo.MarketingEarlyAccessRequests (CreatedUtc DESC);
END;
GO
