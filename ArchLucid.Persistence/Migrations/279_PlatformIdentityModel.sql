/*
  279: Provider-independent platform identity model (PlatformUsers, AuthenticationIdentities,
       WorkspaceMemberships, IdentityMigrationReviewItems).

  Links legacy dbo.ScimUsers and dbo.IdentityUsers via PlatformUserId without rewiring existing FKs.
  Data backfill is idempotent and may be re-run via LegacyPlatformIdentityMigrationService.
*/
IF OBJECT_ID(N'dbo.PlatformUsers', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PlatformUsers
    (
        Id                     UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_PlatformUsers PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        PrimaryEmail           NVARCHAR(320)    NULL,
        NormalizedPrimaryEmail NVARCHAR(320)    NULL,
        DisplayName            NVARCHAR(256)    NULL,
        Status                 NVARCHAR(16)     NOT NULL,
        CreatedUtc             DATETIME2(7)     NOT NULL
            CONSTRAINT DF_PlatformUsers_CreatedUtc DEFAULT SYSUTCDATETIME(),
        UpdatedUtc             DATETIME2(7)     NOT NULL
            CONSTRAINT DF_PlatformUsers_UpdatedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_PlatformUsers_Status CHECK (Status IN (N'Active', N'Suspended', N'Disabled'))
    );

    CREATE INDEX IX_PlatformUsers_NormalizedPrimaryEmail
        ON dbo.PlatformUsers (NormalizedPrimaryEmail)
        WHERE NormalizedPrimaryEmail IS NOT NULL;
END;
GO

IF OBJECT_ID(N'dbo.AuthenticationIdentities', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuthenticationIdentities
    (
        Id                        UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_AuthenticationIdentities PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        UserId                    UNIQUEIDENTIFIER NOT NULL,
        ProviderType              NVARCHAR(32)     NOT NULL,
        NormalizedIssuer          NVARCHAR(512)    NOT NULL,
        Subject                   NVARCHAR(256)    NOT NULL,
        NormalizedEmail           NVARCHAR(320)    NULL,
        DisplayEmail              NVARCHAR(320)    NULL,
        EmailVerified             BIT              NOT NULL
            CONSTRAINT DF_AuthenticationIdentities_EmailVerified DEFAULT (0),
        TenantId                  UNIQUEIDENTIFIER NULL,
        TenantIdentityProviderId  UNIQUEIDENTIFIER NULL,
        IdentityScopeKey          AS (
            CONCAT(
                ISNULL(CONVERT(NCHAR(36), TenantId), N'00000000-0000-0000-0000-000000000000'),
                N'|',
                ISNULL(CONVERT(NCHAR(36), TenantIdentityProviderId), N'00000000-0000-0000-0000-000000000000'))
        ) PERSISTED NOT NULL,
        CreatedUtc                DATETIME2(7)     NOT NULL
            CONSTRAINT DF_AuthenticationIdentities_CreatedUtc DEFAULT SYSUTCDATETIME(),
        LastAuthenticatedUtc      DATETIME2(7)     NULL,
        DisabledUtc               DATETIME2(7)     NULL,
        CONSTRAINT FK_AuthenticationIdentities_PlatformUsers FOREIGN KEY (UserId)
            REFERENCES dbo.PlatformUsers (Id),
        CONSTRAINT FK_AuthenticationIdentities_Tenants FOREIGN KEY (TenantId)
            REFERENCES dbo.Tenants (Id),
        CONSTRAINT CK_AuthenticationIdentities_ProviderType CHECK (ProviderType IN (
            N'EmailOneTimeCode',
            N'MicrosoftIdentity',
            N'GoogleIdentity',
            N'TrialLocalPassword',
            N'TenantOidc',
            N'TenantSaml'))
    );

    CREATE UNIQUE INDEX UX_AuthenticationIdentities_ExternalKey
        ON dbo.AuthenticationIdentities (ProviderType, NormalizedIssuer, Subject, IdentityScopeKey)
        WHERE DisabledUtc IS NULL;

    CREATE INDEX IX_AuthenticationIdentities_UserId
        ON dbo.AuthenticationIdentities (UserId)
        INCLUDE (ProviderType, DisabledUtc);
END;
GO

IF OBJECT_ID(N'dbo.WorkspaceMemberships', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WorkspaceMemberships
    (
        UserId       UNIQUEIDENTIFIER NOT NULL,
        TenantId     UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId  UNIQUEIDENTIFIER NOT NULL,
        Role         NVARCHAR(64)     NOT NULL,
        Status       NVARCHAR(16)     NOT NULL,
        CreatedUtc   DATETIME2(7)     NOT NULL
            CONSTRAINT DF_WorkspaceMemberships_CreatedUtc DEFAULT SYSUTCDATETIME(),
        UpdatedUtc   DATETIME2(7)     NOT NULL
            CONSTRAINT DF_WorkspaceMemberships_UpdatedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_WorkspaceMemberships PRIMARY KEY (UserId, WorkspaceId),
        CONSTRAINT FK_WorkspaceMemberships_PlatformUsers FOREIGN KEY (UserId)
            REFERENCES dbo.PlatformUsers (Id),
        CONSTRAINT FK_WorkspaceMemberships_Tenants FOREIGN KEY (TenantId)
            REFERENCES dbo.Tenants (Id),
        CONSTRAINT FK_WorkspaceMemberships_TenantWorkspaces FOREIGN KEY (WorkspaceId)
            REFERENCES dbo.TenantWorkspaces (Id),
        CONSTRAINT CK_WorkspaceMemberships_Status CHECK (Status IN (N'Active', N'Suspended', N'Revoked'))
    );

    CREATE INDEX IX_WorkspaceMemberships_Tenant_Workspace
        ON dbo.WorkspaceMemberships (TenantId, WorkspaceId, Status);
END;
GO

IF OBJECT_ID(N'dbo.IdentityMigrationReviewItems', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.IdentityMigrationReviewItems
    (
        Id               UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_IdentityMigrationReviewItems PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        LegacySourceType NVARCHAR(32)     NOT NULL,
        LegacySourceId   UNIQUEIDENTIFIER NOT NULL,
        TenantId         UNIQUEIDENTIFIER NULL,
        ReasonCode       NVARCHAR(64)     NOT NULL,
        ReasonDetail     NVARCHAR(2000)   NOT NULL,
        DetectedUtc      DATETIME2(7)     NOT NULL
            CONSTRAINT DF_IdentityMigrationReviewItems_DetectedUtc DEFAULT SYSUTCDATETIME(),
        ResolvedUtc      DATETIME2(7)     NULL,
        CONSTRAINT UQ_IdentityMigrationReviewItems_LegacySource UNIQUE (LegacySourceType, LegacySourceId)
    );

    CREATE INDEX IX_IdentityMigrationReviewItems_Unresolved
        ON dbo.IdentityMigrationReviewItems (DetectedUtc DESC)
        WHERE ResolvedUtc IS NULL;
END;
GO

IF OBJECT_ID(N'dbo.ScimUsers', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ScimUsers', N'PlatformUserId') IS NULL
BEGIN
    ALTER TABLE dbo.ScimUsers ADD PlatformUserId UNIQUEIDENTIFIER NULL;

    ALTER TABLE dbo.ScimUsers
        ADD CONSTRAINT FK_ScimUsers_PlatformUsers FOREIGN KEY (PlatformUserId)
            REFERENCES dbo.PlatformUsers (Id);
END;
GO

IF OBJECT_ID(N'dbo.IdentityUsers', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.IdentityUsers', N'PlatformUserId') IS NULL
BEGIN
    ALTER TABLE dbo.IdentityUsers ADD PlatformUserId UNIQUEIDENTIFIER NULL;

    ALTER TABLE dbo.IdentityUsers
        ADD CONSTRAINT FK_IdentityUsers_PlatformUsers FOREIGN KEY (PlatformUserId)
            REFERENCES dbo.PlatformUsers (Id);
END;
GO
