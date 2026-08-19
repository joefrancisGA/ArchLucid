using ArchLucid.Contracts.Admin;
using ArchLucid.Core.AiProviders;

namespace ArchLucid.Application.AiProviders;

public static class TenantAzureOpenAiConnectionMapper
{
    public static TenantAzureOpenAiConnectionResponse ToResponse(TenantAzureOpenAiConnectionRecord row) =>
        new()
        {
            TenantId = row.TenantId,
            IsConfigured = true,
            ProviderConnectionId = row.ProviderConnectionId,
            Endpoint = row.Endpoint,
            AuthMode = row.AuthMode.ToString(),
            ApiKeyKeyVaultSecretName = row.ApiKeyKeyVaultSecretName,
            DeploymentsJson = row.DeploymentsJson,
            IsEnabled = row.IsEnabled,
            Label = row.Label,
            LastProbeSucceeded = row.LastProbeSucceeded,
            LastProbeMessage = row.LastProbeMessage,
            LastProbeUtc = row.LastProbeUtc,
            UpdatedUtc = row.UpdatedUtc,
        };

    public static TenantAzureOpenAiConnectionResponse Empty(Guid tenantId) =>
        new()
        {
            TenantId = tenantId,
            IsConfigured = false,
            AuthMode = TenantAzureOpenAiAuthMode.ApiKey.ToString(),
            IsEnabled = false,
        };
}
