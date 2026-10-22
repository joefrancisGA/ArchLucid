/*
  356: Operational security findings (IE-09).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.OperationalSecurityFindings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.OperationalSecurityFindings
    (
        FindingId                 UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_OperationalSecurityFindings PRIMARY KEY CLUSTERED,
        TenantId                  UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId               UNIQUEIDENTIFIER NOT NULL,
        ProjectId                 UNIQUEIDENTIFIER NOT NULL,
        Provider                  INT               NOT NULL,
        SourceSystem              NVARCHAR(256)     NOT NULL,
        SourceFindingId           NVARCHAR(512)     NOT NULL,
        CloudResourceId           UNIQUEIDENTIFIER NULL,
        ExternalResourceId        NVARCHAR(1024)    NULL,
        ResourceType              NVARCHAR(256)     NULL,
        SubscriptionOrAccountId   NVARCHAR(256)     NULL,
        ControlId                 NVARCHAR(256)     NULL,
        ControlFramework          NVARCHAR(128)     NULL,
        Title                     NVARCHAR(512)     NOT NULL,
        Description               NVARCHAR(4000)    NULL,
        Severity                  NVARCHAR(64)      NULL,
        RiskScore                 DECIMAL(10, 4)    NULL,
        Exploitability            NVARCHAR(128)     NULL,
        Exposure                  NVARCHAR(128)     NULL,
        BusinessCriticality       NVARCHAR(128)     NULL,
        BlastRadius               NVARCHAR(128)     NULL,
        FirstObservedUtc          DATETIME2         NOT NULL,
        LastObservedUtc           DATETIME2         NOT NULL,
        Status                    INT               NOT NULL,
        RawEvidenceReference      NVARCHAR(1024)    NULL,
        AssessmentId              UNIQUEIDENTIFIER NULL,
        InventoryDiffId           UNIQUEIDENTIFIER NULL,
        AuditEvidenceSnapshotId   UNIQUEIDENTIFIER NULL,
        PayloadHashSha256         VARBINARY(32)     NOT NULL,
        CreatedUtc                DATETIME2         NOT NULL,
        UpdatedUtc                DATETIME2         NOT NULL,
        CONSTRAINT UQ_OperationalSecurityFindings_NaturalKey
            UNIQUE (TenantId, Provider, SourceSystem, SourceFindingId)
    );

    CREATE NONCLUSTERED INDEX IX_OperationalSecurityFindings_Tenant_Status
        ON dbo.OperationalSecurityFindings (TenantId, Status, LastObservedUtc DESC);

    CREATE NONCLUSTERED INDEX IX_OperationalSecurityFindings_Tenant_CloudResource
        ON dbo.OperationalSecurityFindings (TenantId, CloudResourceId)
        WHERE CloudResourceId IS NOT NULL;
END;
GO

IF OBJECT_ID(N'dbo.OperationalSecurityFindingMetadata', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.OperationalSecurityFindingMetadata
    (
        MetadataRowId   UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_OperationalSecurityFindingMetadata PRIMARY KEY CLUSTERED,
        FindingId       UNIQUEIDENTIFIER NOT NULL,
        TenantId        UNIQUEIDENTIFIER NOT NULL,
        MetadataKey     NVARCHAR(128)     NOT NULL,
        MetadataValue   NVARCHAR(1024)    NULL,
        CONSTRAINT FK_OperationalSecurityFindingMetadata_Finding
            FOREIGN KEY (FindingId) REFERENCES dbo.OperationalSecurityFindings (FindingId)
    );

    CREATE UNIQUE NONCLUSTERED INDEX UQ_OperationalSecurityFindingMetadata_Key
        ON dbo.OperationalSecurityFindingMetadata (TenantId, FindingId, MetadataKey);
END;
GO

IF OBJECT_ID(N'dbo.OperationalSecurityFindingObservations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.OperationalSecurityFindingObservations
    (
        ObservationId       UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_OperationalSecurityFindingObservations PRIMARY KEY CLUSTERED,
        FindingId           UNIQUEIDENTIFIER NOT NULL,
        TenantId            UNIQUEIDENTIFIER NOT NULL,
        ObservedUtc         DATETIME2         NOT NULL,
        Status              INT               NOT NULL,
        Severity            NVARCHAR(64)      NULL,
        RiskScore           DECIMAL(10, 4)    NULL,
        Summary             NVARCHAR(4000)    NULL,
        PayloadHashSha256   VARBINARY(32)     NOT NULL,
        SourceSystem        NVARCHAR(256)     NOT NULL,
        CONSTRAINT FK_OperationalSecurityFindingObservations_Finding
            FOREIGN KEY (FindingId) REFERENCES dbo.OperationalSecurityFindings (FindingId)
    );

    CREATE NONCLUSTERED INDEX IX_OperationalSecurityFindingObservations_Finding
        ON dbo.OperationalSecurityFindingObservations (TenantId, FindingId, ObservedUtc DESC);
END;
GO
