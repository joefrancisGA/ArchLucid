namespace ArchLucid.Core.Persistence.Ports;

using ArchLucid.Contracts.Governance;

/// <summary>
///     Persistence for administrator-defined governance environment catalogs scoped to tenant/workspace/project.
/// </summary>
public interface IGovernanceEnvironmentCatalogRepository
{
    Task<GovernanceEnvironmentCatalog?> GetByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken cancellationToken = default);

    Task ReplaceForScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        GovernanceEnvironmentCatalog catalog,
        CancellationToken cancellationToken = default);
}
