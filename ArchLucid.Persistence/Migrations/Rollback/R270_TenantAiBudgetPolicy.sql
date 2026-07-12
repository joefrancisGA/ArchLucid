/*
  R270: Rollback 270_TenantAiBudgetPolicy.sql — drop per-tenant AI budget policy storage.
*/

IF OBJECT_ID(N'dbo.TenantAiBudgetPolicy', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.TenantAiBudgetPolicy;
END;
GO
