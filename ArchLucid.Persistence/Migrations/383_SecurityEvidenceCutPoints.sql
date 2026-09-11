/*
  383: SecureNow architect — cut-point analysis (SA-10).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.SecurityEvidenceCutPoints', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SecurityEvidenceCutPoints
    (
        CutPointId              UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_SecurityEvidenceCutPoints PRIMARY KEY CLUSTERED,
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        SnapshotId              UNIQUEIDENTIFIER NOT NULL,
        RuleVersion             NVARCHAR(64)      NOT NULL,
        CutKind                 INT               NOT NULL,
        CutKey                  NVARCHAR(768)     NOT NULL,
        FromNodeId              NVARCHAR(512)     NULL,
        ToNodeId                NVARCHAR(512)     NULL,
        EdgeType                NVARCHAR(128)     NULL,
        PathsCollapsedCount     INT               NOT NULL,
        OperationalCostClass    INT               NOT NULL,
        LeverageScore           DECIMAL(8, 3)     NOT NULL,
        CutOrder                INT               NOT NULL,
        EvidenceReferencesJson  NVARCHAR(MAX)     NOT NULL,
        CollapsedPathIdsJson    NVARCHAR(MAX)     NOT NULL,
        SuggestedPatternKey     NVARCHAR(256)     NULL,
        CloudResourceId         UNIQUEIDENTIFIER NULL,
        ResourceType            NVARCHAR(256)     NULL,
        ComputedUtc             DATETIME2         NOT NULL,
        CONSTRAINT UQ_SecurityEvidenceCutPoints_Tenant_Snapshot_Key
            UNIQUE (TenantId, SnapshotId, CutKey)
    );

    CREATE NONCLUSTERED INDEX IX_SecurityEvidenceCutPoints_Tenant_Snapshot_Order
        ON dbo.SecurityEvidenceCutPoints (TenantId, SnapshotId, CutOrder);

    CREATE NONCLUSTERED INDEX IX_SecurityEvidenceCutPoints_Tenant_Snapshot_Leverage
        ON dbo.SecurityEvidenceCutPoints (TenantId, SnapshotId, LeverageScore DESC, CutOrder);
END;
GO
