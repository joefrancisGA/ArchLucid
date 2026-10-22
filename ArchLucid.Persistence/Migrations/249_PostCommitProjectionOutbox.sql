-- Migration 249: Transactional outbox for durable post-commit projection side effects (TB-309).
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'PostCommitProjectionOutbox' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.PostCommitProjectionOutbox
    (
        OutboxId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_PostCommitProjectionOutbox PRIMARY KEY,
        WorkType NVARCHAR(64) NOT NULL,
        RunId UNIQUEIDENTIFIER NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        PayloadJson NVARCHAR(MAX) NULL,
        CreatedUtc DATETIME2 NOT NULL,
        ProcessedUtc DATETIME2 NULL,
        AttemptCount INT NOT NULL CONSTRAINT DF_PostCommitProjectionOutbox_AttemptCount DEFAULT ((0)),
        LockedUntilUtc DATETIME2 NULL,
        NextAttemptUtc DATETIME2 NULL,
        LastAttemptError NVARCHAR(400) NULL,
        DeadLetteredUtc DATETIME2 NULL
    );

    CREATE NONCLUSTERED INDEX IX_PostCommitProjectionOutbox_Pending
        ON dbo.PostCommitProjectionOutbox (ProcessedUtc, CreatedUtc)
        WHERE ProcessedUtc IS NULL;
END;
GO
