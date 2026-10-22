/*
  268: OAuth auth-mode columns on per-tenant ITSM connector rows (TB-600 foundation).

  Existing BasicApiToken rows keep working — AuthMode defaults to BasicApiToken.
  Greenfield parity: keep Scripts/ArchLucid.sql sections 266 and 268 aligned (SQL_SCRIPTS.md §5).
*/
IF COL_LENGTH(N'dbo.TenantItsmConnectorConnections', N'AuthMode') IS NULL
BEGIN
    -- Columns and their CHECK constraints must be added in one ALTER TABLE statement: SQL Server binds
    -- constraint expressions against the table's column list *before* running the batch, so a CHECK added
    -- in a later statement within the same GO batch fails with "Invalid column name" on the sibling column
    -- added just above it.
    ALTER TABLE dbo.TenantItsmConnectorConnections
        ADD AuthMode NVARCHAR(32) NOT NULL
                CONSTRAINT DF_TenantItsmConnectorConnections_AuthMode DEFAULT (N'BasicApiToken'),
            OAuthClientIdKeyVaultSecretName NVARCHAR(500) NULL,
            OAuthClientSecretKeyVaultSecretName NVARCHAR(500) NULL,
            OAuthRefreshTokenKeyVaultSecretName NVARCHAR(500) NULL,
            CONSTRAINT CK_TenantItsmConnectorConnections_AuthMode
                CHECK (AuthMode IN (N'BasicApiToken', N'OAuth2ClientCredentials', N'OAuth2RefreshToken')),
            CONSTRAINT CK_TenantItsmConnectorConnections_OAuthClientIdNoUrl
                CHECK (OAuthClientIdKeyVaultSecretName IS NULL OR OAuthClientIdKeyVaultSecretName NOT LIKE N'%://%'),
            CONSTRAINT CK_TenantItsmConnectorConnections_OAuthClientSecretNoUrl
                CHECK (OAuthClientSecretKeyVaultSecretName IS NULL OR OAuthClientSecretKeyVaultSecretName NOT LIKE N'%://%'),
            CONSTRAINT CK_TenantItsmConnectorConnections_OAuthRefreshNoUrl
                CHECK (OAuthRefreshTokenKeyVaultSecretName IS NULL OR OAuthRefreshTokenKeyVaultSecretName NOT LIKE N'%://%');
END;
GO
