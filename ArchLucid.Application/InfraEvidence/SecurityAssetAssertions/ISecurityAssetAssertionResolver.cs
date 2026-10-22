using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.InfraEvidence.SecurityAssetAssertions;

public interface ISecurityAssetAssertionResolver
{
    Task<Guid?> TryResolveCrownJewelAssertionIdAsync(
        ProjectScopeKey scope,
        IReadOnlyList<Guid> cloudResourceIds,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default);

    Task<IReadOnlySet<Guid>> GetActiveCrownJewelAssertionIdsAsync(
        ProjectScopeKey scope,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default);

    Task<bool> IsActiveCrownJewelAssertionAsync(
        ProjectScopeKey scope,
        Guid assertionId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default);
}
