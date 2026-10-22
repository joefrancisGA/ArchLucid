-- 077: Trial local identity (email/password) backing table — ASP.NET Identity-shaped columns + ArchLucid email verification timestamp.

IF OBJECT_ID(N'dbo.IdentityUsers', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.IdentityUsers
    (
        Id                            UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_IdentityUsers PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        NormalizedEmail               NVARCHAR(256)    NOT NULL,
        Email                         NVARCHAR(256)    NOT NULL,
        PasswordHash                  NVARCHAR(500)    NOT NULL,
        SecurityStamp                 NVARCHAR(256)    NOT NULL,
        ConcurrencyStamp              NVARCHAR(256)    NOT NULL,
        EmailConfirmed                BIT              NOT NULL CONSTRAINT DF_IdentityUsers_EmailConfirmed DEFAULT (0),
        EmailVerifiedUtc              DATETIMEOFFSET   NULL,
        LockoutEnd                    DATETIMEOFFSET   NULL,
        LockoutEnabled                BIT              NOT NULL CONSTRAINT DF_IdentityUsers_LockoutEnabled DEFAULT (1),
        AccessFailedCount             INT              NOT NULL CONSTRAINT DF_IdentityUsers_AccessFailedCount DEFAULT (0),
        EmailConfirmationTokenHash    NVARCHAR(128)    NULL,
        EmailConfirmationExpiresUtc   DATETIMEOFFSET   NULL,
        CreatedUtc                    DATETIMEOFFSET   NOT NULL CONSTRAINT DF_IdentityUsers_CreatedUtc DEFAULT (SYSUTCDATETIME())
    );

    CREATE UNIQUE INDEX UX_IdentityUsers_NormalizedEmail ON dbo.IdentityUsers (NormalizedEmail);
END;
GO
