/*
  144: ITSM finding correlation — links ArchLucid findings to Jira issues / ServiceNow incidents for inbound status sync.
*/

IF OBJECT_ID(N'dbo.ItsmFindingCorrelations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ItsmFindingCorrelations
    (
        CorrelationId    BIGINT           IDENTITY(1, 1) NOT NULL
            CONSTRAINT PK_ItsmFindingCorrelations PRIMARY KEY CLUSTERED,
        TenantId         UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId      UNIQUEIDENTIFIER NOT NULL,
        ProjectId        UNIQUEIDENTIFIER NOT NULL,
        FindingId      NVARCHAR(200)    NOT NULL,
        Provider         NVARCHAR(32)     NOT NULL
            CONSTRAINT CK_ItsmFindingCorrelations_Provider
                CHECK (Provider IN (N'Jira', N'ServiceNow')),
        ExternalKey      NVARCHAR(256)    NOT NULL,
        ExternalSysId    NVARCHAR(64)     NULL,
        CreatedUtc       DATETIME2(7)     NOT NULL
            CONSTRAINT DF_ItsmFindingCorrelations_CreatedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_ItsmFindingCorrelations_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id),
        CONSTRAINT UQ_ItsmFindingCorrelations_Provider_ExternalKey UNIQUE (Provider, ExternalKey)
    );

    CREATE NONCLUSTERED INDEX IX_ItsmFindingCorrelations_Tenant_Finding
        ON dbo.ItsmFindingCorrelations (TenantId, FindingId);
END;
GO
