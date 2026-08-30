using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Persistence.Ports;

namespace ArchLucid.Persistence.Governance;

public sealed class InMemoryGovernanceEnvironmentCatalogRepository : IGovernanceEnvironmentCatalogRepository
{
    private readonly Dictionary<string, GovernanceEnvironmentCatalog> _catalogs = new(StringComparer.Ordinal);
    private readonly Lock _gate = new();

    public Task<GovernanceEnvironmentCatalog?> GetByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        string key = BuildKey(tenantId, workspaceId, projectId);

        lock (_gate)
        {
            return Task.FromResult(_catalogs.TryGetValue(key, out GovernanceEnvironmentCatalog? catalog)
                ? catalog
                : null);
        }
    }

    public Task ReplaceForScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        GovernanceEnvironmentCatalog catalog,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(catalog);
        cancellationToken.ThrowIfCancellationRequested();
        string key = BuildKey(tenantId, workspaceId, projectId);

        lock (_gate)
        {
            _catalogs[key] = new GovernanceEnvironmentCatalog
            {
                Environments = catalog.Environments.ToList(),
                Transitions = catalog.Transitions.ToList(),
            };
        }

        return Task.CompletedTask;
    }

    private static string BuildKey(Guid tenantId, Guid workspaceId, Guid projectId) =>
        $"{tenantId:N}:{workspaceId:N}:{projectId:N}";
}
