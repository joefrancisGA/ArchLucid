-- Migration 245: Idempotency key for dbo.UsageEvents (dedupe metering retries / cancel-after-complete).
IF OBJECT_ID(N'dbo.UsageEvents', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.UsageEvents', N'IdempotencyKey') IS NULL
BEGIN
    ALTER TABLE dbo.UsageEvents ADD IdempotencyKey NVARCHAR(256) NULL;
END;
GO

IF OBJECT_ID(N'dbo.UsageEvents', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'UX_UsageEvents_TenantId_IdempotencyKey'
          AND object_id = OBJECT_ID(N'dbo.UsageEvents'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UX_UsageEvents_TenantId_IdempotencyKey
        ON dbo.UsageEvents (TenantId, IdempotencyKey)
        WHERE IdempotencyKey IS NOT NULL;
END;
GO
