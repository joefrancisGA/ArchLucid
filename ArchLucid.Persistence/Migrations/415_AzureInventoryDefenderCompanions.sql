/*
  415: Defender plan, score-control, assessment, and security-contact companion rows.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.AzureInventoryDefenderPricings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureInventoryDefenderPricings
    (
        DefenderPricingRowId      UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureInventoryDefenderPricings PRIMARY KEY CLUSTERED,
        SnapshotId                UNIQUEIDENTIFIER NOT NULL,
        TenantId                  UNIQUEIDENTIFIER NOT NULL,
        SubscriptionId            NVARCHAR(64)      NOT NULL,
        PricingName               NVARCHAR(128)     NOT NULL,
        Tier                      NVARCHAR(32)      NOT NULL,
        Extensions                NVARCHAR(512)     NOT NULL CONSTRAINT DF_AzureInventoryDefenderPricings_Extensions DEFAULT N'',
        SourceEvidenceReference   NVARCHAR(512)     NULL,
        CONSTRAINT FK_AzureInventoryDefenderPricings_Snapshots FOREIGN KEY (SnapshotId) REFERENCES dbo.AzureInventorySnapshots (SnapshotId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureInventoryDefenderPricings_Tenant_Snapshot
        ON dbo.AzureInventoryDefenderPricings (TenantId, SnapshotId);
END;
GO

IF OBJECT_ID(N'dbo.AzureInventoryDefenderScoreControls', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureInventoryDefenderScoreControls
    (
        DefenderScoreControlRowId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureInventoryDefenderScoreControls PRIMARY KEY CLUSTERED,
        SnapshotId                UNIQUEIDENTIFIER NOT NULL,
        TenantId                  UNIQUEIDENTIFIER NOT NULL,
        SubscriptionId            NVARCHAR(64)      NOT NULL,
        ScoreName                 NVARCHAR(64)      NOT NULL,
        ControlName               NVARCHAR(128)     NOT NULL,
        DisplayName               NVARCHAR(512)     NOT NULL CONSTRAINT DF_AzureInventoryDefenderScoreControls_DisplayName DEFAULT N'',
        CurrentScore              INT               NOT NULL,
        MaxScore                  INT               NOT NULL,
        Percentage                INT               NOT NULL,
        Weight                    INT               NOT NULL,
        UnhealthyResourceCount    INT               NOT NULL,
        HealthyResourceCount      INT               NOT NULL,
        SourceEvidenceReference   NVARCHAR(512)     NULL,
        CONSTRAINT FK_AzureInventoryDefenderScoreControls_Snapshots FOREIGN KEY (SnapshotId) REFERENCES dbo.AzureInventorySnapshots (SnapshotId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureInventoryDefenderScoreControls_Tenant_Snapshot
        ON dbo.AzureInventoryDefenderScoreControls (TenantId, SnapshotId);
END;
GO

IF OBJECT_ID(N'dbo.AzureInventoryDefenderAssessments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureInventoryDefenderAssessments
    (
        DefenderAssessmentRowId   UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureInventoryDefenderAssessments PRIMARY KEY CLUSTERED,
        SnapshotId                UNIQUEIDENTIFIER NOT NULL,
        TenantId                  UNIQUEIDENTIFIER NOT NULL,
        SubscriptionId            NVARCHAR(64)      NOT NULL,
        AssessmentKey             NVARCHAR(128)     NOT NULL,
        DisplayName               NVARCHAR(512)     NOT NULL CONSTRAINT DF_AzureInventoryDefenderAssessments_DisplayName DEFAULT N'',
        Severity                  NVARCHAR(32)      NOT NULL,
        Status                    NVARCHAR(32)      NOT NULL,
        StatusCause               NVARCHAR(240)     NOT NULL CONSTRAINT DF_AzureInventoryDefenderAssessments_StatusCause DEFAULT N'',
        Category                  NVARCHAR(128)     NOT NULL CONSTRAINT DF_AzureInventoryDefenderAssessments_Category DEFAULT N'',
        ResourceId                NVARCHAR(1024)    NOT NULL,
        SourceEvidenceReference   NVARCHAR(512)     NULL,
        CONSTRAINT FK_AzureInventoryDefenderAssessments_Snapshots FOREIGN KEY (SnapshotId) REFERENCES dbo.AzureInventorySnapshots (SnapshotId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureInventoryDefenderAssessments_Tenant_Snapshot
        ON dbo.AzureInventoryDefenderAssessments (TenantId, SnapshotId);
END;
GO

IF OBJECT_ID(N'dbo.AzureInventoryDefenderAssessmentCounts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureInventoryDefenderAssessmentCounts
    (
        DefenderAssessmentCountRowId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureInventoryDefenderAssessmentCounts PRIMARY KEY CLUSTERED,
        SnapshotId                   UNIQUEIDENTIFIER NOT NULL,
        TenantId                     UNIQUEIDENTIFIER NOT NULL,
        SubscriptionId               NVARCHAR(64)      NOT NULL,
        AssessmentKey                NVARCHAR(128)     NOT NULL,
        DisplayName                  NVARCHAR(512)     NOT NULL CONSTRAINT DF_AzureInventoryDefenderAssessmentCounts_DisplayName DEFAULT N'',
        Severity                     NVARCHAR(32)      NOT NULL,
        HealthyCount                 INT               NOT NULL,
        UnhealthyCount               INT               NOT NULL,
        NotApplicableCount           INT               NOT NULL,
        SourceEvidenceReference      NVARCHAR(512)     NULL,
        CONSTRAINT FK_AzureInventoryDefenderAssessmentCounts_Snapshots FOREIGN KEY (SnapshotId) REFERENCES dbo.AzureInventorySnapshots (SnapshotId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureInventoryDefenderAssessmentCounts_Tenant_Snapshot
        ON dbo.AzureInventoryDefenderAssessmentCounts (TenantId, SnapshotId);
END;
GO

IF OBJECT_ID(N'dbo.AzureInventoryDefenderSecurityContacts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureInventoryDefenderSecurityContacts
    (
        DefenderSecurityContactRowId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureInventoryDefenderSecurityContacts PRIMARY KEY CLUSTERED,
        SnapshotId                   UNIQUEIDENTIFIER NOT NULL,
        TenantId                     UNIQUEIDENTIFIER NOT NULL,
        SubscriptionId               NVARCHAR(64)      NOT NULL,
        CollectionStatus             NVARCHAR(32)      NOT NULL,
        EmailCount                   INT               NOT NULL,
        Emails                       NVARCHAR(512)     NOT NULL CONSTRAINT DF_AzureInventoryDefenderSecurityContacts_Emails DEFAULT N'',
        AlertsToAdmins               BIT               NOT NULL,
        MinimalSeverity              NVARCHAR(64)      NOT NULL CONSTRAINT DF_AzureInventoryDefenderSecurityContacts_MinimalSeverity DEFAULT N'',
        NotificationRoles            NVARCHAR(512)     NOT NULL CONSTRAINT DF_AzureInventoryDefenderSecurityContacts_NotificationRoles DEFAULT N'',
        SourceEvidenceReference      NVARCHAR(512)     NULL,
        CONSTRAINT FK_AzureInventoryDefenderSecurityContacts_Snapshots FOREIGN KEY (SnapshotId) REFERENCES dbo.AzureInventorySnapshots (SnapshotId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureInventoryDefenderSecurityContacts_Tenant_Snapshot
        ON dbo.AzureInventoryDefenderSecurityContacts (TenantId, SnapshotId);
END;
GO
