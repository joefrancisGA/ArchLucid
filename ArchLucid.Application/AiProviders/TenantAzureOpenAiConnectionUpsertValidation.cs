using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Admin;
using ArchLucid.Core.AiProviders;

namespace ArchLucid.Application.AiProviders;

public static class TenantAzureOpenAiConnectionUpsertValidation
{
    public static bool TryBuildCommand(
        TenantAzureOpenAiConnectionUpsertRequest request,
        out TenantAzureOpenAiConnectionUpsertCommand? command,
        out string? error)
    {
        command = null;
        error = null;

        if (request is null)
        {
            error = "Request body is required.";

            return false;
        }

        if (!TryNormalizeEndpoint(request.Endpoint, out string? endpoint, out error))
        {
            return false;
        }

        if (!TryNormalizeKeyVaultSecretName(request.ApiKeyKeyVaultSecretName, out string? secretName, out error))
        {
            return false;
        }

        if (!TenantAzureOpenAiDeploymentsCatalog.TryParse(request.DeploymentsJson, out _, out error))
        {
            return false;
        }

        TenantAzureOpenAiAuthMode authMode = TenantAzureOpenAiAuthMode.ApiKey;

        if (!string.IsNullOrWhiteSpace(request.AuthMode)
            && !Enum.TryParse(request.AuthMode, ignoreCase: true, out authMode))
        {
            error = "AuthMode must be ApiKey.";

            return false;
        }

        command = new TenantAzureOpenAiConnectionUpsertCommand
        {
            Endpoint = endpoint!,
            AuthMode = authMode,
            ApiKeyKeyVaultSecretName = secretName!,
            DeploymentsJson = request.DeploymentsJson!.Trim(),
            IsEnabled = request.IsEnabled ?? true,
            Label = string.IsNullOrWhiteSpace(request.Label) ? null : request.Label.Trim(),
        };

        return true;
    }

    public static bool TryNormalizeEndpoint(
        string? endpoint,
        [NotNullWhen(true)] out string? normalized,
        out string? error)
    {
        normalized = null;
        error = null;

        if (string.IsNullOrWhiteSpace(endpoint))
        {
            error = "Endpoint is required.";

            return false;
        }

        string trimmed = endpoint.Trim();

        if (!Uri.TryCreate(trimmed, UriKind.Absolute, out Uri? uri)
            || uri.Scheme != Uri.UriSchemeHttps)
        {
            error = "Endpoint must be an absolute HTTPS URL.";

            return false;
        }

        normalized = trimmed.TrimEnd('/');

        return true;
    }

    public static bool TryNormalizeKeyVaultSecretName(
        string? secretName,
        [NotNullWhen(true)] out string? normalized,
        out string? error)
    {
        normalized = null;
        error = null;

        if (string.IsNullOrWhiteSpace(secretName))
        {
            error = "ApiKeyKeyVaultSecretName is required.";

            return false;
        }

        string trimmed = secretName.Trim();

        if (trimmed.Contains("://", StringComparison.Ordinal))
        {
            error = "ApiKeyKeyVaultSecretName must be a Key Vault secret name, not a URL.";

            return false;
        }

        normalized = trimmed;

        return true;
    }
}
