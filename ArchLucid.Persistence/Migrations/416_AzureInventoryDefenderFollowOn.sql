/*
  416: Defender governance, compliance, alerts, attack-path summaries, and vulnerability counts.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.AzureInventoryDefenderGovernanceAssignments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureInventoryDefenderGovernanceAssignments
    (
        DefenderGovernanceAssignmentRowId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureInventoryDefenderGovernanceAssignments PRIMARY KEY CLUSTERED,
        SnapshotId                        UNIQUEIDENTIFIER NOT NULL,
        TenantId                          UNIQUEIDENTIFIER NOT NULL,
        SubscriptionId                    NVARCHAR(64)      NOT NULL,
        AssessmentKey                     NVARCHAR(128)     NOT NULL,
        ResourceId                        NVARCHAR(1024)    NOT NULL,
        Owner                             NVARCHAR(320)     NULL,
        RemediationDueUtc                 DATETIME2         NULL,
        IsGracePeriod                     BIT               NOT NULL CONSTRAINT DF_AzureInventoryDefenderGovernanceAssignments_IsGracePeriod DEFAULT 0,
        AssignmentStatus                  NVARCHAR(64)      NOT NULL CONSTRAINT DF_AzureInventoryDefenderGovernanceAssignments_AssignmentStatus DEFAULT N'',
        SourceEvidenceReference           NVARCHAR(512)     NULL,
        CONSTRAINT FK_AzureInventoryDefenderGovernanceAssignments_Snapshots FOREIGN KEY (SnapshotId) REFERENCES dbo.AzureInventorySnapshots (SnapshotId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureInventoryDefenderGovernanceAssignments_Tenant_Snapshot
        ON dbo.AzureInventoryDefenderGovernanceAssignments (TenantId, SnapshotId);
END;
GO

IF OBJECT_ID(N'dbo.AzureInventoryDefenderComplianceStandards', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureInventoryDefenderComplianceStandards
    (
        DefenderComplianceStandardRowId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureInventoryDefenderComplianceStandards PRIMARY KEY CLUSTERED,
        SnapshotId                      UNIQUEIDENTIFIER NOT NULL,
        TenantId                        UNIQUEIDENTIFIER NOT NULL,
        SubscriptionId                  NVARCHAR(64)      NOT NULL,
        StandardName                    NVARCHAR(128)     NOT NULL,
        State                           NVARCHAR(64)      NOT NULL CONSTRAINT DF_AzureInventoryDefenderComplianceStandards_State DEFAULT N'',
        PassedControlCount              INT               NOT NULL,
        FailedControlCount              INT               NOT NULL,
        SkippedControlCount             INT               NOT NULL,
        SourceEvidenceReference         NVARCHAR(512)     NULL,
        CONSTRAINT FK_AzureInventoryDefenderComplianceStandards_Snapshots FOREIGN KEY (SnapshotId) REFERENCES dbo.AzureInventorySnapshots (SnapshotId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureInventoryDefenderComplianceStandards_Tenant_Snapshot
        ON dbo.AzureInventoryDefenderComplianceStandards (TenantId, SnapshotId);
END;
GO

IF OBJECT_ID(N'dbo.AzureInventoryDefenderComplianceControls', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureInventoryDefenderComplianceControls
    (
        DefenderComplianceControlRowId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureInventoryDefenderComplianceControls PRIMARY KEY CLUSTERED,
        SnapshotId                     UNIQUEIDENTIFIER NOT NULL,
        TenantId                       UNIQUEIDENTIFIER NOT NULL,
        SubscriptionId                 NVARCHAR(64)      NOT NULL,
        StandardName                   NVARCHAR(128)     NOT NULL,
        ControlName                    NVARCHAR(256)     NOT NULL,
        State                          NVARCHAR(64)      NOT NULL,
        FailedAssessmentCount          INT               NOT NULL,
        SourceEvidenceReference        NVARCHAR(512)     NULL,
        CONSTRAINT FK_AzureInventoryDefenderComplianceControls_Snapshots FOREIGN KEY (SnapshotId) REFERENCES dbo.AzureInventorySnapshots (SnapshotId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureInventoryDefenderComplianceControls_Tenant_Snapshot
        ON dbo.AzureInventoryDefenderComplianceControls (TenantId, SnapshotId);
END;
GO

IF OBJECT_ID(N'dbo.AzureInventoryDefenderAlerts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureInventoryDefenderAlerts
    (
        DefenderAlertRowId      UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureInventoryDefenderAlerts PRIMARY KEY CLUSTERED,
        SnapshotId              UNIQUEIDENTIFIER NOT NULL,
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        SubscriptionId          NVARCHAR(64)      NOT NULL,
        AlertId                 NVARCHAR(128)     NOT NULL,
        DisplayName             NVARCHAR(512)     NOT NULL CONSTRAINT DF_AzureInventoryDefenderAlerts_DisplayName DEFAULT N'',
        Severity                NVARCHAR(32)      NOT NULL,
        Status                  NVARCHAR(32)      NOT NULL,
        Intent                  NVARCHAR(64)      NOT NULL CONSTRAINT DF_AzureInventoryDefenderAlerts_Intent DEFAULT N'',
        AlertType               NVARCHAR(256)     NOT NULL CONSTRAINT DF_AzureInventoryDefenderAlerts_AlertType DEFAULT N'',
        StartTimeUtc            DATETIME2         NULL,
        ResourceId              NVARCHAR(1024)    NOT NULL CONSTRAINT DF_AzureInventoryDefenderAlerts_ResourceId DEFAULT N'',
        SourceEvidenceReference NVARCHAR(512)     NULL,
        CONSTRAINT FK_AzureInventoryDefenderAlerts_Snapshots FOREIGN KEY (SnapshotId) REFERENCES dbo.AzureInventorySnapshots (SnapshotId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureInventoryDefenderAlerts_Tenant_Snapshot
        ON dbo.AzureInventoryDefenderAlerts (TenantId, SnapshotId);
END;
GO

IF OBJECT_ID(N'dbo.AzureInventoryDefenderAttackPaths', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureInventoryDefenderAttackPaths
    (
        DefenderAttackPathRowId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureInventoryDefenderAttackPaths PRIMARY KEY CLUSTERED,
        SnapshotId              UNIQUEIDENTIFIER NOT NULL,
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        SubscriptionId          NVARCHAR(64)      NOT NULL,
        AttackPathId            NVARCHAR(128)     NOT NULL,
        DisplayName             NVARCHAR(512)     NOT NULL CONSTRAINT DF_AzureInventoryDefenderAttackPaths_DisplayName DEFAULT N'',
        RiskLevel               NVARCHAR(64)      NOT NULL CONSTRAINT DF_AzureInventoryDefenderAttackPaths_RiskLevel DEFAULT N'',
        EntryResourceIds        NVARCHAR(2048)    NOT NULL CONSTRAINT DF_AzureInventoryDefenderAttackPaths_EntryResourceIds DEFAULT N'',
        TargetResourceIds       NVARCHAR(2048)    NOT NULL CONSTRAINT DF_AzureInventoryDefenderAttackPaths_TargetResourceIds DEFAULT N'',
        SourceEvidenceReference NVARCHAR(512)     NULL,
        CONSTRAINT FK_AzureInventoryDefenderAttackPaths_Snapshots FOREIGN KEY (SnapshotId) REFERENCES dbo.AzureInventorySnapshots (SnapshotId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureInventoryDefenderAttackPaths_Tenant_Snapshot
        ON dbo.AzureInventoryDefenderAttackPaths (TenantId, SnapshotId);
END;
GO

IF OBJECT_ID(N'dbo.AzureInventoryDefenderVulnerabilityCounts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureInventoryDefenderVulnerabilityCounts
    (
        DefenderVulnerabilityCountRowId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureInventoryDefenderVulnerabilityCounts PRIMARY KEY CLUSTERED,
        SnapshotId                      UNIQUEIDENTIFIER NOT NULL,
        TenantId                        UNIQUEIDENTIFIER NOT NULL,
        SubscriptionId                  NVARCHAR(64)      NOT NULL,
        ResourceId                      NVARCHAR(1024)    NOT NULL,
        CriticalCount                   INT               NOT NULL,
        HighCount                       INT               NOT NULL,
        MediumCount                     INT               NOT NULL,
        LowCount                        INT               NOT NULL,
        SourceEvidenceReference         NVARCHAR(512)     NULL,
        CONSTRAINT FK_AzureInventoryDefenderVulnerabilityCounts_Snapshots FOREIGN KEY (SnapshotId) REFERENCES dbo.AzureInventorySnapshots (SnapshotId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureInventoryDefenderVulnerabilityCounts_Tenant_Snapshot
        ON dbo.AzureInventoryDefenderVulnerabilityCounts (TenantId, SnapshotId);
END;
GO

IF OBJECT_ID(N'dbo.AzureInventoryDefenderVulnerabilityFindings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AzureInventoryDefenderVulnerabilityFindings
    (
        DefenderVulnerabilityFindingRowId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_AzureInventoryDefenderVulnerabilityFindings PRIMARY KEY CLUSTERED,
        SnapshotId                        UNIQUEIDENTIFIER NOT NULL,
        TenantId                          UNIQUEIDENTIFIER NOT NULL,
        SubscriptionId                    NVARCHAR(64)      NOT NULL,
        ResourceId                        NVARCHAR(1024)    NOT NULL,
        Severity                          NVARCHAR(16)      NOT NULL,
        FindingId                         NVARCHAR(64)      NOT NULL,
        DisplayName                       NVARCHAR(240)     NOT NULL CONSTRAINT DF_AzureInventoryDefenderVulnerabilityFindings_DisplayName DEFAULT N'',
        SourceEvidenceReference           NVARCHAR(512)     NULL,
        CONSTRAINT FK_AzureInventoryDefenderVulnerabilityFindings_Snapshots FOREIGN KEY (SnapshotId) REFERENCES dbo.AzureInventorySnapshots (SnapshotId)
    );

    CREATE NONCLUSTERED INDEX IX_AzureInventoryDefenderVulnerabilityFindings_Tenant_Snapshot
        ON dbo.AzureInventoryDefenderVulnerabilityFindings (TenantId, SnapshotId);
END;
GO
