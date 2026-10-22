using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Persistence.Caching;

namespace ArchLucid.Persistence.Governance;

/// <summary>
///     Read-through cache decorator for <see cref="IPolicyPackResolver" /> keyed by tenant scope and revision stamp.
/// </summary>
public sealed class CachingPolicyPackResolver(IPolicyPackResolver inner, IHotPathReadCache hotPathReadCache)
    : IPolicyPackResolver
{
    private readonly IPolicyPackResolver _inner = inner ?? throw new ArgumentNullException(nameof(inner));

    private readonly IHotPathReadCache _hotPathReadCache =
        hotPathReadCache ?? throw new ArgumentNullException(nameof(hotPathReadCache));

    /// <inheritdoc />
    public async Task<EffectivePolicyPackSet> ResolveAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        long revision = await ReadTenantRevisionAsync(tenantId, ct);

        string cacheKey = HotPathCacheKeys.EffectivePolicyPackSet(tenantId, workspaceId, projectId, revision);

        EffectivePolicyPackSet? cached = await _hotPathReadCache
            .GetOrCreateAsync(
                cacheKey,
                async innerCt =>
                {
                    EffectivePolicyPackSet resolved =
                        await _inner.ResolveAsync(tenantId, workspaceId, projectId, innerCt);

                    return resolved;
                },
                ct);

        if (cached is null)
        {
            return await _inner.ResolveAsync(tenantId, workspaceId, projectId, ct);
        }

        return cached;
    }

    private async Task<long> ReadTenantRevisionAsync(Guid tenantId, CancellationToken ct)
    {
        string revisionKey = HotPathCacheKeys.PolicyPackResolverTenantRevision(tenantId);

        PolicyPackResolverRevisionState? state = await _hotPathReadCache
            .GetOrCreateAsync(
                revisionKey,
                _ => Task.FromResult<PolicyPackResolverRevisionState?>(
                    new PolicyPackResolverRevisionState { Revision = 0 }),
                ct);

        return state?.Revision ?? 0;
    }
}
