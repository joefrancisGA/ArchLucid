/*
  TB-389 — tenant-scope ITSM correlation external-key uniqueness (multi-tenant SaaS).
  Replaces global UNIQUE (Provider, ExternalKey) with UNIQUE (TenantId, Provider, ExternalKey).
*/

IF OBJECT_ID(N'dbo.ItsmFindingCorrelations', N'U') IS NOT NULL
BEGIN
    IF EXISTS (
        SELECT 1
        FROM sys.key_constraints
        WHERE name = N'UQ_ItsmFindingCorrelations_Provider_ExternalKey'
          AND parent_object_id = OBJECT_ID(N'dbo.ItsmFindingCorrelations'))
    BEGIN
        ALTER TABLE dbo.ItsmFindingCorrelations
            DROP CONSTRAINT UQ_ItsmFindingCorrelations_Provider_ExternalKey;
    END;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.key_constraints
        WHERE name = N'UQ_ItsmFindingCorrelations_Tenant_Provider_ExternalKey'
          AND parent_object_id = OBJECT_ID(N'dbo.ItsmFindingCorrelations'))
    BEGIN
        ALTER TABLE dbo.ItsmFindingCorrelations
            ADD CONSTRAINT UQ_ItsmFindingCorrelations_Tenant_Provider_ExternalKey
                UNIQUE (TenantId, Provider, ExternalKey);
    END;
END;
GO
