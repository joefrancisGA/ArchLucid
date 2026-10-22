/*
  282: Pending authentication-identity link proposals (explicit confirmation before attach).
*/
IF OBJECT_ID(N'dbo.AuthenticationIdentityLinkProposals', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuthenticationIdentityLinkProposals
    (
        Id                          UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_AuthenticationIdentityLinkProposals PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        UserId                      UNIQUEIDENTIFIER NOT NULL,
        ProviderType                TINYINT          NOT NULL,
        NormalizedIssuer            NVARCHAR(512)    NOT NULL,
        Subject                     NVARCHAR(512)    NOT NULL,
        TenantId                    UNIQUEIDENTIFIER NULL,
        TenantIdentityProviderId    UNIQUEIDENTIFIER NULL,
        NormalizedEmail             NVARCHAR(320)    NULL,
        DisplayEmail                NVARCHAR(320)    NULL,
        EmailVerified               BIT              NOT NULL
            CONSTRAINT DF_AuthenticationIdentityLinkProposals_EmailVerified DEFAULT (0),
        RequiresExplicitConfirmation BIT             NOT NULL
            CONSTRAINT DF_AuthenticationIdentityLinkProposals_RequiresExplicitConfirmation DEFAULT (0),
        Status                      TINYINT          NOT NULL
            CONSTRAINT DF_AuthenticationIdentityLinkProposals_Status DEFAULT (0),
        CreatedUtc                  DATETIME2(7)     NOT NULL
            CONSTRAINT DF_AuthenticationIdentityLinkProposals_CreatedUtc DEFAULT SYSUTCDATETIME(),
        ExpiresUtc                  DATETIME2(7)     NOT NULL,
        ConfirmedUtc                DATETIME2(7)     NULL,
        CancelledUtc                DATETIME2(7)     NULL,
        CONSTRAINT FK_AuthenticationIdentityLinkProposals_PlatformUsers FOREIGN KEY (UserId)
            REFERENCES dbo.PlatformUsers (Id)
    );

    CREATE INDEX IX_AuthenticationIdentityLinkProposals_User_Pending
        ON dbo.AuthenticationIdentityLinkProposals (UserId, CreatedUtc DESC)
        WHERE Status = 0;
END;
GO
