/*
  348: Infrastructure-evidence semantic diff and advisory Terraform mapping (IE-05, IE-06).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.AzureInventoryDiffs', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureInventoryDiffs
    (
        DiffId                    UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureInventoryDiffs PRIMARY KEY CLUSTERED,
        TenantId                  UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId               UNIQUEIDENTIFIER NOT NULL,
        ProjectId                 UNIQUEIDENTIFIER NOT NULL,
        SnapshotAId               UNIQUEIDENTIFIER NOT NULL,
        SnapshotBId               UNIQUEIDENTIFIER NOT NULL,
        SubscriptionId            NVARCHAR(128)     NULL,
        TotalChanges              INT               NOT NULL CONSTRAINT DF_AzureInventoryDiffs_TotalChanges DEFAULT (0),
        ResourceAddedCount        INT               NOT NULL CONSTRAINT DF_AzureInventoryDiffs_ResourceAddedCount DEFAULT (0),
        ResourceRemovedCount      INT               NOT NULL CONSTRAINT DF_AzureInventoryDiffs_ResourceRemovedCount DEFAULT (0),
        ResourceModifiedCount     INT               NOT NULL CONSTRAINT DF_AzureInventoryDiffs_ResourceModifiedCount DEFAULT (0),
        NetworkExposureChangeCount INT              NOT NULL CONSTRAINT DF_AzureInventoryDiffs_NetworkExposureChangeCount DEFAULT (0),
        PermissionChangeCount     INT               NOT NULL CONSTRAINT DF_AzureInventoryDiffs_PermissionChangeCount DEFAULT (0),
        LoggingRegressionCount    INT               NOT NULL CONSTRAINT DF_AzureInventoryDiffs_LoggingRegressionCount DEFAULT (0),
        NewPrivateEndpointCount   INT               NOT NULL CONSTRAINT DF_AzureInventoryDiffs_NewPrivateEndpointCount DEFAULT (0),
        RelationshipRemovedCount  INT               NOT NULL CONSTRAINT DF_AzureInventoryDiffs_RelationshipRemovedCount DEFAULT (0),
        CreatedUtc                DATETIME2         NOT NULL,
        CONSTRAINT FK_AzureInventoryDiffs_SnapshotA FOREIGN KEY (SnapshotAId) REFERENCES dbo.AzureInventorySnapshots (SnapshotId),
        CONSTRAINT FK_AzureInventoryDiffs_SnapshotB FOREIGN KEY (SnapshotBId) REFERENCES dbo.AzureInventorySnapshots (SnapshotId),
        CONSTRAINT UQ_AzureInventoryDiffs_Tenant_SnapshotPair UNIQUE (TenantId, SnapshotAId, SnapshotBId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureInventoryDiffs_Tenant_Snapshots
        ON dbo.AzureInventoryDiffs (TenantId, SnapshotAId, SnapshotBId);
END;
GO

IF OBJECT_ID(N'dbo.AzureInventoryChanges', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureInventoryChanges
    (
        ChangeId                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureInventoryChanges PRIMARY KEY CLUSTERED,
        DiffId                    UNIQUEIDENTIFIER NOT NULL,
        TenantId                  UNIQUEIDENTIFIER NOT NULL,
        SnapshotAId               UNIQUEIDENTIFIER NOT NULL,
        SnapshotBId               UNIQUEIDENTIFIER NOT NULL,
        CloudResourceId           UNIQUEIDENTIFIER NULL,
        AzureResourceId           NVARCHAR(1024)    NULL,
        ChangeType                INT               NOT NULL,
        Property                  NVARCHAR(256)     NULL,
        OldValue                  NVARCHAR(4000)    NULL,
        NewValue                  NVARCHAR(4000)    NULL,
        RiskClassification        NVARCHAR(128)     NULL,
        ArchitectureSignificance  NVARCHAR(256)     NULL,
        SecuritySignificance      NVARCHAR(256)     NULL,
        Confidence                DECIMAL(5, 4)     NULL,
        EvidenceReference         NVARCHAR(512)     NULL,
        ProvenanceKind            INT               NOT NULL,
        CONSTRAINT FK_AzureInventoryChanges_Diffs FOREIGN KEY (DiffId) REFERENCES dbo.AzureInventoryDiffs (DiffId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureInventoryChanges_Tenant_Diff
        ON dbo.AzureInventoryChanges (TenantId, DiffId);
END;
GO

IF OBJECT_ID(N'dbo.AdvisoryTerraformResourceMappings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AdvisoryTerraformResourceMappings
    (
        MappingId                 UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AdvisoryTerraformResourceMappings PRIMARY KEY CLUSTERED,
        SnapshotId                UNIQUEIDENTIFIER NOT NULL,
        TenantId                  UNIQUEIDENTIFIER NOT NULL,
        CloudResourceId           UNIQUEIDENTIFIER NULL,
        AzureResourceId           NVARCHAR(1024)    NOT NULL,
        TerraformAddress          NVARCHAR(512)     NOT NULL,
        CategoryFolder            NVARCHAR(64)      NOT NULL,
        GenerationMethod          INT               NOT NULL,
        UncertaintyNotes          NVARCHAR(2000)    NULL,
        CreatedUtc                DATETIME2         NOT NULL,
        CONSTRAINT FK_AdvisoryTerraformResourceMappings_Snapshots FOREIGN KEY (SnapshotId) REFERENCES dbo.AzureInventorySnapshots (SnapshotId)
    );

    CREATE NONCLUSTERED INDEX IX_AdvisoryTerraformResourceMappings_Tenant_Snapshot
        ON dbo.AdvisoryTerraformResourceMappings (TenantId, SnapshotId);
END;
GO
