/*
  R098: Roll back 098 — drop IntegrationEventOutbox diagnostic indexes.
*/

IF EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_IntegrationEventOutbox_PendingWithRetries'
      AND object_id = OBJECT_ID(N'dbo.IntegrationEventOutbox'))
    DROP INDEX IX_IntegrationEventOutbox_PendingWithRetries ON dbo.IntegrationEventOutbox;
GO

IF EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_IntegrationEventOutbox_DeadLetteredUtc'
      AND object_id = OBJECT_ID(N'dbo.IntegrationEventOutbox'))
    DROP INDEX IX_IntegrationEventOutbox_DeadLetteredUtc ON dbo.IntegrationEventOutbox;
GO
