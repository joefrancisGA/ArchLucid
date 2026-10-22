/*
  408: Architect-confirmed diagram node to inventory resource mappings (DIC-02).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.InfrastructureDiagramNodeMappings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.InfrastructureDiagramNodeMappings
    (
        MappingId              UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_InfrastructureDiagramNodeMappings PRIMARY KEY CLUSTERED,
        TenantId               UNIQUEIDENTIFIER NOT NULL,
        SnapshotId             UNIQUEIDENTIFIER NOT NULL,
        NormalizedDiagramLabel NVARCHAR(512)    NOT NULL,
        DiagramNodeId          NVARCHAR(256)    NULL,
        CloudResourceId        UNIQUEIDENTIFIER NOT NULL,
        AzureResourceId        NVARCHAR(2048)   NOT NULL,
        SavedByUserOid         NVARCHAR(128)    NULL,
        CreatedUtc             DATETIME2        NOT NULL,
        UpdatedUtc             DATETIME2        NOT NULL,
        CONSTRAINT UQ_InfrastructureDiagramNodeMappings_Tenant_Snapshot_Node
            UNIQUE (TenantId, SnapshotId, NormalizedDiagramLabel, DiagramNodeId)
    );

    CREATE NONCLUSTERED INDEX IX_InfrastructureDiagramNodeMappings_Tenant_Snapshot
        ON dbo.InfrastructureDiagramNodeMappings (TenantId, SnapshotId);
END;
GO
