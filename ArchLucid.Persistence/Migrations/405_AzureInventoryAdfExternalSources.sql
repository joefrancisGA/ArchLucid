/*
  405: Persist non-secret ADF linked-service identity for diagram graph hydration.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.AzureInventoryAdfExternalSources', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureInventoryAdfExternalSources
    (
        ExternalSourceRowId    UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureInventoryAdfExternalSources PRIMARY KEY CLUSTERED,
        SnapshotId             UNIQUEIDENTIFIER NOT NULL,
        TenantId               UNIQUEIDENTIFIER NOT NULL,
        ExternalNodeKey        NVARCHAR(1024)    NOT NULL,
        LinkedServiceName      NVARCHAR(256)     NOT NULL,
        LinkedServiceType      NVARCHAR(128)     NOT NULL,
        TargetHost             NVARCHAR(256)     NULL,
        FactoryResourceId      NVARCHAR(1024)    NOT NULL,
        IntegrationRuntimeName NVARCHAR(256)     NULL,
        HostInKeyVault         BIT               NOT NULL CONSTRAINT DF_AzureInventoryAdfExternalSources_HostInKeyVault DEFAULT (0),
        KeyVaultResourceId     NVARCHAR(1024)    NULL,
        CONSTRAINT FK_AzureInventoryAdfExternalSources_Snapshots
            FOREIGN KEY (SnapshotId) REFERENCES dbo.AzureInventorySnapshots (SnapshotId),
        CONSTRAINT UQ_AzureInventoryAdfExternalSources_Tenant_Snapshot_Node
            UNIQUE (TenantId, SnapshotId, ExternalNodeKey)
    );

    CREATE NONCLUSTERED INDEX IX_AzureInventoryAdfExternalSources_Tenant_Snapshot
        ON dbo.AzureInventoryAdfExternalSources (TenantId, SnapshotId);
END;
GO
