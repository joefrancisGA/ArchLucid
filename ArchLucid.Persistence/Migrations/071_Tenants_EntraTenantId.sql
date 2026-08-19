/*
  071: Optional Entra directory tenant id (tid) for multi-org SaaS linking.
*/
IF COL_LENGTH(N'dbo.Tenants', N'EntraTenantId') IS NULL
BEGIN
    ALTER TABLE dbo.Tenants ADD EntraTenantId UNIQUEIDENTIFIER NULL;
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_Tenants_EntraTenantId'
      AND object_id = OBJECT_ID(N'dbo.Tenants', N'U')
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX IX_Tenants_EntraTenantId
        ON dbo.Tenants (EntraTenantId)
        WHERE EntraTenantId IS NOT NULL;
END;
GO
