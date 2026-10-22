namespace ArchLucid.Core.Persistence.ApplicationPorts.Integrations;

/// <summary>Per-tenant Azure Boards outbound settings persistence port.</summary>
public interface ITenantAzureBoardsOutboundSettingsRepository
{
    Task<TenantAzureBoardsOutboundSettings?> TryGetAsync(Guid tenantId, CancellationToken cancellationToken);

    Task<TenantAzureBoardsOutboundSettings> UpsertAsync(
        Guid tenantId,
        TenantAzureBoardsOutboundSettings settings,
        CancellationToken cancellationToken);

    Task UpdateConnectionTestAsync(
        Guid tenantId,
        DateTime testedUtc,
        string summary,
        CancellationToken cancellationToken);
}
