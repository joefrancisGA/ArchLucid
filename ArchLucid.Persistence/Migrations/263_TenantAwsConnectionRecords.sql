/*
  263: Per-tenant hosted AWS extractor connection (Tier 2 — IAM role ARN + OIDC federation).

  ArchLucid stores role ARN + account metadata only — no long-lived access keys.
*/
IF OBJECT_ID(N'dbo.TenantAwsConnectionRecords', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantAwsConnectionRecords
    (
        ConnectionId        UNIQUEIDENTIFIER  NOT NULL
            CONSTRAINT DF_TenantAwsConnectionRecords_ConnectionId DEFAULT (NEWSEQUENTIALID()),
        TenantId            UNIQUEIDENTIFIER  NOT NULL,
        AccountId           NVARCHAR(32)      NOT NULL,
        Region              NVARCHAR(32)      NOT NULL,
        RoleArn             NVARCHAR(256)     NOT NULL,
        Status              NVARCHAR(32)      NOT NULL
            CONSTRAINT DF_TenantAwsConnectionRecords_Status DEFAULT (N'Connected'),
        LastPolledUtc       DATETIMEOFFSET(7) NULL,
        CreatedUtc          DATETIMEOFFSET(7) NOT NULL
            CONSTRAINT DF_TenantAwsConnectionRecords_CreatedUtc DEFAULT (SYSUTCDATETIME()),
        UpdatedUtc          DATETIMEOFFSET(7) NOT NULL
            CONSTRAINT DF_TenantAwsConnectionRecords_UpdatedUtc DEFAULT (SYSUTCDATETIME()),
        UpdatedByActorId    NVARCHAR(256)     NOT NULL,
        CONSTRAINT PK_TenantAwsConnectionRecords PRIMARY KEY (ConnectionId),
        CONSTRAINT UQ_TenantAwsConnectionRecords_TenantAccount UNIQUE (TenantId, AccountId),
        CONSTRAINT FK_TenantAwsConnectionRecords_Tenants
            FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );

    CREATE INDEX IX_TenantAwsConnectionRecords_TenantId
        ON dbo.TenantAwsConnectionRecords (TenantId)
        INCLUDE (AccountId, Region, Status, LastPolledUtc, UpdatedUtc);
END;
GO
