using ArchLucid.Core.Integrations.Itsm;

namespace ArchLucid.Core.Persistence.ApplicationPorts.Integrations;

/// <summary>Per-tenant ITSM connector persistence port (TB-392 / TB-600).</summary>
public interface ITenantItsmConnectorConnectionRepository
{
    Task<IReadOnlyList<TenantItsmConnectorConnectionRecord>> ListAsync(Guid tenantId, CancellationToken cancellationToken);

    Task<TenantItsmConnectorConnectionRecord?> GetAsync(
        Guid tenantId,
        TenantItsmConnectorProvider provider,
        CancellationToken cancellationToken);

    Task<TenantItsmConnectorConnectionRecord?> UpsertAsync(
        Guid tenantId,
        TenantItsmConnectorProvider provider,
        TenantItsmConnectorConnectionUpsertCommand command,
        CancellationToken cancellationToken);

    Task<bool> DeleteAsync(Guid tenantId, TenantItsmConnectorProvider provider, CancellationToken cancellationToken);
}
