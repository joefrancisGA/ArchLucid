/*
  R191: Rollback 191_AuditEvents_CorrelationRunId_Indexes.sql — drop indexes added when absent.
*/

IF OBJECT_ID(N'dbo.AuditEvents', N'U') IS NOT NULL
   AND EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_AuditEvents_CorrelationId'
          AND object_id = OBJECT_ID(N'dbo.AuditEvents'))
    DROP INDEX IX_AuditEvents_CorrelationId ON dbo.AuditEvents;
GO

IF OBJECT_ID(N'dbo.AuditEvents', N'U') IS NOT NULL
   AND EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_AuditEvents_RunId_OccurredUtc'
          AND object_id = OBJECT_ID(N'dbo.AuditEvents'))
    DROP INDEX IX_AuditEvents_RunId_OccurredUtc ON dbo.AuditEvents;
GO
