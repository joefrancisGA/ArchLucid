/*
  378: AS-047 — optional bind from dbo.Architectures to dbo.AzureInventorySnapshots (ADR 0084 / inventory-bind).
  Tenant catalog only; no SQL RLS. One active binding row per architecture (PK = ArchitectureId).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.ArchitectureInventoryBindings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ArchitectureInventoryBindings
    (
        ArchitectureId UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_ArchitectureInventoryBindings PRIMARY KEY CLUSTERED,
        TenantId         UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId      UNIQUEIDENTIFIER NOT NULL,
        ScopeProjectId   UNIQUEIDENTIFIER NOT NULL,
        SnapshotId       UNIQUEIDENTIFIER NOT NULL,
        BoundBy          NVARCHAR(256)    NOT NULL,
        BoundUtc         DATETIME2(7)     NOT NULL
            CONSTRAINT DF_ArchitectureInventoryBindings_BoundUtc DEFAULT SYSUTCDATETIME(),
        RowVersion       ROWVERSION       NOT NULL,
        CONSTRAINT FK_ArchitectureInventoryBindings_Architectures
            FOREIGN KEY (ArchitectureId) REFERENCES dbo.Architectures (ArchitectureId) ON DELETE CASCADE,
        CONSTRAINT FK_ArchitectureInventoryBindings_Snapshots
            FOREIGN KEY (SnapshotId) REFERENCES dbo.AzureInventorySnapshots (SnapshotId)
    );

    CREATE NONCLUSTERED INDEX IX_ArchitectureInventoryBindings_Scope_Architecture
        ON dbo.ArchitectureInventoryBindings (TenantId, WorkspaceId, ScopeProjectId, ArchitectureId);

    CREATE NONCLUSTERED INDEX IX_ArchitectureInventoryBindings_Tenant_Snapshot
        ON dbo.ArchitectureInventoryBindings (TenantId, SnapshotId);
END;
GO
