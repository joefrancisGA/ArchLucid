/*
  189: Per-tenant hosted Azure extractor configuration (Tier 2 — Workload Identity Federation).

  One row per tenant per subscription. ArchLucid never stores customer client secrets — only appId + tenantId.
  RLS: not applied — tenant id is the scope; API enforces caller tenant via IScopeContextProvider.
*/
IF OBJECT_ID(N'dbo.TenantHostedExtractorConfigurations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantHostedExtractorConfigurations
    (
        TenantId            UNIQUEIDENTIFIER  NOT NULL,
        SubscriptionId      NVARCHAR(64)      NOT NULL,
        CustomerTenantId    NVARCHAR(64)      NOT NULL,
        CustomerAppId       NVARCHAR(64)      NOT NULL,
        IncludeCost         BIT               NOT NULL
            CONSTRAINT DF_TenantHostedExtractorConfigurations_IncludeCost DEFAULT (0),
        UpdatedUtc          DATETIMEOFFSET(7) NOT NULL
            CONSTRAINT DF_TenantHostedExtractorConfigurations_UpdatedUtc DEFAULT (SYSUTCDATETIME()),
        UpdatedByActorId    NVARCHAR(256)     NOT NULL,
        CONSTRAINT PK_TenantHostedExtractorConfigurations PRIMARY KEY (TenantId, SubscriptionId),
        CONSTRAINT FK_TenantHostedExtractorConfigurations_Tenants
            FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );

    CREATE INDEX IX_TenantHostedExtractorConfigurations_TenantId
        ON dbo.TenantHostedExtractorConfigurations (TenantId)
        INCLUDE (SubscriptionId, CustomerAppId, UpdatedUtc);
END;
GO
