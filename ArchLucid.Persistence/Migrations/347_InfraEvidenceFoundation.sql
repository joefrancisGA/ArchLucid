/*
  347: Infrastructure-evidence plane foundation — Azure inventory snapshots, cloud resource identity,
       audit framework catalog, and tenant branding profiles (IE-01, IE-04, AE-01, BR-01).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.AzureInventorySnapshots', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureInventorySnapshots
    (
        SnapshotId            UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureInventorySnapshots PRIMARY KEY CLUSTERED,
        TenantId              UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId           UNIQUEIDENTIFIER NOT NULL,
        ProjectId             UNIQUEIDENTIFIER NOT NULL,
        PackageId             UNIQUEIDENTIFIER NOT NULL,
        SubscriptionId        NVARCHAR(128)     NULL,
        SubscriptionName      NVARCHAR(256)     NULL,
        CapturedUtc           DATETIME2         NULL,
        CaptureStatus         INT               NOT NULL,
        CaptureVersion        NVARCHAR(64)      NULL,
        ResourceCount         INT               NOT NULL CONSTRAINT DF_AzureInventorySnapshots_ResourceCount DEFAULT (0),
        RelationshipCount     INT               NOT NULL CONSTRAINT DF_AzureInventorySnapshots_RelationshipCount DEFAULT (0),
        CaptureMethod         INT               NOT NULL CONSTRAINT DF_AzureInventorySnapshots_CaptureMethod DEFAULT (0),
        CollectorVersion      NVARCHAR(64)      NULL,
        RequestedBy           NVARCHAR(256)     NULL,
        DurationMs            INT               NULL,
        CompletenessScore     DECIMAL(5, 4)     NULL,
        WarningCount          INT               NOT NULL CONSTRAINT DF_AzureInventorySnapshots_WarningCount DEFAULT (0),
        ErrorCount            INT               NOT NULL CONSTRAINT DF_AzureInventorySnapshots_ErrorCount DEFAULT (0),
        ContentHashSha256     VARBINARY(32)     NULL,
        CreatedUtc            DATETIME2         NOT NULL,
        UpdatedUtc            DATETIME2         NOT NULL,
        CONSTRAINT FK_AzureInventorySnapshots_Packages FOREIGN KEY (PackageId) REFERENCES dbo.AzureExtractorPackages (PackageId),
        CONSTRAINT UQ_AzureInventorySnapshots_Tenant_Package UNIQUE (TenantId, PackageId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureInventorySnapshots_Tenant_Snapshot
        ON dbo.AzureInventorySnapshots (TenantId, SnapshotId);

    CREATE NONCLUSTERED INDEX IX_AzureInventorySnapshots_Scope_Created
        ON dbo.AzureInventorySnapshots (TenantId, WorkspaceId, ProjectId, CreatedUtc DESC);
END;
GO

IF OBJECT_ID(N'dbo.AzureInventoryResources', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureInventoryResources
    (
        ResourceRowId           UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureInventoryResources PRIMARY KEY CLUSTERED,
        SnapshotId              UNIQUEIDENTIFIER NOT NULL,
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        CloudResourceId         UNIQUEIDENTIFIER NULL,
        AzureResourceId         NVARCHAR(1024)    NOT NULL,
        ResourceType            NVARCHAR(256)     NOT NULL,
        Region                  NVARCHAR(128)     NULL,
        ResourceGroup           NVARCHAR(256)     NULL,
        SubscriptionId          NVARCHAR(128)     NULL,
        ParentResourceId        NVARCHAR(1024)    NULL,
        SourceEvidenceReference NVARCHAR(512)     NULL,
        CONSTRAINT FK_AzureInventoryResources_Snapshots FOREIGN KEY (SnapshotId) REFERENCES dbo.AzureInventorySnapshots (SnapshotId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureInventoryResources_Tenant_Snapshot
        ON dbo.AzureInventoryResources (TenantId, SnapshotId);

    CREATE NONCLUSTERED INDEX IX_AzureInventoryResources_Tenant_AzureResourceId
        ON dbo.AzureInventoryResources (TenantId, AzureResourceId);
END;
GO

IF OBJECT_ID(N'dbo.AzureInventoryResourceProperties', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureInventoryResourceProperties
    (
        PropertyRowId           UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureInventoryResourceProperties PRIMARY KEY CLUSTERED,
        SnapshotId              UNIQUEIDENTIFIER NOT NULL,
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        ResourceRowId           UNIQUEIDENTIFIER NOT NULL,
        PropertyKey             NVARCHAR(256)     NOT NULL,
        PropertyValue           NVARCHAR(4000)    NULL,
        IsRedacted              BIT               NOT NULL CONSTRAINT DF_AzureInventoryResourceProperties_IsRedacted DEFAULT (0),
        BlobPointer             NVARCHAR(512)     NULL,
        CONSTRAINT FK_AzureInventoryResourceProperties_Resources FOREIGN KEY (ResourceRowId) REFERENCES dbo.AzureInventoryResources (ResourceRowId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureInventoryResourceProperties_Tenant_Snapshot
        ON dbo.AzureInventoryResourceProperties (TenantId, SnapshotId);
END;
GO

IF OBJECT_ID(N'dbo.AzureInventoryResourceRelationships', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureInventoryResourceRelationships
    (
        RelationshipRowId       UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureInventoryResourceRelationships PRIMARY KEY CLUSTERED,
        SnapshotId              UNIQUEIDENTIFIER NOT NULL,
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        FromAzureResourceId     NVARCHAR(1024)    NOT NULL,
        ToAzureResourceId       NVARCHAR(1024)    NOT NULL,
        RelationshipType        NVARCHAR(128)     NOT NULL,
        ProvenanceKind          INT               NOT NULL,
        Confidence              DECIMAL(5, 4)     NULL,
        InferenceSource         NVARCHAR(256)     NULL,
        CONSTRAINT FK_AzureInventoryResourceRelationships_Snapshots FOREIGN KEY (SnapshotId) REFERENCES dbo.AzureInventorySnapshots (SnapshotId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureInventoryResourceRelationships_Tenant_Snapshot
        ON dbo.AzureInventoryResourceRelationships (TenantId, SnapshotId);
END;
GO

IF OBJECT_ID(N'dbo.AzureInventoryIdentities', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureInventoryIdentities
    (
        IdentityRowId           UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureInventoryIdentities PRIMARY KEY CLUSTERED,
        SnapshotId              UNIQUEIDENTIFIER NOT NULL,
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        IdentityType            NVARCHAR(128)     NOT NULL,
        PrincipalId             NVARCHAR(256)     NOT NULL,
        DisplayName             NVARCHAR(512)     NULL,
        SourceEvidenceReference NVARCHAR(512)     NULL,
        CONSTRAINT FK_AzureInventoryIdentities_Snapshots FOREIGN KEY (SnapshotId) REFERENCES dbo.AzureInventorySnapshots (SnapshotId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureInventoryIdentities_Tenant_Snapshot
        ON dbo.AzureInventoryIdentities (TenantId, SnapshotId);
END;
GO

IF OBJECT_ID(N'dbo.AzureInventoryRoleAssignments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureInventoryRoleAssignments
    (
        RoleAssignmentRowId     UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureInventoryRoleAssignments PRIMARY KEY CLUSTERED,
        SnapshotId              UNIQUEIDENTIFIER NOT NULL,
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        Scope                   NVARCHAR(1024)    NOT NULL,
        PrincipalId             NVARCHAR(256)     NOT NULL,
        RoleDefinitionId        NVARCHAR(1024)    NOT NULL,
        SourceEvidenceReference NVARCHAR(512)     NULL,
        CONSTRAINT FK_AzureInventoryRoleAssignments_Snapshots FOREIGN KEY (SnapshotId) REFERENCES dbo.AzureInventorySnapshots (SnapshotId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureInventoryRoleAssignments_Tenant_Snapshot
        ON dbo.AzureInventoryRoleAssignments (TenantId, SnapshotId);
END;
GO

IF OBJECT_ID(N'dbo.AzureInventoryTags', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureInventoryTags
    (
        TagRowId                UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureInventoryTags PRIMARY KEY CLUSTERED,
        SnapshotId              UNIQUEIDENTIFIER NOT NULL,
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        ResourceRowId           UNIQUEIDENTIFIER NOT NULL,
        TagKey                  NVARCHAR(256)     NOT NULL,
        TagValue                NVARCHAR(512)     NULL,
        CONSTRAINT FK_AzureInventoryTags_Resources FOREIGN KEY (ResourceRowId) REFERENCES dbo.AzureInventoryResources (ResourceRowId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureInventoryTags_Tenant_Snapshot
        ON dbo.AzureInventoryTags (TenantId, SnapshotId);
END;
GO

IF OBJECT_ID(N'dbo.AzureInventoryDiagnosticConfigurations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureInventoryDiagnosticConfigurations
    (
        DiagnosticRowId         UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureInventoryDiagnosticConfigurations PRIMARY KEY CLUSTERED,
        SnapshotId              UNIQUEIDENTIFIER NOT NULL,
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        TargetAzureResourceId   NVARCHAR(1024)    NOT NULL,
        DiagnosticName          NVARCHAR(256)     NOT NULL,
        WorkspaceResourceId     NVARCHAR(1024)    NULL,
        SourceEvidenceReference NVARCHAR(512)     NULL,
        CONSTRAINT FK_AzureInventoryDiagnosticConfigurations_Snapshots FOREIGN KEY (SnapshotId) REFERENCES dbo.AzureInventorySnapshots (SnapshotId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureInventoryDiagnosticConfigurations_Tenant_Snapshot
        ON dbo.AzureInventoryDiagnosticConfigurations (TenantId, SnapshotId);
END;
GO

IF OBJECT_ID(N'dbo.AzureInventoryUnknownResources', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureInventoryUnknownResources
    (
        UnknownResourceRowId    UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureInventoryUnknownResources PRIMARY KEY CLUSTERED,
        SnapshotId              UNIQUEIDENTIFIER NOT NULL,
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        AzureResourceId         NVARCHAR(1024)    NOT NULL,
        ResourceType            NVARCHAR(256)     NOT NULL,
        ResourceGroup           NVARCHAR(256)     NULL,
        CappedPropertiesJson    NVARCHAR(MAX)     NULL,
        SourceEvidenceReference NVARCHAR(512)     NULL,
        CONSTRAINT FK_AzureInventoryUnknownResources_Snapshots FOREIGN KEY (SnapshotId) REFERENCES dbo.AzureInventorySnapshots (SnapshotId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureInventoryUnknownResources_Tenant_Snapshot
        ON dbo.AzureInventoryUnknownResources (TenantId, SnapshotId);
END;
GO

IF OBJECT_ID(N'dbo.CloudResourceIdentities', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CloudResourceIdentities
    (
        CloudResourceId               UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_CloudResourceIdentities PRIMARY KEY CLUSTERED,
        TenantId                      UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId                   UNIQUEIDENTIFIER NOT NULL,
        ProjectId                     UNIQUEIDENTIFIER NOT NULL,
        Provider                      INT               NOT NULL,
        ExternalResourceIdNormalized  NVARCHAR(1024)    NOT NULL,
        ResourceType                  NVARCHAR(256)     NULL,
        SubscriptionOrAccountId       NVARCHAR(128)     NULL,
        ResourceGroupOrProject        NVARCHAR(256)     NULL,
        Region                        NVARCHAR(128)     NULL,
        DisplayName                   NVARCHAR(512)     NULL,
        FirstSeenSnapshotId           UNIQUEIDENTIFIER NULL,
        LastSeenSnapshotId            UNIQUEIDENTIFIER NULL,
        FirstSeenUtc                  DATETIME2         NOT NULL,
        LastSeenUtc                   DATETIME2         NOT NULL,
        CONSTRAINT UQ_CloudResourceIdentities_Tenant_Provider_External UNIQUE (TenantId, Provider, ExternalResourceIdNormalized)
    );

    CREATE NONCLUSTERED INDEX IX_CloudResourceIdentities_Tenant_Provider
        ON dbo.CloudResourceIdentities (TenantId, Provider);
END;
GO

IF OBJECT_ID(N'dbo.AuditFrameworks', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditFrameworks
    (
        FrameworkId           UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AuditFrameworks PRIMARY KEY CLUSTERED,
        TenantId              UNIQUEIDENTIFIER NOT NULL,
        Name                  NVARCHAR(256)     NOT NULL,
        Version               NVARCHAR(64)      NOT NULL,
        Publisher             NVARCHAR(256)     NULL,
        EffectiveDate         DATE              NULL,
        SourceReference       NVARCHAR(512)     NOT NULL,
        Status                INT               NOT NULL,
        ContentHashSha256     VARBINARY(32)     NOT NULL,
        SpecBlob              VARBINARY(MAX)    NOT NULL,
        ImportedBy            NVARCHAR(256)     NULL,
        CreatedUtc            DATETIME2         NOT NULL,
        CONSTRAINT UQ_AuditFrameworks_Tenant_Version_Hash UNIQUE (TenantId, Version, ContentHashSha256)
    );

    CREATE NONCLUSTERED INDEX IX_AuditFrameworks_Tenant_Created
        ON dbo.AuditFrameworks (TenantId, CreatedUtc DESC);
END;
GO

IF OBJECT_ID(N'dbo.AuditControls', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditControls
    (
        ControlId             UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AuditControls PRIMARY KEY CLUSTERED,
        FrameworkId           UNIQUEIDENTIFIER NOT NULL,
        TenantId              UNIQUEIDENTIFIER NOT NULL,
        ControlNumber         NVARCHAR(64)      NOT NULL,
        Title                 NVARCHAR(512)     NOT NULL,
        Description           NVARCHAR(MAX)     NULL,
        Objective             NVARCHAR(MAX)     NULL,
        Applicability         NVARCHAR(512)     NULL,
        ControlType           NVARCHAR(128)     NULL,
        ParentControlId       UNIQUEIDENTIFIER NULL,
        EvaluationGuidance    NVARCHAR(MAX)     NULL,
        CONSTRAINT FK_AuditControls_Frameworks FOREIGN KEY (FrameworkId) REFERENCES dbo.AuditFrameworks (FrameworkId)
    );

    CREATE NONCLUSTERED INDEX IX_AuditControls_Tenant_Framework
        ON dbo.AuditControls (TenantId, FrameworkId);
END;
GO

IF OBJECT_ID(N'dbo.AuditControlMetadata', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditControlMetadata
    (
        MetadataRowId         UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AuditControlMetadata PRIMARY KEY CLUSTERED,
        ControlId             UNIQUEIDENTIFIER NOT NULL,
        TenantId              UNIQUEIDENTIFIER NOT NULL,
        MetadataKey           NVARCHAR(128)     NOT NULL,
        MetadataValue         NVARCHAR(1024)    NULL,
        CONSTRAINT FK_AuditControlMetadata_Controls FOREIGN KEY (ControlId) REFERENCES dbo.AuditControls (ControlId)
    );

    CREATE NONCLUSTERED INDEX IX_AuditControlMetadata_Tenant_Control
        ON dbo.AuditControlMetadata (TenantId, ControlId);
END;
GO

IF OBJECT_ID(N'dbo.TenantBrandingProfiles', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantBrandingProfiles
    (
        BrandingProfileId         UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_TenantBrandingProfiles PRIMARY KEY CLUSTERED,
        TenantId                  UNIQUEIDENTIFIER NOT NULL,
        CompanyDisplayName        NVARCHAR(256)     NULL,
        CompanyLegalName          NVARCHAR(512)     NULL,
        ShortDisplayName          NVARCHAR(128)     NULL,
        LogoPrimaryAssetId        UNIQUEIDENTIFIER NULL,
        LogoSecondaryAssetId      UNIQUEIDENTIFIER NULL,
        LogoSquareAssetId         UNIQUEIDENTIFIER NULL,
        LogoFaviconAssetId        UNIQUEIDENTIFIER NULL,
        LogoDarkAssetId           UNIQUEIDENTIFIER NULL,
        LogoLightAssetId          UNIQUEIDENTIFIER NULL,
        LogoReportCoverAssetId    UNIQUEIDENTIFIER NULL,
        LogoMonoAssetId           UNIQUEIDENTIFIER NULL,
        PrimaryColor              NVARCHAR(16)      NULL,
        SecondaryColor            NVARCHAR(16)      NULL,
        AccentColor               NVARCHAR(16)      NULL,
        BackgroundColor           NVARCHAR(16)      NULL,
        ForegroundColor           NVARCHAR(16)      NULL,
        TypographyJson            NVARCHAR(MAX)     NULL,
        Tagline                   NVARCHAR(512)     NULL,
        WebsiteUrl                NVARCHAR(2048)    NULL,
        SupportUrl                NVARCHAR(2048)    NULL,
        BrandingStatus            INT               NOT NULL,
        Version                   INT               NOT NULL,
        CreatedUtc                DATETIME2         NOT NULL,
        UpdatedUtc                DATETIME2         NOT NULL,
        CreatedBy                 NVARCHAR(256)     NULL,
        UpdatedBy                 NVARCHAR(256)     NULL
    );

    CREATE NONCLUSTERED INDEX IX_TenantBrandingProfiles_Tenant_Status
        ON dbo.TenantBrandingProfiles (TenantId, BrandingStatus);

    CREATE UNIQUE NONCLUSTERED INDEX UX_TenantBrandingProfiles_Tenant_Active
        ON dbo.TenantBrandingProfiles (TenantId)
        WHERE BrandingStatus = 2;
END;
GO
