using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecurityAssetAssertions;

public sealed class SecurityAssetAssertionResolver(ISecurityAssetAssertionRepository assertionRepository)
    : ISecurityAssetAssertionResolver
{
    public async Task<Guid?> TryResolveCrownJewelAssertionIdAsync(
        Guid tenantId,
        IReadOnlyList<Guid> cloudResourceIds,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default)
    {
        if (cloudResourceIds.Count == 0)
        {
            return null;
        }

        foreach (Guid cloudResourceId in cloudResourceIds.Distinct())
        {
            if (cloudResourceId == Guid.Empty)
            {
                continue;
            }

            SecurityAssetAssertionRecord? assertion = await assertionRepository.TryGetActiveByCloudResourceIdAsync(
                tenantId,
                cloudResourceId,
                asOfUtc,
                cancellationToken);

            if (assertion is not null && assertion.QualifiesAsCrownJewel())
            {
                return assertion.AssertionId;
            }
        }

        return null;
    }

    public async Task<IReadOnlySet<Guid>> GetActiveCrownJewelAssertionIdsAsync(
        Guid tenantId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<SecurityAssetAssertionRecord> assertions =
            await assertionRepository.ListByTenantAsync(tenantId, cancellationToken);

        HashSet<Guid> activeIds = assertions
            .Where(assertion =>
                assertion.Status == SecurityAssetAssertionStatus.Active
                && assertion.ExpirationUtc > asOfUtc
                && assertion.QualifiesAsCrownJewel())
            .Select(assertion => assertion.AssertionId)
            .ToHashSet();

        return activeIds;
    }

    public async Task<bool> IsActiveCrownJewelAssertionAsync(
        Guid tenantId,
        Guid assertionId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default)
    {
        if (assertionId == Guid.Empty)
        {
            return false;
        }

        SecurityAssetAssertionRecord? assertion =
            await assertionRepository.TryGetByIdAsync(tenantId, assertionId, cancellationToken);

        return assertion is not null
               && assertion.Status == SecurityAssetAssertionStatus.Active
               && assertion.ExpirationUtc > asOfUtc
               && assertion.QualifiesAsCrownJewel();
    }
}
