using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;
using ArchLucid.Core.Secrets;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Integrations.Itsm;

/// <inheritdoc cref="IItsmTenantConnectorCredentialResolver" />
public sealed class ItsmTenantConnectorCredentialResolver(
    ITenantItsmConnectorConnectionRepository connectionRepository,
    ISecretProvider secretProvider,
    IOptionsMonitor<IntegrationsItsmOutboundOptions> outboundOptions,
    IOptionsMonitor<IntegrationsItsmInboundOptions> inboundOptions) : IItsmTenantConnectorCredentialResolver
{
    private readonly ITenantItsmConnectorConnectionRepository _connectionRepository =
        connectionRepository ?? throw new ArgumentNullException(nameof(connectionRepository));

    private readonly ISecretProvider _secretProvider =
        secretProvider ?? throw new ArgumentNullException(nameof(secretProvider));

    private readonly IOptionsMonitor<IntegrationsItsmOutboundOptions> _outboundOptions =
        outboundOptions ?? throw new ArgumentNullException(nameof(outboundOptions));

    private readonly IOptionsMonitor<IntegrationsItsmInboundOptions> _inboundOptions =
        inboundOptions ?? throw new ArgumentNullException(nameof(inboundOptions));

    public async Task<ResolvedItsmOutboundCredentials?> TryResolveOutboundAsync(
        Guid tenantId,
        TenantItsmConnectorProvider provider,
        CancellationToken cancellationToken)
    {
        TenantItsmConnectorConnectionRecord? tenantRow =
            await _connectionRepository.GetAsync(tenantId, provider, cancellationToken).ConfigureAwait(false);

        if (tenantRow is not null && tenantRow.IsEnabled)
        {
            ResolvedItsmOutboundCredentials? fromTenant =
                await TryResolveFromTenantRowAsync(tenantRow, cancellationToken).ConfigureAwait(false);

            if (fromTenant is not null)
                return fromTenant;
        }

        IntegrationsItsmOutboundOptions outbound = _outboundOptions.CurrentValue;

        if (outbound.RequireTenantScopedCredentials)
            return null;

        return TryResolveFromDeployment(outbound, provider);
    }

    public async Task<string?> TryResolveInboundWebhookSecretAsync(
        Guid tenantId,
        TenantItsmConnectorProvider provider,
        CancellationToken cancellationToken)
    {
        TenantItsmConnectorConnectionRecord? tenantRow =
            await _connectionRepository.GetAsync(tenantId, provider, cancellationToken).ConfigureAwait(false);

        if (tenantRow is not null
            && tenantRow.IsEnabled
            && !string.IsNullOrWhiteSpace(tenantRow.InboundWebhookKeyVaultSecretName))
        {
            string? secret = await _secretProvider
                .GetSecretAsync(tenantRow.InboundWebhookKeyVaultSecretName.Trim(), cancellationToken)
                .ConfigureAwait(false);

            if (!string.IsNullOrWhiteSpace(secret))
                return secret.Trim();
        }

        IntegrationsItsmInboundOptions inbound = _inboundOptions.CurrentValue;

        if (!inbound.AllowDeploymentWideWebhookSecrets)
            return null;

        return provider switch
        {
            TenantItsmConnectorProvider.Jira => NullIfEmpty(inbound.JiraWebhookSecret),
            TenantItsmConnectorProvider.ServiceNow => NullIfEmpty(inbound.ServiceNowWebhookSecret),
            TenantItsmConnectorProvider.AzureBoards => null,
            _ => throw new ArgumentOutOfRangeException(nameof(provider), provider, null)
        };
    }

    public async Task<string?> TryResolveInstanceBaseUrlAsync(
        Guid tenantId,
        TenantItsmConnectorProvider provider,
        CancellationToken cancellationToken)
    {
        TenantItsmConnectorConnectionRecord? tenantRow =
            await _connectionRepository.GetAsync(tenantId, provider, cancellationToken).ConfigureAwait(false);

        if (tenantRow is not null && tenantRow.IsEnabled && !string.IsNullOrWhiteSpace(tenantRow.InstanceBaseUrl))
            return tenantRow.InstanceBaseUrl.Trim().TrimEnd('/');

        IntegrationsItsmOutboundOptions outbound = _outboundOptions.CurrentValue;

        if (outbound.RequireTenantScopedCredentials)
            return null;

        return provider switch
        {
            TenantItsmConnectorProvider.Jira => NullIfEmpty(outbound.Jira.CloudBaseUrl)?.TrimEnd('/'),
            TenantItsmConnectorProvider.ServiceNow => NullIfEmpty(outbound.ServiceNow.InstanceBaseUrl)?.TrimEnd('/'),
            TenantItsmConnectorProvider.AzureBoards => NullIfEmpty(outbound.AzureBoards.OrganizationBaseUrl)?.TrimEnd('/'),
            _ => throw new ArgumentOutOfRangeException(nameof(provider), provider, null)
        };
    }

    private async Task<ResolvedItsmOutboundCredentials?> TryResolveFromTenantRowAsync(
        TenantItsmConnectorConnectionRecord row,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(row.InstanceBaseUrl))
            return null;

        string instanceBaseUrl = row.InstanceBaseUrl.Trim().TrimEnd('/');

        if (row.AuthMode is ItsmConnectorAuthMode.BasicApiToken)
            return await TryResolveBasicFromTenantRowAsync(row, row.Provider, instanceBaseUrl, cancellationToken).ConfigureAwait(false);

        if (string.IsNullOrWhiteSpace(row.OAuthClientIdKeyVaultSecretName)
            || string.IsNullOrWhiteSpace(row.OAuthClientSecretKeyVaultSecretName))
        {
            return null;
        }

        string? clientId = await _secretProvider
            .GetSecretAsync(row.OAuthClientIdKeyVaultSecretName.Trim(), cancellationToken)
            .ConfigureAwait(false);

        string? clientSecret = await _secretProvider
            .GetSecretAsync(row.OAuthClientSecretKeyVaultSecretName.Trim(), cancellationToken)
            .ConfigureAwait(false);

        if (string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(clientSecret))
            return null;

        string? refreshToken = null;

        if (row.AuthMode is ItsmConnectorAuthMode.OAuth2RefreshToken)
        {
            if (string.IsNullOrWhiteSpace(row.OAuthRefreshTokenKeyVaultSecretName))
                return null;

            refreshToken = await _secretProvider
                .GetSecretAsync(row.OAuthRefreshTokenKeyVaultSecretName.Trim(), cancellationToken)
                .ConfigureAwait(false);

            if (string.IsNullOrWhiteSpace(refreshToken))
                return null;
        }

        return ResolvedItsmOutboundCredentials.ForOAuth(
            instanceBaseUrl,
            row.AuthMode,
            clientId.Trim(),
            clientSecret.Trim(),
            refreshToken?.Trim(),
            fromTenantConnection: true);
    }

    private async Task<ResolvedItsmOutboundCredentials?> TryResolveBasicFromTenantRowAsync(
        TenantItsmConnectorConnectionRecord row,
        TenantItsmConnectorProvider provider,
        string instanceBaseUrl,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(row.CredentialKeyVaultSecretName))
            return null;

        if (provider is not TenantItsmConnectorProvider.AzureBoards
            && string.IsNullOrWhiteSpace(row.AuthUserName))
        {
            return null;
        }

        string? secret = await _secretProvider
            .GetSecretAsync(row.CredentialKeyVaultSecretName.Trim(), cancellationToken)
            .ConfigureAwait(false);

        if (string.IsNullOrWhiteSpace(secret))
            return null;

        string authUserName = provider is TenantItsmConnectorProvider.AzureBoards
            ? row.AuthUserName?.Trim() ?? ""
            : row.AuthUserName.Trim();

        return ResolvedItsmOutboundCredentials.ForBasic(
            instanceBaseUrl,
            authUserName,
            secret.Trim(),
            fromTenantConnection: true);
    }

    private static ResolvedItsmOutboundCredentials? TryResolveFromDeployment(
        IntegrationsItsmOutboundOptions outbound,
        TenantItsmConnectorProvider provider)
    {
        return provider switch
        {
            TenantItsmConnectorProvider.Jira => TryJiraDeployment(outbound.Jira),
            TenantItsmConnectorProvider.ServiceNow => TryServiceNowDeployment(outbound.ServiceNow),
            TenantItsmConnectorProvider.AzureBoards => TryAzureBoardsDeployment(outbound.AzureBoards),
            _ => throw new ArgumentOutOfRangeException(nameof(provider), provider, null)
        };
    }

    private static ResolvedItsmOutboundCredentials? TryJiraDeployment(JiraItsmOutboundOptions jira)
    {
        if (string.IsNullOrWhiteSpace(jira.CloudBaseUrl))
            return null;

        string instanceBaseUrl = jira.CloudBaseUrl.Trim().TrimEnd('/');

        if (jira.AuthMode is ItsmConnectorAuthMode.BasicApiToken)
        {
            if (string.IsNullOrWhiteSpace(jira.ServiceAccountEmail)
                || string.IsNullOrWhiteSpace(jira.ApiToken))
            {
                return null;
            }

            return ResolvedItsmOutboundCredentials.ForBasic(
                instanceBaseUrl,
                jira.ServiceAccountEmail.Trim(),
                jira.ApiToken.Trim(),
                fromTenantConnection: false);
        }

        if (string.IsNullOrWhiteSpace(jira.OAuthClientId) || string.IsNullOrWhiteSpace(jira.OAuthClientSecret))
            return null;

        if (jira.AuthMode is ItsmConnectorAuthMode.OAuth2RefreshToken
            && string.IsNullOrWhiteSpace(jira.OAuthRefreshToken))
        {
            return null;
        }

        return ResolvedItsmOutboundCredentials.ForOAuth(
            instanceBaseUrl,
            jira.AuthMode,
            jira.OAuthClientId.Trim(),
            jira.OAuthClientSecret.Trim(),
            NullIfEmpty(jira.OAuthRefreshToken),
            fromTenantConnection: false);
    }

    private static ResolvedItsmOutboundCredentials? TryServiceNowDeployment(ServiceNowItsmOutboundOptions serviceNow)
    {
        if (string.IsNullOrWhiteSpace(serviceNow.InstanceBaseUrl))
            return null;

        string instanceBaseUrl = serviceNow.InstanceBaseUrl.Trim().TrimEnd('/');

        if (serviceNow.AuthMode is ItsmConnectorAuthMode.BasicApiToken)
        {
            if (string.IsNullOrWhiteSpace(serviceNow.Username)
                || string.IsNullOrWhiteSpace(serviceNow.Password))
            {
                return null;
            }

            return ResolvedItsmOutboundCredentials.ForBasic(
                instanceBaseUrl,
                serviceNow.Username.Trim(),
                serviceNow.Password.Trim(),
                fromTenantConnection: false);
        }

        if (string.IsNullOrWhiteSpace(serviceNow.OAuthClientId)
            || string.IsNullOrWhiteSpace(serviceNow.OAuthClientSecret))
        {
            return null;
        }

        return ResolvedItsmOutboundCredentials.ForOAuth(
            instanceBaseUrl,
            serviceNow.AuthMode,
            serviceNow.OAuthClientId.Trim(),
            serviceNow.OAuthClientSecret.Trim(),
            oauthRefreshToken: null,
            fromTenantConnection: false);
    }

    private static ResolvedItsmOutboundCredentials? TryAzureBoardsDeployment(AzureBoardsItsmOutboundOptions azureBoards)
    {
        if (string.IsNullOrWhiteSpace(azureBoards.OrganizationBaseUrl)
            || string.IsNullOrWhiteSpace(azureBoards.PersonalAccessToken))
        {
            return null;
        }

        return ResolvedItsmOutboundCredentials.ForBasic(
            azureBoards.OrganizationBaseUrl.Trim().TrimEnd('/'),
            "",
            azureBoards.PersonalAccessToken.Trim(),
            fromTenantConnection: false);
    }

    private static string? NullIfEmpty(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
