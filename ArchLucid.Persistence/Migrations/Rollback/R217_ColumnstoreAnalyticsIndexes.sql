/*
  Rollback Improvement #36 — drop analytics non-clustered columnstore indexes.
*/

IF EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'NCCI_GoldenManifests_Analytics'
      AND object_id = OBJECT_ID(N'dbo.GoldenManifests'))
    DROP INDEX NCCI_GoldenManifests_Analytics ON dbo.GoldenManifests;
GO

IF EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'NCCI_FindingRecords_Analytics'
      AND object_id = OBJECT_ID(N'dbo.FindingRecords'))
    DROP INDEX NCCI_FindingRecords_Analytics ON dbo.FindingRecords;
GO

IF EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'NCCI_AuditEvents_Analytics'
      AND object_id = OBJECT_ID(N'dbo.AuditEvents'))
    DROP INDEX NCCI_AuditEvents_Analytics ON dbo.AuditEvents;
GO
