/*
  Rollback 296_DropUnusedCoordinatorAndConfluenceTables.sql —
  recreate empty table shells (no row restore).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.DecisionTraces', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.DecisionTraces
    (
        TraceId          NVARCHAR(64)     NOT NULL PRIMARY KEY,
        RunId            UNIQUEIDENTIFIER NOT NULL,
        EventType        NVARCHAR(100)    NOT NULL,
        EventDescription NVARCHAR(MAX)    NOT NULL,
        EventJson        NVARCHAR(MAX)    NOT NULL,
        CreatedUtc       DATETIME2        NOT NULL,
        INDEX IX_DecisionTraces_RunId NONCLUSTERED (RunId),
        INDEX IX_DecisionTraces_CreatedUtc NONCLUSTERED (CreatedUtc DESC)
    );
END
GO

IF OBJECT_ID(N'dbo.DecisionTraces', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_DecisionTraces_Runs_RunId')
BEGIN
    ALTER TABLE dbo.DecisionTraces WITH NOCHECK ADD CONSTRAINT FK_DecisionTraces_Runs_RunId
        FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId);
END
GO

IF OBJECT_ID(N'dbo.ConfluencePublishingTargets', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ConfluencePublishingTargets
    (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_ConfluencePublishingTargets PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        BaseUrl NVARCHAR(512) NOT NULL,
        SpaceKey NVARCHAR(64) NOT NULL,
        ParentPageId NVARCHAR(64) NULL,
        AuthorEmail NVARCHAR(320) NOT NULL,
        SecretReference NVARCHAR(256) NOT NULL,
        IsActive BIT NOT NULL CONSTRAINT DF_ConfluencePublishingTargets_IsActive DEFAULT (1),
        CreatedUtc DATETIMEOFFSET(7) NOT NULL,
        CreatedBy NVARCHAR(320) NOT NULL,
        UpdatedUtc DATETIMEOFFSET(7) NULL
    );

    CREATE UNIQUE INDEX UX_ConfluencePublishingTargets_TenantProject
        ON dbo.ConfluencePublishingTargets (TenantId, WorkspaceId, ProjectId)
        WHERE IsActive = 1;
END;
GO

IF OBJECT_ID(N'dbo.ConfluencePublishJobs', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ConfluencePublishJobs
    (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_ConfluencePublishJobs PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        TargetId UNIQUEIDENTIFIER NOT NULL,
        RunId UNIQUEIDENTIFIER NOT NULL,
        ManifestVersion NVARCHAR(64) NOT NULL,
        DiffBadgeState NVARCHAR(16) NOT NULL,
        PreviousBadgeState NVARCHAR(16) NULL,
        PayloadJson NVARCHAR(MAX) NOT NULL,
        IdempotencyKey VARBINARY(32) NOT NULL,
        Status NVARCHAR(16) NOT NULL,
        Attempts INT NOT NULL CONSTRAINT DF_ConfluencePublishJobs_Attempts DEFAULT (0),
        NextAttemptUtc DATETIMEOFFSET(7) NOT NULL,
        LastErrorReason NVARCHAR(64) NULL,
        LastErrorMessage NVARCHAR(2000) NULL,
        ConfluencePageId NVARCHAR(64) NULL,
        EnqueuedUtc DATETIMEOFFSET(7) NOT NULL,
        CompletedUtc DATETIMEOFFSET(7) NULL,
        CONSTRAINT FK_ConfluencePublishJobs_ConfluencePublishingTargets FOREIGN KEY (TargetId)
            REFERENCES dbo.ConfluencePublishingTargets (Id),
        CONSTRAINT UX_ConfluencePublishJobs_IdempotencyKey UNIQUE (TenantId, IdempotencyKey)
    );

    CREATE INDEX IX_ConfluencePublishJobs_NextAttempt
        ON dbo.ConfluencePublishJobs (Status, NextAttemptUtc)
        INCLUDE (TenantId, TargetId);
END;
GO
