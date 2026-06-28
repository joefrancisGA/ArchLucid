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

    public const string ProviderRequiredMessage = "Provider must be Jira or ServiceNow.";

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

        errorMessage = ProviderRequiredMessage;

        return false;
    }

    public static string ToProviderLabel(TenantItsmConnectorProvider provider) =>
        provider switch
        {
            TenantItsmConnectorProvider.Jira => "Jira",
            TenantItsmConnectorProvider.ServiceNow => "ServiceNow",
            _ => throw new ArgumentOutOfRangeException(nameof(provider), provider, null)
        };

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
