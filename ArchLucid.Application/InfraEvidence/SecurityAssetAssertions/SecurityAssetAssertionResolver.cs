using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecurityAssetAssertions;

public sealed class SecurityAssetAssertionResolver(ISecurityAssetAssertionRepository assertionRepository)
    : ISecurityAssetAssertionResolver
{
    public async Task<Guid?> TryResolveCrownJewelAssertionIdAsync(
        ProjectScopeKey scope,
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

            SecurityAssetAssertionRecord? assertion = await assertionRepository.TryGetActiveByCloudResourceIdInScopeAsync(
                scope,
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
        ProjectScopeKey scope,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<SecurityAssetAssertionRecord> assertions =
            await assertionRepository.ListByScopeAsync(scope, cancellationToken);

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
        ProjectScopeKey scope,
        Guid assertionId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default)
    {
        if (assertionId == Guid.Empty)
        {
            return false;
        }

        SecurityAssetAssertionRecord? assertion =
            await assertionRepository.TryGetByIdInScopeAsync(scope, assertionId, cancellationToken);

        return assertion is not null
               && assertion.Status == SecurityAssetAssertionStatus.Active
               && assertion.ExpirationUtc > asOfUtc
               && assertion.QualifiesAsCrownJewel();
    }
}
