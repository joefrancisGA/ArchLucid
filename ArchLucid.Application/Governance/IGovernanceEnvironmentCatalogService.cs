namespace ArchLucid.Application.Governance;

using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;

/// <summary>
///     Resolves the effective governance environment catalog and validates transitions for the current scope.
/// </summary>
public interface IGovernanceEnvironmentCatalogService
{
    Task<GovernanceEnvironmentCatalog> GetCatalogAsync(CancellationToken cancellationToken = default);

    Task<GovernanceEnvironmentCatalog> GetCatalogAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default);

    Task ReplaceCatalogAsync(
        ReplaceGovernanceEnvironmentCatalogRequest request,
        CancellationToken cancellationToken = default);

    Task<bool> IsValidTransitionAsync(
        string sourceSlug,
        string targetSlug,
        CancellationToken cancellationToken = default);

    Task<bool> IsValidTransitionAsync(
        ScopeContext scope,
        string sourceSlug,
        string targetSlug,
        CancellationToken cancellationToken = default);
}
