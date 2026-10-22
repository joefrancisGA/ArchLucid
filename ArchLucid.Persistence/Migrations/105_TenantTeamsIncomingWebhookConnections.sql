/*
  105: Per-tenant Microsoft Teams incoming-webhook *reference* (Key Vault secret name only — never the webhook URL).

  RLS: not applied — API enforces caller tenant via IScopeContextProvider (same posture as TenantNotificationChannelPreferences).
*/
IF OBJECT_ID(N'dbo.TenantTeamsIncomingWebhookConnections', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantTeamsIncomingWebhookConnections
    (
        TenantId              UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_TenantTeamsIncomingWebhookConnections PRIMARY KEY,
        KeyVaultSecretName    NVARCHAR(500)    NOT NULL,
        Label                 NVARCHAR(200)    NULL,
        UpdatedUtc            DATETIME2(7)     NOT NULL
            CONSTRAINT DF_TenantTeamsIncomingWebhookConnections_UpdatedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_TenantTeamsIncomingWebhookConnections_NoUrl
            CHECK (KeyVaultSecretName NOT LIKE N'%://%'),
        CONSTRAINT FK_TenantTeamsIncomingWebhookConnections_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );
END;
GO
