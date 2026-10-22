/*
  R222: Rollback 222_Tenants_TenantErasureRequestedUtc.sql.
*/
IF COL_LENGTH(N'dbo.Tenants', N'TenantErasureRequestedUtc') IS NOT NULL
    ALTER TABLE dbo.Tenants DROP COLUMN TenantErasureRequestedUtc;
GO
