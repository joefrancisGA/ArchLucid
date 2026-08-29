using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;

namespace ArchLucid.Core.Integrations.Itsm;

/// <summary>Upsert validation for <c>dbo.TenantItsmConnectorConnections</c> — keeps raw secrets out of SQL.</summary>
public static partial class TenantItsmConnectorConnectionUpsertValidation
{
    public const string InstanceBaseUrlRequiredMessage = "InstanceBaseUrl is required.";

    public const string InstanceBaseUrlInvalidMessage =
        "InstanceBaseUrl must be a valid https:// vendor base URL (http:// loopback allowed for local test doubles).";

    public const string CredentialKeyVaultSecretNameRequiredMessage = "CredentialKeyVaultSecretName is required.";

    public const string RawCredentialRejectedMessage =
        "CredentialKeyVaultSecretName must be a Key Vault secret name or id reference — raw API tokens or passwords are not stored in ArchLucid SQL.";

    public const string RawInboundWebhookRejectedMessage =
        "InboundWebhookKeyVaultSecretName must be a Key Vault secret name or id reference — raw webhook shared secrets are not stored in ArchLucid SQL.";

    public const string AuthUserNameRequiredMessage =
        "AuthUserName is required (Jira service account email or ServiceNow integration username).";

    public const string ProviderRequiredMessage = "Provider must be Jira, ServiceNow, or Azure Boards.";

    public const string AuthModeInvalidMessage =
        "AuthMode must be BasicApiToken, OAuth2ClientCredentials, or OAuth2RefreshToken.";

    public const string OAuthClientIdKeyVaultSecretNameRequiredMessage = "OAuthClientIdKeyVaultSecretName is required for OAuth auth modes.";

    public const string OAuthClientSecretKeyVaultSecretNameRequiredMessage =
        "OAuthClientSecretKeyVaultSecretName is required for OAuth auth modes.";

    public const string OAuthRefreshTokenKeyVaultSecretNameRequiredMessage =
        "OAuthRefreshTokenKeyVaultSecretName is required when AuthMode is OAuth2RefreshToken.";

    public const string RawOAuthSecretRejectedMessage =
        "OAuth Key Vault secret name fields must be secret name references — raw OAuth secrets are not stored in ArchLucid SQL.";
}
