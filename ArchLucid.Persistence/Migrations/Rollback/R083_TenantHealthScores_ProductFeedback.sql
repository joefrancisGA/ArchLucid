/*
  Rollback 083: revoke ArchLucidApp hardening, drop upsert proc, remove RLS bindings, drop tables.
*/
IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NOT NULL
BEGIN
    IF OBJECT_ID(N'dbo.sp_TenantHealthScores_Upsert', N'P') IS NOT NULL
        REVOKE EXECUTE ON OBJECT::dbo.sp_TenantHealthScores_Upsert TO [ArchLucidApp];

    IF OBJECT_ID(N'dbo.TenantHealthScores', N'U') IS NOT NULL
    BEGIN
        REVOKE INSERT ON dbo.TenantHealthScores TO [ArchLucidApp];
        REVOKE UPDATE ON dbo.TenantHealthScores TO [ArchLucidApp];
        REVOKE DELETE ON dbo.TenantHealthScores TO [ArchLucidApp];
    END;
END;
GO

IF OBJECT_ID(N'dbo.sp_TenantHealthScores_Upsert', N'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_TenantHealthScores_Upsert;
GO


IF OBJECT_ID(N'dbo.ProductFeedback', N'U') IS NOT NULL
    DROP TABLE dbo.ProductFeedback;
GO

IF OBJECT_ID(N'dbo.TenantHealthScores', N'U') IS NOT NULL
    DROP TABLE dbo.TenantHealthScores;
GO
