-- Rollback 245: remove UsageEvents idempotency index and column.
IF EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'UX_UsageEvents_TenantId_IdempotencyKey'
      AND object_id = OBJECT_ID(N'dbo.UsageEvents'))
BEGIN
    DROP INDEX UX_UsageEvents_TenantId_IdempotencyKey ON dbo.UsageEvents;
END;
GO

IF OBJECT_ID(N'dbo.UsageEvents', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.UsageEvents', N'IdempotencyKey') IS NOT NULL
BEGIN
    ALTER TABLE dbo.UsageEvents DROP COLUMN IdempotencyKey;
END;
GO
