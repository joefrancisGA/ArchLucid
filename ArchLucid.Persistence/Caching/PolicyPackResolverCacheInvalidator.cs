using ArchLucid.Core.Governance.PolicyPacks;

namespace ArchLucid.Persistence.Caching;

/// <summary>
///     Bumps the tenant revision stamp read by <see cref="Governance.CachingPolicyPackResolver" /> so prior
///     effective-set cache entries are bypassed without enumerating scope keys.
/// </summary>
public sealed class PolicyPackResolverCacheInvalidator(IHotPathReadCache hotPathReadCache)
    : IPolicyPackResolverCacheInvalidator
{
    private readonly IHotPathReadCache _hotPathReadCache =
        hotPathReadCache ?? throw new ArgumentNullException(nameof(hotPathReadCache));

    /// <inheritdoc />
    public async Task InvalidateTenantAsync(Guid tenantId, CancellationToken ct)
    {
        string revisionKey = HotPathCacheKeys.PolicyPackResolverTenantRevision(tenantId);

        await _hotPathReadCache.RemoveAsync(revisionKey, ct);

        await _hotPathReadCache.GetOrCreateAsync(
            revisionKey,
            _ => Task.FromResult<PolicyPackResolverRevisionState?>(
                new PolicyPackResolverRevisionState { Revision = TimeProvider.System.GetUtcNow().Ticks }),
            ct);
    }
}
