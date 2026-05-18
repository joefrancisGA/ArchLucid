/*
  R172: Rollback 172_Tenants_TenantErasureQuarantine.sql — remove erasure quarantine columns from dbo.Tenants.
*/

IF COL_LENGTH(N'dbo.Tenants', N'LegalHoldSetUtc') IS NOT NULL
    ALTER TABLE dbo.Tenants DROP COLUMN LegalHoldSetUtc;

IF COL_LENGTH(N'dbo.Tenants', N'LegalHoldSetByUserId') IS NOT NULL
    ALTER TABLE dbo.Tenants DROP COLUMN LegalHoldSetByUserId;

IF COL_LENGTH(N'dbo.Tenants', N'LegalHoldReason') IS NOT NULL
    ALTER TABLE dbo.Tenants DROP COLUMN LegalHoldReason;

IF COL_LENGTH(N'dbo.Tenants', N'LegalHoldUntilUtc') IS NOT NULL
    ALTER TABLE dbo.Tenants DROP COLUMN LegalHoldUntilUtc;

IF COL_LENGTH(N'dbo.Tenants', N'ErasureEligibleUtc') IS NOT NULL
    ALTER TABLE dbo.Tenants DROP COLUMN ErasureEligibleUtc;

IF COL_LENGTH(N'dbo.Tenants', N'OffboardedUtc') IS NOT NULL
    ALTER TABLE dbo.Tenants DROP COLUMN OffboardedUtc;
