/*
  281: Domain verification, enforcement modes, and recovery administrators for sign-in routing.
*/
IF COL_LENGTH(N'dbo.TenantSignInEmailDomains', N'DisplayDomain') IS NULL
BEGIN
    ALTER TABLE dbo.TenantSignInEmailDomains
        ADD DisplayDomain NVARCHAR(253) NULL,
            VerificationStatus TINYINT NOT NULL
                CONSTRAINT DF_TenantSignInEmailDomains_VerificationStatus DEFAULT (0),
            EnforcementMode TINYINT NOT NULL
                CONSTRAINT DF_TenantSignInEmailDomains_EnforcementMode DEFAULT (0),
            DnsVerificationToken NVARCHAR(64) NULL,
            VerificationPendingUtc DATETIME2(7) NULL,
            VerifiedUtc DATETIME2(7) NULL,
            VerificationFailedUtc DATETIME2(7) NULL,
            RemovedUtc DATETIME2(7) NULL,
            UpdatedUtc DATETIME2(7) NULL,
            RoutingTestPassedUtc DATETIME2(7) NULL,
            EnforcementEnabledUtc DATETIME2(7) NULL;
END;
GO

UPDATE dbo.TenantSignInEmailDomains
SET DisplayDomain = NormalizedDomain
WHERE DisplayDomain IS NULL;
GO

IF EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.TenantSignInEmailDomains')
      AND name = N'DisplayDomain'
      AND is_nullable = 1)
BEGIN
    ALTER TABLE dbo.TenantSignInEmailDomains
        ALTER COLUMN DisplayDomain NVARCHAR(253) NOT NULL;
END;
GO

UPDATE dbo.TenantSignInEmailDomains
SET EnforcementMode = CASE WHEN RequireEnterpriseSso = 1 THEN 1 ELSE 0 END
WHERE EnforcementMode = 0 AND RequireEnterpriseSso = 1;
GO

IF OBJECT_ID(N'dbo.TenantSignInEmailDomainRecoveryAdmins', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantSignInEmailDomainRecoveryAdmins
    (
        TenantId                      UNIQUEIDENTIFIER NOT NULL,
        NormalizedDomain              NVARCHAR(253)    NOT NULL,
        NormalizedRecoveryAdminEmail  NVARCHAR(320)    NOT NULL,
        DisplayRecoveryAdminEmail     NVARCHAR(320)    NOT NULL,
        CreatedUtc                    DATETIME2(7)     NOT NULL
            CONSTRAINT DF_TenantSignInEmailDomainRecoveryAdmins_CreatedUtc DEFAULT SYSUTCDATETIME(),
        CreatedByActorId              NVARCHAR(128)    NOT NULL,
        CONSTRAINT PK_TenantSignInEmailDomainRecoveryAdmins
            PRIMARY KEY (TenantId, NormalizedDomain, NormalizedRecoveryAdminEmail),
        CONSTRAINT FK_TenantSignInEmailDomainRecoveryAdmins_Domains FOREIGN KEY (TenantId, NormalizedDomain)
            REFERENCES dbo.TenantSignInEmailDomains (TenantId, NormalizedDomain)
    );
END;
GO
