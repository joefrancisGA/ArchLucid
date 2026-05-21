/* AI business-impact priority rank (lower = more urgent). Populated when AgentRuntime:RerankFindings is enabled. */
IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.FindingRecords', N'PriorityRank') IS NULL
BEGIN
    ALTER TABLE dbo.FindingRecords ADD PriorityRank INT NULL;
END;

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.FindingRecords', N'PriorityRank') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_FindingRecords_Snapshot_PriorityRank'
         AND object_id = OBJECT_ID(N'dbo.FindingRecords'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_FindingRecords_Snapshot_PriorityRank
        ON dbo.FindingRecords (FindingsSnapshotId, PriorityRank, SortOrder)
        INCLUDE (FindingRecordId, FindingId, Severity, Category, FindingType, Title);
END;
