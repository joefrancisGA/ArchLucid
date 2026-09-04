/*
  352: Audit assessments and immutable audit evidence snapshots (AE-04).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.AuditAssessments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditAssessments
    (
        AssessmentId        UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AuditAssessments PRIMARY KEY CLUSTERED,
        TenantId            UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId         UNIQUEIDENTIFIER NOT NULL,
        ProjectId           UNIQUEIDENTIFIER NOT NULL,
        FrameworkId           UNIQUEIDENTIFIER NOT NULL,
        FrameworkVersion      NVARCHAR(64)      NOT NULL,
        ScopeJson             NVARCHAR(MAX)     NOT NULL,
        PeriodStartUtc        DATETIME2         NULL,
        PeriodEndUtc          DATETIME2         NULL,
        Status                INT               NOT NULL,
        RequestedBy           NVARCHAR(256)     NOT NULL,
        CreatedUtc            DATETIME2         NOT NULL,
        CONSTRAINT FK_AuditAssessments_Frameworks FOREIGN KEY (FrameworkId) REFERENCES dbo.AuditFrameworks (FrameworkId)
    );

    CREATE NONCLUSTERED INDEX IX_AuditAssessments_Tenant_Created
        ON dbo.AuditAssessments (TenantId, CreatedUtc DESC);
END;
GO

IF OBJECT_ID(N'dbo.AuditEvidenceSnapshots', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditEvidenceSnapshots
    (
        AuditEvidenceSnapshotId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AuditEvidenceSnapshots PRIMARY KEY CLUSTERED,
        AssessmentId            UNIQUEIDENTIFIER NOT NULL,
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        SubscriptionIdsJson     NVARCHAR(MAX)     NOT NULL,
        CollectionStartedUtc    DATETIME2         NOT NULL,
        CollectionCompletedUtc  DATETIME2         NOT NULL,
        SelectorVersionsJson    NVARCHAR(MAX)     NOT NULL,
        FrameworkVersion        NVARCHAR(64)      NOT NULL,
        ControlCatalogVersion   NVARCHAR(128)     NOT NULL,
        Completeness            DECIMAL(5, 4)     NOT NULL,
        FailuresJson            NVARCHAR(MAX)     NOT NULL,
        WarningsJson            NVARCHAR(MAX)     NOT NULL,
        EvidenceHashSha256      VARBINARY(32)     NOT NULL,
        CreatedUtc              DATETIME2         NOT NULL,
        CONSTRAINT FK_AuditEvidenceSnapshots_Assessments FOREIGN KEY (AssessmentId) REFERENCES dbo.AuditAssessments (AssessmentId)
    );

    CREATE NONCLUSTERED INDEX IX_AuditEvidenceSnapshots_Tenant_Assessment
        ON dbo.AuditEvidenceSnapshots (TenantId, AssessmentId, CollectionCompletedUtc DESC);
END;
GO

IF OBJECT_ID(N'dbo.AuditEvidenceSnapshotInventoryLinks', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditEvidenceSnapshotInventoryLinks
    (
        LinkId                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AuditEvidenceSnapshotInventoryLinks PRIMARY KEY CLUSTERED,
        AuditEvidenceSnapshotId UNIQUEIDENTIFIER NOT NULL,
        AzureInventorySnapshotId UNIQUEIDENTIFIER NOT NULL,
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        CONSTRAINT FK_AuditEvidenceSnapshotInventoryLinks_Snapshots FOREIGN KEY (AuditEvidenceSnapshotId) REFERENCES dbo.AuditEvidenceSnapshots (AuditEvidenceSnapshotId),
        CONSTRAINT FK_AuditEvidenceSnapshotInventoryLinks_Inventory FOREIGN KEY (AzureInventorySnapshotId) REFERENCES dbo.AzureInventorySnapshots (SnapshotId)
    );

    CREATE NONCLUSTERED INDEX IX_AuditEvidenceSnapshotInventoryLinks_Tenant_AuditSnapshot
        ON dbo.AuditEvidenceSnapshotInventoryLinks (TenantId, AuditEvidenceSnapshotId);
END;
GO

IF OBJECT_ID(N'dbo.AuditEvidenceSnapshotItems', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditEvidenceSnapshotItems
    (
        EvidenceRowId           UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AuditEvidenceSnapshotItems PRIMARY KEY CLUSTERED,
        AuditEvidenceSnapshotId UNIQUEIDENTIFIER NOT NULL,
        RequirementId           UNIQUEIDENTIFIER NOT NULL,
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        CloudResourceId         UNIQUEIDENTIFIER NULL,
        AzureResourceId         NVARCHAR(1024)    NULL,
        EvidenceType            NVARCHAR(128)     NOT NULL,
        CollectedUtc            DATETIME2         NOT NULL,
        CollectorVersion        NVARCHAR(64)      NOT NULL,
        NormalizedPointer       NVARCHAR(1024)    NULL,
        RawPointer              NVARCHAR(1024)    NULL,
        EvidenceHashSha256      VARBINARY(32)     NOT NULL,
        CollectionStatus        INT               NOT NULL,
        FreshnessStatus         INT               NOT NULL,
        Confidence              DECIMAL(5, 4)     NOT NULL,
        Summary                 NVARCHAR(2000)    NOT NULL,
        ProvenanceKind          INT               NOT NULL,
        SelectorVersion         NVARCHAR(64)      NOT NULL,
        AzureScope              NVARCHAR(512)     NULL,
        ApiQueryId              NVARCHAR(256)     NULL,
        CONSTRAINT FK_AuditEvidenceSnapshotItems_Snapshots FOREIGN KEY (AuditEvidenceSnapshotId) REFERENCES dbo.AuditEvidenceSnapshots (AuditEvidenceSnapshotId),
        CONSTRAINT FK_AuditEvidenceSnapshotItems_Requirements FOREIGN KEY (RequirementId) REFERENCES dbo.AuditEvidenceRequirements (RequirementId)
    );

    CREATE NONCLUSTERED INDEX IX_AuditEvidenceSnapshotItems_Tenant_AuditSnapshot
        ON dbo.AuditEvidenceSnapshotItems (TenantId, AuditEvidenceSnapshotId);
END;
GO

IF OBJECT_ID(N'dbo.AuditEvidenceBaselines', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditEvidenceBaselines
    (
        BaselineId              UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AuditEvidenceBaselines PRIMARY KEY CLUSTERED,
        AssessmentId            UNIQUEIDENTIFIER NOT NULL,
        AuditEvidenceSnapshotId UNIQUEIDENTIFIER NOT NULL,
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        Name                    NVARCHAR(256)     NOT NULL,
        DesignatedBy            NVARCHAR(256)     NOT NULL,
        DesignatedUtc           DATETIME2         NOT NULL,
        CONSTRAINT FK_AuditEvidenceBaselines_Assessments FOREIGN KEY (AssessmentId) REFERENCES dbo.AuditAssessments (AssessmentId),
        CONSTRAINT FK_AuditEvidenceBaselines_Snapshots FOREIGN KEY (AuditEvidenceSnapshotId) REFERENCES dbo.AuditEvidenceSnapshots (AuditEvidenceSnapshotId),
        CONSTRAINT UQ_AuditEvidenceBaselines_Tenant_Assessment_Name UNIQUE (TenantId, AssessmentId, Name)
    );

    CREATE NONCLUSTERED INDEX IX_AuditEvidenceBaselines_Tenant_Assessment
        ON dbo.AuditEvidenceBaselines (TenantId, AssessmentId, DesignatedUtc DESC);
END;
GO
