/* Keyset pagination for audit search: ORDER BY OccurredUtc DESC, EventId DESC */
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_AuditEvents_OccurredUtc_EventId'
      AND object_id = OBJECT_ID(N'dbo.AuditEvents', N'U')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_AuditEvents_OccurredUtc_EventId
        ON dbo.AuditEvents (OccurredUtc DESC, EventId DESC)
        INCLUDE (TenantId, WorkspaceId, ProjectId, EventType, ActorUserId, RunId);
END;
GO
