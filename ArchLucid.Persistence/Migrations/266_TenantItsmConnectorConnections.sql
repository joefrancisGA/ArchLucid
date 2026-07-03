/*
  266: Per-tenant Jira / ServiceNow connector references (Key Vault secret names only — never raw tokens).

  RLS: not applied — API enforces caller tenant via IScopeContextProvider (same posture as TenantTeamsIncomingWebhookConnections).
*/
IF OBJECT_ID(N'dbo.TenantItsmConnectorConnections', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantItsmConnectorConnections
    (
        TenantId                          UNIQUEIDENTIFIER NOT NULL,
        Provider                          NVARCHAR(32)     NOT NULL,
        InstanceBaseUrl                   NVARCHAR(500)    NOT NULL,
        AuthUserName                      NVARCHAR(320)    NULL,
        CredentialKeyVaultSecretName      NVARCHAR(500)    NOT NULL,
        InboundWebhookKeyVaultSecretName  NVARCHAR(500)    NULL,
        IsEnabled                         BIT              NOT NULL
            CONSTRAINT DF_TenantItsmConnectorConnections_IsEnabled DEFAULT (1),
        Label                             NVARCHAR(200)    NULL,
        UpdatedUtc                        DATETIME2(7)     NOT NULL
            CONSTRAINT DF_TenantItsmConnectorConnections_UpdatedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_TenantItsmConnectorConnections PRIMARY KEY (TenantId, Provider),
        CONSTRAINT CK_TenantItsmConnectorConnections_Provider
            CHECK (Provider IN (N'Jira', N'ServiceNow')),
        CONSTRAINT CK_TenantItsmConnectorConnections_CredentialNoUrl
            CHECK (CredentialKeyVaultSecretName NOT LIKE N'%://%'),
        CONSTRAINT CK_TenantItsmConnectorConnections_InboundNoUrl
            CHECK (InboundWebhookKeyVaultSecretName IS NULL OR InboundWebhookKeyVaultSecretName NOT LIKE N'%://%'),
        CONSTRAINT FK_TenantItsmConnectorConnections_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );
END;
GO
