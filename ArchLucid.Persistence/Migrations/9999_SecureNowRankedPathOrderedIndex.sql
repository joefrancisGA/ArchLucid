/*
  SecureNow ranked path pagination: align the ordered index key with
  ORDER BY r.RankOrder, r.PathId.
  Retain the leading tenant/snapshot seek keys and existing query scope JOINs.
  Rebuild only when the prior three-key index is present. The indexed key
  does not include large JSON/text payload columns.
*/
SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.SecurityEvidencePathRanks', N'U') IS NOT NULL
   AND EXISTS (
       SELECT 1 FROM sys.indexes
       WHERE object_id = OBJECT_ID(N'dbo.SecurityEvidencePathRanks')
         AND name = N'IX_SecurityEvidencePathRanks_Tenant_Snapshot_Order'
   )
   AND NOT EXISTS (
       SELECT 1 FROM sys.indexes AS i
       JOIN sys.index_columns AS ic
         ON ic.object_id = i.object_id AND ic.index_id = i.index_id
       JOIN sys.columns AS c
         ON c.object_id = ic.object_id AND c.column_id = ic.column_id
       WHERE i.object_id = OBJECT_ID(N'dbo.SecurityEvidencePathRanks')
         AND i.name = N'IX_SecurityEvidencePathRanks_Tenant_Snapshot_Order'
         AND ic.key_ordinal = 4
         AND c.name = N'PathId'
   )
BEGIN
    DROP INDEX IX_SecurityEvidencePathRanks_Tenant_Snapshot_Order
        ON dbo.SecurityEvidencePathRanks;
END;
GO

IF OBJECT_ID(N'dbo.SecurityEvidencePathRanks', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM sys.indexes
       WHERE object_id = OBJECT_ID(N'dbo.SecurityEvidencePathRanks')
         AND name = N'IX_SecurityEvidencePathRanks_Tenant_Snapshot_Order'
   )
BEGIN
    CREATE NONCLUSTERED INDEX IX_SecurityEvidencePathRanks_Tenant_Snapshot_Order
        ON dbo.SecurityEvidencePathRanks (TenantId, SnapshotId, RankOrder, PathId);
END;
GO
