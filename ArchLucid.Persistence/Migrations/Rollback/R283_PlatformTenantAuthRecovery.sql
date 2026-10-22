/*
  R283: Rollback 283_PlatformTenantAuthRecovery.sql — drop recovery grants and admin verification column.
*/

IF OBJECT_ID(N'dbo.PlatformTenantAuthRecoveryGrants', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.PlatformTenantAuthRecoveryGrants;
END;
GO

IF OBJECT_ID(N'dbo.TenantSignInEmailDomainRecoveryAdmins', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.TenantSignInEmailDomainRecoveryAdmins', N'AuthenticationVerifiedUtc') IS NOT NULL
BEGIN
    ALTER TABLE dbo.TenantSignInEmailDomainRecoveryAdmins
        DROP COLUMN AuthenticationVerifiedUtc;
END;
GO
