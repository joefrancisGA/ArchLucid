/*
  Batch C / TB-087 — prevent duplicate FindingRecords per snapshot when concurrent backfill runs.
*/

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'UQ_FindingRecords_Snapshot_FindingId'
          AND object_id = OBJECT_ID(N'dbo.FindingRecords'))
BEGIN
    CREATE UNIQUE INDEX UQ_FindingRecords_Snapshot_FindingId
        ON dbo.FindingRecords (FindingsSnapshotId, FindingId);
END;
GO
