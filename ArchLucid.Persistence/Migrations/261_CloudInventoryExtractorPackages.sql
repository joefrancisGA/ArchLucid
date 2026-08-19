-- CloudInventoryExtractorPackages — AWS/GCP customer-controlled inventory ZIP persistence (MULTI_CLOUD_ANALYSIS_V1_1 §5.3).

IF OBJECT_ID(N'dbo.CloudInventoryExtractorPackages', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CloudInventoryExtractorPackages
    (
        PackageId               UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_CloudInventoryExtractorPackages PRIMARY KEY CLUSTERED,
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId             UNIQUEIDENTIFIER NOT NULL,
        ProjectId               UNIQUEIDENTIFIER NOT NULL,
        RunId                   UNIQUEIDENTIFIER NULL,
        CreatedUtc              DATETIME2        NOT NULL,
        CloudProvider           INT              NOT NULL,
        SchemaVersion           INT              NOT NULL,
        ScriptVersion           NVARCHAR(64)      NULL,
        CollectionTimestampUtc  DATETIME2        NULL,
        ScopeId                 NVARCHAR(128)     NOT NULL,
        OriginalFileName        NVARCHAR(400)     NOT NULL,
        ManifestJson            NVARCHAR(MAX)     NOT NULL,
        PackageBytes            VARBINARY(MAX)    NOT NULL,
        CONSTRAINT FK_CloudInventoryExtractorPackages_Runs FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId)
    );

    CREATE NONCLUSTERED INDEX IX_CloudInventoryExtractorPackages_Scope_Provider_Created
        ON dbo.CloudInventoryExtractorPackages (TenantId, WorkspaceId, ProjectId, CloudProvider, CreatedUtc DESC);

    CREATE NONCLUSTERED INDEX IX_CloudInventoryExtractorPackages_RunId
        ON dbo.CloudInventoryExtractorPackages (RunId)
        WHERE RunId IS NOT NULL;
END;
