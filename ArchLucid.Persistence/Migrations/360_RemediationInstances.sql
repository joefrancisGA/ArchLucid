/*
  360: Remediation instances and evidence (IE-13).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.RemediationInstances', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RemediationInstances
    (
        InstanceId              UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_RemediationInstances PRIMARY KEY CLUSTERED,
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId             UNIQUEIDENTIFIER NOT NULL,
        ProjectId               UNIQUEIDENTIFIER NOT NULL,
        FindingId               UNIQUEIDENTIFIER NOT NULL,
        PatternId               UNIQUEIDENTIFIER NOT NULL,
        PatternVersionId        UNIQUEIDENTIFIER NOT NULL,
        PatternKey              NVARCHAR(256)     NOT NULL,
        FrozenPatternVersion    NVARCHAR(64)      NOT NULL,
        AutomationLevel         INT               NOT NULL,
        Status                  INT               NOT NULL,
        CloudResourceId         UNIQUEIDENTIFIER NULL,
        AssessmentId            UNIQUEIDENTIFIER NULL,
        ControlId               UNIQUEIDENTIFIER NULL,
        PreflightSnapshotId     UNIQUEIDENTIFIER NULL,
        ExecutionSnapshotId     UNIQUEIDENTIFIER NULL,
        VerificationSnapshotId  UNIQUEIDENTIFIER NULL,
        WaveId                  UNIQUEIDENTIFIER NULL,
        PreflightResultJson     NVARCHAR(MAX)     NULL,
        VerificationResultJson  NVARCHAR(MAX)     NULL,
        CreatedByActorKey       NVARCHAR(256)     NOT NULL,
        ApprovedByActorKey        NVARCHAR(256)     NULL,
        CreatedUtc              DATETIME2         NOT NULL,
        UpdatedUtc              DATETIME2         NOT NULL,
        ApprovedUtc             DATETIME2         NULL,
        ExecutedUtc             DATETIME2         NULL,
        VerifiedUtc             DATETIME2         NULL,
        ClosedUtc               DATETIME2         NULL,
        CONSTRAINT FK_RemediationInstances_Finding
            FOREIGN KEY (FindingId) REFERENCES dbo.OperationalSecurityFindings (FindingId),
        CONSTRAINT FK_RemediationInstances_PatternVersion
            FOREIGN KEY (PatternVersionId) REFERENCES dbo.RemediationPatternVersions (VersionId)
    );

    CREATE NONCLUSTERED INDEX IX_RemediationInstances_Tenant_Status
        ON dbo.RemediationInstances (TenantId, Status, UpdatedUtc DESC);

    CREATE NONCLUSTERED INDEX IX_RemediationInstances_Tenant_Finding
        ON dbo.RemediationInstances (TenantId, FindingId);
END;
GO

IF OBJECT_ID(N'dbo.RemediationEvidence', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RemediationEvidence
    (
        EvidenceId      UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_RemediationEvidence PRIMARY KEY CLUSTERED,
        InstanceId      UNIQUEIDENTIFIER NOT NULL,
        TenantId        UNIQUEIDENTIFIER NOT NULL,
        Phase           INT               NOT NULL,
        PayloadJson     NVARCHAR(MAX)     NOT NULL,
        ActorKey        NVARCHAR(256)     NOT NULL,
        CorrelationId   NVARCHAR(128)     NOT NULL,
        CreatedUtc      DATETIME2         NOT NULL,
        CONSTRAINT FK_RemediationEvidence_Instance
            FOREIGN KEY (InstanceId) REFERENCES dbo.RemediationInstances (InstanceId)
    );

    CREATE NONCLUSTERED INDEX IX_RemediationEvidence_Instance
        ON dbo.RemediationEvidence (TenantId, InstanceId, CreatedUtc);
END;
GO
