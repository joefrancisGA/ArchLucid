/*
  Roll back DbUp 178 — drop IX_AuditEvents_OccurredUtc.
*/

IF EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_AuditEvents_OccurredUtc'
      AND object_id = OBJECT_ID(N'dbo.AuditEvents'))
BEGIN
    DROP INDEX IX_AuditEvents_OccurredUtc ON dbo.AuditEvents;
END;
GO
