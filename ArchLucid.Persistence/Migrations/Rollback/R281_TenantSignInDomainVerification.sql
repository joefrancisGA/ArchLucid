/*
  R281: Rollback 281_TenantSignInDomainVerification.sql — drop recovery admins and domain verification columns.
*/

IF OBJECT_ID(N'dbo.TenantSignInEmailDomainRecoveryAdmins', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.TenantSignInEmailDomainRecoveryAdmins;
END;
GO

IF OBJECT_ID(N'dbo.TenantSignInEmailDomains', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.TenantSignInEmailDomains', N'DisplayDomain') IS NOT NULL
BEGIN
    IF OBJECT_ID(N'DF_TenantSignInEmailDomains_VerificationStatus', N'D') IS NOT NULL
    BEGIN
        ALTER TABLE dbo.TenantSignInEmailDomains DROP CONSTRAINT DF_TenantSignInEmailDomains_VerificationStatus;
    END;

    IF OBJECT_ID(N'DF_TenantSignInEmailDomains_EnforcementMode', N'D') IS NOT NULL
    BEGIN
        ALTER TABLE dbo.TenantSignInEmailDomains DROP CONSTRAINT DF_TenantSignInEmailDomains_EnforcementMode;
    END;

    ALTER TABLE dbo.TenantSignInEmailDomains
        DROP COLUMN DisplayDomain,
                    VerificationStatus,
                    EnforcementMode,
                    DnsVerificationToken,
                    VerificationPendingUtc,
                    VerifiedUtc,
                    VerificationFailedUtc,
                    RemovedUtc,
                    UpdatedUtc,
                    RoutingTestPassedUtc,
                    EnforcementEnabledUtc;
END;
GO
