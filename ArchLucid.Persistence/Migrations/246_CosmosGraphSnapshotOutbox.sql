-- Migration 246: Transactional outbox for SQL → Cosmos graph snapshot replication.
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'CosmosGraphSnapshotOutbox' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.CosmosGraphSnapshotOutbox
    (
        OutboxId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_CosmosGraphSnapshotOutbox PRIMARY KEY,
        GraphSnapshotId UNIQUEIDENTIFIER NOT NULL,
        RunId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        CreatedUtc DATETIME2 NOT NULL,
        ProcessedUtc DATETIME2 NULL,
        AttemptCount INT NOT NULL CONSTRAINT DF_CosmosGraphSnapshotOutbox_AttemptCount DEFAULT ((0)),
        LockedUntilUtc DATETIME2 NULL,
        NextAttemptUtc DATETIME2 NULL,
        LastAttemptError NVARCHAR(400) NULL,
        DeadLetteredUtc DATETIME2 NULL
    );

    CREATE NONCLUSTERED INDEX IX_CosmosGraphSnapshotOutbox_Pending
        ON dbo.CosmosGraphSnapshotOutbox (ProcessedUtc, CreatedUtc)
        WHERE ProcessedUtc IS NULL;
END;
GO
