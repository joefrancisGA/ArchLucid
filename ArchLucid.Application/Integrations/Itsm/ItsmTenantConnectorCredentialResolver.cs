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
            _ => throw new ArgumentOutOfRangeException(nameof(provider), provider, null)
        };
    }

    private async Task<ResolvedItsmOutboundCredentials?> TryResolveFromTenantRowAsync(
        TenantItsmConnectorConnectionRecord row,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(row.InstanceBaseUrl)
            || string.IsNullOrWhiteSpace(row.AuthUserName)
            || string.IsNullOrWhiteSpace(row.CredentialKeyVaultSecretName))
        {
            return null;
        }

        string? secret = await _secretProvider
            .GetSecretAsync(row.CredentialKeyVaultSecretName.Trim(), cancellationToken)
            .ConfigureAwait(false);

        if (string.IsNullOrWhiteSpace(secret))
            return null;

        return new ResolvedItsmOutboundCredentials(
            row.InstanceBaseUrl.Trim().TrimEnd('/'),
            row.AuthUserName.Trim(),
            secret.Trim(),
            FromTenantConnection: true);
    }

    private static ResolvedItsmOutboundCredentials? TryResolveFromDeployment(
        IntegrationsItsmOutboundOptions outbound,
        TenantItsmConnectorProvider provider)
    {
        return provider switch
        {
            TenantItsmConnectorProvider.Jira => TryJiraDeployment(outbound.Jira),
            TenantItsmConnectorProvider.ServiceNow => TryServiceNowDeployment(outbound.ServiceNow),
            _ => throw new ArgumentOutOfRangeException(nameof(provider), provider, null)
        };
    }

    private static ResolvedItsmOutboundCredentials? TryJiraDeployment(JiraItsmOutboundOptions jira)
    {
        if (string.IsNullOrWhiteSpace(jira.CloudBaseUrl)
            || string.IsNullOrWhiteSpace(jira.ServiceAccountEmail)
            || string.IsNullOrWhiteSpace(jira.ApiToken))
        {
            return null;
        }

        return new ResolvedItsmOutboundCredentials(
            jira.CloudBaseUrl.Trim().TrimEnd('/'),
            jira.ServiceAccountEmail.Trim(),
            jira.ApiToken.Trim(),
            FromTenantConnection: false);
    }

    private static ResolvedItsmOutboundCredentials? TryServiceNowDeployment(ServiceNowItsmOutboundOptions serviceNow)
    {
        if (string.IsNullOrWhiteSpace(serviceNow.InstanceBaseUrl)
            || string.IsNullOrWhiteSpace(serviceNow.Username)
            || string.IsNullOrWhiteSpace(serviceNow.Password))
        {
            return null;
        }

        return new ResolvedItsmOutboundCredentials(
            serviceNow.InstanceBaseUrl.Trim().TrimEnd('/'),
            serviceNow.Username.Trim(),
            serviceNow.Password.Trim(),
            FromTenantConnection: false);
    }

    private static string? NullIfEmpty(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
