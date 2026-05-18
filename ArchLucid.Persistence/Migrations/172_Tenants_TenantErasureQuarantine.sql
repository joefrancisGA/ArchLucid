/*
  172: Tenant scheduled erasure quarantine + legal hold columns on dbo.Tenants.
*/

IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.Tenants', N'OffboardedUtc') IS NULL
BEGIN
    ALTER TABLE dbo.Tenants ADD
        OffboardedUtc           DATETIMEOFFSET NULL,
        ErasureEligibleUtc      DATETIMEOFFSET NULL,
        LegalHoldUntilUtc       DATETIMEOFFSET NULL,
        LegalHoldReason         NVARCHAR(500) NULL,
        LegalHoldSetByUserId    NVARCHAR(256) NULL,
        LegalHoldSetUtc         DATETIMEOFFSET NULL;
END;
