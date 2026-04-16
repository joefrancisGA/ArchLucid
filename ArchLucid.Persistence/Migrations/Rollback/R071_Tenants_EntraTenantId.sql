IF EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_Tenants_EntraTenantId'
      AND object_id = OBJECT_ID(N'dbo.Tenants', N'U')
)
    DROP INDEX IX_Tenants_EntraTenantId ON dbo.Tenants;
GO

IF COL_LENGTH(N'dbo.Tenants', N'EntraTenantId') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Tenants DROP COLUMN EntraTenantId;
END;
GO
