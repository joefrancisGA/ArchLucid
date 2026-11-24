/*
  430: Widen SecureNow cut-point leverage score to retain the squared Int32 count.
  Existing rows are unchanged. The leverage index is recreated with its original keys.
*/
SET NOCOUNT ON;
GO

IF EXISTS
(
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.SecurityEvidenceCutPoints', N'U')
      AND name = N'LeverageScore'
      AND precision < 22
)
BEGIN
    IF EXISTS
    (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.SecurityEvidenceCutPoints', N'U')
          AND name = N'IX_SecurityEvidenceCutPoints_Tenant_Snapshot_Leverage'
    )
        DROP INDEX IX_SecurityEvidenceCutPoints_Tenant_Snapshot_Leverage
            ON dbo.SecurityEvidenceCutPoints;

    ALTER TABLE dbo.SecurityEvidenceCutPoints
        ALTER COLUMN LeverageScore DECIMAL(22, 3) NOT NULL;

    CREATE NONCLUSTERED INDEX IX_SecurityEvidenceCutPoints_Tenant_Snapshot_Leverage
        ON dbo.SecurityEvidenceCutPoints (TenantId, SnapshotId, LeverageScore DESC, CutOrder);
END;
GO
