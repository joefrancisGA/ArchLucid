/*
  Roll back DbUp 170 — dbo.InternalCrossTenantRollupDaily (pseudonymized cross-tenant daily rollups).
*/

IF OBJECT_ID(N'dbo.InternalCrossTenantRollupDaily', N'U') IS NOT NULL
    DROP TABLE dbo.InternalCrossTenantRollupDaily;
GO
