using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;

namespace ArchLucid.Persistence.Integrations;

/// <summary>
///     Shared ITSM connector connection mapping, auth-mode normalization, and enabled-state rules for SQL and in-memory stores.
/// </summary>
internal static class TenantItsmConnectorConnectionRepositoryCore
{
    public static TenantItsmConnectorConnectionRecord CreateFromUpsert(
        Guid tenantId,
        TenantItsmConnectorProvider provider,
        TenantItsmConnectorConnectionUpsertCommand command,
        DateTimeOffset updatedUtc)
    {
        ArgumentNullException.ThrowIfNull(command);

        ItsmConnectorAuthMode authMode = NormalizeAuthModeForProvider(provider, command.AuthMode);

        return new TenantItsmConnectorConnectionRecord
        {
            TenantId = tenantId,
            Provider = provider,
            InstanceBaseUrl = command.InstanceBaseUrl,
            AuthMode = authMode,
            AuthUserName = command.AuthUserName,
            CredentialKeyVaultSecretName = command.CredentialKeyVaultSecretName,
            OAuthClientIdKeyVaultSecretName = command.OAuthClientIdKeyVaultSecretName,
            OAuthClientSecretKeyVaultSecretName = command.OAuthClientSecretKeyVaultSecretName,
            OAuthRefreshTokenKeyVaultSecretName = command.OAuthRefreshTokenKeyVaultSecretName,
            InboundWebhookKeyVaultSecretName = command.InboundWebhookKeyVaultSecretName,
            IsEnabled = ResolveIsEnabled(command),
            Label = command.Label,
            UpdatedUtc = updatedUtc
        };
    }

    public static TenantItsmConnectorConnectionRecord MapFromSqlRow(
        Guid tenantId,
        string providerLabel,
        string instanceBaseUrl,
        string authModeLabel,
        string authUserName,
        string credentialKeyVaultSecretName,
        string? oauthClientIdKeyVaultSecretName,
        string? oauthClientSecretKeyVaultSecretName,
        string? oauthRefreshTokenKeyVaultSecretName,
        string? inboundWebhookKeyVaultSecretName,
        bool isEnabled,
        string? label,
        DateTime updatedUtc)
    {
        if (!TenantItsmConnectorConnectionUpsertValidation.TryParseProvider(providerLabel, out TenantItsmConnectorProvider provider, out _))
            throw new InvalidOperationException($"Unknown ITSM provider label '{providerLabel}' in SQL row.");

        if (!TenantItsmConnectorConnectionUpsertValidation.TryParseAuthModeLabel(authModeLabel, out ItsmConnectorAuthMode authMode))
            throw new InvalidOperationException($"Unknown ITSM auth mode label '{authModeLabel}' in SQL row.");

        return new TenantItsmConnectorConnectionRecord
        {
            TenantId = tenantId,
            Provider = provider,
            InstanceBaseUrl = instanceBaseUrl,
            AuthMode = authMode,
            AuthUserName = authUserName,
            CredentialKeyVaultSecretName = credentialKeyVaultSecretName,
            OAuthClientIdKeyVaultSecretName = oauthClientIdKeyVaultSecretName,
            OAuthClientSecretKeyVaultSecretName = oauthClientSecretKeyVaultSecretName,
            OAuthRefreshTokenKeyVaultSecretName = oauthRefreshTokenKeyVaultSecretName,
            InboundWebhookKeyVaultSecretName = inboundWebhookKeyVaultSecretName,
            IsEnabled = isEnabled,
            Label = label,
            UpdatedUtc = new DateTimeOffset(updatedUtc, TimeSpan.Zero)
        };
    }

    public static string ToPersistenceProviderLabel(TenantItsmConnectorProvider provider) =>
        TenantItsmConnectorConnectionUpsertValidation.ToProviderPersistenceLabel(provider);

    public static string ToPersistenceAuthModeLabel(ItsmConnectorAuthMode authMode) =>
        TenantItsmConnectorConnectionUpsertValidation.ToAuthModeLabel(authMode);

    public static ItsmConnectorAuthMode NormalizeAuthModeForProvider(
        TenantItsmConnectorProvider provider,
        ItsmConnectorAuthMode authMode) =>
        provider is TenantItsmConnectorProvider.AzureBoards
            ? ItsmConnectorAuthMode.BasicApiToken
            : authMode;

    public static bool ResolveIsEnabled(TenantItsmConnectorConnectionUpsertCommand command)
    {
        ArgumentNullException.ThrowIfNull(command);

        if (!command.IsEnabled)
            return false;

        if (string.IsNullOrWhiteSpace(command.InstanceBaseUrl))
            return false;

        return command.AuthMode switch
        {
            ItsmConnectorAuthMode.BasicApiToken =>
                !string.IsNullOrWhiteSpace(command.CredentialKeyVaultSecretName),
            ItsmConnectorAuthMode.OAuth2ClientCredentials =>
                !string.IsNullOrWhiteSpace(command.OAuthClientIdKeyVaultSecretName)
                && !string.IsNullOrWhiteSpace(command.OAuthClientSecretKeyVaultSecretName),
            ItsmConnectorAuthMode.OAuth2RefreshToken =>
                !string.IsNullOrWhiteSpace(command.OAuthClientIdKeyVaultSecretName)
                && !string.IsNullOrWhiteSpace(command.OAuthClientSecretKeyVaultSecretName)
                && !string.IsNullOrWhiteSpace(command.OAuthRefreshTokenKeyVaultSecretName),
            _ => false
        };
    }
}
