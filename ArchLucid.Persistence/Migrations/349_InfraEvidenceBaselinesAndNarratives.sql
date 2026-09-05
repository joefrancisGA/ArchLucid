/*
  349: Infrastructure-evidence baselines, drift approvals, and diff narratives (IE-07, IE-08).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.AzureInventoryBaselines', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureInventoryBaselines
    (
        BaselineId        UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureInventoryBaselines PRIMARY KEY CLUSTERED,
        TenantId          UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId       UNIQUEIDENTIFIER NOT NULL,
        ProjectId         UNIQUEIDENTIFIER NOT NULL,
        SnapshotId        UNIQUEIDENTIFIER NOT NULL,
        BaselineKind      INT               NOT NULL,
        SubscriptionId    NVARCHAR(128)     NULL,
        DesignatedBy      NVARCHAR(256)     NOT NULL,
        DesignatedUtc     DATETIME2         NOT NULL,
        Notes             NVARCHAR(2000)    NULL,
        CONSTRAINT FK_AzureInventoryBaselines_Snapshots FOREIGN KEY (SnapshotId) REFERENCES dbo.AzureInventorySnapshots (SnapshotId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureInventoryBaselines_Tenant_Kind
        ON dbo.AzureInventoryBaselines (TenantId, BaselineKind, DesignatedUtc DESC);
END;
GO

IF OBJECT_ID(N'dbo.AzureInventoryDriftApprovals', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureInventoryDriftApprovals
    (
        ApprovalId        UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureInventoryDriftApprovals PRIMARY KEY CLUSTERED,
        TenantId          UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId       UNIQUEIDENTIFIER NOT NULL,
        ProjectId         UNIQUEIDENTIFIER NOT NULL,
        DiffId            UNIQUEIDENTIFIER NOT NULL,
        ChangeId          UNIQUEIDENTIFIER NULL,
        Approver          NVARCHAR(256)     NOT NULL,
        Reason            NVARCHAR(2000)    NOT NULL,
        TicketReference   NVARCHAR(256)     NULL,
        ExpirationUtc     DATETIME2         NOT NULL,
        Status            INT               NOT NULL,
        CreatedUtc        DATETIME2         NOT NULL,
        CONSTRAINT FK_AzureInventoryDriftApprovals_Diffs FOREIGN KEY (DiffId) REFERENCES dbo.AzureInventoryDiffs (DiffId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureInventoryDriftApprovals_Tenant_Diff_Status
        ON dbo.AzureInventoryDriftApprovals (TenantId, DiffId, Status, ExpirationUtc);
END;
GO

IF OBJECT_ID(N'dbo.AzureInventoryDiffNarratives', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureInventoryDiffNarratives
    (
        NarrativeId       UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureInventoryDiffNarratives PRIMARY KEY CLUSTERED,
        DiffId            UNIQUEIDENTIFIER NOT NULL,
        TenantId          UNIQUEIDENTIFIER NOT NULL,
        NarrativeKind     INT               NOT NULL,
        NarrativeText     NVARCHAR(MAX)     NOT NULL,
        CitedChangeIdsJson NVARCHAR(MAX)    NOT NULL,
        ProvenanceKind    INT               NOT NULL,
        SimulatorLabel    NVARCHAR(64)      NULL,
        CreatedUtc        DATETIME2         NOT NULL,
        CONSTRAINT FK_AzureInventoryDiffNarratives_Diffs FOREIGN KEY (DiffId) REFERENCES dbo.AzureInventoryDiffs (DiffId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureInventoryDiffNarratives_Tenant_Diff
        ON dbo.AzureInventoryDiffNarratives (TenantId, DiffId, CreatedUtc DESC);
END;
GO
