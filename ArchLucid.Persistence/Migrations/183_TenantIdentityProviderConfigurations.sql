/*
  183: Per-tenant SSO identity provider configuration (OIDC / SAML 2.0 wizard output).

  RLS: not applied — tenant id is the scope; API enforces caller tenant via IScopeContextProvider.
*/
IF OBJECT_ID(N'dbo.TenantIdentityProviderConfigurations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantIdentityProviderConfigurations
    (
        TenantId            UNIQUEIDENTIFIER  NOT NULL
            CONSTRAINT PK_TenantIdentityProviderConfigurations PRIMARY KEY,
        Protocol            NVARCHAR(16)      NOT NULL,
        IssuerUri           NVARCHAR(2048)    NOT NULL,
        MetadataXml         NVARCHAR(MAX)     NULL,
        ClaimMappingJson    NVARCHAR(MAX)     NOT NULL,
        KeyVaultSecretName  NVARCHAR(256)     NULL,
        UpdatedUtc          DATETIMEOFFSET(7) NOT NULL
            CONSTRAINT DF_TenantIdentityProviderConfigurations_UpdatedUtc DEFAULT (SYSUTCDATETIME()),
        UpdatedByActorId    NVARCHAR(256)     NOT NULL,
        IsActive            BIT               NOT NULL
            CONSTRAINT DF_TenantIdentityProviderConfigurations_IsActive DEFAULT (0),
        CONSTRAINT CK_TenantIdentityProviderConfigurations_Protocol
            CHECK (Protocol IN (N'oidc', N'saml')),
        CONSTRAINT CK_TenantIdentityProviderConfigurations_ClaimMappingJson
            CHECK (ISJSON(ClaimMappingJson) = 1),
        CONSTRAINT FK_TenantIdentityProviderConfigurations_Tenants
            FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );

    CREATE INDEX IX_TenantIdentityProviderConfigurations_IsActive
        ON dbo.TenantIdentityProviderConfigurations (IsActive)
        INCLUDE (TenantId, Protocol, UpdatedUtc);
END;
GO
