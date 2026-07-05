/*
  268: OAuth auth-mode columns on per-tenant ITSM connector rows (TB-600 foundation).

  Existing BasicApiToken rows keep working — AuthMode defaults to BasicApiToken.
*/
IF COL_LENGTH(N'dbo.TenantItsmConnectorConnections', N'AuthMode') IS NULL
BEGIN
    ALTER TABLE dbo.TenantItsmConnectorConnections
        ADD AuthMode NVARCHAR(32) NOT NULL
            CONSTRAINT DF_TenantItsmConnectorConnections_AuthMode DEFAULT (N'BasicApiToken'),
        OAuthClientIdKeyVaultSecretName NVARCHAR(500) NULL,
        OAuthClientSecretKeyVaultSecretName NVARCHAR(500) NULL,
        OAuthRefreshTokenKeyVaultSecretName NVARCHAR(500) NULL;

    ALTER TABLE dbo.TenantItsmConnectorConnections
        ADD CONSTRAINT CK_TenantItsmConnectorConnections_AuthMode
            CHECK (AuthMode IN (N'BasicApiToken', N'OAuth2ClientCredentials', N'OAuth2RefreshToken'));

    ALTER TABLE dbo.TenantItsmConnectorConnections
        ADD CONSTRAINT CK_TenantItsmConnectorConnections_OAuthClientIdNoUrl
            CHECK (OAuthClientIdKeyVaultSecretName IS NULL OR OAuthClientIdKeyVaultSecretName NOT LIKE N'%://%');

    ALTER TABLE dbo.TenantItsmConnectorConnections
        ADD CONSTRAINT CK_TenantItsmConnectorConnections_OAuthClientSecretNoUrl
            CHECK (OAuthClientSecretKeyVaultSecretName IS NULL OR OAuthClientSecretKeyVaultSecretName NOT LIKE N'%://%');

    ALTER TABLE dbo.TenantItsmConnectorConnections
        ADD CONSTRAINT CK_TenantItsmConnectorConnections_OAuthRefreshNoUrl
            CHECK (OAuthRefreshTokenKeyVaultSecretName IS NULL OR OAuthRefreshTokenKeyVaultSecretName NOT LIKE N'%://%');
END;
GO
