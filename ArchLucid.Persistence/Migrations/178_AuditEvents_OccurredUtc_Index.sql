/*
  Add OccurredUtc index to dbo.AuditEvents table to improve performance of time-window filtered audit searches.
*/

IF OBJECT_ID(N'dbo.AuditEvents', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_AuditEvents_OccurredUtc'
         AND object_id = OBJECT_ID(N'dbo.AuditEvents'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_AuditEvents_OccurredUtc
        ON dbo.AuditEvents (OccurredUtc DESC);
END;
GO
