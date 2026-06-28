/*
  264: Per-tenant hosted GCP extractor connection (Tier 2 — Workload Identity Federation).

  ArchLucid stores pool provider + service account metadata only — no JSON keys.
*/
IF OBJECT_ID(N'dbo.TenantGcpConnectionRecords', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantGcpConnectionRecords
    (
        ConnectionId                    UNIQUEIDENTIFIER  NOT NULL
            CONSTRAINT DF_TenantGcpConnectionRecords_ConnectionId DEFAULT (NEWSEQUENTIALID()),
        TenantId                        UNIQUEIDENTIFIER  NOT NULL,
        ProjectId                       NVARCHAR(64)      NOT NULL,
        WorkloadIdentityPoolProvider    NVARCHAR(512)     NOT NULL,
        ServiceAccountEmail             NVARCHAR(256)     NOT NULL,
        Status                          NVARCHAR(32)      NOT NULL
            CONSTRAINT DF_TenantGcpConnectionRecords_Status DEFAULT (N'Connected'),
        LastPolledUtc                   DATETIMEOFFSET(7) NULL,
        CreatedUtc                      DATETIMEOFFSET(7) NOT NULL
            CONSTRAINT DF_TenantGcpConnectionRecords_CreatedUtc DEFAULT (SYSUTCDATETIME()),
        UpdatedUtc                      DATETIMEOFFSET(7) NOT NULL
            CONSTRAINT DF_TenantGcpConnectionRecords_UpdatedUtc DEFAULT (SYSUTCDATETIME()),
        UpdatedByActorId                NVARCHAR(256)     NOT NULL,
        CONSTRAINT PK_TenantGcpConnectionRecords PRIMARY KEY (ConnectionId),
        CONSTRAINT UQ_TenantGcpConnectionRecords_TenantProject UNIQUE (TenantId, ProjectId),
        CONSTRAINT FK_TenantGcpConnectionRecords_Tenants
            FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );

    CREATE INDEX IX_TenantGcpConnectionRecords_TenantId
        ON dbo.TenantGcpConnectionRecords (TenantId)
        INCLUDE (ProjectId, Status, LastPolledUtc, UpdatedUtc);
END;
GO
