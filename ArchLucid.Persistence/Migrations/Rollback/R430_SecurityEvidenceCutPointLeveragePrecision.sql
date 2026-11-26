/* Reverse 430 to the DECIMAL(8,3) definition in migration 383.
   Refuse overflow or unexpected precision; do not round, delete or truncate data. */
SET XACT_ABORT ON;
BEGIN TRANSACTION;
IF EXISTS (SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.SecurityEvidenceCutPoints', N'U')
      AND name = N'LeverageScore' AND precision = 22 AND scale = 3)
BEGIN
    IF EXISTS (SELECT 1 FROM dbo.SecurityEvidenceCutPoints WITH (TABLOCKX, HOLDLOCK)
               WHERE TRY_CONVERT(DECIMAL(8,3), LeverageScore) IS NULL)
        THROW 51430, N'LeverageScore exceeds previous precision. Preserve data and abort rollback.', 1;

    IF EXISTS (SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.SecurityEvidenceCutPoints', N'U')
          AND name = N'IX_SecurityEvidenceCutPoints_Tenant_Snapshot_Leverage')
        DROP INDEX IX_SecurityEvidenceCutPoints_Tenant_Snapshot_Leverage ON dbo.SecurityEvidenceCutPoints;

    ALTER TABLE dbo.SecurityEvidenceCutPoints ALTER COLUMN LeverageScore DECIMAL(8,3) NOT NULL;
    CREATE NONCLUSTERED INDEX IX_SecurityEvidenceCutPoints_Tenant_Snapshot_Leverage
        ON dbo.SecurityEvidenceCutPoints (TenantId, SnapshotId, LeverageScore DESC, CutOrder);
END
ELSE IF EXISTS (SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.SecurityEvidenceCutPoints', N'U')
      AND name = N'LeverageScore' AND (precision <> 8 OR scale <> 3))
    THROW 51431, N'Unexpected LeverageScore definition. Abort rollback.', 1;

COMMIT TRANSACTION;
GO
