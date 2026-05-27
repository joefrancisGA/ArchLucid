IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL
   AND EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'UQ_FindingRecords_Snapshot_FindingId'
          AND object_id = OBJECT_ID(N'dbo.FindingRecords'))
    DROP INDEX UQ_FindingRecords_Snapshot_FindingId ON dbo.FindingRecords;
GO
