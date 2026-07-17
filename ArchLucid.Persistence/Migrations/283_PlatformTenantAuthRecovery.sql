/*
  283: Recovery-admin authentication verification and platform-assisted tenant auth recovery grants.
*/
IF COL_LENGTH(N'dbo.TenantSignInEmailDomainRecoveryAdmins', N'AuthenticationVerifiedUtc') IS NULL
BEGIN
    ALTER TABLE dbo.TenantSignInEmailDomainRecoveryAdmins
        ADD AuthenticationVerifiedUtc DATETIME2(7) NULL;
END;
GO

IF OBJECT_ID(N'dbo.PlatformTenantAuthRecoveryGrants', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PlatformTenantAuthRecoveryGrants
    (
        GrantId              UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT DF_PlatformTenantAuthRecoveryGrants_GrantId DEFAULT NEWSEQUENTIALID(),
        TenantId             UNIQUEIDENTIFIER NOT NULL,
        NormalizedDomain     NVARCHAR(253)    NOT NULL,
        Reason               NVARCHAR(2000)   NOT NULL,
        EvidenceReference    NVARCHAR(512)    NOT NULL,
        GrantedByActorId     NVARCHAR(128)    NOT NULL,
        GrantedUtc           DATETIME2(7)     NOT NULL
            CONSTRAINT DF_PlatformTenantAuthRecoveryGrants_GrantedUtc DEFAULT SYSUTCDATETIME(),
        ExpiresUtc           DATETIME2(7)     NOT NULL,
        RevokedUtc           DATETIME2(7)     NULL,
        RevokedByActorId     NVARCHAR(128)    NULL,
        TenantNotifiedUtc    DATETIME2(7)     NULL,
        CONSTRAINT PK_PlatformTenantAuthRecoveryGrants PRIMARY KEY (GrantId),
        CONSTRAINT FK_PlatformTenantAuthRecoveryGrants_Domains FOREIGN KEY (TenantId, NormalizedDomain)
            REFERENCES dbo.TenantSignInEmailDomains (TenantId, NormalizedDomain)
    );

    CREATE INDEX IX_PlatformTenantAuthRecoveryGrants_TenantDomain_Active
        ON dbo.PlatformTenantAuthRecoveryGrants (TenantId, NormalizedDomain, ExpiresUtc)
        WHERE RevokedUtc IS NULL;
END;
GO
