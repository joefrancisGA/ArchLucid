-- Transactional outbox for integration events (e.g. authority run completed → Service Bus).
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'IntegrationEventOutbox' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.IntegrationEventOutbox
    (
        OutboxId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_IntegrationEventOutbox PRIMARY KEY,
        RunId UNIQUEIDENTIFIER NULL,
        EventType NVARCHAR(256) NOT NULL,
        MessageId NVARCHAR(128) NULL,
        PayloadUtf8 VARBINARY(MAX) NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        CreatedUtc DATETIME2 NOT NULL,
        ProcessedUtc DATETIME2 NULL
    );

    CREATE NONCLUSTERED INDEX IX_IntegrationEventOutbox_Pending
        ON dbo.IntegrationEventOutbox (ProcessedUtc, CreatedUtc)
        WHERE ProcessedUtc IS NULL;
END;
GO

GO
