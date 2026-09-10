namespace ArchLucid.Application.InfraEvidence.SecurityAssetAssertions;

public interface ISecurityAssetAssertionResolver
{
    Task<Guid?> TryResolveCrownJewelAssertionIdAsync(
        Guid tenantId,
        IReadOnlyList<Guid> cloudResourceIds,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default);

    Task<IReadOnlySet<Guid>> GetActiveCrownJewelAssertionIdsAsync(
        Guid tenantId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default);

    Task<bool> IsActiveCrownJewelAssertionAsync(
        Guid tenantId,
        Guid assertionId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default);
}
