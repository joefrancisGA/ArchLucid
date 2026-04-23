IF EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_AuditEvents_OccurredUtc_EventId'
      AND object_id = OBJECT_ID(N'dbo.AuditEvents', N'U')
)
    DROP INDEX IX_AuditEvents_OccurredUtc_EventId ON dbo.AuditEvents;
GO
