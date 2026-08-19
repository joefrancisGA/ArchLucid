IF COL_LENGTH(N'dbo.TenantItsmConnectorConnections', N'AuthMode') IS NOT NULL
BEGIN
    IF OBJECT_ID(N'CK_TenantItsmConnectorConnections_OAuthRefreshNoUrl', N'C') IS NOT NULL
        ALTER TABLE dbo.TenantItsmConnectorConnections DROP CONSTRAINT CK_TenantItsmConnectorConnections_OAuthRefreshNoUrl;

    IF OBJECT_ID(N'CK_TenantItsmConnectorConnections_OAuthClientSecretNoUrl', N'C') IS NOT NULL
        ALTER TABLE dbo.TenantItsmConnectorConnections DROP CONSTRAINT CK_TenantItsmConnectorConnections_OAuthClientSecretNoUrl;

    IF OBJECT_ID(N'CK_TenantItsmConnectorConnections_OAuthClientIdNoUrl', N'C') IS NOT NULL
        ALTER TABLE dbo.TenantItsmConnectorConnections DROP CONSTRAINT CK_TenantItsmConnectorConnections_OAuthClientIdNoUrl;

    IF OBJECT_ID(N'CK_TenantItsmConnectorConnections_AuthMode', N'C') IS NOT NULL
        ALTER TABLE dbo.TenantItsmConnectorConnections DROP CONSTRAINT CK_TenantItsmConnectorConnections_AuthMode;

    IF OBJECT_ID(N'DF_TenantItsmConnectorConnections_AuthMode', N'D') IS NOT NULL
        ALTER TABLE dbo.TenantItsmConnectorConnections DROP CONSTRAINT DF_TenantItsmConnectorConnections_AuthMode;

    ALTER TABLE dbo.TenantItsmConnectorConnections
        DROP COLUMN AuthMode,
                    OAuthClientIdKeyVaultSecretName,
                    OAuthClientSecretKeyVaultSecretName,
                    OAuthRefreshTokenKeyVaultSecretName;
END;
GO
