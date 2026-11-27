/* FND-075: tenant-local, fenced durable analysis stage work. No inference from legacy timeline rows. */
IF OBJECT_ID(N'dbo.AnalysisStageRecovery', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AnalysisStageRecovery
    (
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        Pipeline NVARCHAR(32) NOT NULL,
        RunId UNIQUEIDENTIFIER NOT NULL,
        Stage NVARCHAR(64) NOT NULL,
        InputVersion CHAR(64) NOT NULL,
        State NVARCHAR(16) NOT NULL,
        Owner UNIQUEIDENTIFIER NULL,
        Fence BIGINT NOT NULL,
        Attempts INT NOT NULL,
        LeaseUntilUtc DATETIME2(7) NULL,
        ResultReference NVARCHAR(1024) NULL,
        UpdatedUtc DATETIME2(7) NOT NULL,
        CONSTRAINT PK_AnalysisStageRecovery
            PRIMARY KEY (TenantId, WorkspaceId, ProjectId, Pipeline, RunId, Stage),
        CONSTRAINT CK_AnalysisStageRecovery_State
            CHECK (State IN (N'running', N'retry', N'succeeded', N'failed')),
        CONSTRAINT CK_AnalysisStageRecovery_Ownership CHECK
            ((State = N'running' AND Owner IS NOT NULL AND LeaseUntilUtc IS NOT NULL)
            OR (State <> N'running' AND Owner IS NULL AND LeaseUntilUtc IS NULL)),
        CONSTRAINT CK_AnalysisStageRecovery_Result CHECK
            ((State = N'succeeded' AND ResultReference IS NOT NULL)
            OR (State <> N'succeeded' AND ResultReference IS NULL)),
        CONSTRAINT CK_AnalysisStageRecovery_Attempts CHECK (Fence >= 1 AND Attempts >= 1)
    );
END;
GO

IF OBJECT_ID(N'dbo.SecureNowAnalysisRecoveryJobs', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SecureNowAnalysisRecoveryJobs
    (
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        SnapshotId UNIQUEIDENTIFIER NOT NULL,
        SubscriptionId NVARCHAR(128) NULL,
        FullRecompute BIT NOT NULL,
        InputVersion CHAR(64) NOT NULL,
        AdmittedUtc DATETIME2(7) NOT NULL,
        DeadlineUtc DATETIME2(7) NOT NULL,
        Outcome NVARCHAR(16) NULL,
        CONSTRAINT PK_SecureNowAnalysisRecoveryJobs PRIMARY KEY (TenantId, WorkspaceId, ProjectId, SnapshotId),
        CONSTRAINT CK_SecureNowAnalysisRecoveryJobs_Outcome
            CHECK (Outcome IS NULL OR Outcome IN (N'succeeded', N'failed', N'timed_out', N'retry_exhausted'))
    );
    CREATE INDEX IX_SecureNowAnalysisRecoveryJobs_Pending
        ON dbo.SecureNowAnalysisRecoveryJobs (TenantId, AdmittedUtc, SnapshotId) WHERE Outcome IS NULL;
END;
GO
