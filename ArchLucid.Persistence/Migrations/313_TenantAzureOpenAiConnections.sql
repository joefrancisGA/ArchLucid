/*
  313: Per-tenant Azure OpenAI BYO connection references (Key Vault secret name only — never raw API keys).

  RLS: not applied — API enforces caller tenant via IScopeContextProvider (TB-872).
*/
IF OBJECT_ID(N'dbo.TenantAzureOpenAiConnections', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantAzureOpenAiConnections
    (
        TenantId                   UNIQUEIDENTIFIER NOT NULL,
        Endpoint                   NVARCHAR(500)    NOT NULL,
        AuthMode                   NVARCHAR(32)     NOT NULL
            CONSTRAINT DF_TenantAzureOpenAiConnections_AuthMode DEFAULT (N'ApiKey'),
        ApiKeyKeyVaultSecretName   NVARCHAR(500)    NOT NULL,
        DeploymentsJson            NVARCHAR(MAX)    NOT NULL,
        IsEnabled                  BIT              NOT NULL
            CONSTRAINT DF_TenantAzureOpenAiConnections_IsEnabled DEFAULT (1),
        Label                      NVARCHAR(200)    NULL,
        LastProbeSucceeded         BIT              NULL,
        LastProbeMessage           NVARCHAR(1000)   NULL,
        LastProbeUtc               DATETIME2(7)     NULL,
        UpdatedUtc                 DATETIME2(7)     NOT NULL
            CONSTRAINT DF_TenantAzureOpenAiConnections_UpdatedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_TenantAzureOpenAiConnections PRIMARY KEY (TenantId),
        CONSTRAINT CK_TenantAzureOpenAiConnections_AuthMode
            CHECK (AuthMode IN (N'ApiKey')),
        CONSTRAINT CK_TenantAzureOpenAiConnections_ApiKeyNoUrl
            CHECK (ApiKeyKeyVaultSecretName NOT LIKE N'%://%'),
        CONSTRAINT FK_TenantAzureOpenAiConnections_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );
END;
GO
