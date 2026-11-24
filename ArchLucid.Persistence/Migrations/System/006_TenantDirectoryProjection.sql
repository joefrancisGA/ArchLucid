/* Keep the system tenant directory compatible with the tenant-plane row projection.
   In a shared catalog some or all of these columns may already exist. */
IF COL_LENGTH(N'dbo.Tenants', N'DataRegion') IS NULL
    ALTER TABLE dbo.Tenants ADD DataRegion NVARCHAR(64) NOT NULL CONSTRAINT DF_Tenants_DataRegion DEFAULT N'default';

IF COL_LENGTH(N'dbo.Tenants', N'OffboardedUtc') IS NULL
    ALTER TABLE dbo.Tenants ADD OffboardedUtc DATETIMEOFFSET(7) NULL;

IF COL_LENGTH(N'dbo.Tenants', N'ErasureEligibleUtc') IS NULL
    ALTER TABLE dbo.Tenants ADD ErasureEligibleUtc DATETIMEOFFSET(7) NULL;

IF COL_LENGTH(N'dbo.Tenants', N'LegalHoldUntilUtc') IS NULL
    ALTER TABLE dbo.Tenants ADD LegalHoldUntilUtc DATETIMEOFFSET(7) NULL;

IF COL_LENGTH(N'dbo.Tenants', N'LegalHoldReason') IS NULL
    ALTER TABLE dbo.Tenants ADD LegalHoldReason NVARCHAR(500) NULL;

IF COL_LENGTH(N'dbo.Tenants', N'LegalHoldSetByUserId') IS NULL
    ALTER TABLE dbo.Tenants ADD LegalHoldSetByUserId NVARCHAR(256) NULL;

IF COL_LENGTH(N'dbo.Tenants', N'LegalHoldSetUtc') IS NULL
    ALTER TABLE dbo.Tenants ADD LegalHoldSetUtc DATETIMEOFFSET(7) NULL;

IF COL_LENGTH(N'dbo.Tenants', N'TenantErasureRequestedUtc') IS NULL
BEGIN
    ALTER TABLE dbo.Tenants ADD TenantErasureRequestedUtc DATETIMEOFFSET(7) NULL;
    -- Match tenant migration 222 for pre-existing offboarded tenants.
    EXEC(N'UPDATE dbo.Tenants SET TenantErasureRequestedUtc = OffboardedUtc WHERE OffboardedUtc IS NOT NULL AND TenantErasureRequestedUtc IS NULL;');
END;

IF COL_LENGTH(N'dbo.Tenants', N'TrialArchitecturePreseedAttemptCount') IS NULL
    ALTER TABLE dbo.Tenants ADD TrialArchitecturePreseedAttemptCount INT NOT NULL CONSTRAINT DF_Tenants_TrialArchitecturePreseedAttemptCount DEFAULT (0);

IF COL_LENGTH(N'dbo.Tenants', N'TrialArchitecturePreseedFailedUtc') IS NULL
    ALTER TABLE dbo.Tenants ADD TrialArchitecturePreseedFailedUtc DATETIMEOFFSET(7) NULL;

IF COL_LENGTH(N'dbo.Tenants', N'TrialArchitecturePreseedLastError') IS NULL
    ALTER TABLE dbo.Tenants ADD TrialArchitecturePreseedLastError NVARCHAR(2048) NULL;
GO
