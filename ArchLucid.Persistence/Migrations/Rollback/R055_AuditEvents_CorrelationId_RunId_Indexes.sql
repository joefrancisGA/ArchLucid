-- Rollback for 055_AuditEvents_CorrelationId_RunId_Indexes.sql — drops indexes only (no data movement).
IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_AuditEvents_CorrelationId'
      AND object_id = OBJECT_ID(N'dbo.AuditEvents'))
    DROP INDEX IX_AuditEvents_CorrelationId ON dbo.AuditEvents;

IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_AuditEvents_RunId_OccurredUtc'
      AND object_id = OBJECT_ID(N'dbo.AuditEvents'))
    DROP INDEX IX_AuditEvents_RunId_OccurredUtc ON dbo.AuditEvents;
