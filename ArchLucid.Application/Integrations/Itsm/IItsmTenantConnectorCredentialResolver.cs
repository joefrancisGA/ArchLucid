using ArchLucid.Core.Integrations.Itsm;

namespace ArchLucid.Application.Integrations.Itsm;

/// <summary>Resolves per-tenant ITSM connector credentials with deployment-wide fallback (TB-392).</summary>
public interface IItsmTenantConnectorCredentialResolver
{
    Task<ResolvedItsmOutboundCredentials?> TryResolveOutboundAsync(
        Guid tenantId,
        TenantItsmConnectorProvider provider,
        CancellationToken cancellationToken);

    Task<string?> TryResolveInboundWebhookSecretAsync(
        Guid tenantId,
        TenantItsmConnectorProvider provider,
        CancellationToken cancellationToken);

    Task<string?> TryResolveInstanceBaseUrlAsync(
        Guid tenantId,
        TenantItsmConnectorProvider provider,
        CancellationToken cancellationToken);
}
