/*
  Improvement #36 — non-clustered columnstore indexes for analytics-heavy scan paths.
*/

IF OBJECT_ID(N'dbo.AuditEvents', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'NCCI_AuditEvents_Analytics'
         AND object_id = OBJECT_ID(N'dbo.AuditEvents'))
    CREATE NONCLUSTERED COLUMNSTORE INDEX NCCI_AuditEvents_Analytics
        ON dbo.AuditEvents (TenantId, WorkspaceId, ProjectId, OccurredUtc, EventType, RunId)
        WITH (ONLINE = ON);
GO

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'NCCI_FindingRecords_Analytics'
         AND object_id = OBJECT_ID(N'dbo.FindingRecords'))
    CREATE NONCLUSTERED COLUMNSTORE INDEX NCCI_FindingRecords_Analytics
        ON dbo.FindingRecords (TenantId, WorkspaceId, ProjectId, FindingsSnapshotId, Severity, FindingRecordId)
        WITH (ONLINE = ON);
GO

IF OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'NCCI_GoldenManifests_Analytics'
         AND object_id = OBJECT_ID(N'dbo.GoldenManifests'))
    CREATE NONCLUSTERED COLUMNSTORE INDEX NCCI_GoldenManifests_Analytics
        ON dbo.GoldenManifests (TenantId, WorkspaceId, ProjectId, RunId, CreatedUtc, ArchivedUtc, FindingsSnapshotId)
        WITH (ONLINE = ON);
GO
