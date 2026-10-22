/*
  Rollback 149: dbo.sp_TenantHealthScores_BatchRefresh was introduced in 149_TenantHealthScores_BatchRefresh.sql
  (no earlier numbered forward migration defined this proc).
*/

IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NOT NULL
   AND OBJECT_ID(N'dbo.sp_TenantHealthScores_BatchRefresh', N'P') IS NOT NULL
BEGIN
    REVOKE EXECUTE ON OBJECT::dbo.sp_TenantHealthScores_BatchRefresh TO [ArchLucidApp];
END;
GO

IF OBJECT_ID(N'dbo.sp_TenantHealthScores_BatchRefresh', N'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_TenantHealthScores_BatchRefresh;
GO
