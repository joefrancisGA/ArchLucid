namespace ArchLucid.Core.Integrations.Itsm;

public static partial class TenantItsmConnectorConnectionUpsertValidation
{
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
