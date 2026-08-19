/*
  280: Passwordless email OTP challenges and tenant sign-in domain policy.
*/
IF OBJECT_ID(N'dbo.EmailOtpChallenges', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.EmailOtpChallenges
    (
        Id                  UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_EmailOtpChallenges PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        NormalizedEmail     NVARCHAR(320)    NOT NULL,
        CodeHash            NVARCHAR(128)    NOT NULL,
        CreatedUtc          DATETIME2(7)     NOT NULL
            CONSTRAINT DF_EmailOtpChallenges_CreatedUtc DEFAULT SYSUTCDATETIME(),
        ExpiresUtc          DATETIME2(7)     NOT NULL,
        FailedAttemptCount  INT              NOT NULL
            CONSTRAINT DF_EmailOtpChallenges_FailedAttemptCount DEFAULT (0),
        CompletedUtc        DATETIME2(7)     NULL,
        InvalidatedUtc      DATETIME2(7)     NULL,
        ClientIpHash        NVARCHAR(64)     NULL,
        UserAgentHash       NVARCHAR(64)     NULL,
        InvitationId        UNIQUEIDENTIFIER NULL,
        RowVersion          ROWVERSION       NOT NULL
    );

    CREATE INDEX IX_EmailOtpChallenges_Email_Active
        ON dbo.EmailOtpChallenges (NormalizedEmail, CreatedUtc DESC)
        WHERE CompletedUtc IS NULL AND InvalidatedUtc IS NULL;

    CREATE INDEX IX_EmailOtpChallenges_ClientIpHash_CreatedUtc
        ON dbo.EmailOtpChallenges (ClientIpHash, CreatedUtc DESC)
        WHERE ClientIpHash IS NOT NULL;
END;
GO

IF OBJECT_ID(N'dbo.TenantSignInEmailDomains', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantSignInEmailDomains
    (
        TenantId                UNIQUEIDENTIFIER NOT NULL,
        NormalizedDomain        NVARCHAR(253)    NOT NULL,
        RequireEnterpriseSso    BIT              NOT NULL
            CONSTRAINT DF_TenantSignInEmailDomains_RequireEnterpriseSso DEFAULT (1),
        AllowEmailOtpRecovery   BIT              NOT NULL
            CONSTRAINT DF_TenantSignInEmailDomains_AllowEmailOtpRecovery DEFAULT (0),
        CreatedUtc              DATETIME2(7)     NOT NULL
            CONSTRAINT DF_TenantSignInEmailDomains_CreatedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_TenantSignInEmailDomains PRIMARY KEY (TenantId, NormalizedDomain),
        CONSTRAINT FK_TenantSignInEmailDomains_Tenants FOREIGN KEY (TenantId)
            REFERENCES dbo.Tenants (Id)
    );

    CREATE UNIQUE INDEX UX_TenantSignInEmailDomains_NormalizedDomain
        ON dbo.TenantSignInEmailDomains (NormalizedDomain);
END;
GO
