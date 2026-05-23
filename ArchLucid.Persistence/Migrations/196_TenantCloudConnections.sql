/*
  196: Per-tenant cloud connections (Tier 2).
*/
IF OBJECT_ID(N'dbo.TenantCloudConnections', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantCloudConnections
    (
        ConnectionId        UNIQUEIDENTIFIER  NOT NULL,
        TenantId            UNIQUEIDENTIFIER  NOT NULL,
        TenantIdAzure       NVARCHAR(100)     NOT NULL,
        ClientId            NVARCHAR(100)     NOT NULL,
        SubscriptionIds     NVARCHAR(MAX)     NOT NULL,
        UpdatedUtc          DATETIMEOFFSET(7) NOT NULL
            CONSTRAINT DF_TenantCloudConnections_UpdatedUtc DEFAULT (SYSUTCDATETIME()),
        UpdatedByActorId    NVARCHAR(256)     NOT NULL,
        CONSTRAINT PK_TenantCloudConnections PRIMARY KEY (ConnectionId),
        CONSTRAINT FK_TenantCloudConnections_Tenants
            FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );

    CREATE INDEX IX_TenantCloudConnections_TenantId
        ON dbo.TenantCloudConnections (TenantId)
        INCLUDE (TenantIdAzure, ClientId, UpdatedUtc);
END;
GO
