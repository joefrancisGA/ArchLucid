/*
  363: Architecture diagram infrastructure reconciliation (IE-19).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.ArchitectureDiagramReconciliations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ArchitectureDiagramReconciliations
    (
        ReconciliationId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_ArchitectureDiagramReconciliations PRIMARY KEY CLUSTERED,
        TenantId         UNIQUEIDENTIFIER NOT NULL,
        RunId            UNIQUEIDENTIFIER NOT NULL,
        SnapshotId       UNIQUEIDENTIFIER NOT NULL,
        ResultJson       NVARCHAR(MAX)     NOT NULL,
        CreatedUtc       DATETIME2         NOT NULL,
        UpdatedUtc       DATETIME2         NOT NULL,
        CONSTRAINT UQ_ArchitectureDiagramReconciliations_Tenant_Run_Snapshot UNIQUE (TenantId, RunId, SnapshotId)
    );

    CREATE NONCLUSTERED INDEX IX_ArchitectureDiagramReconciliations_Tenant_Run
        ON dbo.ArchitectureDiagramReconciliations (TenantId, RunId);
END;
GO
