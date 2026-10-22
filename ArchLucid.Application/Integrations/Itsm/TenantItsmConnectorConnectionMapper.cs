using ArchLucid.Contracts.Integrations;
using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;

namespace ArchLucid.Application.Integrations.Itsm;

/// <summary>Maps persistence rows to API contracts for ITSM connector connections (TB-392 / TB-600).</summary>
public static class TenantItsmConnectorConnectionMapper
{
    public static TenantItsmConnectorConnectionResponse ToResponse(TenantItsmConnectorConnectionRecord row) =>
        new()
        {
            TenantId = row.TenantId,
            Provider = TenantItsmConnectorConnectionUpsertValidation.ToProviderLabel(row.Provider),
            IsConfigured = true,
            IsEnabled = row.IsEnabled,
            InstanceBaseUrl = row.InstanceBaseUrl,
            AuthMode = TenantItsmConnectorConnectionUpsertValidation.ToAuthModeLabel(row.AuthMode),
            AuthUserName = row.AuthUserName,
            CredentialKeyVaultSecretName = row.CredentialKeyVaultSecretName,
            OAuthClientIdKeyVaultSecretName = row.OAuthClientIdKeyVaultSecretName,
            OAuthClientSecretKeyVaultSecretName = row.OAuthClientSecretKeyVaultSecretName,
            OAuthRefreshTokenKeyVaultSecretName = row.OAuthRefreshTokenKeyVaultSecretName,
            InboundWebhookKeyVaultSecretName = row.InboundWebhookKeyVaultSecretName,
            Label = row.Label,
            UpdatedUtc = row.UpdatedUtc
        };

    public static TenantItsmConnectorConnectionResponse Empty(Guid tenantId, TenantItsmConnectorProvider provider) =>
        new()
        {
            TenantId = tenantId,
            Provider = TenantItsmConnectorConnectionUpsertValidation.ToProviderLabel(provider),
            IsConfigured = false,
            IsEnabled = false,
            InstanceBaseUrl = null,
            AuthMode = TenantItsmConnectorConnectionUpsertValidation.ToAuthModeLabel(ItsmConnectorAuthMode.BasicApiToken),
            AuthUserName = null,
            CredentialKeyVaultSecretName = null,
            OAuthClientIdKeyVaultSecretName = null,
            OAuthClientSecretKeyVaultSecretName = null,
            OAuthRefreshTokenKeyVaultSecretName = null,
            InboundWebhookKeyVaultSecretName = null,
            Label = null,
            UpdatedUtc = TimeProvider.System.GetUtcNow()
        };
}
