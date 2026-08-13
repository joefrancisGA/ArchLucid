namespace ArchLucid.Core.Persistence.Ports;

using ArchLucid.Core.Agents;

/// <summary>DDL-backed agent model catalog (TB-2103).</summary>
public interface IAgentModelCatalogRepository
{
    Task<IReadOnlyList<AgentModelCatalogRow>> ListAllAsync(CancellationToken cancellationToken);

    Task<AgentModelCatalogRow?> TryGetAsync(string aliasId, CancellationToken cancellationToken);

    Task UpsertAsync(AgentModelCatalogRow row, CancellationToken cancellationToken);

    Task<int> CountAsync(CancellationToken cancellationToken);
}
