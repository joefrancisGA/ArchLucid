/*
  222: Explicit tenant erasure request timestamp on dbo.Tenants (assessment #7).

  Distinct from OffboardedUtc for future quarantine workflows; backfilled from existing offboard rows.
*/
IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.Tenants', N'TenantErasureRequestedUtc') IS NULL
BEGIN
    ALTER TABLE dbo.Tenants ADD TenantErasureRequestedUtc DATETIMEOFFSET NULL;
END;
GO

IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.Tenants', N'TenantErasureRequestedUtc') IS NOT NULL
BEGIN
    UPDATE dbo.Tenants
    SET TenantErasureRequestedUtc = OffboardedUtc
    WHERE OffboardedUtc IS NOT NULL
      AND TenantErasureRequestedUtc IS NULL;
END;
GO
