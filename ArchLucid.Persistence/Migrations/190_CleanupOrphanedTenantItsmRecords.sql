/*
  190: Remove ITSM correlation/outbound rows whose TenantId no longer exists in dbo.Tenants.
  Idempotent data cleanup (no schema change).
*/

IF OBJECT_ID(N'dbo.ItsmFindingCorrelations', N'U') IS NOT NULL
BEGIN
    DELETE c
    FROM dbo.ItsmFindingCorrelations AS c
    WHERE NOT EXISTS (
        SELECT 1
        FROM dbo.Tenants AS t
        WHERE t.Id = c.TenantId);
END;
GO

IF OBJECT_ID(N'dbo.TenantItsmOutboundSettings', N'U') IS NOT NULL
BEGIN
    DELETE s
    FROM dbo.TenantItsmOutboundSettings AS s
    WHERE NOT EXISTS (
        SELECT 1
        FROM dbo.Tenants AS t
        WHERE t.Id = s.TenantId);
END;
GO
