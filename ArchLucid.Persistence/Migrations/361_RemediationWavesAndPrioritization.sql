/*
  361: Remediation waves, prioritization weights/scores (IE-15).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.RemediationPrioritizationWeights', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RemediationPrioritizationWeights
    (
        TenantId            UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_RemediationPrioritizationWeights PRIMARY KEY CLUSTERED,
        WeightsJson         NVARCHAR(MAX)     NOT NULL,
        UpdatedByActorKey   NVARCHAR(256)     NOT NULL,
        UpdatedUtc          DATETIME2         NOT NULL
    );
END;
GO

IF OBJECT_ID(N'dbo.RemediationPrioritizationScores', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RemediationPrioritizationScores
    (
        FindingId           UNIQUEIDENTIFIER NOT NULL,
        TenantId            UNIQUEIDENTIFIER NOT NULL,
        TotalScore          DECIMAL(12, 6)    NOT NULL,
        BreakdownJson       NVARCHAR(MAX)     NOT NULL,
        ExplanationSummary  NVARCHAR(1024)    NOT NULL,
        RuleVersion         NVARCHAR(64)      NOT NULL,
        ComputedUtc         DATETIME2         NOT NULL,
        CONSTRAINT PK_RemediationPrioritizationScores PRIMARY KEY CLUSTERED (TenantId, FindingId),
        CONSTRAINT FK_RemediationPrioritizationScores_Finding
            FOREIGN KEY (FindingId) REFERENCES dbo.OperationalSecurityFindings (FindingId)
    );

    CREATE NONCLUSTERED INDEX IX_RemediationPrioritizationScores_Tenant_Score
        ON dbo.RemediationPrioritizationScores (TenantId, TotalScore DESC, ComputedUtc DESC);
END;
GO

IF OBJECT_ID(N'dbo.RemediationWaves', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RemediationWaves
    (
        WaveId              UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_RemediationWaves PRIMARY KEY CLUSTERED,
        TenantId            UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId         UNIQUEIDENTIFIER NOT NULL,
        ProjectId           UNIQUEIDENTIFIER NOT NULL,
        Name                NVARCHAR(256)     NOT NULL,
        TargetSize          INT               NULL,
        Status              INT               NOT NULL,
        CreatedByActorKey   NVARCHAR(256)     NOT NULL,
        CreatedUtc          DATETIME2         NOT NULL,
        UpdatedUtc          DATETIME2         NOT NULL
    );

    CREATE NONCLUSTERED INDEX IX_RemediationWaves_Tenant_Status
        ON dbo.RemediationWaves (TenantId, Status, UpdatedUtc DESC);
END;
GO

IF OBJECT_ID(N'dbo.RemediationWaveMembers', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RemediationWaveMembers
    (
        MemberId            UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_RemediationWaveMembers PRIMARY KEY CLUSTERED,
        WaveId              UNIQUEIDENTIFIER NOT NULL,
        TenantId            UNIQUEIDENTIFIER NOT NULL,
        FindingId           UNIQUEIDENTIFIER NOT NULL,
        InstanceId          UNIQUEIDENTIFIER NULL,
        CloudResourceId     UNIQUEIDENTIFIER NULL,
        PriorityRank        INT               NOT NULL,
        PriorityScore       DECIMAL(12, 6)    NOT NULL,
        CreatedUtc          DATETIME2         NOT NULL,
        CONSTRAINT FK_RemediationWaveMembers_Wave
            FOREIGN KEY (WaveId) REFERENCES dbo.RemediationWaves (WaveId),
        CONSTRAINT FK_RemediationWaveMembers_Finding
            FOREIGN KEY (FindingId) REFERENCES dbo.OperationalSecurityFindings (FindingId)
    );

    CREATE NONCLUSTERED INDEX IX_RemediationWaveMembers_Wave
        ON dbo.RemediationWaveMembers (TenantId, WaveId, PriorityRank);
END;
GO
