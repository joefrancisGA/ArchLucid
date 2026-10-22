IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_FindingRecords_Snapshot_PriorityRank'
         AND object_id = OBJECT_ID(N'dbo.FindingRecords'))
BEGIN
    DROP INDEX IX_FindingRecords_Snapshot_PriorityRank ON dbo.FindingRecords;
END;

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.FindingRecords', N'PriorityRank') IS NOT NULL
BEGIN
    ALTER TABLE dbo.FindingRecords DROP COLUMN PriorityRank;
END;
