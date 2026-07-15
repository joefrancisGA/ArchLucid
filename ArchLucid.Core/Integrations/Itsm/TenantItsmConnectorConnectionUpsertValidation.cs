using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;

namespace ArchLucid.Core.Integrations.Itsm;

/// <summary>Upsert validation for <c>dbo.TenantItsmConnectorConnections</c> — keeps raw secrets out of SQL.</summary>
public static class TenantItsmConnectorConnectionUpsertValidation
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

    public static bool TryParseProvider(string? raw, out TenantItsmConnectorProvider provider, out string? errorMessage)
    {
        provider = default;
        errorMessage = null;

        if (string.IsNullOrWhiteSpace(raw))
        {
            errorMessage = ProviderRequiredMessage;

            return false;
        }

        if (raw.Trim().Equals("Jira", StringComparison.OrdinalIgnoreCase))
        {
            provider = TenantItsmConnectorProvider.Jira;

            return true;
        }

        if (raw.Trim().Equals("ServiceNow", StringComparison.OrdinalIgnoreCase))
        {
            provider = TenantItsmConnectorProvider.ServiceNow;

            return true;
        }

        if (raw.Trim().Equals("AzureBoards", StringComparison.OrdinalIgnoreCase))
        {
            provider = TenantItsmConnectorProvider.AzureBoards;

            return true;
        }

        errorMessage = ProviderRequiredMessage;

        return false;
    }

    public static string ToProviderLabel(TenantItsmConnectorProvider provider) =>
        provider switch
        {
            TenantItsmConnectorProvider.Jira => "Jira",
            TenantItsmConnectorProvider.ServiceNow => "ServiceNow",
            TenantItsmConnectorProvider.AzureBoards => "Azure Boards",
            _ => throw new ArgumentOutOfRangeException(nameof(provider), provider, null)
        };

    public static string ToProviderPersistenceLabel(TenantItsmConnectorProvider provider) =>
        provider switch
        {
            TenantItsmConnectorProvider.Jira => "Jira",
            TenantItsmConnectorProvider.ServiceNow => "ServiceNow",
            TenantItsmConnectorProvider.AzureBoards => "AzureBoards",
            _ => throw new ArgumentOutOfRangeException(nameof(provider), provider, null)
        };

    public static bool TryParseAuthMode(string? raw, out ItsmConnectorAuthMode authMode, out string? errorMessage)
    {
        authMode = ItsmConnectorAuthMode.BasicApiToken;
        errorMessage = null;

        if (string.IsNullOrWhiteSpace(raw))
            return true;

        string trimmed = raw.Trim();

        if (trimmed.Equals("BasicApiToken", StringComparison.OrdinalIgnoreCase))
        {
            authMode = ItsmConnectorAuthMode.BasicApiToken;

            return true;
        }

        if (trimmed.Equals("OAuth2ClientCredentials", StringComparison.OrdinalIgnoreCase))
        {
            authMode = ItsmConnectorAuthMode.OAuth2ClientCredentials;

            return true;
        }

        if (trimmed.Equals("OAuth2RefreshToken", StringComparison.OrdinalIgnoreCase))
        {
            authMode = ItsmConnectorAuthMode.OAuth2RefreshToken;

            return true;
        }

        errorMessage = AuthModeInvalidMessage;

        return false;
    }

    public static string ToAuthModeLabel(ItsmConnectorAuthMode authMode) =>
        authMode switch
        {
            ItsmConnectorAuthMode.BasicApiToken => "BasicApiToken",
            ItsmConnectorAuthMode.OAuth2ClientCredentials => "OAuth2ClientCredentials",
            ItsmConnectorAuthMode.OAuth2RefreshToken => "OAuth2RefreshToken",
            _ => throw new ArgumentOutOfRangeException(nameof(authMode), authMode, null)
        };

    public static bool TryParseAuthModeLabel(string? raw, out ItsmConnectorAuthMode authMode)
    {
        if (!TryParseAuthMode(raw, out authMode, out _))
        {
            authMode = ItsmConnectorAuthMode.BasicApiToken;

            return false;
        }

        return true;
    }

    public static bool TryBuildUpsertCommandForProvider(
        TenantItsmConnectorProvider provider,
        string? instanceBaseUrl,
        string? authModeRaw,
        string? authUserName,
        string? credentialKeyVaultSecretName,
        string? oauthClientIdKeyVaultSecretName,
        string? oauthClientSecretKeyVaultSecretName,
        string? oauthRefreshTokenKeyVaultSecretName,
        string? inboundWebhookKeyVaultSecretName,
        bool isEnabled,
        string? label,
        out TenantItsmConnectorConnectionUpsertCommand? command,
        out string? errorMessage)
    {
        if (provider is TenantItsmConnectorProvider.AzureBoards)
            return TryBuildAzureBoardsUpsertCommand(
                instanceBaseUrl,
                authModeRaw,
                authUserName,
                credentialKeyVaultSecretName,
                inboundWebhookKeyVaultSecretName,
                isEnabled,
                label,
                out command,
                out errorMessage);

        return TryBuildUpsertCommand(
            instanceBaseUrl,
            authModeRaw,
            authUserName,
            credentialKeyVaultSecretName,
            oauthClientIdKeyVaultSecretName,
            oauthClientSecretKeyVaultSecretName,
            oauthRefreshTokenKeyVaultSecretName,
            inboundWebhookKeyVaultSecretName,
            isEnabled,
            label,
            out command,
            out errorMessage);
    }

    public static bool TryBuildUpsertCommand(
        string? instanceBaseUrl,
        string? authModeRaw,
        string? authUserName,
        string? credentialKeyVaultSecretName,
        string? oauthClientIdKeyVaultSecretName,
        string? oauthClientSecretKeyVaultSecretName,
        string? oauthRefreshTokenKeyVaultSecretName,
        string? inboundWebhookKeyVaultSecretName,
        bool isEnabled,
        string? label,
        out TenantItsmConnectorConnectionUpsertCommand? command,
        out string? errorMessage)
    {
        command = null;
        errorMessage = null;

        if (!TryValidateInstanceBaseUrl(instanceBaseUrl, out string? trimmedInstanceBaseUrl, out errorMessage))
            return false;

        if (!TryParseAuthMode(authModeRaw, out ItsmConnectorAuthMode authMode, out errorMessage))
            return false;

        string authUserNameTrimmed = "";
        string credentialSecretTrimmed = "";
        string? oauthClientIdTrimmed = null;
        string? oauthClientSecretTrimmed = null;
        string? oauthRefreshTrimmed = null;

        if (authMode is ItsmConnectorAuthMode.BasicApiToken)
        {
            if (!TryValidateAuthUserName(authUserName, out string? trimmedAuthUserName, out errorMessage))
                return false;

            if (!TryValidateCredentialKeyVaultSecretName(credentialKeyVaultSecretName, out string? trimmedCredential, out errorMessage))
                return false;

            authUserNameTrimmed = trimmedAuthUserName!;
            credentialSecretTrimmed = trimmedCredential!;
        }
        else
        {
            if (!TryValidateRequiredOAuthKeyVaultSecretName(
                    oauthClientIdKeyVaultSecretName,
                    OAuthClientIdKeyVaultSecretNameRequiredMessage,
                    out oauthClientIdTrimmed,
                    out errorMessage))
            {
                return false;
            }

            if (!TryValidateRequiredOAuthKeyVaultSecretName(
                    oauthClientSecretKeyVaultSecretName,
                    OAuthClientSecretKeyVaultSecretNameRequiredMessage,
                    out oauthClientSecretTrimmed,
                    out errorMessage))
            {
                return false;
            }

            if (authMode is ItsmConnectorAuthMode.OAuth2RefreshToken
                && !TryValidateRequiredOAuthKeyVaultSecretName(
                    oauthRefreshTokenKeyVaultSecretName,
                    OAuthRefreshTokenKeyVaultSecretNameRequiredMessage,
                    out oauthRefreshTrimmed,
                    out errorMessage))
            {
                return false;
            }
        }

        if (!TryValidateInboundWebhookKeyVaultSecretName(
                inboundWebhookKeyVaultSecretName,
                out string? inboundSecretName,
                out errorMessage))
        {
            return false;
        }

        command = new TenantItsmConnectorConnectionUpsertCommand
        {
            InstanceBaseUrl = trimmedInstanceBaseUrl!,
            AuthMode = authMode,
            AuthUserName = authUserNameTrimmed,
            CredentialKeyVaultSecretName = credentialSecretTrimmed,
            OAuthClientIdKeyVaultSecretName = oauthClientIdTrimmed,
            OAuthClientSecretKeyVaultSecretName = oauthClientSecretTrimmed,
            OAuthRefreshTokenKeyVaultSecretName = oauthRefreshTrimmed,
            InboundWebhookKeyVaultSecretName = inboundSecretName,
            IsEnabled = isEnabled,
            Label = string.IsNullOrWhiteSpace(label) ? null : label.Trim()
        };

        return true;
    }

    public static bool TryValidateInstanceBaseUrl(string? instanceBaseUrl, out string? trimmed, out string? errorMessage)
    {
        trimmed = null;
        errorMessage = null;

        if (string.IsNullOrWhiteSpace(instanceBaseUrl))
        {
            errorMessage = InstanceBaseUrlRequiredMessage;

            return false;
        }

        trimmed = instanceBaseUrl.Trim().TrimEnd('/');

        if (!TryValidateVendorBaseUrl(trimmed))
        {
            errorMessage = InstanceBaseUrlInvalidMessage;

            return false;
        }

        return true;
    }

    public static bool TryValidateCredentialKeyVaultSecretName(
        string? keyVaultSecretName,
        out string? trimmed,
        out string? errorMessage)
    {
        trimmed = null;
        errorMessage = null;

        if (string.IsNullOrWhiteSpace(keyVaultSecretName))
        {
            errorMessage = CredentialKeyVaultSecretNameRequiredMessage;

            return false;
        }

        trimmed = keyVaultSecretName.Trim();

        if (trimmed.Contains("://", StringComparison.Ordinal))
        {
            errorMessage = RawCredentialRejectedMessage;

            return false;
        }

        return true;
    }

    public static bool TryValidateInboundWebhookKeyVaultSecretName(
        string? keyVaultSecretName,
        out string? trimmed,
        out string? errorMessage)
    {
        trimmed = null;
        errorMessage = null;

        if (string.IsNullOrWhiteSpace(keyVaultSecretName))
        {
            trimmed = null;

            return true;
        }

        trimmed = keyVaultSecretName.Trim();

        if (trimmed.Contains("://", StringComparison.Ordinal))
        {
            errorMessage = RawInboundWebhookRejectedMessage;

            return false;
        }

        return true;
    }

    public static bool TryValidateAuthUserName(string? authUserName, out string? trimmed, out string? errorMessage)
    {
        trimmed = null;
        errorMessage = null;

        if (string.IsNullOrWhiteSpace(authUserName))
        {
            errorMessage = AuthUserNameRequiredMessage;

            return false;
        }

        trimmed = authUserName.Trim();

        return true;
    }

    private static bool TryBuildAzureBoardsUpsertCommand(
        string? instanceBaseUrl,
        string? authModeRaw,
        string? authUserName,
        string? credentialKeyVaultSecretName,
        string? inboundWebhookKeyVaultSecretName,
        bool isEnabled,
        string? label,
        out TenantItsmConnectorConnectionUpsertCommand? command,
        out string? errorMessage)
    {
        command = null;
        errorMessage = null;

        if (!TryValidateInstanceBaseUrl(instanceBaseUrl, out string? trimmedInstanceBaseUrl, out errorMessage))
            return false;

        if (!TryParseAuthMode(authModeRaw, out ItsmConnectorAuthMode authMode, out errorMessage))
            return false;

        if (authMode is not ItsmConnectorAuthMode.BasicApiToken)
        {
            errorMessage = "Azure Boards connector supports BasicApiToken (PAT) auth mode only.";

            return false;
        }

        if (!TryValidateCredentialKeyVaultSecretName(credentialKeyVaultSecretName, out string? trimmedCredential, out errorMessage))
            return false;

        if (!TryValidateInboundWebhookKeyVaultSecretName(
                inboundWebhookKeyVaultSecretName,
                out string? inboundSecretName,
                out errorMessage))
        {
            return false;
        }

        string authUserNameTrimmed = string.IsNullOrWhiteSpace(authUserName) ? "" : authUserName.Trim();

        command = new TenantItsmConnectorConnectionUpsertCommand
        {
            InstanceBaseUrl = trimmedInstanceBaseUrl!,
            AuthMode = ItsmConnectorAuthMode.BasicApiToken,
            AuthUserName = authUserNameTrimmed,
            CredentialKeyVaultSecretName = trimmedCredential!,
            OAuthClientIdKeyVaultSecretName = null,
            OAuthClientSecretKeyVaultSecretName = null,
            OAuthRefreshTokenKeyVaultSecretName = null,
            InboundWebhookKeyVaultSecretName = inboundSecretName,
            IsEnabled = isEnabled,
            Label = string.IsNullOrWhiteSpace(label) ? null : label.Trim()
        };

        return true;
    }

    private static bool TryValidateRequiredOAuthKeyVaultSecretName(
        string? keyVaultSecretName,
        string requiredMessage,
        out string? trimmed,
        out string? errorMessage)
    {
        trimmed = null;
        errorMessage = null;

        if (string.IsNullOrWhiteSpace(keyVaultSecretName))
        {
            errorMessage = requiredMessage;

            return false;
        }

        trimmed = keyVaultSecretName.Trim();

        if (trimmed.Contains("://", StringComparison.Ordinal))
        {
            errorMessage = RawOAuthSecretRejectedMessage;

            return false;
        }

        return true;
    }

    private static bool TryValidateVendorBaseUrl(string url)
    {
        if (string.IsNullOrWhiteSpace(url))
            return false;

        if (!Uri.TryCreate(url, UriKind.Absolute, out Uri? uri))
            return false;

        if (string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
            return true;

        if (string.Equals(uri.Scheme, Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase))
            return string.Equals(uri.Host, "localhost", StringComparison.OrdinalIgnoreCase);

        return false;
    }
}
