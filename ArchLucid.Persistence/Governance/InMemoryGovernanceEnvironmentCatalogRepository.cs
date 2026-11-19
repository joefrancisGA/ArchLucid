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
                ? Copy(catalog)
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
            _catalogs[key] = Copy(catalog);
        }

        return Task.CompletedTask;
    }

    private static GovernanceEnvironmentCatalog Copy(GovernanceEnvironmentCatalog catalog) => new GovernanceEnvironmentCatalog
    {
        IsAdministratorConfigured = catalog.IsAdministratorConfigured,
        Environments = catalog.Environments
            .Select(environment => new GovernanceEnvironmentDefinition
            {
                Slug = environment.Slug,
                DisplayName = environment.DisplayName,
                SortOrder = environment.SortOrder,
                IsActive = environment.IsActive,
            })
            .ToList(),
        Transitions = catalog.Transitions
            .Select(transition => new GovernanceEnvironmentTransition
            {
                SourceSlug = transition.SourceSlug,
                TargetSlug = transition.TargetSlug,
            })
            .ToList(),
    };

    private static string BuildKey(Guid tenantId, Guid workspaceId, Guid projectId) =>
        $"{tenantId:N}:{workspaceId:N}:{projectId:N}";
}
