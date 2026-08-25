/*
  328 — Rebuild recoverable outbox pending indexes after lease/retry columns (migration 219+).

  Dequeue filters ProcessedUtc IS NULL, DeadLetteredUtc IS NULL, NextAttemptUtc, and LockedUntilUtc
  but original indexes only keyed (ProcessedUtc, CreatedUtc). Mirror IntegrationEventOutbox (041/098).

  Rollback: Rollback/R328_RecoverableOutbox_PendingIndexes.sql
*/

/* ---- RetrievalIndexingOutbox ---- */
IF OBJECT_ID(N'dbo.RetrievalIndexingOutbox', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.RetrievalIndexingOutbox', N'NextAttemptUtc') IS NOT NULL
   AND COL_LENGTH(N'dbo.RetrievalIndexingOutbox', N'DeadLetteredUtc') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_RetrievalIndexingOutbox_Pending'
         AND object_id = OBJECT_ID(N'dbo.RetrievalIndexingOutbox'))
BEGIN
    DROP INDEX IX_RetrievalIndexingOutbox_Pending ON dbo.RetrievalIndexingOutbox;
END;
GO

IF OBJECT_ID(N'dbo.RetrievalIndexingOutbox', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.RetrievalIndexingOutbox', N'NextAttemptUtc') IS NOT NULL
   AND COL_LENGTH(N'dbo.RetrievalIndexingOutbox', N'DeadLetteredUtc') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_RetrievalIndexingOutbox_Pending'
         AND object_id = OBJECT_ID(N'dbo.RetrievalIndexingOutbox'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_RetrievalIndexingOutbox_Pending
        ON dbo.RetrievalIndexingOutbox (NextAttemptUtc, CreatedUtc)
        WHERE ProcessedUtc IS NULL AND DeadLetteredUtc IS NULL;
END;
GO

IF OBJECT_ID(N'dbo.RetrievalIndexingOutbox', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.RetrievalIndexingOutbox', N'AttemptCount') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_RetrievalIndexingOutbox_PendingWithRetries'
         AND object_id = OBJECT_ID(N'dbo.RetrievalIndexingOutbox'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_RetrievalIndexingOutbox_PendingWithRetries
        ON dbo.RetrievalIndexingOutbox (NextAttemptUtc ASC, CreatedUtc ASC)
        WHERE ProcessedUtc IS NULL AND DeadLetteredUtc IS NULL AND AttemptCount > 0;
END;
GO

/* ---- AuthorityPipelineWorkOutbox ---- */
IF OBJECT_ID(N'dbo.AuthorityPipelineWorkOutbox', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AuthorityPipelineWorkOutbox', N'NextAttemptUtc') IS NOT NULL
   AND COL_LENGTH(N'dbo.AuthorityPipelineWorkOutbox', N'DeadLetteredUtc') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_AuthorityPipelineWorkOutbox_Pending'
         AND object_id = OBJECT_ID(N'dbo.AuthorityPipelineWorkOutbox'))
BEGIN
    DROP INDEX IX_AuthorityPipelineWorkOutbox_Pending ON dbo.AuthorityPipelineWorkOutbox;
END;
GO

IF OBJECT_ID(N'dbo.AuthorityPipelineWorkOutbox', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AuthorityPipelineWorkOutbox', N'NextAttemptUtc') IS NOT NULL
   AND COL_LENGTH(N'dbo.AuthorityPipelineWorkOutbox', N'DeadLetteredUtc') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_AuthorityPipelineWorkOutbox_Pending'
         AND object_id = OBJECT_ID(N'dbo.AuthorityPipelineWorkOutbox'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_AuthorityPipelineWorkOutbox_Pending
        ON dbo.AuthorityPipelineWorkOutbox (NextAttemptUtc, CreatedUtc)
        WHERE ProcessedUtc IS NULL AND DeadLetteredUtc IS NULL;
END;
GO

IF OBJECT_ID(N'dbo.AuthorityPipelineWorkOutbox', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AuthorityPipelineWorkOutbox', N'AttemptCount') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_AuthorityPipelineWorkOutbox_PendingWithRetries'
         AND object_id = OBJECT_ID(N'dbo.AuthorityPipelineWorkOutbox'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_AuthorityPipelineWorkOutbox_PendingWithRetries
        ON dbo.AuthorityPipelineWorkOutbox (NextAttemptUtc ASC, CreatedUtc ASC)
        WHERE ProcessedUtc IS NULL AND DeadLetteredUtc IS NULL AND AttemptCount > 0;
END;
GO

/* ---- CosmosGraphSnapshotOutbox ---- */
IF OBJECT_ID(N'dbo.CosmosGraphSnapshotOutbox', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.CosmosGraphSnapshotOutbox', N'NextAttemptUtc') IS NOT NULL
   AND COL_LENGTH(N'dbo.CosmosGraphSnapshotOutbox', N'DeadLetteredUtc') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_CosmosGraphSnapshotOutbox_Pending'
         AND object_id = OBJECT_ID(N'dbo.CosmosGraphSnapshotOutbox'))
BEGIN
    DROP INDEX IX_CosmosGraphSnapshotOutbox_Pending ON dbo.CosmosGraphSnapshotOutbox;
END;
GO

IF OBJECT_ID(N'dbo.CosmosGraphSnapshotOutbox', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.CosmosGraphSnapshotOutbox', N'NextAttemptUtc') IS NOT NULL
   AND COL_LENGTH(N'dbo.CosmosGraphSnapshotOutbox', N'DeadLetteredUtc') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_CosmosGraphSnapshotOutbox_Pending'
         AND object_id = OBJECT_ID(N'dbo.CosmosGraphSnapshotOutbox'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_CosmosGraphSnapshotOutbox_Pending
        ON dbo.CosmosGraphSnapshotOutbox (NextAttemptUtc, CreatedUtc)
        WHERE ProcessedUtc IS NULL AND DeadLetteredUtc IS NULL;
END;
GO

IF OBJECT_ID(N'dbo.CosmosGraphSnapshotOutbox', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.CosmosGraphSnapshotOutbox', N'AttemptCount') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_CosmosGraphSnapshotOutbox_PendingWithRetries'
         AND object_id = OBJECT_ID(N'dbo.CosmosGraphSnapshotOutbox'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_CosmosGraphSnapshotOutbox_PendingWithRetries
        ON dbo.CosmosGraphSnapshotOutbox (NextAttemptUtc ASC, CreatedUtc ASC)
        WHERE ProcessedUtc IS NULL AND DeadLetteredUtc IS NULL AND AttemptCount > 0;
END;
GO

/* ---- RunExportBlobPushOutbox ---- */
IF OBJECT_ID(N'dbo.RunExportBlobPushOutbox', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.RunExportBlobPushOutbox', N'NextAttemptUtc') IS NOT NULL
   AND COL_LENGTH(N'dbo.RunExportBlobPushOutbox', N'DeadLetteredUtc') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_RunExportBlobPushOutbox_Pending'
         AND object_id = OBJECT_ID(N'dbo.RunExportBlobPushOutbox'))
BEGIN
    DROP INDEX IX_RunExportBlobPushOutbox_Pending ON dbo.RunExportBlobPushOutbox;
END;
GO

IF OBJECT_ID(N'dbo.RunExportBlobPushOutbox', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.RunExportBlobPushOutbox', N'NextAttemptUtc') IS NOT NULL
   AND COL_LENGTH(N'dbo.RunExportBlobPushOutbox', N'DeadLetteredUtc') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_RunExportBlobPushOutbox_Pending'
         AND object_id = OBJECT_ID(N'dbo.RunExportBlobPushOutbox'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_RunExportBlobPushOutbox_Pending
        ON dbo.RunExportBlobPushOutbox (NextAttemptUtc, CreatedUtc)
        WHERE ProcessedUtc IS NULL AND DeadLetteredUtc IS NULL;
END;
GO

IF OBJECT_ID(N'dbo.RunExportBlobPushOutbox', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.RunExportBlobPushOutbox', N'AttemptCount') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_RunExportBlobPushOutbox_PendingWithRetries'
         AND object_id = OBJECT_ID(N'dbo.RunExportBlobPushOutbox'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_RunExportBlobPushOutbox_PendingWithRetries
        ON dbo.RunExportBlobPushOutbox (NextAttemptUtc ASC, CreatedUtc ASC)
        WHERE ProcessedUtc IS NULL AND DeadLetteredUtc IS NULL AND AttemptCount > 0;
END;
GO

/* ---- PostCommitProjectionOutbox ---- */
IF OBJECT_ID(N'dbo.PostCommitProjectionOutbox', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.PostCommitProjectionOutbox', N'NextAttemptUtc') IS NOT NULL
   AND COL_LENGTH(N'dbo.PostCommitProjectionOutbox', N'DeadLetteredUtc') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_PostCommitProjectionOutbox_Pending'
         AND object_id = OBJECT_ID(N'dbo.PostCommitProjectionOutbox'))
BEGIN
    DROP INDEX IX_PostCommitProjectionOutbox_Pending ON dbo.PostCommitProjectionOutbox;
END;
GO

IF OBJECT_ID(N'dbo.PostCommitProjectionOutbox', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.PostCommitProjectionOutbox', N'NextAttemptUtc') IS NOT NULL
   AND COL_LENGTH(N'dbo.PostCommitProjectionOutbox', N'DeadLetteredUtc') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_PostCommitProjectionOutbox_Pending'
         AND object_id = OBJECT_ID(N'dbo.PostCommitProjectionOutbox'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_PostCommitProjectionOutbox_Pending
        ON dbo.PostCommitProjectionOutbox (NextAttemptUtc, CreatedUtc)
        WHERE ProcessedUtc IS NULL AND DeadLetteredUtc IS NULL;
END;
GO

IF OBJECT_ID(N'dbo.PostCommitProjectionOutbox', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.PostCommitProjectionOutbox', N'AttemptCount') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_PostCommitProjectionOutbox_PendingWithRetries'
         AND object_id = OBJECT_ID(N'dbo.PostCommitProjectionOutbox'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_PostCommitProjectionOutbox_PendingWithRetries
        ON dbo.PostCommitProjectionOutbox (NextAttemptUtc ASC, CreatedUtc ASC)
        WHERE ProcessedUtc IS NULL AND DeadLetteredUtc IS NULL AND AttemptCount > 0;
END;
GO
