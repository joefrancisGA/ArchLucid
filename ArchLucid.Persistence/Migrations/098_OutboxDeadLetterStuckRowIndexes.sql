/*
  098: Filtered nonclustered indexes on dbo.IntegrationEventOutbox for operator / dashboard queries.

  Numbering: **097** is **`097_TenantOnboardingState.sql`** (tenant funnel); this migration is the next lexicographic slice
  for the backlog item “dead-letter / stuck pending” outbox diagnostics.

  - IX_IntegrationEventOutbox_DeadLetteredUtc: rows moved to dead-letter (sparse filter).
  - IX_IntegrationEventOutbox_PendingWithRetries: pending rows that have failed at least once (RetryCount > 0),
    keyed for “stuck / backoff” sweeps by NextRetryUtc and CreatedUtc.

  Idempotent: each CREATE runs only when the table exists and the index name is absent.

  Rollback: Rollback/R098_OutboxDeadLetterStuckRowIndexes.sql
*/

IF OBJECT_ID(N'dbo.IntegrationEventOutbox', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.IntegrationEventOutbox', N'DeadLetteredUtc') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_IntegrationEventOutbox_DeadLetteredUtc'
          AND object_id = OBJECT_ID(N'dbo.IntegrationEventOutbox'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_IntegrationEventOutbox_DeadLetteredUtc
        ON dbo.IntegrationEventOutbox (DeadLetteredUtc DESC, EventType)
        INCLUDE (TenantId, WorkspaceId, ProjectId, RetryCount, LastErrorMessage)
        WHERE DeadLetteredUtc IS NOT NULL;
END;
GO

IF OBJECT_ID(N'dbo.IntegrationEventOutbox', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.IntegrationEventOutbox', N'RetryCount') IS NOT NULL
   AND COL_LENGTH(N'dbo.IntegrationEventOutbox', N'NextRetryUtc') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_IntegrationEventOutbox_PendingWithRetries'
          AND object_id = OBJECT_ID(N'dbo.IntegrationEventOutbox'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_IntegrationEventOutbox_PendingWithRetries
        ON dbo.IntegrationEventOutbox (NextRetryUtc ASC, CreatedUtc ASC)
        INCLUDE (EventType, TenantId, WorkspaceId, ProjectId, RetryCount, LastErrorMessage)
        WHERE ProcessedUtc IS NULL AND DeadLetteredUtc IS NULL AND RetryCount > 0;
END;
GO
