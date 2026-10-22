-- Migration 248: Transactional outbox for durable run-export blob push.
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'RunExportBlobPushOutbox' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.RunExportBlobPushOutbox
    (
        OutboxId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_RunExportBlobPushOutbox PRIMARY KEY,
        RunId UNIQUEIDENTIFIER NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        DestinationSasUrl NVARCHAR(2048) NOT NULL,
        CreatedUtc DATETIME2 NOT NULL,
        ProcessedUtc DATETIME2 NULL,
        AttemptCount INT NOT NULL CONSTRAINT DF_RunExportBlobPushOutbox_AttemptCount DEFAULT ((0)),
        LockedUntilUtc DATETIME2 NULL,
        NextAttemptUtc DATETIME2 NULL,
        LastAttemptError NVARCHAR(400) NULL,
        DeadLetteredUtc DATETIME2 NULL
    );

    CREATE NONCLUSTERED INDEX IX_RunExportBlobPushOutbox_Pending
        ON dbo.RunExportBlobPushOutbox (ProcessedUtc, CreatedUtc)
        WHERE ProcessedUtc IS NULL;
END;
GO
